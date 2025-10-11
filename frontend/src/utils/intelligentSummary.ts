import type { VideoAnalysisData } from './analysisData';

export interface IntelligentSummary {
  executiveSummary: string;
  keyFindings: string[];
  immediateActions: string[];
  longTermGoals: string[];
}

/**
 * Generates an intelligent executive summary and recommendations based on analysis data
 */
export function generateIntelligentSummary(analysisData: VideoAnalysisData): IntelligentSummary {
  const scores = analysisData.driving_scores;
  const safetyScore = scores?.safety_score || 0;
  const complianceScore = scores?.compliance_score || 0;
  const efficiencyScore = scores?.efficiency_score || 0;
  const overallScore = scores?.overall_score || 0;

  // Extract metrics
  const closeEncounters = analysisData.close_encounters?.event_count || 0;
  const trafficViolations = analysisData.traffic_signal_summary?.traffic_violation_windows?.length || 0;
  const busLaneViolations = analysisData.illegal_way_bus_lane?.violation_ranges?.length || 0;
  const totalViolations = trafficViolations + busLaneViolations;
  const laneChanges = analysisData.lane_change_count?.turn_count || 0;
  const turns = analysisData.turn_changes_orb?.turn_count || 0;
  const avgSpeed = analysisData.average_speed_kmph || 0;
  const duration = analysisData.video_metadata?.duration_seconds || 0;

  // Generate executive summary
  const executiveSummary = generateExecutiveSummary({
    safetyScore,
    complianceScore,
    efficiencyScore,
    overallScore,
    closeEncounters,
    trafficViolations,
    busLaneViolations,
    totalViolations,
    avgSpeed,
  });

  // Generate key findings
  const keyFindings = generateKeyFindings({
    avgSpeed,
    closeEncounters,
    laneChanges,
    turns,
    trafficViolations,
    busLaneViolations,
    duration,
  });

  // Generate immediate actions
  const immediateActions = generateImmediateActions({
    safetyScore,
    complianceScore,
    efficiencyScore,
    closeEncounters,
    trafficViolations,
    busLaneViolations,
    laneChanges,
    overallScore,
  });

  // Generate long-term goals
  const longTermGoals = generateLongTermGoals({
    safetyScore,
    complianceScore,
    efficiencyScore,
    overallScore,
    closeEncounters,
    totalViolations,
  });

  return {
    executiveSummary,
    keyFindings,
    immediateActions,
    longTermGoals,
  };
}

/**
 * Generate executive summary paragraph
 */
