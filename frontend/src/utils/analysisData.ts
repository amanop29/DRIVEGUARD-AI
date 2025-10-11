/**
 * Analysis Data Utility
 * Reads and provides access to pre-generated video analysis data
 */

export interface VideoAnalysisData {
  video_filename: string;
  video_metadata?: {
    duration_seconds: number;
    fps: number;
    frame_count: number;
    resolution: {
      width: number;
      height: number;
    };
  };
  average_speed_kmph: number;
  safety_violation: number;
  traffic_signal_summary: {
    violations: any[];
    traffic_violation_windows: Array<{
      start_time: number;
      end_time: number;
    }>;
    violation: boolean;
  };
  close_encounters: {
    close_encounters: Array<{
      start_time: number;
      peak_time: number;
      peak_score: number;
      where: string;
      max_box_height_norm: number;
      end_time: number;
    }>;
    event_count: number;
  };
  turn_changes_orb: {
    turn_count: number;
    left: number;
    right: number;
  };
  lane_change_count: {
    turn_count: number;
    left: number;
    right: number;
  };
  illegal_way_bus_lane: {
    violation_detected: boolean;
    violation_ranges: Array<{
      start_time: number;
      end_time: number;
    }>;
  };
  driving_scores?: {
    overall_score: number;
    safety_score: number;
    compliance_score: number;
    efficiency_score: number;
    category: string;
    category_description: string;
    category_color: string;
    metrics_used: {
      close_encounters: number;
      traffic_violations: number;
      bus_lane_violations: number;
      lane_changes: number;
    };
  };
}

export interface MergedAnalysisData {
  [videoFilename: string]: VideoAnalysisData;
}

/**
 * Load merged analysis data from the backend
 */
export async function loadMergedAnalysis(): Promise<MergedAnalysisData | null> {
  try {
    // Fetch from the backend API
    const response = await fetch('http://localhost:3001/api/merged-analysis');
    if (!response.ok) {
      console.warn('Merged analysis file not found, using mock data');
      return null;
    }
    const data = await response.json();
    return data as MergedAnalysisData;
  } catch (error) {
    console.error('Error loading merged analysis:', error);
    return null;
  }
}

/**
 * Get analysis for a specific video
 */
export function getVideoAnalysis(
  mergedData: MergedAnalysisData | null,
  videoFilename: string
): VideoAnalysisData | null {
  if (!mergedData) return null;
  return mergedData[videoFilename] || null;
}
