import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  Settings, 
  Bell, 
  TrendingDown,
  Clock,
  User,
  X
} from 'lucide-react';

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

interface PerformanceAlert {
  id: string;
  driverId: string;
  driverName: string;
  type: 'score_drop' | 'critical_score' | 'consecutive_low' | 'no_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  threshold: number;
  currentValue: number;
  triggerDate: string;
  acknowledged: boolean;
  resolvedDate?: string;
}

interface AlertThresholds {
  criticalScoreThreshold: number;
  warningScoreThreshold: number;
  scoreDrop: number;
  consecutiveLowScores: number;
  inactivityDays: number;
  enableScoreAlerts: boolean;
  enableActivityAlerts: boolean;
  enableDropAlerts: boolean;
}

interface PerformanceAlertsProps {
  drivers: Driver[];
  onUpdateDriver?: (driverId: string, updates: Partial<Driver>) => void;
}

export function PerformanceAlerts({ drivers, onUpdateDriver }: PerformanceAlertsProps) {
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [thresholds, setThresholds] = useState<AlertThresholds>({
    criticalScoreThreshold: 60,
    warningScoreThreshold: 75,
    scoreDrop: 15,
    consecutiveLowScores: 3,
    inactivityDays: 14,
    enableScoreAlerts: true,
    enableActivityAlerts: true,
    enableDropAlerts: true,
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unacknowledged' | 'critical'>('unacknowledged');

  // Generate alerts based on current driver data and thresholds
  useEffect(() => {
    const newAlerts: PerformanceAlert[] = [];

    drivers.forEach(driver => {
      if (driver.status !== 'active') return;

      // Critical score alert
      if (thresholds.enableScoreAlerts && driver.averageScore > 0 && driver.averageScore <= thresholds.criticalScoreThreshold) {
        newAlerts.push({
          id: `critical_${driver.id}_${Date.now()}`,
          driverId: driver.id,
          driverName: driver.name,
          type: 'critical_score',
          severity: 'critical',
          message: `Driver has a critically low average score of ${driver.averageScore}`,
          threshold: thresholds.criticalScoreThreshold,
          currentValue: driver.averageScore,
          triggerDate: new Date().toISOString(),
          acknowledged: false
        });
      }
      // Warning score alert
      else if (thresholds.enableScoreAlerts && driver.averageScore > 0 && driver.averageScore <= thresholds.warningScoreThreshold) {
        newAlerts.push({
          id: `warning_${driver.id}_${Date.now()}`,
          driverId: driver.id,
          driverName: driver.name,
          type: 'score_drop',
          severity: 'medium',
          message: `Driver performance below warning threshold (${driver.averageScore})`,
          threshold: thresholds.warningScoreThreshold,
          currentValue: driver.averageScore,
          triggerDate: new Date().toISOString(),
          acknowledged: false
        });
      }

      // Inactivity alert
      if (thresholds.enableActivityAlerts && driver.lastAnalysis) {
        const lastAnalysisDate = new Date(driver.lastAnalysis);
        const daysSinceLastAnalysis = Math.floor((Date.now() - lastAnalysisDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysSinceLastAnalysis >= thresholds.inactivityDays) {
          newAlerts.push({
            id: `inactive_${driver.id}_${Date.now()}`,
            driverId: driver.id,
            driverName: driver.name,
            type: 'no_activity',
            severity: 'low',
            message: `No driving activity for ${daysSinceLastAnalysis} days`,
            threshold: thresholds.inactivityDays,
            currentValue: daysSinceLastAnalysis,
            triggerDate: new Date().toISOString(),
            acknowledged: false
          });
        }
      }
    });

    // Only add new alerts that don't already exist
    setAlerts(prevAlerts => {
      const existingAlertKeys = new Set(prevAlerts.map(alert => `${alert.type}_${alert.driverId}`));
      const filteredNewAlerts = newAlerts.filter(alert => 
        !existingAlertKeys.has(`${alert.type}_${alert.driverId}`) || 
        !prevAlerts.find(existing => existing.driverId === alert.driverId && existing.type === alert.type && !existing.acknowledged)
      );
      return [...prevAlerts, ...filteredNewAlerts];
    });
  }, [drivers, thresholds]);

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prevAlerts => 
      prevAlerts.map(alert => 
        alert.id === alertId 
          ? { ...alert, acknowledged: true, resolvedDate: new Date().toISOString() }
          : alert
      )
    );
  };

  const dismissAlert = (alertId: string) => {
    setAlerts(prevAlerts => prevAlerts.filter(alert => alert.id !== alertId));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertCircle className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <TrendingDown className="h-4 w-4" />;
      case 'low': return <Clock className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'unacknowledged') return !alert.acknowledged;
    if (filter === 'critical') return alert.severity === 'critical' || alert.severity === 'high';
    return true;
  });

  const criticalAlertsCount = alerts.filter(alert => !alert.acknowledged && (alert.severity === 'critical' || alert.severity === 'high')).length;
  const totalUnacknowledgedCount = alerts.filter(alert => !alert.acknowledged).length;

  return (
    <div className="space-y-6">
      {/* Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-destructive/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-sm text-muted-foreground">Critical Alerts</p>
                <p className="text-2xl font-semibold text-destructive">{criticalAlertsCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Unread</p>
                <p className="text-2xl font-semibold">{totalUnacknowledgedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Drivers Monitored</p>
                <p className="text-2xl font-semibold">{drivers.filter(d => d.status === 'active').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Performance Alerts</span>
              </CardTitle>
              <CardDescription>
                Monitor driver performance and get notified of issues
              </CardDescription>
            </div>
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Alert Configuration</DialogTitle>
                  <DialogDescription>
                    Set thresholds and preferences for performance alerts
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="score-alerts">Score-based Alerts</Label>
                      <Switch
                        id="score-alerts"
                        checked={thresholds.enableScoreAlerts}
                        onCheckedChange={(checked) => 
                          setThresholds(prev => ({ ...prev, enableScoreAlerts: checked }))
                        }
                      />
                    </div>
                    
                    {thresholds.enableScoreAlerts && (
                      <div className="space-y-2 ml-4">
                        <div className="space-y-1">
                          <Label htmlFor="critical-threshold">Critical Score Threshold</Label>
                          <Input
                            id="critical-threshold"
                            type="number"
                            min="0"
                            max="100"
                            value={thresholds.criticalScoreThreshold}
                            onChange={(e) => 
                              setThresholds(prev => ({ 
                                ...prev, 
                                criticalScoreThreshold: parseInt(e.target.value) || 60 
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="warning-threshold">Warning Score Threshold</Label>
                          <Input
                            id="warning-threshold"
                            type="number"
                            min="0"
                            max="100"
                            value={thresholds.warningScoreThreshold}
                            onChange={(e) => 
                              setThresholds(prev => ({ 
                                ...prev, 
                                warningScoreThreshold: parseInt(e.target.value) || 75 
                              }))
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="activity-alerts">Activity Alerts</Label>
                      <Switch
                        id="activity-alerts"
                        checked={thresholds.enableActivityAlerts}
                        onCheckedChange={(checked) => 
                          setThresholds(prev => ({ ...prev, enableActivityAlerts: checked }))
                        }
                      />
                    </div>
                    
                    {thresholds.enableActivityAlerts && (
                      <div className="space-y-1 ml-4">
                        <Label htmlFor="inactivity-days">Inactivity Alert (Days)</Label>
                        <Input
                          id="inactivity-days"
                          type="number"
                          min="1"
                          max="90"
                          value={thresholds.inactivityDays}
                          onChange={(e) => 
                            setThresholds(prev => ({ 
                              ...prev, 
                              inactivityDays: parseInt(e.target.value) || 14 
                            }))
                          }
                        />
                      </div>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="filter">Filter:</Label>
              <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Alerts</SelectItem>
                  <SelectItem value="unacknowledged">Unread Only</SelectItem>
                  <SelectItem value="critical">Critical Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Badge variant="secondary">{filteredAlerts.length} alerts</Badge>
          </div>

          {filteredAlerts.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-muted-foreground">No alerts matching your filters</p>
              <p className="text-sm text-muted-foreground">Your drivers are performing well!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAlerts.map((alert) => (
                <Alert key={alert.id} className={`relative ${alert.acknowledged ? 'opacity-60' : ''}`}>
                  <div className="flex items-start space-x-3">
                    {getSeverityIcon(alert.severity)}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge variant={getSeverityColor(alert.severity) as any}>
                            {alert.severity.toUpperCase()}
                          </Badge>
                          <span className="font-medium">{alert.driverName}</span>
                          {alert.acknowledged && (
                            <Badge variant="outline" className="text-xs">
                              Acknowledged
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-1">
                          {!alert.acknowledged && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => acknowledgeAlert(alert.id)}
                              className="h-6 px-2 text-xs"
                            >
                              Mark Read
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => dismissAlert(alert.id)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <AlertDescription className="text-sm">
                        {alert.message}
                      </AlertDescription>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span>Triggered: {new Date(alert.triggerDate).toLocaleDateString()}</span>
                        {alert.resolvedDate && (
                          <span>Resolved: {new Date(alert.resolvedDate).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}