function generateExecutiveSummary(data: {
  safetyScore: number;
  complianceScore: number;
  efficiencyScore: number;
  overallScore: number;
  closeEncounters: number;
  trafficViolations: number;
  busLaneViolations: number;
  totalViolations: number;
  avgSpeed: number;
}): string {
  const {
    safetyScore,
    complianceScore,
    efficiencyScore,
    overallScore,
    closeEncounters,
    trafficViolations,
    busLaneViolations,
    totalViolations,
  } = data;

  // Determine performance level
  const performanceLevel = getPerformanceLevel(overallScore);
  const scoreCategory = getScoreCategory(overallScore);

  // Identify strengths and weaknesses
  const highestScore = Math.max(safetyScore, complianceScore, efficiencyScore);
  const lowestScore = Math.min(safetyScore, complianceScore, efficiencyScore);

  let strengthArea = '';
  let weaknessArea = '';

  if (highestScore === safetyScore) strengthArea = 'safety';
  else if (highestScore === complianceScore) strengthArea = 'compliance';
  else if (highestScore === efficiencyScore) strengthArea = 'efficiency';

  if (lowestScore === safetyScore) weaknessArea = 'safety';
  else if (lowestScore === complianceScore) weaknessArea = 'rule adherence';
  else if (lowestScore === efficiencyScore) weaknessArea = 'efficiency';

  // Build summary based on score ranges
  if (overallScore >= 90) {
    return `This driver demonstrated ${performanceLevel} driving performance with an overall score of ${overallScore}. ${
      closeEncounters === 0
        ? 'A perfect safety record was maintained with zero close encounters.'
        : `Only ${closeEncounters} close ${closeEncounters === 1 ? 'encounter was' : 'encounters were'} detected.`
    } ${
      totalViolations === 0
        ? 'Complete compliance with traffic regulations was observed.'
        : `Minor attention to ${totalViolations === 1 ? 'a compliance issue is' : 'compliance issues are'} recommended for perfection.`
    }`;
  } else if (overallScore >= 80) {
    return `This driver performed well with ${strengthArea} skills reflected in a high ${
      strengthArea.charAt(0).toUpperCase() + strengthArea.slice(1)
    } Score of ${highestScore.toFixed(0)}. However, ${
      weaknessArea === 'rule adherence' ? 'adherence to traffic rules' : weaknessArea
    } ${
      totalViolations > 0 || closeEncounters > 3
        ? `requires attention, with ${totalViolations} violation${totalViolations !== 1 ? 's' : ''} ${
            closeEncounters > 0 ? `and ${closeEncounters} close encounter${closeEncounters !== 1 ? 's' : ''}` : ''
          } recorded`
        : 'could be improved'
    }, resulting in a '${scoreCategory}' overall score of ${overallScore}.`;
  } else if (overallScore >= 60) {
    return `This driver showed ${scoreCategory.toLowerCase()} performance with an overall score of ${overallScore}. While ${strengthArea} demonstrates competence (Score: ${highestScore.toFixed(
      0
    )}), significant improvements are needed in ${weaknessArea}${
      totalViolations > 2
        ? `, with ${totalViolations} traffic violations detected`
        : closeEncounters > 5
        ? `, with ${closeEncounters} close encounters recorded`
        : ''
    }. Focused training is recommended.`;
  } else if (overallScore >= 40) {
    const criticalIssues = [];
    if (closeEncounters > 10) criticalIssues.push(`${closeEncounters} close encounters`);
    if (trafficViolations > 5) criticalIssues.push(`${trafficViolations} traffic signal violations`);
    if (busLaneViolations > 3) criticalIssues.push(`${busLaneViolations} bus lane violations`);

    return `This driver requires immediate intervention, scoring ${overallScore} overall. Critical safety concerns include ${criticalIssues.join(
      ', '
    )}. All driving categories scored below acceptable standards (Safety: ${safetyScore.toFixed(
      0
    )}, Compliance: ${complianceScore.toFixed(0)}, Efficiency: ${efficiencyScore.toFixed(
      0
    )}). Comprehensive retraining is essential before continuing unsupervised driving.`;
  } else {
    return `This driver demonstrated poor performance with an overall score of ${overallScore}, indicating serious driving concerns. Multiple violations across safety (Score: ${safetyScore.toFixed(
      0
    )}), compliance (Score: ${complianceScore.toFixed(0)}), and efficiency (Score: ${efficiencyScore.toFixed(
      0
    )}) were observed. Immediate suspension and mandatory retraining are strongly recommended to address fundamental driving deficiencies.`;
  }
}

/**
 * Generate key findings list
 */
