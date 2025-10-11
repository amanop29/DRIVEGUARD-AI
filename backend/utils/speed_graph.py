import cv2
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
import math
import sys
import os
import json

def create_speed_chart(video_path, config, output_path='speed_chart.png', visualize=False):
    """
    Analyzes a video to generate and save a smoothed speed vs. time chart
    using the existing rectangular ROI parameters.
    """
    print("Step 1: Analyzing video with improved logic...")
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"Error: Cannot open video file at {video_path}")
        return

    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    # Use existing rectangular ROI parameters from the JSON file
    roi_top = config.get('roi_top', 0.5)
    roi_bottom = config.get('roi_bottom', 0.8)
    # --- IMPORTANT ---
    # The 'meters_per_pixel' from the JSON is too high for accurate graphing, causing unrealistic speeds.
    # We will override it here with a more sensible value ONLY for this script.
    # This will NOT affect your other scripts like Avg_speed.py.
    # You can tune this value if speeds are still off.
    mpp = 0.05 # Using a more realistic value for graphing.
    # mpp = config.get('meters_per_pixel', 6.0) # This was the original line, now disabled.

    roi_start_y = int(height * roi_top)
    roi_end_y = int(height * roi_bottom)

    prev_gray_frame = None
    frame_speeds_kmph = []

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        current_gray_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        if prev_gray_frame is None:
            prev_gray_frame = current_gray_frame
            continue

        # Get the rectangular ROI from both frames
        prev_roi = prev_gray_frame[roi_start_y:roi_end_y, :]
        current_roi = current_gray_frame[roi_start_y:roi_end_y, :]

        if prev_roi.size == 0:
            continue

        flow = cv2.calcOpticalFlowFarneback(prev_roi, current_roi, None, 0.5, 3, 15, 3, 5, 1.2, 0)
        
        speed_kmph = 0
        if flow is not None:
            # --- IMPROVEMENT: Filter flow vectors ---
            # Keep only downward vertical flow (positive y-direction) which represents road movement
            downward_flow_y = flow[..., 1][flow[..., 1] > 0]

            if downward_flow_y.shape[0] > 20: # Require a minimum number of flow vectors
                # Use a more robust percentile to ignore outliers (e.g., from shadows, reflections)
                # This is more stable than the median for noisy data.
                stable_flow = np.percentile(downward_flow_y, 75)
                
                # If flow is very small, consider it zero speed (car is stopped)
                if stable_flow < 0.1:
                    speed_kmph = 0
                else:
                    speed_mps = abs(stable_flow * mpp * fps)
                    speed_kmph = speed_mps * 3.6
            else:
                # Not enough motion detected, assume speed is zero
                speed_kmph = 0

        frame_speeds_kmph.append(speed_kmph)
        
        if visualize:
            vis_frame = frame.copy()
            # Draw the rectangle on the frame
            cv2.rectangle(vis_frame, (0, roi_start_y), (vis_frame.shape[1], roi_end_y), (0, 255, 255), 2)
            
            cv2.putText(vis_frame, f"Speed: {speed_kmph:.2f} km/h", (50, 50), 
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 0), 2)
            
            cv2.imshow("Speed Analysis - Press 'q' to quit", vis_frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                visualize = False
                cv2.destroyAllWindows()

        prev_gray_frame = current_gray_frame
    
    cap.release()
    if visualize:
        cv2.destroyAllWindows()
    print("Step 1 Complete.")

    if not frame_speeds_kmph:
        print("Could not calculate speed data.")
        return

    # --- IMPROVEMENT: Smooth the speed data using a moving average ---
    # This removes noise and jitter for a much cleaner graph.
    window_size = int(fps / 2) # Use a half-second window for smoothing
    if window_size < 1: window_size = 1
    # Use 'valid' mode and adjust time points accordingly
    smoothed_speeds = np.convolve(frame_speeds_kmph, np.ones(window_size)/window_size, mode='valid')

    # --- Step 2: Aggregate speed data per second ---
    print("Step 2: Aggregating smoothed speed data...")
    num_smoothed_frames = len(smoothed_speeds)
    total_seconds = int(num_smoothed_frames / fps)
    
    time_points = []
    speed_points = []

    for sec in range(total_seconds):
        start_frame = int(sec * fps)
        end_frame = int((sec + 1) * fps)
        
        second_speeds = smoothed_speeds[start_frame:end_frame]
        
        if len(second_speeds) > 0:
            avg_speed_for_second = np.mean(second_speeds)
            time_points.append(sec)
            speed_points.append(avg_speed_for_second)
    print("Step 2 Complete.")

    # --- Step 3: Generate the chart ---
    if not speed_points:
        print("No speed points to plot after aggregation.")
        return
        
    print(f"Step 3: Generating chart and saving to {output_path}...")
    plt.style.use('dark_background')
    fig, ax = plt.subplots(figsize=(12, 6))

    ax.plot(time_points, speed_points, color='cyan', linewidth=2)
    ax.set_title('Speed vs. Time (Smoothed)', fontsize=16, color='white')
    ax.set_ylabel('Speed (km/h)', fontsize=12, color='white')
    ax.set_xlabel('Time (MM:SS)', fontsize=12, color='white')
    ax.grid(True, linestyle='--', alpha=0.4)

    max_speed = max(speed_points) if speed_points else 60
    ax.set_ylim(0, math.ceil((max_speed + 15) / 10) * 10)

    def time_formatter(x, pos):
        minutes = int(x // 60)
        seconds = int(x % 60)
        return f'{minutes:02d}:{seconds:02d}'
    
    ax.xaxis.set_major_formatter(mticker.FuncFormatter(time_formatter))
    ax.tick_params(axis='x', colors='white')
    ax.tick_params(axis='y', colors='white')
    fig.tight_layout()

    plt.savefig(output_path, dpi=150, facecolor='darkgrey')
    print("Step 3 Complete. Chart saved successfully!")


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python speed_graph.py <video_filename> [--visualize]")
        sys.exit(1)

    video_to_analyze = sys.argv[1]
    visualize_mode = '--visualize' in sys.argv

    project_root = os.path.abspath(os.path.dirname(__file__))
    video_folder_path = os.path.join(project_root, '..', 'videos')
    video_file_path = os.path.join(video_folder_path, video_to_analyze)
    calibration_file_path = os.path.join(project_root, 'video_calibrations.json')

    if not os.path.exists(video_file_path):
        print(f"Error: Video file not found at {video_file_path}")
        sys.exit(1)

    try:
        with open(calibration_file_path, 'r') as f:
            all_configs = json.load(f)
        config = all_configs.get(os.path.basename(video_file_path))
        if config is None:
            print(f"Error: No configuration found for '{os.path.basename(video_file_path)}'")
            sys.exit(1)
    except Exception as e:
        print(f"Error loading configuration: {e}")
        sys.exit(1)

    output_filename = f"{os.path.splitext(video_to_analyze)[0]}_speed_chart_improved.png"
    output_path = os.path.join(project_root, 'output', output_filename)
    os.makedirs(os.path.join(project_root, 'output'), exist_ok=True)

    create_speed_chart(video_file_path, config, output_path, visualize_mode)
