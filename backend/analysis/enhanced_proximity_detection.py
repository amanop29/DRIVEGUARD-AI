#!/usr/bin/env python3
"""
Enhanced Proximity Detection with Distance and Motion Analysis
Integrated version for DriveGuard AI
"""

import cv2
import numpy as np
from typing import Dict, List, Tuple, Optional
from collections import defaultdict

try:
    from ultralytics import YOLO
    HAS_YOLO = True
except ImportError:
    HAS_YOLO = False


def detect_close_encounters_enhanced(video_path: str, model_path: str = 'models/yolov8n.pt') -> Dict:
    """
    Enhanced close encounter detection with distance estimation
    
    Returns:
        {
            'close_encounters': List[Dict],
            'event_count': int,
            'method': str
        }
    """
    if not HAS_YOLO:
        return {
            'close_encounters': [],
            'event_count': 0,
            'error': 'YOLO not available'
        }
    
    detector = EnhancedProximityDetector(video_path, model_path)
    return detector.detect_encounters()


class EnhancedProximityDetector:
    """
    Improved close encounter detection with:
    - Distance estimation from box size + position
    - Motion trajectory analysis  
    - Time-to-collision calculation
    - Multi-frame validation
    """
    
    # Thresholds (restored to original sensitive values for better detection)
    DANGEROUS_DISTANCE_M = 15.0    # Within 15 meters is concerning
    CRITICAL_DISTANCE_M = 8.0      # Within 8 meters is critical
    TTC_THRESHOLD_SEC = 4.0        # Time-to-collision < 4 seconds
    MIN_TRACK_FRAMES = 5           # Need 5 frames to validate
    MIN_BOX_HEIGHT_RATIO = 0.20    # Box must be at least 20% of frame height
    
    def __init__(self, video_path: str, model_path: str):
        self.video_path = video_path
        self.model_path = model_path
        
        self.cap = cv2.VideoCapture(video_path)
        if not self.cap.isOpened():
            raise RuntimeError(f"Cannot open video: {video_path}")
        
        self.fps = self.cap.get(cv2.CAP_PROP_FPS) or 30.0
        self.width = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        self.height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        
        # Calibration (adjust for your dashcam)
        self.camera_height_m = 1.5      # Dashcam mounted 1.5m above ground
        self.camera_fov_deg = 90        # Typical dashcam FOV
        self.focal_length = self.width / (2 * np.tan(np.radians(self.camera_fov_deg / 2)))
        
    def estimate_distance(self, box: Tuple[int, int, int, int], vehicle_class: str) -> float:
        """
        Estimate distance to vehicle using pinhole camera model
        
        Args:
            box: (x1, y1, x2, y2)
            vehicle_class: 'car', 'truck', 'bus', etc.
        
        Returns:
            distance in meters
        """
        x1, y1, x2, y2 = box
        box_height_px = y2 - y1
        
        if box_height_px <= 0:
            return 100.0
        
        # Real-world vehicle heights (meters)
        real_heights = {
            'car': 1.5,
            'truck': 3.0,
            'bus': 3.5,
            'motorcycle': 1.2,
            'bicycle': 1.5
        }
        
        real_height = real_heights.get(vehicle_class, 1.5)
        
        # Distance = (real_height * focal_length) / box_height_px
        distance = (real_height * self.focal_length) / box_height_px
        
        # Adjust based on vertical position (perspective correction)
        y_center = (y1 + y2) / 2
        horizon_y = self.height * 0.45  # Horizon at ~45% from top
        
        if y_center < horizon_y:
            # Above horizon = farther away
            distance *= 1.5
        
        # Sanity check
        distance = np.clip(distance, 1.0, 100.0)
        
        return distance
    
    def calculate_ttc(self, track_history: List[Dict]) -> float:
        """
        Calculate Time-To-Collision based on distance change rate
        
        Returns:
            TTC in seconds (inf if not approaching)
        """
        if len(track_history) < 3:
            return float('inf')
        
        # Get recent positions
        recent = track_history[-min(5, len(track_history)):]
        
        distances = np.array([t['distance'] for t in recent])
        times = np.array([t['time'] for t in recent])
        
        if len(times) < 2:
            return float('inf')
        
        # Calculate rate of distance change (linear regression)
        time_diffs = times - times[0]
        
        if len(time_diffs) < 2:
            return float('inf')
        
        # Fit line to distance over time
        slope, _ = np.polyfit(time_diffs, distances, 1)
        
        if slope >= -0.1:  # Not approaching (or very slowly)
            return float('inf')
        
        # TTC = current_distance / |closing_rate|
        current_distance = distances[-1]
        ttc = current_distance / abs(slope)
        
        return ttc
    
    def is_lateral_movement(self, track_history: List[Dict]) -> bool:
        """
        Check if vehicle is moving laterally (passing, not approaching)
        """
        if len(track_history) < 3:
            return False
        
        recent = track_history[-min(5, len(track_history)):]
        x_positions = [t['center_x'] for t in recent]
        
        # Check horizontal movement
        x_movement = abs(x_positions[-1] - x_positions[0])
        
        # If moving more than 30% of frame width, it's lateral
        return x_movement > (self.width * 0.3)
    
    def detect_encounters(self) -> Dict:
        """
        Main detection loop with enhanced logic
        """
        print(f"Enhanced proximity detection for: {self.video_path}")
        
        model = YOLO(self.model_path)
        model.to('mps' if cv2.ocl.haveOpenCL() else 'cpu')
        
        # Track vehicles across frames
        vehicle_tracks = defaultdict(lambda: {
            'history': [],
            'first_frame': 0,
            'last_frame': 0,
            'min_distance': float('inf'),
            'max_danger_score': 0.0,
            'is_dangerous': False
        })
        
        frame_idx = 0
        
        while True:
            ret, frame = self.cap.read()
            if not ret:
                break
            
            frame_idx += 1
            time_sec = frame_idx / self.fps
            
            # Skip frames for performance
            if frame_idx % 2 != 0:
                continue
            
            # Run detection with tracking
            results = model.track(frame, persist=True, conf=0.3, iou=0.5, verbose=False)
            
            if results[0].boxes is None or len(results[0].boxes) == 0:
                continue
            
            for box in results[0].boxes:
                cls_id = int(box.cls[0])
                cls_name = model.names[cls_id]
                
                # Only track vehicles
                if cls_name not in ['car', 'truck', 'bus', 'motorcycle']:
                    continue
                
                # Get bounding box
                x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                box_height = y2 - y1
                
                # Filter out small boxes (far away or detection errors)
                if box_height < self.height * self.MIN_BOX_HEIGHT_RATIO:
                    continue
                
                # Get track ID
                if box.id is None:
                    continue
                track_id = int(box.id[0])
                
                # Calculate distance
                distance = self.estimate_distance((x1, y1, x2, y2), cls_name)
                
                # Calculate center
                center_x = (x1 + x2) / 2
                center_y = (y1 + y2) / 2
                
                # Check if vehicle is in center region (frontal)
                is_frontal = (self.width * 0.3 < center_x < self.width * 0.7)
                
                # Update track history
                track_data = {
                    'time': time_sec,
                    'distance': distance,
                    'box': (x1, y1, x2, y2),
                    'box_height': box_height,
                    'center_x': center_x,
                    'center_y': center_y,
                    'class': cls_name,
                    'is_frontal': is_frontal
                }
                
                vehicle_tracks[track_id]['history'].append(track_data)
                vehicle_tracks[track_id]['last_frame'] = frame_idx
                
                if vehicle_tracks[track_id]['first_frame'] == 0:
                    vehicle_tracks[track_id]['first_frame'] = frame_idx
                
                # Update minimum distance
                if distance < vehicle_tracks[track_id]['min_distance']:
                    vehicle_tracks[track_id]['min_distance'] = distance
                
                # Evaluate danger if we have enough frames
                if len(vehicle_tracks[track_id]['history']) >= self.MIN_TRACK_FRAMES:
                    ttc = self.calculate_ttc(vehicle_tracks[track_id]['history'])
                    is_lateral = self.is_lateral_movement(vehicle_tracks[track_id]['history'])
                    
                    # Danger criteria:
                    # 1. Close distance
                    # 2. Frontal position (not just passing by)
                    # 3. Approaching (TTC < threshold)
                    # 4. Not lateral movement
                    
                    is_close = distance < self.DANGEROUS_DISTANCE_M
                    is_critical = distance < self.CRITICAL_DISTANCE_M
                    is_approaching = ttc < self.TTC_THRESHOLD_SEC
                    
                    if (is_close and is_frontal and (is_approaching or is_critical) and not is_lateral):
                        # Calculate danger score
                        distance_factor = 1.0 / max(distance, 0.5)
                        ttc_factor = 1.0 / max(ttc, 0.5) if ttc != float('inf') else 0.5
                        box_factor = box_height / self.height
                        
                        danger_score = distance_factor * 0.5 + ttc_factor * 0.3 + box_factor * 0.2
                        
                        if danger_score > vehicle_tracks[track_id]['max_danger_score']:
                            vehicle_tracks[track_id]['max_danger_score'] = danger_score
                            vehicle_tracks[track_id]['is_dangerous'] = True
                            vehicle_tracks[track_id]['peak_time'] = time_sec
                            vehicle_tracks[track_id]['peak_distance'] = distance
                            vehicle_tracks[track_id]['ttc'] = ttc if ttc != float('inf') else 0
        
        self.cap.release()
        
        # Convert dangerous tracks to close encounters
        close_encounters = []
        
        for track_id, track_data in vehicle_tracks.items():
            if not track_data['is_dangerous']:
                continue
            
            history = track_data['history']
            
            if len(history) < self.MIN_TRACK_FRAMES:
                continue
            
            # Determine location
            avg_x = np.mean([h['center_x'] for h in history])
            
            if avg_x < self.width * 0.33:
                location = 'left'
            elif avg_x > self.width * 0.67:
                location = 'right'
            else:
                location = 'center'
            
            # Calculate peak score (normalized 0-1)
            peak_score = min(track_data['max_danger_score'], 1.0)
            
            encounter = {
                'start_time': round(history[0]['time'], 2),
                'end_time': round(history[-1]['time'], 2),
                'peak_time': round(track_data.get('peak_time', history[0]['time']), 2),
                'peak_score': round(peak_score, 3),
                'where': location,
                'max_box_height_norm': round(max(h['box_height'] for h in history) / self.height, 3),
                # Additional info for debugging
                'min_distance_m': round(track_data['min_distance'], 2),
                'ttc_sec': round(track_data.get('ttc', 0), 2)
            }
            
            close_encounters.append(encounter)
        
        print(f"  Found {len(close_encounters)} close encounters")
        
        return {
            'close_encounters': close_encounters,
            'event_count': len(close_encounters),
            'method': 'enhanced_proximity_v2'
        }
