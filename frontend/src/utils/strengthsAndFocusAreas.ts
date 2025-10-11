/**
 * Dynamic Strengths and Focus Areas Generator
 * Automatically determines strengths and improvement areas based on analysis data
 */

import { VideoAnalysisData } from './analysisData';

export interface StrengthsAndFocusAreas {
  strengths: string[];
  focusAreas: string[];
}

/**
 * Automatically generate strengths and focus areas based on analysis data
 */
export function generateStrengthsAndFocusAreas(
  analysisData: VideoAnalysisData
): StrengthsAndFocusAreas {
  const strengths: string[] = [];
  const focusAreas: string[] = [];

  // Get scores from driving_scores
  const scores = analysisData.driving_scores;
  
  if (!scores) {
    return {
      strengths: ['Analysis data available'],
      focusAreas: ['Complete analysis to get recommendations']
    };
  }

  const safetyScore = scores.safety_score;
  const complianceScore = scores.compliance_score;
  const efficiencyScore = scores.efficiency_score;

  // Get metrics
  const closeEncounters = analysisData.close_encounters?.event_count || 0;
  const trafficViolations = analysisData.traffic_signal_summary?.traffic_violation_windows?.length || 0;
  const busLaneViolation = analysisData.illegal_way_bus_lane?.violation_detected || false;
  const laneChanges = analysisData.lane_change_count?.turn_count || 0;
  const averageSpeed = analysisData.average_speed_kmph || 0;

  // ============================================================
  // STRENGTHS (Score >= 85)
  // ============================================================

  // Safety Strengths
  if (safetyScore >= 85) {
    if (closeEncounters === 0) {
      strengths.push('Perfect safety record - zero close encounters');
    } else if (closeEncounters <= 2) {
      strengths.push('Excellent close encounter avoidance');
    } else if (closeEncounters <= 5) {
      strengths.push('Good situational awareness');
    }
  }

  // Compliance Strengths
  if (complianceScore >= 85) {
    if (trafficViolations === 0 && !busLaneViolation) {
      strengths.push('Perfect compliance - zero violations');
    } else if (trafficViolations === 0) {
      strengths.push('Excellent traffic signal compliance');
    } else if (!busLaneViolation) {
      strengths.push('Proper lane discipline maintained');
    }
  }

  // Efficiency Strengths
  if (efficiencyScore >= 85) {
    if (laneChanges <= 3) {
      strengths.push('Optimal efficiency - minimal lane changes');
    } else if (laneChanges <= 7) {
      strengths.push('Good route planning and execution');
    } else {
      strengths.push('Efficient driving patterns');
    }
  }

  // Speed Management Strengths
  if (averageSpeed > 0 && averageSpeed <= 60 && efficiencyScore >= 75) {
    if (averageSpeed <= 20) {
      strengths.push(`Controlled speed in low-speed zone (${Math.round(averageSpeed)} km/h)`);
    } else if (averageSpeed <= 40) {
      strengths.push(`Appropriate urban speed management (${Math.round(averageSpeed)} km/h)`);
    } else {
      strengths.push(`Consistent highway speed control (${Math.round(averageSpeed)} km/h)`);
    }
  }

  // Overall Excellence
  if (scores.overall_score >= 90) {
    strengths.push('Outstanding overall driving performance');
  }

  // ============================================================
  // FOCUS AREAS (Score < 75)
  // ============================================================

  // Safety Focus Areas
  if (safetyScore < 75) {
    if (closeEncounters > 10) {
      focusAreas.push('CRITICAL: Reduce close encounters - maintain safe distance');
    } else if (closeEncounters > 5) {
      focusAreas.push('Important: Improve following distance and awareness');
    } else if (closeEncounters > 2) {
      focusAreas.push('Increase awareness of surrounding vehicles');
    }
  } else if (safetyScore < 85 && closeEncounters > 0) {
    focusAreas.push('Maintain safer following distances');
  }

  // Compliance Focus Areas
  if (complianceScore < 75) {
    if (trafficViolations > 3) {
      focusAreas.push('CRITICAL: Traffic signal compliance required');
    } else if (trafficViolations > 0) {
      focusAreas.push('Improve adherence to traffic signals');
    }
    
    if (busLaneViolation) {
      focusAreas.push('CRITICAL: Avoid bus lane violations');
    }
    
    if (complianceScore < 50) {
      focusAreas.push('Review traffic rules and regulations');
    }
  } else if (complianceScore < 85) {
    if (trafficViolations > 0) {
      focusAreas.push('Better attention to traffic signals');
    }
  }

  // Efficiency Focus Areas
  if (efficiencyScore < 75) {
    if (laneChanges > 15) {
      focusAreas.push('Reduce unnecessary lane changes');
    } else if (laneChanges > 10) {
      focusAreas.push('Improve lane discipline and planning');
    }
  } else if (efficiencyScore < 85 && laneChanges > 7) {
    focusAreas.push('Optimize lane usage for smoother driving');
  }

  // Speed Management Focus
  if (averageSpeed > 80) {
    focusAreas.push('CRITICAL: Reduce speed to safe levels');
  } else if (averageSpeed > 60 && safetyScore < 80) {
    focusAreas.push('Monitor speed in relation to traffic conditions');
  }

  // Overall Low Score
  if (scores.overall_score < 60) {
    focusAreas.push('Consider defensive driving course');
    focusAreas.push('Schedule review with driving instructor');
  } else if (scores.overall_score < 75) {
    focusAreas.push('Review and practice safe driving techniques');
  }

  // ============================================================
  // FALLBACKS
  // ============================================================

  // If no strengths identified, add general positive feedback
  if (strengths.length === 0) {
    if (scores.overall_score >= 60) {
      strengths.push('Adequate driving performance maintained');
    }
    if (closeEncounters < 10) {
      strengths.push('Reasonable situational awareness');
    }
  }

  // If no focus areas but score isn't perfect, add maintenance message
  if (focusAreas.length === 0 && scores.overall_score < 95) {
    focusAreas.push('Maintain current driving standards');
    focusAreas.push('Continue safe driving practices');
  }

  // If perfect score
  if (scores.overall_score >= 95 && focusAreas.length === 0) {
    focusAreas.push('Maintain exemplary driving standards');
    focusAreas.push('Share best practices with other drivers');
  }

  // Limit to top 3-4 items each
  return {
    strengths: strengths.slice(0, 4),
    focusAreas: focusAreas.slice(0, 4)
  };
}

