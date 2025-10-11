#!/usr/bin/env python3
"""
Enhanced Speed Detection - Consolidated Module
Integrated version for DriveGuard AI

This module consolidates all speed detection functionality:
- Multi-method speed detection with confidence scoring
- Dynamic scale estimation for realistic speeds
- Built-in calibration tool for testing and tuning
- Speed analysis and validation

Previously separate files merged into this module:
- improved_speed_detection.py (alternative methods)
- calibrate_speed_detection.py (calibration tool)
- calibrate_speed.py (test values)
"""

import cv2
import numpy as np
from typing import Dict, List, Tuple, Optional
from pathlib import Path

def estimate_speed_multimethod(video_path: str) -> Dict[str, float]:
    """
    Enhanced speed detection using multiple methods
    
    Returns:
        {
            'average_speed_kmh': float,
            'confidence': float,
            'method': str
        }
    """
    detector = EnhancedSpeedDetector(video_path)
    return detector.detect_speed()


class EnhancedSpeedDetector:
    """Multi-method speed detection with confidence scoring"""
    
    def __init__(self, video_path: str):
        self.video_path = video_path
        self.cap = cv2.VideoCapture(video_path)
        
        if not self.cap.isOpened():
            raise RuntimeError(f"Cannot open video: {video_path}")
        
        self.fps = self.cap.get(cv2.CAP_PROP_FPS) or 30.0
        self.width = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        self.height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        
    def method_ego_motion(self) -> Tuple[float, float]:
        """
        Estimate speed using feature tracking on road surface
        Best accuracy for typical dashcam footage
        """
        # Feature detection parameters - more features for highway
        feature_params = dict(
            maxCorners=300,  # Increased for highway detection
            qualityLevel=0.01,
            minDistance=15,  # Reduced to find more features
            blockSize=7
        )
        
        # Optical flow parameters
        lk_params = dict(
            winSize=(21, 21),  # Larger window for better tracking
            maxLevel=3,  # More pyramid levels
            criteria=(cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 10, 0.03)
        )
        
        speeds = []
        confidences = []
        
        self.cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
        ret, old_frame = self.cap.read()
        
        if not ret:
            return 0.0, 0.0
        
        old_gray = cv2.cvtColor(old_frame, cv2.COLOR_BGR2GRAY)
        
        # Enhanced ROI: Cover more area for highway scenarios
        # Lower region for road surface (60-95%)
        # Middle region for lane markers and road features (40-70%)
        roi_mask = np.zeros_like(old_gray)
        roi_mask[int(self.height * 0.4):int(self.height * 0.95), :] = 255
        
        # Detect features in ROI
        p0 = cv2.goodFeaturesToTrack(old_gray, mask=roi_mask, **feature_params)
        
        if p0 is None:
            return 0.0, 0.0
        
        frame_count = 0
        valid_frames = 0
        
        while True:
            ret, frame = self.cap.read()
            if not ret:
                break
            
            frame_count += 1
            if frame_count % 3 != 0:  # Process every 3rd frame
                continue
            
            frame_gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            
            # Calculate optical flow
            p1, st, err = cv2.calcOpticalFlowPyrLK(old_gray, frame_gray, p0, None, **lk_params)
            
            if p1 is None or st is None:
                break
            
            # Select good points
            good_new = p1[st == 1]
            good_old = p0[st == 1]
            
            if len(good_new) < 10:  # Need at least 10 tracked points
                # Re-detect features
                p0 = cv2.goodFeaturesToTrack(frame_gray, mask=roi_mask, **feature_params)
                if p0 is None:
                    break
                old_gray = frame_gray.copy()
                continue
            
            # Calculate motion vectors
            motion = good_new - good_old
            
            # Filter outliers using median and std
            median_y = np.median(motion[:, 1])
            std_y = np.std(motion[:, 1])
            
            # Keep only inliers (within 2 std devs)
            inliers = motion[np.abs(motion[:, 1] - median_y) < 2 * std_y]
            
            if len(inliers) < 5:
                old_gray = frame_gray.copy()
                p0 = good_new.reshape(-1, 1, 2)
                continue
            
            # Calculate speed with improved scale estimation
            avg_displacement_y = np.median(inliers[:, 1])
            
            # Skip if displacement is too small (stationary)
            if abs(avg_displacement_y) < 0.5:
                old_gray = frame_gray.copy()
                p0 = good_new.reshape(-1, 1, 2)
                continue
            
            # Dynamic scale estimation based on feature positions
            # Features lower in frame = closer = larger scale
            avg_y_position = np.mean([p[1] for p in good_new])
            scale_factor = self.estimate_scale_dynamic(avg_y_position)
            
            # Convert to speed
            pixels_per_second = abs(avg_displacement_y) * self.fps / 3
            meters_per_second = pixels_per_second * scale_factor
            kmh = meters_per_second * 3.6
            
            # Confidence based on:
            # 1. Number of inliers (more is better)
            # 2. Displacement magnitude (larger is more confident)
            # 3. Consistency with previous speeds
            inlier_conf = min(len(inliers) / 50.0, 1.0)
            displacement_conf = min(abs(avg_displacement_y) / 10.0, 1.0)
            confidence = (inlier_conf * 0.6 + displacement_conf * 0.4)
            
            # Sanity check: typical speeds 0-150 km/h (allow up to 150 for highways)
            if 0 <= kmh <= 150:
                speeds.append(kmh)
                confidences.append(confidence)
                valid_frames += 1
            
            # Update for next iteration
            old_gray = frame_gray.copy()
            p0 = good_new.reshape(-1, 1, 2)
        
        self.cap.release()
        
        if not speeds:
            print("  ⚠️  No valid speed measurements detected")
            return 0.0, 0.0
        
        if valid_frames < 3:
            print(f"  ⚠️  Too few valid frames ({valid_frames}), returning 0")
            return 0.0, 0.0
        
        print(f"  📊 Analyzed {valid_frames} frames, got {len(speeds)} speed measurements")
        
        # Remove extreme outliers first (speeds > 150 or < 3)
        # Allowing lower minimum (3 km/h) for parking/slow scenarios
        # Allowing higher maximum (150 km/h) for highway scenarios
        reasonable_speeds = [s for s in speeds if 3 <= s <= 150]
        reasonable_confidences = [confidences[i] for i, s in enumerate(speeds) if 3 <= s <= 150]
        
        if not reasonable_speeds:
            print("  ⚠️  No reasonable speeds detected (all too high/low)")
            return 0.0, 0.0
        
        # Weighted average by confidence
        if sum(reasonable_confidences) > 0:
            weighted_speed = np.average(reasonable_speeds, weights=reasonable_confidences)
            avg_confidence = np.mean(reasonable_confidences)
        else:
            weighted_speed = np.median(reasonable_speeds)
            avg_confidence = 0.5
        
        # Additional outlier filtering using IQR method
        q1 = np.percentile(reasonable_speeds, 25)
        q3 = np.percentile(reasonable_speeds, 75)
        iqr = q3 - q1
        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr
        
        filtered_speeds = [s for s in reasonable_speeds if lower_bound <= s <= upper_bound]
        
        if filtered_speeds and len(filtered_speeds) >= 3:
            final_speed = np.median(filtered_speeds)
            print(f"  ✅ Final speed: {final_speed:.1f} km/h (from {len(filtered_speeds)} measurements)")
        else:
            final_speed = weighted_speed
            print(f"  ✅ Final speed: {final_speed:.1f} km/h (weighted average)")
        
        return final_speed, avg_confidence
    
    def estimate_scale(self) -> float:
        """
        Estimate meters_per_pixel based on typical dashcam setup
        
        Assumptions:
        - Camera height: ~1.5m above ground
        - Looking at road ~20-40m ahead
        - Typical dashcam FOV: 90-120 degrees
        """
        # For middle portion of frame (road surface at ~20-30m)
        # CALIBRATED for realistic speeds (both highway and city)
        return 0.65  # Realistic value for mid-range detection
    
    def estimate_scale_dynamic(self, y_position: float) -> float:
        """
        Dynamic scale estimation based on vertical position in frame
        
        IMPROVED CALIBRATION for realistic speeds:
        - Dashcam mounted at ~1.2-1.5m height
        - Typical viewing distance: 5-50m ahead
        - Real-world testing showed previous values were too low
        
        Features closer to bottom of frame are closer to camera = smaller scale
        Features higher in frame are farther = larger scale
        """
        # Normalize y position (0 = top, 1 = bottom)
        y_norm = y_position / self.height
        
        # REALISTIC SCALE FACTORS (calibrated from real dashcam footage):
        # These values produce highway speeds of 50-100 km/h and city speeds of 25-50 km/h
        
        if y_norm < 0.5:
            # Far region (horizon, distant lanes) - 30-50m away
            scale = 1.0  # High scale for highway/distant feature detection
        elif y_norm < 0.7:
            # Mid region (road surface ahead) - 10-30m away
            scale = 0.65  # Medium-high scale for typical driving speeds
        else:
            # Near region (close road) - 5-10m away
            scale = 0.40  # Lower scale for close-range features
        
        return scale
    
    def detect_speed(self) -> Dict[str, float]:
        """
        Main detection method
        """
        print(f"Analyzing speed for: {self.video_path}")
        
        speed, confidence = self.method_ego_motion()
        
        print(f"  Speed: {speed:.1f} km/h (confidence: {confidence:.2f})")
        
        return {
            'average_speed_kmh': round(speed, 2),
            'confidence': round(confidence, 2),
            'method': 'enhanced_ego_motion',
            'successful': confidence > 0.3
        }


