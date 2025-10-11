#!/usr/bin/env python3
"""
Enhanced Traffic Signal Detection
Improves traffic light detection accuracy using multiple techniques:
1. Deep learning (YOLO) + traditional color detection
2. Morphological filtering to reduce false positives
3. Temporal consistency checking
4. Position-based filtering
"""

import cv2
import numpy as np
from typing import List, Tuple, Dict, Any
import torch

class EnhancedTrafficDetector:
    """Enhanced traffic signal detection with multiple methods"""
    
    def __init__(self, use_yolo: bool = True, device: str = 'cpu'):
        """
        Initialize enhanced traffic detector
        
        Args:
            use_yolo: Whether to use YOLO for traffic light detection
            device: Device to use ('cuda', 'mps', or 'cpu')
        """
        self.use_yolo = use_yolo
        self.device = device
        self.yolo_model = None
        
        # HSV color ranges for traffic lights (improved)
        self.hsv_ranges = {
            'red_1': ((0, 100, 100), (10, 255, 255)),      # Red wrap-around part 1
            'red_2': ((170, 100, 100), (180, 255, 255)),   # Red wrap-around part 2
            'amber': ((10, 100, 100), (25, 255, 255)),     # Amber/Yellow
            'green': ((35, 50, 50), (85, 255, 255))        # Green
        }
        
        # Morphological kernels for filtering
        self.kernel_small = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        self.kernel_medium = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        
        # Temporal tracking
        self.recent_detections = []  # Store last N frames
        self.max_history = 10
        
        if use_yolo:
            self._init_yolo()
    
    def _init_yolo(self):
        """Initialize YOLO model for traffic light detection"""
        try:
            from ultralytics import YOLO
            # You can train a custom model or use pre-trained one
            # For now, we'll use the standard model and filter for traffic lights
            print("⚠️  YOLO traffic light detection not yet trained")
            print("   Using enhanced HSV detection instead")
            self.use_yolo = False
        except Exception as e:
            print(f"Failed to initialize YOLO: {e}")
            self.use_yolo = False
    
    def detect_traffic_lights(self, frame: np.ndarray, hsv_frame: np.ndarray = None) -> Dict[str, List[Tuple]]:
        """
        Detect traffic lights using enhanced methods
        
        Args:
            frame: BGR image frame
            hsv_frame: Optional pre-computed HSV frame
        
        Returns:
            Dictionary with detected lights: {'red': [(x,y,w,h), ...], 'amber': [...], 'green': [...]}
        """
        if hsv_frame is None:
            hsv_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        
        detections = {'red': [], 'amber': [], 'green': []}
        
        # Method 1: Enhanced HSV color detection
        hsv_detections = self._hsv_detection(frame, hsv_frame)
        
        # Method 2: YOLO detection (if available)
        if self.use_yolo and self.yolo_model is not None:
            yolo_detections = self._yolo_detection(frame)
            # Merge detections
            detections = self._merge_detections(hsv_detections, yolo_detections)
        else:
            detections = hsv_detections
        
        # Method 3: Apply temporal consistency
        detections = self._temporal_filtering(detections)
        
        return detections
    
    def _hsv_detection(self, frame: np.ndarray, hsv: np.ndarray) -> Dict[str, List[Tuple]]:
        """Enhanced HSV-based detection with morphological filtering"""
        detections = {'red': [], 'amber': [], 'green': []}
        h, w = frame.shape[:2]
        
        # Only look in top half of frame (traffic lights are usually high)
        roi_hsv = hsv[0:int(h*0.6), :]
        
        for color in ['red', 'amber', 'green']:
            # Get appropriate HSV ranges
            if color == 'red':
                # Red has two ranges due to wrap-around in HSV
                mask1 = cv2.inRange(roi_hsv, self.hsv_ranges['red_1'][0], self.hsv_ranges['red_1'][1])
                mask2 = cv2.inRange(roi_hsv, self.hsv_ranges['red_2'][0], self.hsv_ranges['red_2'][1])
                mask = cv2.bitwise_or(mask1, mask2)
            else:
                mask = cv2.inRange(roi_hsv, self.hsv_ranges[color][0], self.hsv_ranges[color][1])
            
            # Apply morphological operations to reduce noise
            # 1. Opening to remove small noise
            mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, self.kernel_small)
            # 2. Closing to fill gaps
            mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, self.kernel_medium)
            
            # Find contours
            contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            for contour in contours:
                area = cv2.contourArea(contour)
                # Filter by size (traffic lights should be within certain size range)
                if 50 < area < 5000:  # Adjust based on your video resolution
                    x, y, w_box, h_box = cv2.boundingRect(contour)
                    
                    # Traffic lights are usually vertical rectangles or circles
                    aspect_ratio = h_box / max(w_box, 1)
                    
                    # Filter by aspect ratio (should be roughly square or vertical)
                    if 0.8 < aspect_ratio < 2.5:
                        # Check brightness in the region (traffic lights are bright)
                        roi = frame[y:y+h_box, x:x+w_box]
                        brightness = np.mean(cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY))
                        
                        if brightness > 100:  # Traffic lights are bright
                            detections[color].append((x, y, w_box, h_box))
        
        return detections
    
    def _yolo_detection(self, frame: np.ndarray) -> Dict[str, List[Tuple]]:
        """YOLO-based traffic light detection (to be implemented)"""
        # Placeholder for custom YOLO model trained on traffic lights
        return {'red': [], 'amber': [], 'green': []}
    
    def _merge_detections(self, hsv_det: Dict, yolo_det: Dict) -> Dict[str, List[Tuple]]:
        """Merge detections from multiple methods"""
        # Simple merge - can be improved with NMS (Non-Maximum Suppression)
        merged = {}
        for color in ['red', 'amber', 'green']:
            merged[color] = hsv_det[color] + yolo_det[color]
        return merged
    
    def _temporal_filtering(self, detections: Dict[str, List[Tuple]]) -> Dict[str, List[Tuple]]:
        """
        Apply temporal consistency check
        Only keep detections that appear in multiple consecutive frames
        """
        # Store current detections
        self.recent_detections.append(detections)
        if len(self.recent_detections) > self.max_history:
            self.recent_detections.pop(0)
        
        # If we don't have enough history yet, return current detections
        if len(self.recent_detections) < 3:
            return detections
        
        # Filter detections that appear consistently
        filtered = {'red': [], 'amber': [], 'green': []}
        
        for color in ['red', 'amber', 'green']:
            current = detections[color]
            for det in current:
                # Check if similar detection exists in recent frames
                if self._exists_in_history(det, color):
                    filtered[color].append(det)
        
        return filtered
    
    def _exists_in_history(self, detection: Tuple, color: str, threshold: int = 30) -> bool:
        """Check if a detection exists in recent history"""
        x, y, w, h = detection
        count = 0
        
        # Check last 3 frames
        for frame_det in self.recent_detections[-3:]:
            for hist_det in frame_det[color]:
                hx, hy, hw, hh = hist_det
                # Check if detections are close to each other
                if abs(x - hx) < threshold and abs(y - hy) < threshold:
                    count += 1
                    break
        
        # Detection should exist in at least 2 out of 3 recent frames
        return count >= 2
    
    def improve_traffic_signal_detection(self, frame: np.ndarray, 
                                         hsv_ranges: Dict[str, Tuple]) -> Dict[str, int]:
        """
        Improved traffic signal detection for integration with main_v2.py
        
        Args:
            frame: BGR image frame
            hsv_ranges: Dictionary of HSV color ranges
        
        Returns:
            Dictionary with counts: {'red': count, 'amber': count, 'green': count}
        """
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        detections = self.detect_traffic_lights(frame, hsv)
        
        return {
            'red': len(detections['red']),
            'amber': len(detections['amber']),
            'green': len(detections['green'])
        }