function generateKeyFindings(data: {
  avgSpeed: number;
  closeEncounters: number;
  laneChanges: number;
  turns: number;
  trafficViolations: number;
  busLaneViolations: number;
  duration: number;
}): string[] {
  const { avgSpeed, closeEncounters, laneChanges, turns, trafficViolations, busLaneViolations, duration } = data;
  const findings: string[] = [];

  // Speed finding
  if (avgSpeed > 0) {
    const speedContext =
      avgSpeed < 10
        ? 'in congested traffic'
        : avgSpeed < 30
        ? 'in urban traffic'
        : avgSpeed < 60
        ? 'in suburban conditions'
        : 'on highway conditions';
    findings.push(`Average speed of ${avgSpeed.toFixed(2)} km/h ${speedContext}.`);
  }

  // Close encounters finding
  if (closeEncounters === 0) {
    findings.push('Zero close encounters detected, demonstrating excellent hazard perception.');
  } else if (closeEncounters === 1) {
    findings.push('Only 1 close encounter was detected, showing good hazard perception.');
  } else if (closeEncounters <= 3) {
    findings.push(`${closeEncounters} close encounters were detected, indicating adequate situational awareness.`);
  } else if (closeEncounters <= 7) {
    findings.push(
      `${closeEncounters} close encounters were recorded, suggesting room for improvement in following distance.`
    );
  } else {
    findings.push(
      `${closeEncounters} close encounters detected, indicating concerning gaps in hazard awareness and safe following distance.`
    );
  }

  // Lane changes finding
  if (laneChanges === 0) {
    findings.push('No lane changes were made during this segment.');
  } else if (laneChanges <= 3) {
    findings.push(`${laneChanges} lane change${laneChanges !== 1 ? 's were' : ' was'} made, indicating efficient navigation.`);
  } else if (laneChanges <= 7) {
    findings.push(
      `${laneChanges} lane changes were made, showing active traffic positioning${
        duration > 60 ? ' over the journey' : ''
      }.`
    );
  } else {
    findings.push(
      `${laneChanges} lane changes were recorded, suggesting potentially aggressive or inefficient route navigation.`
    );
  }

  // Turns finding (if significant)
  if (turns > 0) {
    findings.push(`${turns} turn${turns !== 1 ? 's were' : ' was'} executed during the drive.`);
  }

  // Traffic violations finding
  if (trafficViolations === 0 && busLaneViolations === 0) {
    findings.push('Perfect compliance record with no traffic or bus lane violations.');
  } else if (trafficViolations > 0 && busLaneViolations === 0) {
    findings.push(
      `${trafficViolations} critical traffic signal violation${trafficViolations !== 1 ? 's were' : ' was'} recorded.`
    );
  } else if (trafficViolations === 0 && busLaneViolations > 0) {
    findings.push(`${busLaneViolations} bus lane violation${busLaneViolations !== 1 ? 's were' : ' was'} detected.`);
  } else {
    findings.push(
      `${trafficViolations} traffic signal and ${busLaneViolations} bus lane violation${
        trafficViolations + busLaneViolations !== 1 ? 's were' : ' was'
      } recorded.`
    );
  }

  return findings.slice(0, 5); // Limit to 5 key findings
}

/**
 * Generate immediate action items
 */
function generateImmediateActions(data: {
  safetyScore: number;
  complianceScore: number;
  efficiencyScore: number;
  closeEncounters: number;
  trafficViolations: number;
  busLaneViolations: number;
  laneChanges: number;
  overallScore: number;
}): string[] {
  const {
    safetyScore,
    complianceScore,
    efficiencyScore,
    closeEncounters,
    trafficViolations,
    busLaneViolations,
    laneChanges,
    overallScore,
  } = data;
  const actions: string[] = [];

  // Critical actions for very poor performance
  if (overallScore < 40) {
    actions.push('Schedule immediate mandatory driving assessment with a certified instructor.');
    actions.push('Suspend independent driving privileges pending comprehensive retraining.');
    actions.push('Complete full defensive driving course before resuming operations.');
    return actions;
  }

  // Safety-related actions
  if (safetyScore < 60 || closeEncounters > 10) {
    actions.push('Conduct emergency safety review session with supervisor immediately.');
    actions.push('Practice maintaining 3-second following distance in controlled environment.');
  } else if (safetyScore < 75 || closeEncounters > 5) {
    actions.push('Review footage of close encounters with a supervisor to identify patterns.');
    actions.push('Complete refresher module on defensive driving and hazard perception.');
  } else if (closeEncounters > 2) {
    actions.push('Review footage of close encounters to understand contributing factors.');
  }

  // Compliance-related actions
  if (complianceScore < 60 || trafficViolations > 3) {
    actions.push('Mandatory attendance at traffic law refresher course this week.');
    actions.push('Review footage of all traffic signal violations with traffic safety officer.');
    actions.push('Implement pre-intersection scanning protocol at every traffic light.');
  } else if (complianceScore < 75 || trafficViolations > 0) {
    actions.push('Review footage of the traffic signal violation with a supervisor.');
    actions.push('Complete a refresher module on intersection safety and traffic light rules.');
    actions.push('Increase observational scanning at all upcoming intersections.');
  }

  // Bus lane violations
  if (busLaneViolations > 2) {
    actions.push('Review local bus lane regulations and operating hours.');
    actions.push('Study route map to identify and memorize bus lane locations.');
  } else if (busLaneViolations > 0) {
    actions.push('Review bus lane violation footage and confirm understanding of restrictions.');
  }

  // Efficiency actions
  if (efficiencyScore < 60) {
    actions.push('Practice route planning to minimize unnecessary lane changes.');
    actions.push('Review smooth driving techniques for fuel efficiency and passenger comfort.');
  } else if (efficiencyScore < 75 && laneChanges > 8) {
    actions.push('Review lane selection strategy to reduce excessive lane changes.');
  }

  // If no specific issues but room for improvement
  if (actions.length === 0 && overallScore < 85) {
    actions.push('Review full drive footage to identify minor areas for refinement.');
    actions.push('Practice advanced defensive driving techniques in next training session.');
  }

  // Positive reinforcement for good performance
  if (overallScore >= 85 && actions.length === 0) {
    actions.push('Continue maintaining current high standards of safe driving.');
    actions.push('Share best practices with team members during next safety meeting.');
  }

  return actions.slice(0, 4); // Limit to 4 immediate actions
}

