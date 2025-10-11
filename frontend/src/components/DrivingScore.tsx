import React, { useState, useEffect } from 'react';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Star, Trophy, AlertTriangle, CheckCircle } from 'lucide-react';
import { getVideoScoreData } from '../utils/videoScoreData';
import { loadMergedAnalysis, getVideoAnalysis } from '../utils/analysisData';
import { generateStrengthsAndFocusAreas } from '../utils/strengthsAndFocusAreas';

interface DrivingScoreProps {
  videoFilename: string;
  overallScore?: number;
  safetyScore?: number;
  efficiencyScore?: number;
  complianceScore?: number;
}

export function DrivingScore({ videoFilename, overallScore, safetyScore, efficiencyScore, complianceScore }: DrivingScoreProps) {
  const [dynamicScores, setDynamicScores] = useState<any>(null);
  const [analysisData, setAnalysisData] = useState<any>(null);
  
  // Fetch dynamic scores and full analysis from JSON
  useEffect(() => {
    const fetchScores = async () => {
      const mergedData = await loadMergedAnalysis();
      if (mergedData) {
        const analysis = getVideoAnalysis(mergedData, videoFilename);
        if (analysis) {
          setAnalysisData(analysis);
          if (analysis.driving_scores) {
            setDynamicScores(analysis.driving_scores);
          }
        }
      }
    };
    fetchScores();
  }, [videoFilename]);
  
  // Get video-specific score data as fallback
  const videoScoreData = getVideoScoreData(videoFilename);
  
  // Use dynamic scores if available, otherwise fall back to provided props or static data
  const finalOverallScore = dynamicScores?.overall_score ?? overallScore ?? videoScoreData.overallScore;
  const finalSafetyScore = dynamicScores?.safety_score ?? safetyScore ?? videoScoreData.scoreBreakdown.safety;
  const finalEfficiencyScore = dynamicScores?.efficiency_score ?? efficiencyScore ?? videoScoreData.scoreBreakdown.efficiency;
  const finalComplianceScore = dynamicScores?.compliance_score ?? complianceScore ?? videoScoreData.scoreBreakdown.compliance;
  
  // Generate dynamic strengths and focus areas
  const dynamicStrengthsAndFocus = analysisData 
    ? generateStrengthsAndFocusAreas(analysisData)
    : null;
  
  // Use dynamic or fallback to static
  const finalStrengths = dynamicStrengthsAndFocus?.strengths ?? videoScoreData.strengths;
  const finalFocusAreas = dynamicStrengthsAndFocus?.focusAreas ?? videoScoreData.focusAreas;
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 75) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-500 dark:text-red-400';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 90) return 'from-green-500/20 to-emerald-500/20';
    if (score >= 75) return 'from-amber-500/20 to-yellow-500/20';
    return 'from-red-500/20 to-rose-500/20';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return { variant: 'default' as const, label: 'Excellent', icon: Trophy };
    if (score >= 75) return { variant: 'secondary' as const, label: 'Good', icon: CheckCircle };
    return { variant: 'destructive' as const, label: 'Needs Improvement', icon: AlertTriangle };
  };

  const getPerformanceMessage = (score: number) => {
    if (score >= 90) return 'Outstanding performance exceeding safety standards';
    if (score >= 75) return 'Good performance with minor improvement opportunities';
    return 'Performance requires attention and safety improvements';
  };

  const badge = getScoreBadge(finalOverallScore);
  const IconComponent = badge.icon;

  return (
    <Card className="relative overflow-hidden backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border border-white/20 dark:border-gray-800/20 shadow-2xl">
      {/* Glass effect overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${getScoreGradient(finalOverallScore)} backdrop-blur-sm`} />
      
      {/* Content */}
      <div className="relative z-10">
        <CardHeader className="text-center pb-4">
          <CardTitle className="flex items-center justify-center space-x-2 text-lg">
            <Star className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />
            <span>Driving Score</span>
          </CardTitle>
          <div className="space-y-3">
            <div className={`text-5xl font-bold ${getScoreColor(finalOverallScore)}`}>
              {finalOverallScore}
            </div>
            <div className="flex flex-col items-center space-y-1">
              <Badge variant={badge.variant} className="gap-1 px-3 py-1">
                <IconComponent className="h-3 w-3" />
                {badge.label}
              </Badge>
              <p className="text-xs text-muted-foreground text-center max-w-xs leading-relaxed">
                {getPerformanceMessage(finalOverallScore)}
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Performance Breakdown
            </h4>
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between items-center text-sm">
                  <span>Safety</span>
                  <span className={`font-medium ${getScoreColor(finalSafetyScore)}`}>{finalSafetyScore}/100</span>
                </div>
                <Progress value={finalSafetyScore} className="h-2" />
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between items-center text-sm">
                  <span>Efficiency</span>
                  <span className={`font-medium ${getScoreColor(finalEfficiencyScore)}`}>{finalEfficiencyScore}/100</span>
                </div>
                <Progress value={finalEfficiencyScore} className="h-2" />
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between items-center text-sm">
                  <span>Compliance</span>
                  <span className={`font-medium ${getScoreColor(finalComplianceScore)}`}>{finalComplianceScore}/100</span>
                </div>
                <Progress value={finalComplianceScore} className="h-2" />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center gap-1">
                <Trophy className="h-3 w-3" />
                Strengths
              </h4>
              <ul className="text-xs space-y-0.5 text-muted-foreground">
                {finalStrengths.map((strength, index) => (
                  <li key={index}>• {strength}</li>
                ))}
              </ul>
            </div>
            
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Focus Areas
              </h4>
              <ul className="text-xs space-y-0.5 text-muted-foreground">
                {finalFocusAreas.map((area, index) => (
                  <li key={index}>• {area}</li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}