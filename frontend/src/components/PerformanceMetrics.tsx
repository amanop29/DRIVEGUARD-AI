import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { 
  Gauge, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  Navigation, 
  Zap,
  Shield,
  Target,
  Car,
  RotateCcw
} from 'lucide-react';
import { 
  VideoAnalysisData, 
  loadMergedAnalysis, 
  getVideoAnalysis,
  MergedAnalysisData 
} from '../utils/analysisData';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ComponentType<any>;
  status?: 'good' | 'warning' | 'danger';
  change?: string;
}

function MetricCard({ title, value, unit, icon: Icon, status = 'good', change }: MetricCardProps) {
  const statusColors = {
    good: 'text-green-600',
    warning: 'text-yellow-600',
    danger: 'text-red-600'
  };

  const badgeVariants = {
    good: 'default' as const,
    warning: 'secondary' as const,
    danger: 'destructive' as const
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline space-x-1">
          <div className={`text-2xl font-bold ${statusColors[status]}`}>
            {value}
          </div>
          {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
        </div>
        {change && (
          <Badge variant={badgeVariants[status]} className="mt-2 text-xs">
            {change}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}

interface PerformanceMetricsProps {
  videoFilename?: string;
  analysisData?: VideoAnalysisData | null;
}

export function PerformanceMetrics({ videoFilename, analysisData: propAnalysisData }: PerformanceMetricsProps) {
  const [mergedData, setMergedData] = useState<MergedAnalysisData | null>(null);
  const [analysisData, setAnalysisData] = useState<VideoAnalysisData | null>(propAnalysisData || null);
  const [isLoading, setIsLoading] = useState(false);

  // Load merged analysis data on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await loadMergedAnalysis();
        setMergedData(data);
        
        // If videoFilename is provided, get its analysis
        if (videoFilename && data) {
          const analysis = getVideoAnalysis(data, videoFilename);
          setAnalysisData(analysis);
        }
      } catch (error) {
        console.error('Error loading analysis data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!propAnalysisData) {
      loadData();
    }
  }, [videoFilename, propAnalysisData]);

  // Update analysis data when videoFilename or propAnalysisData changes
  useEffect(() => {
    if (propAnalysisData) {
      setAnalysisData(propAnalysisData);
    } else if (videoFilename && mergedData) {
      const analysis = getVideoAnalysis(mergedData, videoFilename);
      setAnalysisData(analysis);
    }
  }, [videoFilename, mergedData, propAnalysisData]);

  // Generate metrics from analysis data
  const getMetrics = (): MetricCardProps[] => {
    if (!analysisData) {
      return [];
    }

    const speedStatus: 'good' | 'warning' | 'danger' = analysisData.average_speed_kmph > 80 ? 'danger' : 
                       analysisData.average_speed_kmph < 5 ? 'warning' : 'good';
    
    const laneChangeStatus: 'good' | 'warning' | 'danger' = analysisData.lane_change_count.turn_count > 10 ? 'warning' : 'good';
    
    const closeEncounterStatus: 'good' | 'warning' | 'danger' = analysisData.close_encounters.event_count > 5 ? 'danger' :
                                analysisData.close_encounters.event_count > 2 ? 'warning' : 'good';

    return [
      {
        title: 'Average Speed',
        value: Math.round(analysisData.average_speed_kmph),
        unit: 'km/h',
        icon: Gauge,
        status: speedStatus,
        change: speedStatus === 'good' ? 'Within limits' : speedStatus === 'danger' ? 'Speeding detected' : 'Below optimal'
      },
      {
        title: 'Total Turns',
        value: analysisData.turn_changes_orb.turn_count,
        unit: 'turns',
        icon: RotateCcw,
        status: 'good' as 'good' | 'warning' | 'danger',
        change: `${analysisData.turn_changes_orb.left} left, ${analysisData.turn_changes_orb.right} right`
      },
      {
        title: 'Close Encounters',
        value: analysisData.close_encounters.event_count,
        unit: 'events',
        icon: AlertTriangle,
        status: closeEncounterStatus,
        change: closeEncounterStatus === 'good' ? 'Safe distance maintained' : 'Too close to vehicles'
      },
      {
        title: 'Lane Changes',
        value: analysisData.lane_change_count.turn_count,
        unit: 'changes',
        icon: Navigation,
        status: laneChangeStatus,
        change: `${analysisData.lane_change_count.left} left, ${analysisData.lane_change_count.right} right`
      },
      {
        title: 'Traffic Violations',
        value: analysisData.traffic_signal_summary.traffic_violation_windows.length,
        unit: 'violations',
        icon: Shield,
        status: (analysisData.traffic_signal_summary.traffic_violation_windows.length > 0 ? 'danger' : 'good') as 'good' | 'warning' | 'danger',
        change: analysisData.traffic_signal_summary.traffic_violation_windows.length > 0 ? 'Traffic signal violations' : 'No violations'
      },
      {
        title: 'Bus Lane Violations',
        value: analysisData.illegal_way_bus_lane.violation_ranges.length,
        unit: 'violations',
        icon: Car,
        status: (analysisData.illegal_way_bus_lane.violation_detected ? 'danger' : 'good') as 'good' | 'warning' | 'danger',
        change: analysisData.illegal_way_bus_lane.violation_detected ? 'Bus lane entered' : 'No violations'
      },
      {
        title: 'Overall Violations',
        value: analysisData.safety_violation,
        unit: 'total',
        icon: Shield,
        status: analysisData.safety_violation > 3 ? 'danger' : analysisData.safety_violation > 0 ? 'warning' : 'good',
        change: `${analysisData.safety_violation} safety concerns`
      },
      {
        title: 'Video Duration',
        value: analysisData.video_metadata?.duration_seconds 
          ? Math.round(analysisData.video_metadata.duration_seconds) 
          : '-',
        unit: 'sec',
        icon: Clock,
        status: 'good' as 'good' | 'warning' | 'danger',
        change: analysisData.video_metadata?.fps 
          ? `${Math.round(analysisData.video_metadata.fps)} FPS` 
          : 'No metadata'
      }
    ];
  };

  const metrics = getMetrics();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2>Performance Metrics</h2>
          <p className="text-muted-foreground">
            Loading analysis data...
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analysisData) {
    return (
      <div className="space-y-6">
        <div>
          <h2>Performance Metrics</h2>
          <p className="text-muted-foreground">
            No analysis data available. Please select a video or upload for analysis.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2>Performance Metrics</h2>
        <p className="text-muted-foreground">
          Detailed breakdown of driving performance indicators
          {videoFilename && ` for ${videoFilename}`}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>
    </div>
  );
}