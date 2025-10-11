# How Video Upload and Analysis Works

> **Quick Reference** - Simplified overview of the complete video processing pipeline

## 🔄 High-Level Flow

```
User Upload → Backend API → Python Analysis → AI Models → Results → Dashboard
   (React)      (Node.js)       (main_v2.py)    (YOLO/CV)   (JSON)    (Display)
```

---

## 📋 Processing Pipeline (6 Stages)

### Stage 1: Frontend Upload 📤
**Component:** `VideoUpload.tsx`

```typescript
// User selects video → Creates FormData → POST to backend
const formData = new FormData();
formData.append('video', selectedFile);
const response = await fetch('http://localhost:3001/api/upload-video', {
  method: 'POST',
  body: formData
});
```

**Result:** Video uploaded, `jobId` returned for tracking

---

### Stage 2: Backend Receives Upload 🔧
**File:** `backend/server.js`

```javascript
// Multer saves file → Generate jobId → Spawn Python process
app.post('/api/upload-video', upload.single('video'), (req, res) => {
  const jobId = Date.now().toString();
  res.json({ success: true, jobId });
  processVideo(jobId, videoFilename); // Background process
});
```

**Storage:** `backend/videos/{filename}.mp4`

---

### Stage 3: Python Analysis Wrapper 🐍
**File:** `backend/analysis/analyze_video_single.py`

```python
# Bridge between Node.js and Python analysis engine
video_path = sys.argv[1]
video_filename = sys.argv[2]

# Load calibrations and run analysis
calibrations = json.load(open("config/video_calibrations.json"))
result = analyze_video(video_path, video_filename, calibrations)

# Save results
json.dump(result, open(f"outputs/analysis/{filename}_analysis.json", 'w'))
```

---

### Stage 4: AI Model Analysis 🤖
**File:** `backend/analysis/main_v2.py`

#### 4.1 Initialization
```python
# Load YOLO model + Open video
model = YOLO('models/yolov8n.pt').to(device)  # Apple Silicon MPS or CPU
cap = cv2.VideoCapture(video_path)
fps, duration, resolution = extract_metadata(cap)
```

#### 4.2 Frame-by-Frame Processing
```python
for frame_idx in range(total_frames):
    frame = cap.read()
    
    # Run 5 parallel analyses on each frame:
    speeds.append(detect_speed(frame, prev_frame))           # Optical flow
    encounters.extend(detect_proximity(frame, model))        # YOLO + distance
    violations.extend(detect_traffic_violations(frame))      # Signal detection
    bus_lane.extend(detect_bus_lane(frame))                  # HSV color
    lane_changes.extend(detect_lane_changes(flow))           # Lateral motion
```

#### 4.3 Post-Processing
```python
# Aggregate frame data
avg_speed = np.mean(speeds_filtered)  # IQR filtering
total_encounters = len([e for e in encounters if e['severity'] == 'critical'])
total_violations = len(violations)

# Calculate driving scores
scores = calculate_driving_score({
    'speed': avg_speed,
    'encounters': encounters,
    'violations': violations,
    'lane_changes': lane_changes
})
```

---

### Stage 5: AI Models Detailed 🧠

#### Speed Detection (enhanced_speed_detection.py)
```python
# Multi-method approach
- Lucas-Kanade Optical Flow → Track pixel movements
- Shi-Tomasi Features → Corner detection and tracking
- Scale Estimation → Far: 1.0 m/px, Mid: 0.65 m/px, Near: 0.40 m/px
- IQR Filtering → Remove outliers (>200 km/h)
→ Result: Realistic speed (10-120 km/h)
```

#### Object Detection (YOLOv8)
```python
# Detect vehicles and objects
results = model(frame, conf=0.5)
for detection in results[0].boxes:
    class_name = model.names[int(detection.cls)]  # car, truck, bus, person
    bbox = detection.xyxy[0]  # [x1, y1, x2, y2]
    confidence = detection.conf[0]
```

