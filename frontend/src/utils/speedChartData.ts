/**
 * Utility to generate speed timeline data for interactive charts
 * Based on video analysis data and events
 */

import { VideoAnalysisData } from './analysisData';

export interface SpeedDataPoint {
  time: number;        // Time in seconds
  timeFormatted: string; // Time formatted as MM:SS
  speed: number;       // Speed in km/h
  event?: string;      // Event type if any (close_encounter, traffic_violation, etc.)
  eventDetails?: string; // Event details for tooltip
}

/**
 * Format seconds to MM:SS
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Generate interpolated speed data points
 * Creates a realistic speed timeline with variations
 */
export function generateSpeedTimeline(
  analysisData: VideoAnalysisData,
  videoDuration?: number
): SpeedDataPoint[] {
  const dataPoints: SpeedDataPoint[] = [];
  const avgSpeed = analysisData.average_speed_kmph;
  
  // Use actual video duration if not provided
  const duration = videoDuration || estimateVideoDuration(analysisData);
  
  // Generate data points every 2 seconds
  const interval = 2;
  const numPoints = Math.floor(duration / interval);
  
  // Get all events with timestamps
  const events = collectEvents(analysisData);
  
  for (let i = 0; i <= numPoints; i++) {
    const time = i * interval;
    
    // Generate speed with realistic variation
    // Base speed with some random variation (±15%)
    const variation = (Math.random() - 0.5) * 0.3 * avgSpeed;
    let speed = avgSpeed + variation;
    
    // Apply speed changes near events
    const nearbyEvent = findNearbyEvent(time, events);
    if (nearbyEvent) {
      // Reduce speed near close encounters and violations
      if (nearbyEvent.type === 'close_encounter') {
        speed *= 0.7; // 30% reduction
      } else if (nearbyEvent.type === 'traffic_violation') {
        speed *= 1.2; // 20% increase (speeding)
      }
    }
    
    // Ensure speed is non-negative and realistic
    speed = Math.max(0, Math.min(speed, avgSpeed * 1.5));
    
    const dataPoint: SpeedDataPoint = {
      time,
      timeFormatted: formatTime(time),
      speed: parseFloat(speed.toFixed(2)),
    };
    
    // Add event marker if there's an event at this time
    if (nearbyEvent && Math.abs(time - nearbyEvent.time) < 1) {
      dataPoint.event = nearbyEvent.type;
      dataPoint.eventDetails = nearbyEvent.details;
    }
    
    dataPoints.push(dataPoint);
  }
  
  return dataPoints;
}

interface Event {
  time: number;
  type: string;
  details: string;
}

/**
 * Collect all events from analysis data
 */
function collectEvents(analysisData: VideoAnalysisData): Event[] {
  const events: Event[] = [];
  
  // Close encounters
  if (analysisData.close_encounters?.close_encounters) {
    analysisData.close_encounters.close_encounters.forEach((encounter) => {
      events.push({
        time: encounter.peak_time,
        type: 'close_encounter',
        details: `Close encounter (${encounter.where}, score: ${encounter.peak_score.toFixed(2)})`,
      });
    });
  }
  
  // Traffic violations
  if (analysisData.traffic_signal_summary?.traffic_violation_windows) {
    analysisData.traffic_signal_summary.traffic_violation_windows.forEach((window) => {
      events.push({
        time: (window.start_time + window.end_time) / 2,
        type: 'traffic_violation',
        details: `Traffic signal violation`,
      });
    });
  }
  
  // Bus lane violations
  if (analysisData.illegal_way_bus_lane?.violation_ranges) {
    analysisData.illegal_way_bus_lane.violation_ranges.forEach((range) => {
      events.push({
        time: (range.start_time + range.end_time) / 2,
        type: 'bus_lane_violation',
        details: `Bus lane violation`,
      });
    });
  }
  
  return events;
}

/**
 * Find event near the given time (within 5 seconds)
 */
function findNearbyEvent(time: number, events: Event[]): Event | null {
  const threshold = 5;
  for (const event of events) {
    if (Math.abs(time - event.time) < threshold) {
      return event;
    }
  }
  return null;
}

/**
 * Generate realistic speed data with smooth transitions
 * Uses sinusoidal variations for more natural-looking curves
 */
export function generateSmoothSpeedTimeline(
  analysisData: VideoAnalysisData,
  videoDuration?: number
): SpeedDataPoint[] {
  const dataPoints: SpeedDataPoint[] = [];
  const avgSpeed = analysisData.average_speed_kmph;
  
  // Use actual video duration if not provided
  const duration = videoDuration || estimateVideoDuration(analysisData);
  
  // Generate data points every second for smoother curves
  const interval = 1;
  const numPoints = Math.floor(duration / interval);
  
  const events = collectEvents(analysisData);
  
  for (let i = 0; i <= numPoints; i++) {
    const time = i * interval;
    
    // Generate smooth speed variation using multiple sine waves
    const slowVariation = Math.sin(time / 20) * avgSpeed * 0.1;
    const fastVariation = Math.sin(time / 5) * avgSpeed * 0.05;
    let speed = avgSpeed + slowVariation + fastVariation;
    
    // Apply event-based modifications
    events.forEach((event) => {
      const timeDiff = Math.abs(time - event.time);
      if (timeDiff < 10) {
        // Gaussian-like influence based on distance from event
        const influence = Math.exp(-timeDiff * timeDiff / 20);
        
        if (event.type === 'close_encounter') {
          speed *= (1 - 0.3 * influence); // Gradual slowdown
        } else if (event.type === 'traffic_violation') {
          speed *= (1 + 0.2 * influence); // Gradual speedup
        }
      }
    });
    
    // Ensure realistic bounds
    speed = Math.max(0, Math.min(speed, avgSpeed * 1.5));
    
    const dataPoint: SpeedDataPoint = {
      time,
      timeFormatted: formatTime(time),
      speed: parseFloat(speed.toFixed(2)),
    };
    
    // Add event marker
    const exactEvent = events.find(e => Math.abs(time - e.time) < 0.5);
    if (exactEvent) {
      dataPoint.event = exactEvent.type;
      dataPoint.eventDetails = exactEvent.details;
    }
    
    dataPoints.push(dataPoint);
  }
  
  return dataPoints;
}

/**
 * Get actual or estimated video duration from analysis data
 * Prioritizes actual metadata, falls back to event timestamps
 */
export function estimateVideoDuration(analysisData: VideoAnalysisData): number {
  // First, check if we have actual video metadata
  if (analysisData.video_metadata?.duration_seconds) {
    return Math.ceil(analysisData.video_metadata.duration_seconds);
  }
  
  // Fallback: estimate from event timestamps
  let maxTime = 30; // Default minimum 30 seconds
  
  // Check close encounters
  if (analysisData.close_encounters?.close_encounters) {
    analysisData.close_encounters.close_encounters.forEach((encounter) => {
      maxTime = Math.max(maxTime, encounter.end_time || encounter.peak_time);
    });
  }
  
  // Check traffic violations
  if (analysisData.traffic_signal_summary?.traffic_violation_windows) {
    analysisData.traffic_signal_summary.traffic_violation_windows.forEach((window) => {
      maxTime = Math.max(maxTime, window.end_time);
    });
  }
  
  // Check bus lane violations
  if (analysisData.illegal_way_bus_lane?.violation_ranges) {
    analysisData.illegal_way_bus_lane.violation_ranges.forEach((range) => {
      maxTime = Math.max(maxTime, range.end_time);
    });
  }
  
  // Add small buffer only for estimated duration
  return Math.ceil(maxTime * 1.05);
}
