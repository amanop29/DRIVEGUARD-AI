/**
 * Video-specific Executive Summaries and Recommendations
 * Based on automated analysis of dashcam footage.
 */

export interface VideoSummary {
  executiveSummary: {
    description: string;
    keyFindings: string[];
  };
  recommendations: {
    immediateActions: string[];
    longTermGoals: string[];
  };
}

export interface VideoSummaries {
  [videoFilename: string]: VideoSummary;
}

export const videoSummaries: VideoSummaries = {
  "Dashcam001.mp4": {
    executiveSummary: {
      description: "This driver performed well in safety and efficiency, reflected in a high Safety Score of 92. However, a traffic signal violation significantly lowered the Compliance Score to 60, resulting in a 'Good' overall score of 84. Immediate focus on rule adherence is required.",
      keyFindings: [
        "Average speed of 18.54 km/h in urban traffic.",
        "Only 1 close encounter was detected, showing good hazard perception.",
        "4 lane changes were made, indicating efficient navigation.",
        "1 critical traffic signal violation was recorded."
      ]
    },
    recommendations: {
      immediateActions: [
        "Review footage of the traffic signal violation with a supervisor.",
        "Complete a refresher module on intersection safety and traffic light rules.",
        "Increase observational scanning at all upcoming intersections."
      ],
      longTermGoals: [
        "Target a 100% compliance score on the next assessment.",
        "Maintain the high standard of hazard avoidance.",
        "Improve the overall score to 90+ by eliminating compliance errors."
      ]
    }
  },

  "Dashcam002.mp4": {
    executiveSummary: {
      description: "This trip represents an exemplary standard of driving, achieving a perfect 100/100 score. The driver demonstrated flawless safety, compliance, and efficiency, with zero incidents or violations recorded.",
      keyFindings: [
        "Appropriate average speed of 32.4 km/h for the conditions.",
        "Perfect safety record with 0 close encounters.",
        "Flawless compliance with 0 violations of any kind.",
        "Optimal efficiency with 0 unnecessary maneuvers."
      ]
    },
    recommendations: {
      immediateActions: [
        "Recognize the driver for achieving a perfect safety score.",
        "Share this trip's footage as a best-practice example in team meetings.",
        "Encourage the driver to share their defensive driving techniques with peers."
      ],
      longTermGoals: [
        "Maintain a perfect or near-perfect score over the next quarter.",
        "Act as a mentor for new or underperforming drivers.",
        "Participate in the development of internal driver safety training."
      ]
    }
  },

  "Dashcam003.mp4": {
    executiveSummary: {
      description: "This driver displays good vehicle control and safety awareness (Safety Score: 92), but major compliance failures resulted in an extremely low Compliance Score of 30. The overall score of 75 ('Fair') indicates an urgent need for retraining on traffic laws.",
      keyFindings: [
        "Managed speed well at 25.5 km/h for the environment.",
        "Only 1 close encounter was detected, indicating good hazard management.",
        "Critical: 1 bus lane violation was recorded.",
        "Critical: 1 traffic violation (rolling stop) was recorded."
      ]
    },
    recommendations: {
      immediateActions: [
        "Mandatory: Review footage of both the bus lane and stop sign violations with a supervisor immediately.",
        "Enroll in and complete a mandatory compliance and rules-of-the-road retraining course.",
        "Place on a 30-day performance monitoring plan."
      ],
      longTermGoals: [
        "Achieve zero compliance violations for the next three consecutive months.",
        "Raise the overall driving score to a minimum of 90.",
        "Develop a habit of pre-drive route planning to avoid restricted lanes."
      ]
    }
  },

  "Dashcam004.mp4": {
    executiveSummary: {
      description: "An excellent driving performance, earning an overall score of 91/100. Safety and efficiency were perfect. The score was only held back by a single, preventable compliance error involving the use of a dedicated bicycle lane.",
      keyFindings: [
        "Excellent low-speed control with an average of 11.5 km/h.",
        "Perfect 100/100 Safety Score with zero close encounters.",
        "Perfect 100/100 Efficiency Score with zero unnecessary maneuvers.",
        "1 compliance violation: improper use of a bicycle lane."
      ]
    },
    recommendations: {
      immediateActions: [
        "Review road markings and signage standards, specifically for bus and bicycle lanes.",
        "Acknowledge the violation in a brief coaching session.",
        "Incorporate lane designation checks into driving routine."
      ],
      longTermGoals: [
        "Eliminate all lane-use errors to achieve a perfect 100 overall score.",
        "Continue to serve as an example of safe vehicle operation.",
        "Maintain a perfect Safety Score across all future trips."
      ]
    }
  }
};

/**
 * Get summary and recommendations for a specific video
 * Falls back to a default summary if the video is not found
 */
export function getVideoSummary(videoFilename: string): VideoSummary {
  return videoSummaries[videoFilename] || videoSummaries["Dashcam001.mp4"];
}

/**
 * Check if a video has custom summary data
 */
export function hasVideoSummary(videoFilename: string): boolean {
  return videoFilename in videoSummaries;
}