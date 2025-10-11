import React from 'react';
import { Shield, TrendingUp, Activity, Clock, Users, Car, BarChart3, Calendar } from 'lucide-react';
import { AffiliatedUsersSection } from './AffiliatedUsersSection';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Logo } from './Logo';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ReferenceLine } from 'recharts';

interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  accountType: 'individual' | 'enterprise';
  businessType?: 'insurance' | 'fleet-operator';
  carNumber?: string;
  // Organization affiliation for individual users
  affiliatedOrganizationId?: string;
  affiliatedOrganizationName?: string;
  affiliatedOrganizationType?: 'insurance' | 'fleet-operator';
  // Organization ID for enterprise users
  organizationId?: string;
}

interface AnalysisRecord {
  id: string;
  fileName: string;
  date: string;
  score: number;
  duration: string;
  carNumber?: string;
  driverId?: string;
  vehicleId?: string;
  // User and organization tracking
  userId?: string;
  userEmail?: string;
  userName?: string;
  organizationId?: string;
  organizationName?: string;
  isFromAffiliatedUser?: boolean;
}

interface Driver {
  id: string;
  name: string;
  email: string;
  license: string;
  joinDate: string;
  assignedVehicle?: string;
  totalAnalyses: number;
  averageScore: number;
  lastAnalysis?: string;
  status: 'active' | 'inactive';
}

interface Vehicle {
  id: string;
  plateNumber: string;
  model: string;
  year: number;
  assignedDriverId?: string;
  insuranceAmount?: number;
}

interface DashboardProps {
  userData: UserData | null;
  analysisHistory: AnalysisRecord[];
  drivers: Driver[];
  vehicles: Vehicle[];
  onBackToUpload: () => void;
  onViewProfile: () => void;
  onViewTeam: () => void;
  onViewAnalysis: (analysisId: string) => void;
  onLogoClick: () => void;
}