#### Close Encounters (enhanced_proximity_detection.py)
```python
# Distance estimation from bbox size
distance = estimate_distance_from_bbox(width, height, vehicle_type)
expansion_score = calculate_expansion(bbox, frame_idx)  # TTC

# Severity classification
if distance < 5m or expansion > 0.7: severity = 'critical'
elif distance < 10m or expansion > 0.4: severity = 'warning'
else: severity = 'info'
```

#### Traffic Violations (enhanced_traffic_detection.py)
```python
# Red light detection
hsv = cv2.cvtColor(traffic_light_roi, cv2.COLOR_BGR2HSV)
red_mask = cv2.inRange(hsv, (0,100,100), (10,255,255))
if red_pixels > threshold: violation = 'red_light_run'

# Speed violations
if current_speed > speed_limit * 1.1: violation = 'speeding'
```

#### Driving Score Calculation (driving_score_calculator.py)
```python
# Composite scoring
safety_score = 100 - (critical_encounters * 15) - (avg_encounters * 5)
compliance_score = 100 - (violations * 20) - (bus_violations * 15)
efficiency_score = 100 - (excessive_lane_changes * 3)

overall_score = (safety * 0.50) + (compliance * 0.35) + (efficiency * 0.15)
```

---

### Stage 6: Results Storage & API 💾

#### Save Individual Analysis
```python
# In analyze_video_single.py
output = {
    'video_filename': 'Dashcam001.mp4',
    'video_metadata': { fps, duration, resolution },
    'driving_scores': { overall: 85, safety: 82, compliance: 90, efficiency: 83 },
    'speed_analysis': { avg, max, std, frame_speeds[] },
    'close_encounters': [ {...}, {...} ],
    'traffic_violations': [ {...} ],
    'frame_data': [ {...}, {...} ]
}
json.dump(output, open('outputs/analysis/Dashcam001_analysis.json', 'w'))
```

#### Update Merged File
```javascript
// In backend/server.js
function updateMergedAnalysis(videoFilename, results) {
    let merged = JSON.parse(fs.readFileSync('outputs/analysis/merged_output_analysis.json'));
    merged[videoFilename] = results;  // Add/update
    fs.writeFileSync('outputs/analysis/merged_output_analysis.json', JSON.stringify(merged));
}
```

**File Structure:**
```
backend/outputs/analysis/
├── Dashcam001_analysis.json         ← Individual results
├── Dashcam002_analysis.json
├── speed-highway_analysis.json
└── merged_output_analysis.json      ← All results combined (single source of truth)
```

---

## 🎯 Frontend Display

### Data Fetching
```typescript
// In App.tsx
const response = await fetch('http://localhost:3001/api/merged-analysis');
const analysisData = await response.json();
// Returns: { "Dashcam001.mp4": {...}, "Dashcam002.mp4": {...}, "analyses": {...} }
```

### Dashboard Tabs

**1. Dashboard (Overview)**
- Overall driving score (gauge chart)
- Score breakdown (safety, compliance, efficiency)
- Key metrics cards

**2. Metrics (Detailed Stats)**
- Speed analysis (avg, max, std)
- Safety events (encounters, violations)
- Compliance summary

**3. Charts (Visualizations)**
- Speed over time (line chart)
- Encounters timeline (scatter chart)
- Score breakdown (radar chart)

**4. Video Playback (Interactive)**
- Video player with event markers
- Clickable timeline events
- Playback controls (speed, seek)

---

## 📊 Status Updates & Polling

### Backend Progress Tracking
```javascript
processingJobs.set(jobId, {
    status: 'processing',  // or 'completed', 'failed'
    progress: 50,          // 0-100
    videoFilename: 'Dashcam001.mp4'
});
```

