import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { DrivingScore } from './DrivingScore';
import { PerformanceMetrics } from './PerformanceMetrics';
import { AnalysisCharts } from './AnalysisCharts';
import { ReportsExport } from './ReportsExport';
import { VideoPlayer } from './VideoPlayer';
import { Logo } from './Logo';
import { Driver, Vehicle, AnalysisRecord } from '../types';
import { VideoAnalysisData, loadMergedAnalysis, getVideoAnalysis } from '../utils/analysisData';
import { getVideoSummary } from '../utils/videoSummaries';
import { generateIntelligentSummary } from '../utils/intelligentSummary';
import { 
  Download, 
  Share2, 
  RefreshCw, 
  Calendar,
  MapPin,
  Clock,
  User,
  FileText,
  BarChart3,
  LayoutDashboard
} from 'lucide-react';

interface AnalysisDashboardProps {
  fileName: string;
  onReset: () => void;
  onViewProfile: () => void;
  onViewDashboard?: () => void;
  analysisData?: AnalysisRecord;
  drivers?: Driver[];
  vehicles?: Vehicle[];
  onLogoClick: () => void;
  analysisHistory?: AnalysisRecord[];
  userData?: any;
}

export function AnalysisDashboard({ 
  fileName, 
  onReset, 
  onViewProfile,
  onViewDashboard,
  analysisData, 
  drivers = [], 
  vehicles = [], 
  onLogoClick,
  analysisHistory = [],
  userData
}: AnalysisDashboardProps) {
  const [activeTab, setActiveTab] = useState('analysis');
  const [videoAnalysis, setVideoAnalysis] = useState<VideoAnalysisData | null>(null);
  
  // Load video analysis data
  useEffect(() => {
    const loadAnalysis = async () => {
      const mergedData = await loadMergedAnalysis();
      if (mergedData) {
        const analysis = getVideoAnalysis(mergedData, fileName);
        console.log('Loaded analysis for', fileName, ':', analysis ? 'SUCCESS' : 'NOT FOUND');
        setVideoAnalysis(analysis);
      } else {
        console.error('Failed to load merged analysis data');
      }
    };
    loadAnalysis();
  }, [fileName]);
  
  // Generate intelligent summary based on actual analysis data (with fallback to hardcoded)
  const intelligentSummary = videoAnalysis ? generateIntelligentSummary(videoAnalysis) : null;
  const hardcodedSummary = getVideoSummary(fileName);
  
  // Use intelligent summary if available, otherwise fall back to hardcoded
  const videoSummary = intelligentSummary 
    ? {
        executiveSummary: {
          description: intelligentSummary.executiveSummary,
          keyFindings: intelligentSummary.keyFindings
        },
        recommendations: {
          immediateActions: intelligentSummary.immediateActions,
          longTermGoals: intelligentSummary.longTermGoals
        }
      }
    : hardcodedSummary;
  
  // Find driver and vehicle information
  const currentDriver = analysisData?.driverId ? drivers.find(d => d.id === analysisData.driverId) : null;
  const currentVehicle = analysisData?.vehicleId ? vehicles.find(v => v.id === analysisData.vehicleId) : null;

  const analysisInfo = {
    overallScore: analysisData?.score || 84,
    safetyScore: 78,
    efficiencyScore: 89,
    complianceScore: 85,
    tripInfo: {
      date: analysisData?.date || '2024-01-15',
      startTime: '08:30 AM',
      endTime: '09:00 AM',
      route: 'Downtown to Office Park',
      distance: '12.4 miles',
      duration: analysisData?.duration || '30min',
      driver: currentDriver?.name || 'N/A',
      vehicle: currentVehicle ? `${currentVehicle.plateNumber} (${currentVehicle.model})` : analysisData?.carNumber || 'N/A'
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Mobile-responsive Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Logo onClick={onLogoClick} size="md" />
            <p className="text-muted-foreground text-sm sm:text-base truncate">
              Video: {fileName}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={onViewProfile} className="flex-1 sm:flex-none">
              <User className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">View Profile</span>
              <span className="sm:hidden">Profile</span>
            </Button>

            {onViewDashboard && (
              <Button variant="outline" size="sm" onClick={onViewDashboard} className="flex-1 sm:flex-none">
                <LayoutDashboard className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Overall Dashboard</span>
                <span className="sm:hidden">Dashboard</span>
              </Button>
            )}

            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 sm:flex-none"
              onClick={() => setActiveTab('reports')}
            >
              <Download className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Export Report</span>
              <span className="sm:hidden">Export</span>
            </Button>

            <Button variant="outline" size="sm" onClick={onReset} className="flex-1 sm:flex-none">
              <RefreshCw className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">New Analysis</span>
              <span className="sm:hidden">New</span>
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="analysis" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analysis Results</span>
              <span className="sm:hidden">Analysis</span>
            </TabsTrigger>
            <TabsTrigger value="video" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Video Playback</span>
              <span className="sm:hidden">Video</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Reports & Export</span>
              <span className="sm:hidden">Reports</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analysis" className="space-y-8 mt-6">
            {/* Trip Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5" />
                  <span>Trip Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Date</span>
                    </div>
                    <p className="font-medium">{analysisInfo.tripInfo.date}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Duration</span>
                    </div>
                    <p className="font-medium">{analysisInfo.tripInfo.duration}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>Driver</span>
                    </div>
                    <p className="font-medium">{userData ? `${userData.firstName} ${userData.lastName}` : analysisInfo.tripInfo.driver}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>Vehicle</span>
                    </div>
                    <p className="font-medium">{analysisInfo.tripInfo.vehicle}</p>
                  </div>
                </div>
              </CardContent>
            </Card>



            {/* <Separator />

            {/* Prominent Driving Score Section */}
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold">Analysis Results</h2>
                <p className="text-muted-foreground">
                  Comprehensive evaluation of driving performance and safety
                </p>
              </div>
              
              <div className="max-w-2xl mx-auto">
                <DrivingScore 
                  videoFilename={fileName}
                />
              </div>
            </div>

            <Separator />
            

            {/* Performance Metrics */}
            <PerformanceMetrics videoFilename={fileName} analysisData={videoAnalysis} />

            <Separator />

            {/* Essential Charts */}
            <AnalysisCharts videoFilename={fileName} analysisData={videoAnalysis} />

            <Separator />

            {/* Summary and Recommendations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Executive Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm">
                    {videoSummary.executiveSummary.description}
                  </p>
                  <div className="space-y-2">
                    <h4 className="font-semibold">Key Findings:</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      {videoSummary.executiveSummary.keyFindings.map((finding, index) => (
                        <li key={index}>• {finding}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recommendations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <h4 className="font-semibold">Immediate Actions:</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      {videoSummary.recommendations.immediateActions.map((action, index) => (
                        <li key={index}>• {action}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold">Long-term Goals:</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      {videoSummary.recommendations.longTermGoals.map((goal, index) => (
                        <li key={index}>• {goal}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="video" className="mt-6">
            <VideoPlayer 
              videoFilename={fileName}
              analysisData={videoAnalysis}
            />
          </TabsContent>

          <TabsContent value="reports" className="mt-6">
            <ReportsExport 
              analysisData={analysisData}
              analysisHistory={analysisHistory}
              drivers={drivers}
              vehicles={vehicles}
              userData={userData}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}