export function Dashboard({ 
  userData, 
  analysisHistory, 
  drivers, 
  vehicles, 
  onBackToUpload, 
  onViewProfile, 
  onViewTeam,
  onViewAnalysis,
  onLogoClick 
}: DashboardProps) {

  // Calculate dashboard metrics
  const totalAnalyses = analysisHistory.length;
  const averageScore = analysisHistory.length > 0 
    ? analysisHistory.reduce((sum, analysis) => sum + analysis.score, 0) / analysisHistory.length 
    : 0;

  // Calculate improvement metric (compare last 5 analyses with previous 5)
  const recentAnalyses = analysisHistory.slice(0, 5);
  const previousAnalyses = analysisHistory.slice(5, 10);
  const recentAvg = recentAnalyses.length > 0 
    ? recentAnalyses.reduce((sum, analysis) => sum + analysis.score, 0) / recentAnalyses.length 
    : 0;
  const previousAvg = previousAnalyses.length > 0 
    ? previousAnalyses.reduce((sum, analysis) => sum + analysis.score, 0) / previousAnalyses.length 
    : 0;
  const improvement = recentAvg - previousAvg;

  // Prepare chart data - group by date and calculate average scores
  const chartData = analysisHistory
    .slice(0, 10) // Last 10 analyses
    .reverse()
    .map((analysis, index) => ({
      date: analysis.date,
      score: analysis.score,
      index: index + 1,
      id: analysis.id,
      fileName: analysis.fileName,
      duration: analysis.duration
    }));

  // Fleet overview data for enterprise accounts
  const activeDrivers = drivers.filter(d => d.status === 'active').length;
  const totalVehicles = vehicles.length;
  const assignedVehicles = vehicles.filter(v => v.assignedDriverId).length;

  // Recent performance by driver for enterprise
  const driverPerformance = drivers.map(driver => {
    const driverAnalyses = analysisHistory.filter(a => a.driverId === driver.id);
    const recentScore = driverAnalyses.length > 0 ? driverAnalyses[0].score : 0;
    return {
      name: driver.name,
      score: driver.averageScore,
      recentScore,
      totalAnalyses: driver.totalAnalyses,
      trend: recentScore > driver.averageScore ? 'up' : recentScore < driver.averageScore ? 'down' : 'stable'
    };
  }).slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Navigation */}
      <nav className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo 
            onClick={onLogoClick}
            size="md"
          />
          <div className="flex items-center space-x-4">
            {userData?.accountType === 'enterprise' && (
              <Badge variant="secondary" className="bg-gradient-to-r from-primary/10 to-primary/5">
                Enterprise {userData?.businessType ? `(${userData.businessType === 'fleet-operator' ? 'Fleet' : 'Insurance'})` : ''}
              </Badge>
            )}
            <Button variant="outline" onClick={onBackToUpload}>
              Upload Video
            </Button>
            {userData?.accountType === 'enterprise' && (
              <Button variant="outline" onClick={onViewTeam}>
                Team Management
              </Button>
            )}
            <Button variant="outline" onClick={onViewProfile}>
              Profile
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2">Dashboard Overview</h1>
          <p className="text-muted-foreground">
            {userData?.accountType === 'enterprise' 
              ? 'Monitor your fleet performance and driver analytics'
              : 'Track your driving performance and improvement over time'
            }
          </p>
        </div>

        {/* Quick Stats */}
        <div className={`grid grid-cols-1 ${userData?.accountType === 'enterprise' ? 'md:grid-cols-5' : 'md:grid-cols-4'} gap-6 mb-8`}>
          <Card className="bg-gradient-to-br from-card to-card/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <Activity className="h-5 w-5 text-primary" />
                <span>{totalAnalyses}</span>
              </CardTitle>
              <CardDescription>Total Analyses</CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gradient-to-br from-card to-card/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <BarChart3 className="h-5 w-5 text-primary" />
                <span>{averageScore.toFixed(1)}</span>
              </CardTitle>
              <CardDescription>Average Score</CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gradient-to-br from-card to-card/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <TrendingUp className={`h-5 w-5 ${improvement >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                <span className={improvement >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {improvement >= 0 ? '+' : ''}{improvement.toFixed(1)}
                </span>
              </CardTitle>
              <CardDescription>Recent Improvement</CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gradient-to-br from-card to-card/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <Clock className="h-5 w-5 text-primary" />
                <span>{analysisHistory.length > 0 ? analysisHistory[0].date : 'N/A'}</span>
              </CardTitle>
              <CardDescription>Last Analysis</CardDescription>
            </CardHeader>
          </Card>

          {userData?.accountType === 'enterprise' && (
            <Card className="bg-gradient-to-br from-card to-card/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <Users className="h-5 w-5 text-primary" />
                  <span>{activeDrivers}/{drivers.length}</span>
                </CardTitle>
                <CardDescription>Active Drivers</CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Score Trends Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Driving Score Trends</CardTitle>
              <CardDescription>Performance over recent analyses • Click points to view details</CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart 
                    data={chartData}
                    onClick={(data) => {
                      if (data && data.activePayload && data.activePayload[0]) {
                        const clickedData = data.activePayload[0].payload;
                        const analysisId = clickedData.id;
                        if (analysisId) {
                          onViewAnalysis(analysisId);
                        }
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="index" 
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      tickFormatter={(value) => `#${value}`}
                      stroke="#9ca3af"
                    />
                    <YAxis 
                      domain={[0, 100]} 
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      stroke="#9ca3af"
                      label={{ value: 'Score', angle: -90, position: 'insideLeft', style: { fill: '#6b7280', fontSize: 12 } }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '12px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      formatter={(value: any, name: string, props: any) => {
                        const clickedData = props.payload;
                        const scoreColor = value >= 80 ? '#22c55e' : value >= 60 ? '#f59e0b' : '#ef4444';
                        return [
                          <div key="tooltip" style={{ color: scoreColor, fontWeight: 'bold', fontSize: '16px' }}>
                            {value}/100
                          </div>,
                          <div key="details" style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                            <div>📅 {clickedData?.date || 'N/A'}</div>
                            <div>🎥 {clickedData?.fileName || 'Unknown'}</div>
                            <div>⏱️ {clickedData?.duration || 'N/A'}</div>
                            <div style={{ marginTop: '4px', fontStyle: 'italic', color: '#9ca3af' }}>
                              Click to view details
                            </div>
                          </div>
                        ];
                      }}
                      labelFormatter={(label) => `Analysis #${label}`}
                      cursor={{ stroke: '#6366f1', strokeWidth: 2, strokeDasharray: '5 5' }}
                    />
                    {/* Reference line for average score */}
                    {averageScore > 0 && (
                      <ReferenceLine 
                        y={averageScore} 
                        stroke="#9ca3af" 
                        strokeDasharray="5 5" 
                        strokeWidth={1.5} 
                        opacity={0.6}
                        label={{ 
                          value: `Avg: ${averageScore.toFixed(1)}`, 
                          position: 'right',
                          fill: '#6b7280',
                          fontSize: 11,
                          fontWeight: 500
                        }}
                      />
                    )}
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#6366f1" 
                      strokeWidth={3}
                      dot={{ 
                        fill: '#6366f1', 
                        strokeWidth: 2, 
                        r: 5,
                        cursor: 'pointer'
                      }}
                      activeDot={{ 
                        r: 8, 
                        fill: '#6366f1',
                        stroke: '#ffffff', 
                        strokeWidth: 3,
                        cursor: 'pointer',
                        onClick: (data: any) => {
                          const index = data.payload.index;
                          const analysisIndex = analysisHistory.length - index;
                          const analysis = analysisHistory[analysisIndex];
                          if (analysis) {
                            onViewAnalysis(analysis.id);
                          }
                        }
                      }}
                      animationDuration={1000}
                      animationEasing="ease-in-out"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No analysis data available yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fleet Overview or Recent Activity */}
          {userData?.accountType === 'enterprise' ? (
            <Card>
              <CardHeader>
                <CardTitle>Fleet Overview</CardTitle>
                <CardDescription>Current fleet status and utilization</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {drivers.length > 0 || vehicles.length > 0 ? (
                  <>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>Vehicle Utilization</span>
                        <span>{assignedVehicles}/{totalVehicles}</span>
                      </div>
                      <Progress value={(assignedVehicles / totalVehicles) * 100 || 0} />
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>Driver Activity</span>
                        <span>{activeDrivers}/{drivers.length}</span>
                      </div>
                      <Progress value={(activeDrivers / drivers.length) * 100 || 0} />
                    </div>

                    {drivers.filter(d => d.totalAnalyses > 0).length > 0 && (
                      <div className="pt-4 border-t">
                        <h4 className="mb-4">Top Performers</h4>
                        <div className="space-y-3">
                          {drivers
                            .filter(d => d.totalAnalyses > 0)
                            .sort((a, b) => b.averageScore - a.averageScore)
                            .slice(0, 3)
                            .map((driver, index) => (
                            <div key={driver.id} className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm">
                                  {index + 1}
                                </div>
                                <span className="text-sm">{driver.name}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge variant={driver.averageScore >= 80 ? 'default' : 'secondary'} className="text-xs">
                                  {driver.averageScore.toFixed(1)}
                                </Badge>
                                <div className="text-xs text-muted-foreground">
                                  {driver.totalAnalyses} analyses
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3>No Fleet Data Yet</h3>
                    <p className="text-muted-foreground mb-6">
                      Add drivers and vehicles to your fleet to see overview metrics and performance analytics.
                    </p>
                    <Button onClick={onViewTeam} className="bg-gradient-to-r from-primary to-primary/80">
                      Manage Team
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest driving analyses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysisHistory.slice(0, 5).map((analysis) => (
                    <div 
                      key={analysis.id} 
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => onViewAnalysis(analysis.id)}
                    >

                      <div className="flex items-center space-x-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium text-sm">{analysis.fileName}</div>
                          <div className="text-xs text-muted-foreground">{analysis.date}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={analysis.score >= 80 ? 'default' : analysis.score >= 60 ? 'secondary' : 'destructive'}>
                          {analysis.score}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{analysis.duration}</span>
                      </div>
                    </div>
                  ))}
                  {analysisHistory.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No analyses yet. Upload your first video to get started!
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Affiliated Users Section for Enterprise */}
        {userData?.accountType === 'enterprise' && (
          <AffiliatedUsersSection 
            analysisHistory={analysisHistory}
            userData={userData}
            onViewAnalysis={onViewAnalysis}
          />
        )}

        {/* Recent Analysis Summaries */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Analysis Summaries</CardTitle>
            <CardDescription>
              {userData?.accountType === 'enterprise' 
                ? 'Latest analyses from your team' 
                : 'Your recent driving performance summaries'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analysisHistory.slice(0, 10).map((analysis) => {
                const driver = analysis.driverId ? drivers.find(d => d.id === analysis.driverId) : null;
                const vehicle = analysis.vehicleId ? vehicles.find(v => v.id === analysis.vehicleId) : null;
                
                return (
                  <div 
                    key={analysis.id} 
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => onViewAnalysis(analysis.id)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        analysis.score >= 80 ? 'bg-green-100 text-green-700' :
                        analysis.score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {analysis.score}
                      </div>
                      <div>
                        <div className="font-medium">{analysis.fileName}</div>
                        <div className="text-sm text-muted-foreground space-x-2">
                          <span>{analysis.date}</span>
                          <span>•</span>
                          <span>{analysis.duration}</span>
                          {driver && (
                            <>
                              <span>•</span>
                              <span>Driver: {driver.name}</span>
                            </>
                          )}
                          {vehicle && (
                            <>
                              <span>•</span>
                              <span>Vehicle: {vehicle.plateNumber}</span>
                            </>
                          )}
                          {analysis.carNumber && !vehicle && (
                            <>
                              <span>•</span>
                              <span>Car: {analysis.carNumber}</span>
                            </>
                          )}
                          {analysis.isFromAffiliatedUser && (
                            <>
                              <span>•</span>
                              <span className="text-blue-600 dark:text-blue-400 font-medium">📧 {analysis.userEmail}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {analysis.isFromAffiliatedUser && (
                        <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                          External
                        </Badge>
                      )}
                      <Badge variant={analysis.score >= 80 ? 'default' : analysis.score >= 60 ? 'secondary' : 'destructive'}>
                        {analysis.score}%
                      </Badge>
                    </div>
                  </div>
                );
              })}
              {analysisHistory.length === 0 && (
                <div className="text-center py-12">
                  <Activity className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3>No Analyses Yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Upload your first driving video to see detailed analytics and insights.
                  </p>
                  <Button onClick={onBackToUpload} className="bg-gradient-to-r from-primary to-primary/80">
                    Upload Video
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}