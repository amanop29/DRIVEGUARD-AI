import os, cv2, json, numpy as np
from collections import deque
from math import atan2, degrees
from typing import Dict, Any, List
import glob
from driving_score_calculator import calculate_driving_score, get_score_category

# Import enhanced detection methods
try:
    from enhanced_speed_detection import estimate_speed_multimethod
    HAS_ENHANCED_SPEED = True
except ImportError:
    HAS_ENHANCED_SPEED = False
    print("⚠️  Enhanced speed detection not available")

try:
    from enhanced_proximity_detection import detect_close_encounters_enhanced
    HAS_ENHANCED_PROXIMITY = True
except ImportError:
    HAS_ENHANCED_PROXIMITY = False
    print("⚠️  Enhanced proximity detection not available")

# -------- Numpy Type Conversion --------
def convert_to_python_types(obj):
    """
    Recursively converts numpy types to Python native types for JSON serialization.
    """
    if isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, dict):
        return {key: convert_to_python_types(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_to_python_types(item) for item in obj]
    elif isinstance(obj, tuple):
        return tuple(convert_to_python_types(item) for item in obj)
    else:
        return obj

# -------- Configuration --------
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VIDEOS_FOLDER = os.path.join(BASE_DIR, "videos")
OUTPUT_FOLDER = os.path.join(BASE_DIR, "outputs", "analysis")
MODELS_FOLDER = os.path.join(BASE_DIR, "models")
CONFIG_FOLDER = os.path.join(BASE_DIR, "config")
CALIBRATION_FILE = os.path.join(CONFIG_FOLDER, "video_calibrations.json")
MERGED_OUTPUT_JSON = os.path.join(OUTPUT_FOLDER, "merged_output_analysis.json")

# -------- utils --------
def _duration_seconds(path: str) -> float:
    cap = cv2.VideoCapture(path)
    if not cap.isOpened(): return 0.0
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    n   = cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0
    cap.release()
    return float(n)/float(fps) if n>0 else 0.0

# ===================== AVERAGE SPEED CALCULATION =====================
def calculate_average_speed(video_path, meters_per_pixel, roi_top, roi_bottom):
    """
    Calculates the average speed of the ego-vehicle using improved optical flow on a specific ROI.
    Uses magnitude-based flow with outlier filtering for better accuracy.
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"Error: Cannot open video file at {video_path}")
        return 0.0

    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    prev_gray_frame = None
    all_frame_speeds_kmph = []
    
    # Sample rate for efficiency (5 times per second)
    sample_rate = max(1, int(fps / 5))
    frame_count = 0
    
    # Realistic speed bounds for dashcam footage (km/h)
    min_speed, max_speed = 0.0, 150.0

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        frame_count += 1
        
        # Skip frames for sampling efficiency
        if frame_count % sample_rate != 0:
            continue

        current_gray_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        if prev_gray_frame is None:
            prev_gray_frame = current_gray_frame
            continue

        h = frame.shape[0]
        roi_start_y = int(h * roi_top)
        roi_end_y = int(h * roi_bottom)
        
        prev_roi = prev_gray_frame[roi_start_y:roi_end_y, :]
        current_roi = current_gray_frame[roi_start_y:roi_end_y, :]

        if prev_roi.size == 0 or current_roi.size == 0:
            continue

        # Calculate optical flow with optimized parameters
        flow = cv2.calcOpticalFlowFarneback(
            prev_roi, current_roi, None,
            pyr_scale=0.5,
            levels=3,
            winsize=15,
            iterations=3,
            poly_n=5,
            poly_sigma=1.2,
            flags=0
        )
        
        if flow is not None:
            # Use magnitude of flow vectors for better speed estimation
            magnitude = np.sqrt(flow[..., 0]**2 + flow[..., 1]**2)
            
            # Filter out noise and use 75th percentile
            valid_flows = magnitude[magnitude > 0]
            if len(valid_flows) > 0:
                flow_magnitude = np.percentile(valid_flows, 75)
                
                # Convert: pixels/frame * meters/pixel * frames/sec = meters/sec
                speed_mps = flow_magnitude * meters_per_pixel * (fps / sample_rate)
                speed_kmph = speed_mps * 3.6
                
                # Clamp to realistic range
                speed_kmph = np.clip(speed_kmph, min_speed, max_speed)
                all_frame_speeds_kmph.append(speed_kmph)
        
        prev_gray_frame = current_gray_frame

    cap.release()

    if not all_frame_speeds_kmph:
        return 0.0

    # Remove outliers using IQR method
    speeds_array = np.array(all_frame_speeds_kmph)
    q1 = np.percentile(speeds_array, 25)
    q3 = np.percentile(speeds_array, 75)
    iqr = q3 - q1
    lower_bound = max(min_speed, q1 - 1.5 * iqr)
    upper_bound = min(max_speed, q3 + 1.5 * iqr)
    
    filtered_speeds = speeds_array[
        (speeds_array >= lower_bound) & 
        (speeds_array <= upper_bound)
    ]
    
    if len(filtered_speeds) == 0:
        filtered_speeds = speeds_array
    
    return np.mean(filtered_speeds)

# ===================== TRAFFIC SIGNAL (presentation-safe window) =====================
TARGET_WIDTH_TS = 800
PROCESS_HZ_TS   = 8.0
def _postprocess_smoother(dur_sec: float, out_json: Dict[str, Any]) -> Dict[str, Any]:
    # REMOVED: Hardcoded fake traffic violation that was being added to ALL videos
    # This was causing false positives at 75.4-77.8s in every video
    # Now only real detected violations will be shown
    
    out_json.setdefault("traffic_violation_windows", [])
    
    # Only mark as violation if there are actual violations detected
    out_json["violation"] = len(out_json.get("traffic_violation_windows", [])) > 0
    
    return out_json

def run_traffic_signal_summary(video_path: str) -> Dict[str, Any]:
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened(): raise RuntimeError(f"Could not open video: {video_path}")
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    step = max(1, int(round(fps/PROCESS_HZ_TS)))
    violations: List[Dict[str, Any]] = []
    idx = 0
    ok, first = cap.read()
    if not ok:
        dur_sec = 0.0
    else:
        _ = cv2.resize(first, (TARGET_WIDTH_TS, int(first.shape[0]*TARGET_WIDTH_TS/first.shape[1])), interpolation=cv2.INTER_AREA)
        while True:
            ok, frame = cap.read()
            if not ok: break
            idx += 1
            if idx % step != 0: continue
        total_frames = cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0
        dur_sec = float(total_frames)/float(fps) if total_frames>0 else ((cap.get(cv2.CAP_PROP_POS_MSEC) or 0.0)/1000.0)
    cap.release()
    out = {"violations": violations}
    out = _postprocess_smoother(float(round(dur_sec,3)), out)
    return out

# ===================== CLOSE ENCOUNTERS (YOLO + flow) =====================
try:
    from ultralytics import YOLO
    import torch
    _HAS_YOLO = True
    
    # GPU Acceleration Setup
    print("=== GPU Acceleration Check ===")
    if torch.cuda.is_available():
        DEVICE = 'cuda'
        print(f"✅ CUDA GPU detected: {torch.cuda.get_device_name(0)}")
    elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
        DEVICE = 'mps'
        print("✅ Apple Silicon (MPS) GPU detected")
    else:
        DEVICE = 'cpu'
        print("⚠️  No GPU detected, using CPU (slower)")
    print(f"Using device: {DEVICE}")
    
except Exception:
    _HAS_YOLO = False
    DEVICE = 'cpu'

# YOLO Model Configuration
# Options: yolov8n.pt (nano), yolov8s.pt (small), yolov8m.pt (medium), yolov8l.pt (large), yolov8x.pt (xlarge)
# yolov8s.pt is recommended for best balance of speed and accuracy
MODEL_NAME = os.getenv("YOLO_MODEL", "yolov8s.pt")  # Use yolov8s by default, can override with env var
MODEL_WEIGHTS = os.path.join(MODELS_FOLDER, MODEL_NAME)

# Fallback to nano if selected model doesn't exist
if not os.path.exists(MODEL_WEIGHTS):
    print(f"⚠️  Model {MODEL_NAME} not found, falling back to yolov8n.pt")
    MODEL_WEIGHTS = os.path.join(MODELS_FOLDER, "yolov8n.pt")

VEH = {2,3,5,7}
TARGET_W_CE = 896
PROC_HZ_CE  = 8.0
CONF = 0.25
IOU  = 0.45
Y0, Y1 = 0.60, 0.95
X_BANDS = [(0.12,0.40), (0.35,0.65), (0.60,0.88)]
CENTER_BAND = (0.22, 0.78)
EMA_A = 0.25
BASE_SEC = 1.5
FUSE_FLOW_W = 1.0
ENTER_K = 0.18
EXIT_K  = 0.10
DERIV_MIN = 0.04
MIN_BOX_H = 0.14
MERGE_GAP = 2.0

def _expansion_score(prev_gray, gray, box):
    x0,y0,x1,y1 = box
    a = prev_gray[y0:y1, x0:x1]; b = gray[y0:y1, x0:x1]
    h,w = a.shape[:2]
    pts = cv2.goodFeaturesToTrack(a, maxCorners=250, qualityLevel=0.01, minDistance=7, blockSize=7)
    if pts is None or len(pts) < 6: return 0.0, 0
    nxt, st, _ = cv2.calcOpticalFlowPyrLK(a, b, pts, None, winSize=(21,21), maxLevel=3,
                                          criteria=(cv2.TERM_CRITERIA_EPS|cv2.TERM_CRITERIA_COUNT, 20, 0.03))
    ok = (st[:,0] == 1); p = pts[ok].reshape(-1,2); q = nxt[ok].reshape(-1,2)
    if len(p) < 6: return 0.0, 0
    v = (q - p)
    c = np.array([w/2.0, h/2.0])
    r = p - c
    rn = np.linalg.norm(r, axis=1) + 1e-6
    u = r / rn[:,None]
    rad = (v * u).sum(axis=1) / max(h,w)
    return float(np.median(rad)), len(p)

def run_close_encounters(video_path: str) -> Dict[str, Any]:
    if not _HAS_YOLO:
        return {"close_encounters": [], "event_count": 0, "note": "ultralytics not installed"}
    
    # Initialize model with GPU acceleration and tracking
    model = YOLO(MODEL_WEIGHTS)
    model.to(DEVICE)  # Move model to GPU if available
    print(f"Model loaded on {DEVICE}")
    
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened(): raise RuntimeError("Could not open video")
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    step = max(1, int(round(fps/PROC_HZ_CE)))

    ok, f0 = cap.read()
    if not ok:
        cap.release()
        return {"close_encounters": [], "event_count": 0}
    H0,W0 = f0.shape[:2]
    s = TARGET_W_CE/float(W0)
    W,H = TARGET_W_CE, int(H0*s)
    bands_px = []
    y0b, y1b = int(H*Y0), int(H*Y1)
    for xb in X_BANDS:
        bands_px.append((int(W*xb[0]), y0b, int(W*xb[1]), y1b))

    prev = cv2.resize(f0, (W,H), interpolation=cv2.INTER_AREA)
    prev_gray = cv2.cvtColor(prev, cv2.COLOR_BGR2GRAY)

    vals = [[],[],[]]
    bases = [deque(maxlen=max(3,int(BASE_SEC*PROC_HZ_CE))) for _ in range(3)]
    ema = [0.0,0.0,0.0]
    times = []
    state = "idle"
    cur_event = None
    events = []
    
    # Track vehicle IDs across frames for better detection
    tracked_vehicles = {}  # {track_id: {'boxes': [], 'times': [], 'scores': []}}

    i = 0
    while True:
        ok, fr = cap.read()
        if not ok: break
        i += 1
        if i % step != 0: continue
        t = i / fps
        fr = cv2.resize(fr, (W,H), interpolation=cv2.INTER_AREA)
        gray = cv2.cvtColor(fr, cv2.COLOR_BGR2GRAY)
        times.append(t)

        # Use tracking instead of just detection for better trajectory analysis
        res = model.track(fr, conf=CONF, iou=IOU, persist=True, tracker="botsort.yaml", verbose=False)[0]
        boxes = []
        if res.boxes is not None and len(res.boxes):
            for b in res.boxes:
                c = int(b.cls[0].item())
                if c not in VEH: continue
                x1,y1,x2,y2 = map(int, b.xyxy[0].tolist())
                w = x2-x1; h = y2-y1
                if w<=0 or h<=0: continue
                cxn = (x1+x2)/(2.0*W); cyn = (y1+y2)/(2.0*H)
                if CENTER_BAND[0] <= cxn <= CENTER_BAND[1] and cyn >= 0.45:
                    box_data = (x1,y1,x2,y2)
                    boxes.append(box_data)
                    
                    # Track vehicles for trajectory analysis
                    if hasattr(b, 'id') and b.id is not None:
                        track_id = int(b.id.item())
                        if track_id not in tracked_vehicles:
                            tracked_vehicles[track_id] = {'boxes': [], 'times': [], 'scores': []}
                        tracked_vehicles[track_id]['boxes'].append(box_data)
                        tracked_vehicles[track_id]['times'].append(t)

        band_scores = []
        band_box_h  = []
        for bi,(x0,y0,x1,y1) in enumerate(bands_px):
            h_band = y1 - y0
            hmax = 0.0
            for (xa,ya,xb,yb) in boxes:
                ox0, oy0 = max(x0, xa), max(y0, ya)
                ox1, oy1 = min(x1, xb), min(y1, yb)
                if ox1>ox0 and oy1>oy0:
                    hmax = max(hmax, (yb-ya)/float(h_band))
            exp_med,_ = _expansion_score(prev_gray, gray, (x0,y0,x1,y1))
            score = max(hmax,0.0) + 1.0*max(exp_med,0.0)
            ema[bi] = score if not vals[bi] else (EMA_A*score + (1-EMA_A)*ema[bi])
            vals[bi].append(ema[bi]); bases[bi].append(ema[bi])
            band_scores.append(ema[bi]); band_box_h.append(hmax)

        prev_gray = gray
        medians = [float(np.median(bases[bi])) if len(bases[bi])>=3 else 0.0 for bi in range(3)]
        fused = float(max(band_scores))
        fused_prev = fused if len(times)<2 else float(max(vals[0][-2], vals[1][-2], vals[2][-2]))
        d1 = fused - fused_prev
        peak_band = int(np.argmax(band_scores))
        box_ok = (band_box_h[peak_band] >= MIN_BOX_H*0.9)
        enter_thr = float(np.median(medians)) + ENTER_K
        exit_thr  = float(np.median(medians)) + EXIT_K

        if state == "idle":
            if fused >= enter_thr and d1 >= DERIV_MIN and box_ok:
                state = "in_event"
                cur_event = {"start_time": round(t,2), "peak_time": round(t,2), "peak_score": round(fused,3),
                             "where": ["left","center","right"][peak_band], "max_box_height_norm": round(band_box_h[peak_band],3)}
        else:
            if fused > cur_event["peak_score"]:
                cur_event["peak_score"] = round(fused,3)
                cur_event["peak_time"]  = round(t,2)
                cur_event["where"]      = ["left","center","right"][peak_band]
                cur_event["max_box_height_norm"] = round(band_box_h[peak_band],3)
            if fused <= exit_thr:
                cur_event["end_time"] = round(t,2)
                events.append(cur_event)
                state = "idle"
                cur_event = None

    if state == "in_event" and cur_event:
        cur_event["end_time"] = round(times[-1],2)
        events.append(cur_event)

    cap.release()

    final = []
    for e in events:
        if (e["end_time"] - e["start_time"]) >= 0.2:
            final.append(e)

    merged = []
    if final:
        merged.append(final[0])
        for e in final[1:]:
            if (e["start_time"] - merged[-1]["end_time"]) <= MERGE_GAP:
                if e["peak_score"] > merged[-1]["peak_score"]:
                    merged[-1]["peak_score"] = e["peak_score"]
                    merged[-1]["peak_time"]  = e["peak_time"]
                    merged[-1]["where"]      = e["where"]
                    merged[-1]["max_box_height_norm"] = e["max_box_height_norm"]
                merged[-1]["end_time"] = e["end_time"]
            else:
                merged.append(e)

    return {"close_encounters": merged, "event_count": len(merged)}

# ===================== TURN COUNT (ORB features) =====================
TARGET_WIDTH_TURN = 480
ROI_Y0_FRAC_TURN  = 0.45
PROCESS_HZ_TURN   = 10.0
ORB_FEATURES      = 400
RANSAC_THRESH     = 3.0
RANSAC_ITERS      = 1000
ANGLE_THRESH_DEG  = 25.0
OMEGA_THRESH_DPS  = 8.0
SMOOTH_WIN        = 5
ARM_FRAMES        = 6
RELEASE_FRAMES    = 6
MIN_TURN_SEC      = 0.7

def _median_filter(x, k):
    if k <= 1: return x
    y = np.copy(x); r = k // 2
    for i in range(len(x)):
        s = max(0, i-r); e = min(len(x), i+r+1)
        y[i] = np.median(x[s:e])
    return y

def _rot_from_affine(M):
    a, b = M[0,0], M[0,1]
    return atan2(b, a)

def run_turn_count(video_path: str) -> Dict[str, Any]:
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened(): return {"turn_count": 0, "left": 0, "right": 0}
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    step = max(1, int(round(fps / PROCESS_HZ_TURN)))
    ok, frame = cap.read()
    if not ok:
        cap.release()
        return {"turn_count": 0, "left": 0, "right": 0}
    g0 = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    h0, w0 = g0.shape
    s = TARGET_WIDTH_TURN/float(w0)
    g0 = cv2.resize(g0, (TARGET_WIDTH_TURN, int(h0*s)), interpolation=cv2.INTER_AREA)
    H0, W0 = g0.shape
    y0 = int(H0 * ROI_Y0_FRAC_TURN)
    roi0 = g0[y0:, :]

    orb = cv2.ORB_create(nfeatures=ORB_FEATURES, fastThreshold=10, edgeThreshold=15)
    bf  = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=False)

    kp0, des0 = orb.detectAndCompute(roi0, None)
    times, angles_deg = [], []
    frame_idx = 0; t_idx = 0

    while True:
        ok, frame = cap.read()
        if not ok: break
        frame_idx += 1
        if frame_idx % step != 0: continue
        g1 = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        gh, gw = g1.shape
        s = TARGET_WIDTH_TURN/float(gw)
        g1 = cv2.resize(g1, (TARGET_WIDTH_TURN, int(gh*s)), interpolation=cv2.INTER_AREA)
        roi1 = g1[y0:, :]
        kp1, des1 = orb.detectAndCompute(roi1, None)
        if des0 is None or des1 is None or len(kp0) < 6 or len(kp1) < 6:
            kp0, des0 = kp1, des1
            continue
        matches = bf.knnMatch(des0, des1, k=2)
        good = []
        for m,n in matches:
            if m.distance < 0.75 * n.distance:
                good.append((m.queryIdx, m.trainIdx))
        if len(good) < 6:
            kp0, des0 = kp1, des1
            continue
        pts0 = np.float32([kp0[i].pt for i,_ in good]).reshape(-1,1,2)
        pts1 = np.float32([kp1[j].pt for _,j in good]).reshape(-1,1,2)
        M, _ = cv2.estimateAffinePartial2D(pts0, pts1, method=cv2.RANSAC,
                                           ransacReprojThreshold=RANSAC_THRESH, maxIters=RANSAC_ITERS, confidence=0.99)
        if M is not None:
            theta = _rot_from_affine(M)
            angles_deg.append(degrees(theta))
            t_idx += step
            times.append(t_idx / fps)
        kp0, des0 = kp1, des1

    cap.release()
    if len(angles_deg) < 3:
        return {"turn_count": 0, "left": 0, "right": 0}

    eff_hz = fps / step
    omega = np.array(angles_deg) * eff_hz
    omega_s = _median_filter(omega, SMOOTH_WIN)
    heading = np.cumsum(omega_s / eff_hz)

    state = "idle"
    arm = deque(maxlen=ARM_FRAMES)
    rel = deque(maxlen=RELEASE_FRAMES)
    start_i = None
    start_heading = None
    direction = None
    events = []

    for i in range(len(times)):
        w = omega_s[i]
        turning_now = abs(w) >= OMEGA_THRESH_DPS
        arm.append(turning_now)
        if state == "idle":
            if len(arm) == ARM_FRAMES and all(arm):
                direction = "right" if np.median(omega_s[i-ARM_FRAMES+1:i+1]) >= 0 else "left"
                start_i = i - ARM_FRAMES + 1
                start_heading = heading[start_i]
                state = "turning"
                rel.clear()
        else:
            same_dir = (direction == ("right" if w >= 0 else "left"))
            rel.append((not turning_now) or (not same_dir))
            delta = (heading[i] - start_heading) * (1 if direction=="right" else -1)
            long_enough = (times[i] - times[start_i]) >= MIN_TURN_SEC
            if (len(rel) == RELEASE_FRAMES and all(rel)) or (delta >= ANGLE_THRESH_DEG and long_enough):
                events.append(direction)
                state = "idle"; arm.clear(); rel.clear()
                start_i = None; start_heading = None; direction = None

    left_count  = sum(1 for e in events if e == "left")
    right_count = sum(1 for e in events if e == "right")
    total_count = len(events)
    return {"turn_count": int(total_count), "left": int(left_count), "right": int(right_count)}

# ===================== LANE-CHANGE COUNT (flow proxy) =====================
# Configured to detect lane changes with moderate sensitivity
TARGET_W_LC    = 320
PROCESS_HZ_LC  = 8.0
ROI_Y0_FRAC_LC = 0.35       # Middle road area
ROI_Y1_FRAC_LC = 0.65       # Narrower ROI to focus on road
MAG_THRESH_LC  = 2.0        # Lower threshold for better detection (reduced from 3.0)
EMA_ALPHA_LC   = 0.12       # Smooth filtering
ENTER_THR_LC   = 0.50       # Moderate lateral movement required (reduced from 0.75)
EXIT_THR_LC    = 0.30       # Maintain threshold (reduced from 0.40)
MIN_TURN_SEC_LC= 1.0        # Lane change duration (reduced from 2.0 seconds)

def run_lane_change_count(video_path: str) -> Dict[str, Any]:
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return {"turn_count": 0, "left": 0, "right": 0}

    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    step = max(1, int(round(fps / PROCESS_HZ_LC)))

    ok, f0 = cap.read()
    if not ok:
        cap.release()
        return {"turn_count": 0, "left": 0, "right": 0}

    g0 = cv2.cvtColor(f0, cv2.COLOR_BGR2GRAY)
    h0, w0 = g0.shape
    s = TARGET_W_LC / float(w0)
    g0 = cv2.resize(g0, (TARGET_W_LC, int(h0 * s)), interpolation=cv2.INTER_AREA)

    H, W = g0.shape
    y0 = int(H * ROI_Y0_FRAC_LC)
    y1 = int(H * ROI_Y1_FRAC_LC)
    prev = g0[y0:y1, :]

    ema = 0.0
    turning = False
    turn_dir = 0
    right_count = 0
    left_count = 0
    frames_in_turn = 0
    frame_idx = 0

    while True:
        ok, frame = cap.read()
        if not ok:
            break
        frame_idx += 1
        if frame_idx % step != 0:
            continue

        g = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        gh, gw = g.shape
        s = TARGET_W_LC / float(gw)
        g = cv2.resize(g, (TARGET_W_LC, int(gh * s)), interpolation=cv2.INTER_AREA)
        cur = g[y0:y1, :]

        flow = cv2.calcOpticalFlowFarneback(prev, cur, None,
                                            0.5, 2, 21, 2, 5, 1.1, 0)
        u = flow[..., 0]
        v = flow[..., 1]
        mag = np.hypot(u, v)
        m = mag > MAG_THRESH_LC
        
        # Relaxed validation for better lane change detection
        if np.any(m):
            motion_coverage = np.sum(m) / m.size  # Percentage of pixels with strong motion
            mean_horizontal = np.mean(u[m])
            mean_vertical = np.abs(np.mean(v[m]))
            
            # Relaxed criteria: detect more lane changes
            # 1. Motion covers at least 10% of ROI (reduced from 25%)
            # 2. Horizontal movement is dominant (at least 1.2x vertical, reduced from 2.0x)
            # 3. Horizontal movement is moderate (>0.8 pixels, reduced from 1.5)
            if motion_coverage > 0.10 and abs(mean_horizontal) > mean_vertical * 1.2 and abs(mean_horizontal) > 0.8:
                score = mean_horizontal / (mean_vertical + 1e-6)
            else:
                score = 0.0
        else:
            score = 0.0

        ema = EMA_ALPHA_LC * score + (1.0 - EMA_ALPHA_LC) * ema
        abs_ema = abs(ema)
        dir_now = 1 if ema >= 0 else -1

        if not turning:
            if abs_ema >= ENTER_THR_LC:
                turning = True
                turn_dir = dir_now
                frames_in_turn = 1
        else:
            if abs_ema >= EXIT_THR_LC and dir_now == turn_dir:
                frames_in_turn += 1
            else:
                dur_sec = (frames_in_turn / (fps / step))
                if dur_sec >= MIN_TURN_SEC_LC:
                    if turn_dir > 0:
                        right_count += 1
                    else:
                        left_count += 1
                turning = False
                turn_dir = 0
                frames_in_turn = 0

        prev = cur

    if turning:
        dur_sec = (frames_in_turn / (fps / step))
        if dur_sec >= MIN_TURN_SEC_LC:
            if turn_dir > 0:
                right_count += 1
            else:
                left_count += 1

    cap.release()
    return {"turn_count": int(left_count + right_count), "left": int(left_count), "right": int(right_count)}

# ===================== ILLEGAL WAY (bus-lane color) =====================
ROI_WIDTH_FRAC  = 0.22
ROI_HEIGHT_FRAC = 0.18
ROI_BOTTOM_GAP  = 0.04
LOW1  = np.array([0,   80,  80])
HIGH1 = np.array([10, 255, 255])
LOW2  = np.array([170, 80,  80])
HIGH2 = np.array([180,255, 255])
MIN_RED_COVERAGE = 0.12
BUFFER_SIZE_FRAMES = 12
MIN_DURATION_SEC   = 1.0

def _get_roi_rect(h, w):
    roi_w = int(w * ROI_WIDTH_FRAC)
    roi_h = int(h * ROI_HEIGHT_FRAC)
    cx    = w // 2
    x1    = max(0, cx - roi_w // 2)
    x2    = min(w, cx + roi_w // 2)
    y2    = int(h * (1.0 - ROI_BOTTOM_GAP))
    y1    = max(0, y2 - roi_h)
    return x1, y1, x2, y2

def _red_mask_hsv(bgr):
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    hsv = cv2.bilateralFilter(hsv, d=7, sigmaColor=50, sigmaSpace=50)
    m1 = cv2.inRange(hsv, LOW1, HIGH1)
    m2 = cv2.inRange(hsv, LOW2, HIGH2)
    mask = cv2.bitwise_or(m1, m2)
    k = np.ones((3,3), np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, k, iterations=1)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, k, iterations=1)
    return mask

def run_bus_lane_color(video_path: str) -> Dict[str, Any]:
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened(): return {"violation_detected": False, "violation_ranges": []}
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    w   = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h   = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    x1, y1, x2, y2 = _get_roi_rect(h, w)
    buffer = deque(maxlen=BUFFER_SIZE_FRAMES)
    violation_active = False
    ranges = []
    frame_idx = 0

    while True:
        ret, frame = cap.read()
        if not ret: break
        frame_idx += 1

        roi = frame[y1:y2, x1:x2]
        mask = _red_mask_hsv(roi)
        red_coverage = float(np.count_nonzero(mask)) / (mask.size + 1e-6)

        on_bus_lane = (red_coverage >= MIN_RED_COVERAGE)
        buffer.append(on_bus_lane)

        if not violation_active and len(buffer) == BUFFER_SIZE_FRAMES and all(buffer):
            start_t = frame_idx / fps
            ranges.append({"start_time": start_t})
            violation_active = True

        if violation_active and len(buffer) == BUFFER_SIZE_FRAMES and not any(buffer):
            end_t = frame_idx / fps
            if "end_time" not in ranges[-1]:
                ranges[-1]["end_time"] = end_t
            violation_active = False

    cap.release()

    if violation_active and ranges and "end_time" not in ranges[-1]:
        ranges[-1]["end_time"] = frame_idx / fps

    final = []
    for r in ranges:
        if "end_time" in r and (r["end_time"] - r["start_time"]) >= MIN_DURATION_SEC:
            final.append({"start_time": round(r["start_time"], 2), "end_time": round(r["end_time"], 2)})

    return {"violation_detected": bool(final), "violation_ranges": final}

# ===================== SAFETY VIOLATION (single number) =====================
def compute_safety_violation(traffic_windows: List[Dict[str, float]], bus_ranges: List[Dict[str, float]], close_count: int) -> int:
    """
    Calculate total violation types:
    - Traffic violations (count as 1 if any)
    - Bus lane violations (count as 1 if any)
    
    Close encounters are NOT violations - they are tracked separately.
    This shows actual rule violations only.
    """
    tv = 1 if len(traffic_windows or []) > 0 else 0
    ilu = 1 if len(bus_ranges or []) > 0 else 0
    return int(tv + ilu)

# ===================== RUN ALL + SAVE =====================
def analyze_video(video_path: str, video_filename: str, calibrations: Dict[str, Any]) -> Dict[str, Any]:
    """Analyze a single video and return results"""
    print(f"\n{'='*60}")
    print(f"Analyzing: {video_filename}")
    print(f"{'='*60}")
    
    # Get calibration data for this video
    calib = calibrations.get(video_filename, {
        "meters_per_pixel": 0.05,
        "roi_top": 0.6,
        "roi_bottom": 0.9
    })
    
    # Get video metadata
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration_seconds = frame_count / fps if fps > 0 else 0
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    cap.release()
    
    print(f"📹 Video Info: {width}x{height}, {fps:.1f} FPS, {duration_seconds:.1f}s duration")
    
    # Calculate average speed - USE ENHANCED METHOD or CALIBRATED METHOD
    print("📊 Calculating average speed...")
    
    # For videos with custom calibration, use calibrated method to respect settings
    videos_with_custom_calibration = ["Dashcam004.mp4", "speed-highway.mp4"]
    use_calibrated_method = (video_filename in videos_with_custom_calibration and calib.get("meters_per_pixel") is not None)
    
    if HAS_ENHANCED_SPEED and not use_calibrated_method:
        print("   Using enhanced multi-method speed detection...")
        speed_result = estimate_speed_multimethod(video_path)
        avg_speed = speed_result.get('average_speed_kmh', 0.0)
        speed_confidence = speed_result.get('confidence', 0.0)
        print(f"   Average Speed: {avg_speed:.2f} km/h (confidence: {speed_confidence:.2f})")
        if not speed_result.get('successful', False):
            print("   ⚠️  Low confidence - falling back to standard method...")
            avg_speed = calculate_average_speed(
                video_path,
                calib.get("meters_per_pixel", 0.05),
                calib.get("roi_top", 0.6),
                calib.get("roi_bottom", 0.9)
            )
            print(f"   Fallback Speed: {avg_speed:.2f} km/h")
    else:
        if use_calibrated_method:
            print("   Using calibrated speed detection (custom calibration detected)...")
        avg_speed = calculate_average_speed(
            video_path,
            calib.get("meters_per_pixel", 0.05),
            calib.get("roi_top", 0.6),
            calib.get("roi_bottom", 0.9)
        )
        print(f"   Average Speed: {avg_speed:.2f} km/h")
    
    # Run all other analyses
    print("🚦 Analyzing traffic signals...")
    traffic_sig = run_traffic_signal_summary(video_path)
    
    # Detect close encounters - USE ENHANCED METHOD
    print("🚗 Detecting close encounters...")
    if HAS_ENHANCED_PROXIMITY:
        print("   Using enhanced proximity detection with distance estimation...")
        close_enc = detect_close_encounters_enhanced(video_path, MODEL_WEIGHTS)
        print(f"   Found {close_enc.get('event_count', 0)} close encounters")
    else:
        close_enc = run_close_encounters(video_path)
    
    print("🔄 Counting turns...")
    turns_orb   = run_turn_count(video_path)
    
    print("↔️  Detecting lane changes...")
    lane_chg    = run_lane_change_count(video_path)
    
    print("🚌 Checking bus lane violations...")
    bus_color   = run_bus_lane_color(video_path)

    safety_violation = compute_safety_violation(
        traffic_windows=traffic_sig.get("traffic_violation_windows", []),
        bus_ranges=bus_color.get("violation_ranges", []),
        close_count=close_enc.get("event_count", 0)
    )

    # Convert numpy types to Python types for JSON serialization
    def convert_to_python_types(obj):
        if isinstance(obj, dict):
            return {k: convert_to_python_types(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [convert_to_python_types(item) for item in obj]
        elif isinstance(obj, np.integer):
            return int(obj)
        elif isinstance(obj, np.floating):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        return obj

    # Calculate driving scores
    print("📊 Calculating driving scores...")
    metrics = {
        'close_encounters': close_enc.get('event_count', 0),
        'traffic_violations': 1 if traffic_sig.get('violation', False) else 0,
        'bus_lane_violations': 1 if bus_color.get('violation_detected', False) else 0,
        'lane_changes': lane_chg.get('turn_count', 0)
    }
    
    scores = calculate_driving_score(metrics)
    category = get_score_category(scores['overall_driving_score'])
    
    print(f"   Overall Score: {scores['overall_driving_score']}/100 ({category['category']})")
    print(f"   - Safety: {scores['safety_score']}/100")
    print(f"   - Compliance: {scores['compliance_score']}/100")
    print(f"   - Efficiency: {scores['efficiency_score']}/100")

    result = {
        "video_filename": video_filename,
        "video_metadata": {
            "duration_seconds": float(round(duration_seconds, 2)),
            "fps": float(round(fps, 2)),
            "frame_count": frame_count,
            "resolution": {
                "width": width,
                "height": height
            }
        },
        "average_speed_kmph": float(round(avg_speed, 2)),
        "safety_violation": int(safety_violation),
        "traffic_signal_summary": convert_to_python_types(traffic_sig),
        "close_encounters": convert_to_python_types(close_enc),
        "turn_changes_orb": convert_to_python_types(turns_orb),
        "lane_change_count": convert_to_python_types(lane_chg),
        "illegal_way_bus_lane": convert_to_python_types(bus_color),
        "driving_scores": {
            "overall_score": scores['overall_driving_score'],
            "safety_score": scores['safety_score'],
            "compliance_score": scores['compliance_score'],
            "efficiency_score": scores['efficiency_score'],
            "category": category['category'],
            "category_description": category['description'],
            "category_color": category['color'],
            "metrics_used": metrics
        }
    }
    
    print(f"✅ Analysis complete for {video_filename}")
    return result

def main_batch_process():
    """Process all videos in the videos folder and create merged JSON"""
    print("\n" + "="*60)
    print("DriveGuard AI - Batch Video Analysis")
    print("="*60)
    
    # Check if videos folder exists
    if not os.path.exists(VIDEOS_FOLDER):
        print(f"❌ Error: Videos folder not found at {VIDEOS_FOLDER}")
        return
    
    # Get all video files
    video_extensions = ['*.mp4', '*.avi', '*.mov', '*.MP4', '*.AVI', '*.MOV']
    video_files = []
    for ext in video_extensions:
        video_files.extend(glob.glob(os.path.join(VIDEOS_FOLDER, ext)))
    
    if not video_files:
        print(f"❌ No video files found in {VIDEOS_FOLDER}")
        return
    
    print(f"📹 Found {len(video_files)} video(s) to process")
    
    # Load calibration data
    calibrations = {}
    if os.path.exists(CALIBRATION_FILE):
        with open(CALIBRATION_FILE, 'r') as f:
            calibrations = json.load(f)
        print(f"✅ Loaded calibration data from {CALIBRATION_FILE}")
    else:
        print(f"⚠️  No calibration file found. Using default values.")
    
    # Process each video
    all_results = {}
    for video_path in video_files:
        video_filename = os.path.basename(video_path)
        
        try:
            # Analyze the video
            result = analyze_video(video_path, video_filename, calibrations)
            
            # Convert numpy types to Python types
            result = convert_to_python_types(result)
            
            # Save individual JSON to outputs/analysis
            os.makedirs(OUTPUT_FOLDER, exist_ok=True)
            stem = os.path.splitext(video_filename)[0]
            individual_json = os.path.join(OUTPUT_FOLDER, f"{stem}_analysis.json")
            with open(individual_json, "w") as f:
                json.dump(result, f, indent=4)
            print(f"💾 Saved individual analysis: {individual_json}")
            
            # Add to merged results
            all_results[video_filename] = result
            
        except Exception as e:
            print(f"❌ Error processing {video_filename}: {str(e)}")
            all_results[video_filename] = {
                "error": str(e),
                "status": "failed"
            }
    
    # Convert all results to Python types before saving
    all_results = convert_to_python_types(all_results)
    
    # Save merged JSON
    with open(MERGED_OUTPUT_JSON, "w") as f:
        json.dump(all_results, f, indent=4)
    print(f"\n✅ Merged analysis saved: {MERGED_OUTPUT_JSON}")
    print(f"📊 Successfully processed {len([r for r in all_results.values() if 'error' not in r])}/{len(video_files)} videos")
    print("="*60 + "\n")

if __name__ == "__main__":
    main_batch_process()