def test_enhanced_detection(video_path: str, output_path: str = None):
    """Test enhanced traffic detection on a video"""
    import os
    
    # Detect device
    if torch.cuda.is_available():
        device = 'cuda'
    elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
        device = 'mps'
    else:
        device = 'cpu'
    
    print(f"Using device: {device}")
    
    detector = EnhancedTrafficDetector(use_yolo=False, device=device)
    
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"Error: Cannot open video {video_path}")
        return
    
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    
    # Setup video writer if output path provided
    writer = None
    if output_path:
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        writer = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
    
    frame_count = 0
    total_detections = {'red': 0, 'amber': 0, 'green': 0}
    
    print("Processing video...")
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        frame_count += 1
        
        # Detect traffic lights
        detections = detector.detect_traffic_lights(frame)
        
        # Update counts
        for color in ['red', 'amber', 'green']:
            total_detections[color] += len(detections[color])
        
        # Draw detections on frame
        for color in ['red', 'amber', 'green']:
            color_bgr = {'red': (0, 0, 255), 'amber': (0, 165, 255), 'green': (0, 255, 0)}
            for (x, y, w, h) in detections[color]:
                cv2.rectangle(frame, (x, y), (x+w, y+h), color_bgr[color], 2)
                cv2.putText(frame, color.upper(), (x, y-5), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, color_bgr[color], 2)
        
        # Write frame if output requested
        if writer:
            writer.write(frame)
        
        # Print progress every 100 frames
        if frame_count % 100 == 0:
            print(f"Processed {frame_count} frames...")
    
    cap.release()
    if writer:
        writer.release()
    
    print("\n=== Detection Results ===")
    print(f"Total frames processed: {frame_count}")
    print(f"Red lights detected: {total_detections['red']}")
    print(f"Amber lights detected: {total_detections['amber']}")
    print(f"Green lights detected: {total_detections['green']}")
    
    if output_path:
        print(f"\nAnnotated video saved to: {output_path}")


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python3 enhanced_traffic_detection.py <video_path> [output_path]")
        print("Example: python3 enhanced_traffic_detection.py ../videos/Dashcam001.mp4 output_traffic.mp4")
        sys.exit(1)
    
    video_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else None
    
    test_enhanced_detection(video_path, output_path)