### Frontend Polling
```typescript
// Poll every 2 seconds
const interval = setInterval(async () => {
    const status = await fetch(`http://localhost:3001/api/status/${jobId}`);
    setProgress(status.progress);  // Update UI
    if (status.progress === 100) clearInterval(interval);
}, 2000);
```

**Progress Breakdown:**
- 0-10%: Upload complete, initializing
- 10-30%: Loading AI models
- 30-70%: Processing frames
- 70-90%: Calculating scores
- 90-100%: Saving results
- 100%: ✅ Complete!

---

## 🔑 Key Files Reference

### Backend
| File | Purpose |
|------|---------|
| `server.js` | Express API, file upload, process management |
| `analyze_video_single.py` | Python wrapper for single video |
| `main_v2.py` | Main analysis orchestrator |
| `enhanced_speed_detection.py` | Multi-method speed calculation |
| `enhanced_proximity_detection.py` | Close encounter detection |
| `enhanced_traffic_detection.py` | Traffic violation detection |
| `driving_score_calculator.py` | Score calculation engine |

### Frontend
| File | Purpose |
|------|---------|
| `App.tsx` | Main app, data sync |
| `VideoUpload.tsx` | Upload component with progress |
| `AnalysisDashboard.tsx` | Main dashboard with tabs |
| `VideoPlayer.tsx` | Video playback with markers |

### Models & Config
| File | Purpose |
|------|---------|
| `yolov8n.pt` | YOLOv8 nano (fast) |
| `yolov8s.pt` | YOLOv8 small (accurate) |
| `video_calibrations.json` | Speed calibration settings |
| `analysis_config.json` | Detection thresholds |

---

## 🚀 API Endpoints

### Upload & Processing
```
POST /api/upload-video        Upload video, start analysis
GET  /api/status/:jobId        Check processing status
GET  /api/results/:filename    Get individual analysis JSON
```

### Data Retrieval
```
GET  /api/merged-analysis      Get all video analyses (main endpoint)
GET  /api/user-analyses/:email Get user's saved analyses
GET  /videos/:filename         Stream video file
GET  /outputs/:path            Get output files
```

### User Management
```
POST /api/register             Register new user
POST /api/login                User login
POST /api/save-analysis        Save analysis to user history
PUT  /api/update-user          Update user profile
```

---

## ⚡ Performance

### Processing Times
- 30-second video: ~15-30 seconds
- 2-minute video: ~60-120 seconds
- 5-minute video: ~3-5 minutes

### Factors
- ✅ Apple Silicon GPU (MPS): 2-3x faster
- ✅ Video resolution: 1080p < 4K
- ✅ YOLO model: yolov8n (fast) vs yolov8s (accurate)
- ✅ Frame sampling: Every frame vs every 2nd frame

### Resource Usage
- CPU: 40-80% during processing
- GPU: 60-90% with MPS
- RAM: ~2-4 GB
- Disk: ~100 MB per video

---

## 🔍 Troubleshooting

### Video not processing?
```bash
# Check backend
lsof -ti:3001

# Check Python
python3 --version

# Check models
ls backend/models/*.pt

# View logs
tail -f backend/backend.log
```

### Results not showing?
```bash
# Test API
curl http://localhost:3001/api/merged-analysis

# Check files
ls backend/outputs/analysis/

# Hard refresh browser
Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
```

### Analysis too slow?
- Use yolov8n.pt (faster model)
- Reduce video resolution
- Check GPU acceleration enabled
- Process shorter segments

---

## ✅ System Status

**Components:**
- ✅ Backend API (port 3001)
- ✅ Frontend UI (port 5173)
- ✅ Python Analysis Engine
- ✅ AI Models (YOLO + OpenCV)
- ✅ GPU Acceleration (Apple Silicon MPS)
- ✅ Video Upload & Processing
- ✅ Real-time Progress Tracking
- ✅ Interactive Dashboard

**Status:** 🟢 **Fully Operational**

---

## 📚 Related Documentation

- **[README.md](../README.md)** - Project overview and setup
- **[BACKEND_DOCUMENTATION.md](./BACKEND_DOCUMENTATION.md)** - Backend architecture
- **[FRONTEND_DOCUMENTATION.md](./FRONTEND_DOCUMENTATION.md)** - Frontend components
- **[COMPLETE_SYSTEM_WORKFLOW.md](./COMPLETE_SYSTEM_WORKFLOW.md)** - System workflow

---

**Last Updated:** October 9, 2025  
**Version:** 2.0.0  
**Architecture:** Frontend/Backend Separation
