import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, ReferenceDot } from 'recharts';
import { VideoAnalysisData } from '../utils/analysisData';
import { generateSmoothSpeedTimeline, estimateVideoDuration } from '../utils/speedChartData';

interface AnalysisChartsProps {
  videoFilename: string;
  analysisData?: VideoAnalysisData | null;
}

export function AnalysisCharts({ videoFilename, analysisData }: AnalysisChartsProps) {
  // Generate interactive speed data
  const speedData = useMemo(() => {
    if (!analysisData) return [];
    const duration = estimateVideoDuration(analysisData);
    return generateSmoothSpeedTimeline(analysisData, duration);
  }, [analysisData]);

  // Prepare violation data from analysis
  const violationData = analysisData ? [
    { 
      name: 'Traffic Signals', 
      value: analysisData.traffic_signal_summary?.traffic_violation_windows?.length || 0, 
      color: '#ef4444' 
    },
    { 
      name: 'Close Encounters', 
      value: analysisData.close_encounters?.event_count || 0, 
      color: '#f97316' 
    },
    { 
      name: 'Lane Changes', 
      value: analysisData.lane_change_count?.turn_count || 0, 
      color: '#eab308' 
    },
    { 
      name: 'Bus Lane', 
      value: analysisData.illegal_way_bus_lane?.violation_detected ? 1 : 0, 
      color: '#8b5cf6' 
    },
  ] : [];

  // Prepare close encounter severity data
  const encounterData = analysisData?.close_encounters?.close_encounters ? 
    analysisData.close_encounters.close_encounters.map((event, idx) => ({
      name: `Event ${idx + 1}`,
      score: event.peak_score || 0,
      time: event.peak_time || 0,
    })) : [];

    // Data removed: heatmapData, getRiskColor, getRiskLabel (chart removed)

  // Helper function to get color based on risk level
  const getRiskColor = (riskLevel: number) => {
    switch (riskLevel) {
      case 0: return '#10b981'; // Green - Safe
      case 1: return '#84cc16'; // Light green - Low risk
      case 2: return '#eab308'; // Yellow - Medium risk
      case 3: return '#f97316'; // Orange - High risk
      case 4: return '#ef4444'; // Red - Critical
      default: return '#10b981';
    }
  };

  const getRiskLabel = (riskLevel: number) => {
    switch (riskLevel) {
      case 0: return 'Safe';
      case 1: return 'Low Risk';
      case 2: return 'Medium Risk';
      case 3: return 'High Risk';
      case 4: return 'Critical';
      default: return 'Safe';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Detailed Analysis Charts</h2>
        <p className="text-muted-foreground">
          Visual insights from {videoFilename}
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        {/* Speed vs Time Chart (Interactive) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Speed vs Time (Interactive)</span>
              {analysisData && (
                <span className="text-sm font-normal text-muted-foreground">
                  Avg: {analysisData.average_speed_kmph.toFixed(2)} km/h
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {speedData.length > 0 ? (
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={speedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis 
                      dataKey="timeFormatted" 
                      label={{ value: 'Time (MM:SS)', position: 'insideBottom', offset: -5 }}
                      tick={{ fontSize: 12 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      label={{ value: 'Speed (km/h)', angle: -90, position: 'insideLeft' }}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                              <p className="font-semibold">{data.timeFormatted}</p>
                              <p className="text-sm">Speed: <span className="font-bold text-cyan-500">{data.speed} km/h</span></p>
                              {data.event && (
                                <p className="text-sm text-orange-500 mt-1">
                                  ⚠️ {data.eventDetails}
                                </p>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="speed" 
                      stroke="#06b6d4" 
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 6, fill: '#06b6d4', stroke: '#fff', strokeWidth: 2 }}
                      name="Speed"
                      animationDuration={1000}
                    />
                    {/* Mark events on the chart */}
                    {speedData.filter(d => d.event).map((point, idx) => (
                      <ReferenceDot
                        key={idx}
                        x={point.timeFormatted}
                        y={point.speed}
                        r={6}
                        fill={point.event === 'close_encounter' ? '#f97316' : '#ef4444'}
                        stroke="#fff"
                        strokeWidth={2}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
                
                {/* Event Legend */}
                <div className="flex flex-wrap gap-4 justify-center text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-cyan-500"></div>
                    <span>Speed Trend</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                    <span>Close Encounter</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-red-500"></div>
                    <span>Traffic Violation</span>
                  </div>
                </div>
                
                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-cyan-500">
                      {Math.max(...speedData.map(d => d.speed)).toFixed(1)}
                    </p>
                    <p className="text-xs text-muted-foreground">Max Speed (km/h)</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-500">
                      {analysisData?.average_speed_kmph.toFixed(1) || '0'}
                    </p>
                    <p className="text-xs text-muted-foreground">Avg Speed (km/h)</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-500">
                      {speedData.filter(d => d.event).length}
                    </p>
                    <p className="text-xs text-muted-foreground">Safety Events</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                Loading speed data...
              </div>
            )}
          </CardContent>
        </Card>

        {/* Two column layout for smaller charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Close Encounter Severity */}
          <Card className="relative overflow-hidden backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border border-white/20 dark:border-gray-800/20 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10 backdrop-blur-sm" />
            <div className="relative z-10">
              <CardHeader>
                <CardTitle>Close Encounter Severity</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  {encounterData.length > 0 ? (
                    <BarChart data={encounterData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="score" fill="#f97316" name="Expansion Score" />
                    </BarChart>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No close encounters detected
                    </div>
                  )}
                </ResponsiveContainer>
              </CardContent>
            </div>
          </Card>

          {/* Safety Violations Pie Chart */}
        <Card className="relative overflow-hidden backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border border-white/20 dark:border-gray-800/20 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm" />
          <div className="relative z-10">
            <CardHeader>
              <CardTitle>Safety Violations Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={violationData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {violationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </div>
        </Card>
        </div>
      </div>
    </div>
  );
}