#!/usr/bin/env python3
"""
Single Video Analysis Wrapper
Analyzes a single video file for the DriveGuard AI backend server
Supports both full path and filename-only usage
"""

import sys
import os
import json

# Add parent directory to path to import from analysis modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from main_v2 import analyze_video, MODELS_FOLDER, CONFIG_FOLDER, OUTPUT_FOLDER, BASE_DIR

def main():
    # Support both old usage (path + filename) and new usage (filename only)
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python3 analyze_video_single.py <video_filename>")
        print("  python3 analyze_video_single.py <video_path> <video_filename>")
        print("\nExamples:")
        print("  python3 analyze_video_single.py Dashcam004.mp4")
        print("  python3 analyze_video_single.py /path/to/video.mp4 video.mp4")
        sys.exit(1)
    
    # Determine if using new (filename only) or old (path + filename) format
    if len(sys.argv) == 2:
        # New format: just filename
        video_filename = sys.argv[1]
        video_path = os.path.join(BASE_DIR, "videos", video_filename)
    else:
        # Old format: path + filename (for backward compatibility)
        video_path = sys.argv[1]
        video_filename = sys.argv[2]
    
    if not os.path.exists(video_path):
        print(f"❌ Error: Video file not found: {video_path}")
        sys.exit(1)
    
    # Load calibrations
    calib_file = os.path.join(CONFIG_FOLDER, "video_calibrations.json")
    print(f"📋 Loading calibration from: {calib_file}")
    try:
        with open(calib_file, "r") as f:
            calibrations = json.load(f)
    except:
        calibrations = {}
    
    # Show calibration being used
    calib = calibrations.get(video_filename, {})
    if calib:
        print(f"\n📊 Using calibration for {video_filename}:")
        print(f"   - meters_per_pixel: {calib.get('meters_per_pixel', 'default')}")
        print(f"   - roi_top: {calib.get('roi_top', 'default')}")
        print(f"   - roi_bottom: {calib.get('roi_bottom', 'default')}\n")
    
    # Analyze the video
    try:
        print(f"{'='*60}")
        print(f"🔄 Analyzing: {video_filename}")
        print(f"{'='*60}\n")
        
        result = analyze_video(video_path, video_filename, calibrations)
        
        # Save individual analysis file
        output_file = os.path.join(OUTPUT_FOLDER, f"{os.path.splitext(video_filename)[0]}_analysis.json")
        with open(output_file, "w") as f:
            json.dump(result, f, indent=4)
        print(f"\n💾 Saved individual analysis: {output_file}")
        
        # Update merged analysis file (important for frontend)
        merged_output_file = os.path.join(OUTPUT_FOLDER, "merged_output_analysis.json")
        if os.path.exists(merged_output_file):
            with open(merged_output_file, 'r') as f:
                merged_data = json.load(f)
        else:
            merged_data = {}
        
        merged_data[video_filename] = result
        
        with open(merged_output_file, 'w') as f:
            json.dump(merged_data, f, indent=4)
        print(f"💾 Updated merged analysis: {merged_output_file}")
        
        # Display summary
        print(f"\n{'='*60}")
        print(f"✅ Analysis Complete!")
        print(f"{'='*60}")
        print(f"� Speed: {result['average_speed_kmph']:.2f} km/h")
        print(f"🎯 Score: {result['driving_scores']['overall_score']}/100")
        print(f"   - Safety: {result['driving_scores']['safety_score']}/100")
        print(f"   - Compliance: {result['driving_scores']['compliance_score']}/100")
        print(f"   - Efficiency: {result['driving_scores']['efficiency_score']}/100")
        print(f"🚗 Close Encounters: {result['close_encounters']['event_count']}")
        print(f"🚦 Traffic Violations: {len(result['traffic_signal_summary']['violations'])}")
        print(f"🚌 Bus Lane Violations: {'Yes' if result['illegal_way_bus_lane']['violation_detected'] else 'No'}")
        print(f"🔄 Turns: {result['turn_changes_orb']['turn_count']} (L:{result['turn_changes_orb']['left']}, R:{result['turn_changes_orb']['right']})")
        print(f"↔️  Lane Changes: {result['lane_change_count']['turn_count']}")
        print(f"{'='*60}\n")
        
        sys.exit(0)
        
    except Exception as e:
        print(f"\n❌ Error during analysis: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