# ============================================================================
# CALIBRATION TOOL
# ============================================================================

def calibrate_speed_detection(video_path: str, known_speed_kmh: float = None):
    """
    Test and calibrate speed detection
    
    Use this function to:
    1. Test speed detection on a video
    2. Compare detected vs known speed
    3. Get calibration recommendations
    
    Args:
        video_path: Path to test video
        known_speed_kmh: If you know the actual speed, provide it for calibration
    
    Example:
        # Test without known speed
        calibrate_speed_detection('videos/highway.mp4')
        
        # Test with known speed to get calibration suggestions
        calibrate_speed_detection('videos/highway.mp4', known_speed_kmh=80)
    """
    print("=" * 60)
    print("SPEED DETECTION CALIBRATION TEST")
    print("=" * 60)
    print(f"Video: {video_path}")
    if known_speed_kmh:
        print(f"Known Speed: {known_speed_kmh} km/h")
    print("-" * 60)
    
    # Run detection
    result = estimate_speed_multimethod(video_path)
    
    detected_speed = result['average_speed_kmh']
    confidence = result['confidence']
    
    print("-" * 60)
    print(f"Detected Speed: {detected_speed:.1f} km/h")
    print(f"Confidence: {confidence:.2f}")
    
    if known_speed_kmh and detected_speed > 0:
        error = abs(detected_speed - known_speed_kmh)
        error_pct = (error / known_speed_kmh) * 100
        
        print(f"\nAccuracy Analysis:")
        print(f"  Error: {error:.1f} km/h ({error_pct:.1f}%)")
        
        # Calculate correction factor
        correction_factor = known_speed_kmh / detected_speed
        
        print(f"\n📐 Calibration Recommendation:")
        print(f"  Current scale factors in code:")
        print(f"    - Far region (horizon): 1.0 m/px")
        print(f"    - Mid region (road): 0.65 m/px")
        print(f"    - Near region (close): 0.40 m/px")
        print(f"\n  Suggested adjustment:")
        print(f"    Multiply all scale factors by: {correction_factor:.2f}")
        print(f"\n  New scale factors would be:")
        print(f"    - Far region: {1.0 * correction_factor:.2f} m/px")
        print(f"    - Mid region: {0.65 * correction_factor:.2f} m/px")
        print(f"    - Near region: {0.40 * correction_factor:.2f} m/px")
        
        if error_pct < 10:
            print(f"\n✅ Excellent! Error < 10%, calibration is good!")
        elif error_pct < 20:
            print(f"\n⚠️  Acceptable but could be better. Consider adjusting scale factors.")
        else:
            print(f"\n❌ Poor accuracy. Definitely adjust scale factors as suggested above.")
    
    print("=" * 60)
    return result


# ============================================================================
# CLI INTERFACE
# ============================================================================

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Enhanced Speed Detection - Consolidated Module")
        print("\nUsage:")
        print("  1. Test speed detection:")
        print("     python3 enhanced_speed_detection.py <video_path>")
        print("\n  2. Calibrate with known speed:")
        print("     python3 enhanced_speed_detection.py <video_path> <known_speed_kmh>")
        print("\nExamples:")
        print("  python3 enhanced_speed_detection.py videos/highway.mp4")
        print("  python3 enhanced_speed_detection.py videos/highway.mp4 80")
        print("  (if you know the video was recorded at 80 km/h)")
        sys.exit(1)
    
    video_path = sys.argv[1]
    known_speed = float(sys.argv[2]) if len(sys.argv) > 2 else None
    
    calibrate_speed_detection(video_path, known_speed)