/**
 * Generate long-term goals
 */
function generateLongTermGoals(data: {
  safetyScore: number;
  complianceScore: number;
  efficiencyScore: number;
  overallScore: number;
  closeEncounters: number;
  totalViolations: number;
}): string[] {
  const { safetyScore, complianceScore, efficiencyScore, overallScore, closeEncounters, totalViolations } = data;
  const goals: string[] = [];

  // Goals based on overall performance
  if (overallScore < 60) {
    goals.push('Achieve minimum score of 75 (Good) within next 30 days through focused training.');
    goals.push('Reduce violations by 80% through consistent application of traffic rules.');
    goals.push('Demonstrate sustained improvement over 5 consecutive assessed drives.');
  } else if (overallScore < 75) {
    goals.push('Improve overall score to 80+ (Good) on the next assessment.');
    goals.push('Achieve zero violations in next 3 consecutive drives.');
  } else if (overallScore < 85) {
    goals.push('Target 85+ (Very Good) overall score within next two assessments.');
    goals.push('Maintain current performance levels while addressing identified weaknesses.');
  } else if (overallScore < 90) {
    goals.push('Strive for 90+ (Excellent) overall score through consistent excellence.');
    goals.push('Achieve perfect 100% compliance score on next assessment.');
  } else {
    goals.push('Maintain exceptional 90+ overall score across all future assessments.');
    goals.push('Serve as driving mentor and role model for other team members.');
  }

  // Compliance goals
  if (complianceScore < 75) {
    goals.push('Target 100% compliance score through enhanced traffic law awareness.');
  } else if (totalViolations > 0) {
    goals.push('Achieve zero-violation record in next 5 consecutive assessments.');
  }

  // Safety goals
  if (safetyScore < 75 || closeEncounters > 5) {
    goals.push('Reduce close encounters by 70% through improved following distance management.');
    goals.push('Master advanced hazard perception and anticipation techniques.');
  } else if (closeEncounters > 0) {
    goals.push('Maintain the high standard of hazard avoidance consistently.');
  }

  // Efficiency goals
  if (efficiencyScore < 75) {
    goals.push('Enhance route planning and lane selection efficiency by 30%.');
  }

  // Excellence goals
  if (overallScore >= 85) {
    goals.push('Develop advanced defensive driving skills through continued professional development.');
    goals.push('Participate in peer mentoring program to share expertise.');
  }

  return goals.slice(0, 4); // Limit to 4 long-term goals
}

/**
 * Helper function to get performance level description
 */
function getPerformanceLevel(score: number): string {
  if (score >= 90) return 'excellent';
  if (score >= 80) return 'good';
  if (score >= 60) return 'average';
  if (score >= 40) return 'below average';
  return 'poor';
}

/**
 * Helper function to get score category
 */
function getScoreCategory(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Good';
  if (score >= 60) return 'Average';
  if (score >= 40) return 'Needs Improvement';
  return 'Poor';
}
