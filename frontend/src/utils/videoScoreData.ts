/**
 * Video-specific Driving Score Data
 * Configure scores, strengths, and focus areas for each video
 */

export interface ScoreBreakdown {
  safety: number;      // Score out of 100
  efficiency: number;  // Score out of 100
  compliance: number;  // Score out of 100
}

export interface VideoScoreData {
  overallScore: number;
  scoreBreakdown: ScoreBreakdown;
  strengths: string[];
  focusAreas: string[];
  scoreCategory: 'Excellent' | 'Good' | 'Fair' | 'Needs Improvement' | 'Poor';
  scoreCategoryDescription: string;
}

export interface VideoScoresConfig {
  [videoFilename: string]: VideoScoreData;
}

/**
 * Configuration for all 4 videos
 * EDIT THESE VALUES to customize each video's scoring
 */
export const videoScores: VideoScoresConfig = {
  "Dashcam001.mp4": {
    overallScore: 84,
    scoreBreakdown: {
      safety: 92,
      efficiency: 98,
      compliance: 60
    },
    strengths: [
      "Excellent close encounter avoidance",
      "Minimal lane changes",
      "Efficient driving patterns"
    ],
    focusAreas: [
      "Traffic signal compliance",
      "Improve adherence to traffic rules",
      "Better attention to signals"
    ],
    scoreCategory: "Good",
    scoreCategoryDescription: "Good performance with strong safety but needs compliance improvement"
  },

  "Dashcam002.mp4": {
    overallScore: 100,
    scoreBreakdown: {
      safety: 100,
      efficiency: 100,
      compliance: 100
    },
    strengths: [
      "Perfect safety record - zero close encounters",
      "Flawless efficiency - no unnecessary lane changes",
      "Perfect compliance - zero violations",
      "Exceptional speed control at 32.4 km/h"
    ],
    focusAreas: [
      "Maintain exemplary driving standards",
      "Continue perfect compliance record",
      "Share best practices with other drivers"
    ],
    scoreCategory: "Excellent",
    scoreCategoryDescription: "Outstanding performance exceeding safety standards"
  },

  "Dashcam003.mp4": {
    overallScore: 75,
    scoreBreakdown: {
      safety: 92,
      efficiency: 100,
      compliance: 30
    },
    strengths: [
      "Strong safety performance - only 1 close encounter",
      "Perfect efficiency - minimal lane changes",
      "Good speed management at 25.5 km/h"
    ],
    focusAreas: [
      "Critical: Improve traffic signal compliance",
      "Critical: Zero bus lane violations required",
      "Review compliance training materials",
      "Attend defensive driving course"
    ],
    scoreCategory: "Good",
    scoreCategoryDescription: "Good performance with minor improvement opportunities"
  },

  "Dashcam004.mp4": {
    overallScore: 100,
    scoreBreakdown: {
      safety: 100,
      efficiency: 100,
      compliance: 100
    },
    strengths: [
      "Perfect safety record - zero close encounters",
      "Optimal efficiency - no lane changes needed",
      "Full compliance - zero violations",
      "Controlled speed at 11.5 km/h in low-speed zone"
    ],
    focusAreas: [
      "Maintain perfect driving record",
      "Continue exemplary safety practices",
      "Serve as role model for other drivers"
    ],
    scoreCategory: "Excellent",
    scoreCategoryDescription: "Outstanding performance exceeding safety standards"
  }
};

/**
 * Get score data for a specific video
 * Falls back to Dashcam001 if video not found
 */
export function getVideoScoreData(videoFilename: string): VideoScoreData {
  return videoScores[videoFilename] || videoScores["Dashcam001.mp4"];
}

/**
 * Calculate overall score from breakdown
 * Useful if you want to auto-calculate overall from components
 */
export function calculateOverallScore(breakdown: ScoreBreakdown): number {
  const weights = {
    safety: 0.5,      // 50% weight
    efficiency: 0.25, // 25% weight
    compliance: 0.25  // 25% weight
  };
  
  return Math.round(
    breakdown.safety * weights.safety +
    breakdown.efficiency * weights.efficiency +
    breakdown.compliance * weights.compliance
  );
}

/**
 * Get score category based on score value
 */
export function getScoreCategory(score: number): VideoScoreData['scoreCategory'] {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Good';
  if (score >= 70) return 'Fair';
  if (score >= 60) return 'Needs Improvement';
  return 'Poor';
}

/**
 * Get score category description
 */
export function getScoreCategoryDescription(score: number): string {
  const category = getScoreCategory(score);
  const descriptions = {
    'Excellent': 'Excellent performance demonstrating best practices',
    'Good': 'Good performance with minor improvement opportunities',
    'Fair': 'Fair performance requiring attention in several areas',
    'Needs Improvement': 'Performance requires immediate attention and training',
    'Poor': 'Critical performance issues requiring urgent intervention'
  };
  return descriptions[category];
}

/**
 * Check if a video has custom score data
 */
export function hasVideoScoreData(videoFilename: string): boolean {
  return videoFilename in videoScores;
}

/**
 * Get color based on score value (for UI styling)
 */
export function getScoreColor(score: number): string {
  if (score >= 90) return '#22c55e'; // Green
  if (score >= 80) return '#eab308'; // Yellow
  if (score >= 70) return '#f97316'; // Orange
  if (score >= 60) return '#ef4444'; // Red
  return '#991b1b'; // Dark red
}

/**
 * Get all videos with their scores (for comparison views)
 */
export function getAllVideoScores(): { filename: string; score: number }[] {
  return Object.entries(videoScores).map(([filename, data]) => ({
    filename,
    score: data.overallScore
  })).sort((a, b) => b.score - a.score);
}