/**
 * Get priority level for focus areas
 */
export function getFocusAreaPriority(focusArea: string): 'critical' | 'high' | 'medium' | 'low' {
  if (focusArea.includes('CRITICAL:')) return 'critical';
  if (focusArea.includes('Important:')) return 'high';
  if (focusArea.includes('Consider') || focusArea.includes('Review')) return 'medium';
  return 'low';
}

/**
 * Format focus area with appropriate emoji/icon indicator
 */
export function formatFocusArea(focusArea: string): string {
  const priority = getFocusAreaPriority(focusArea);
  const cleanArea = focusArea.replace(/^(CRITICAL:|Important:)\s*/, '');
  
  switch (priority) {
    case 'critical':
      return `🚨 ${cleanArea}`;
    case 'high':
      return `⚠️ ${cleanArea}`;
    case 'medium':
      return `📋 ${cleanArea}`;
    default:
      return cleanArea;
  }
}

/**
 * Generate summary recommendation based on overall score
 */
export function generateRecommendationSummary(overallScore: number): string {
  if (overallScore >= 90) {
    return 'Excellent driving! Continue maintaining these high standards.';
  } else if (overallScore >= 80) {
    return 'Good driving with minor areas for improvement.';
  } else if (overallScore >= 70) {
    return 'Average performance. Focus on key improvement areas.';
  } else if (overallScore >= 60) {
    return 'Requires attention. Address critical areas immediately.';
  } else {
    return 'Urgent improvement needed. Consider professional training.';
  }
}
