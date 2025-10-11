import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { 
  Download, 
  FileText, 
  FileSpreadsheet,
  Calendar,
  MapPin,
  Clock,
  User,
  Car,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';

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
  userId?: string;
  userEmail?: string;
  userName?: string;
  organizationId?: string;
  organizationName?: string;
  isFromAffiliatedUser?: boolean;
}

interface ReportsExportProps {
  analysisData?: AnalysisRecord;
  analysisHistory?: AnalysisRecord[];
  drivers?: Driver[];
  vehicles?: Vehicle[];
  userData?: any;
}

export function ReportsExport({ 
  analysisData, 
  analysisHistory = [], 
  drivers = [], 
  vehicles = [], 
  userData 
}: ReportsExportProps) {
  
  const generatePDFReport = (analysis?: AnalysisRecord) => {
    const reportData = analysis || analysisData;
    if (!reportData) {
      toast.error('No analysis data available for PDF generation');
      return;
    }

    const currentDriver = reportData.driverId ? drivers.find(d => d.id === reportData.driverId) : null;
    const currentVehicle = reportData.vehicleId ? vehicles.find(v => v.id === reportData.vehicleId) : null;

    // Generate PDF content as HTML
    const pdfContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>DRIVEGUARD AI - Driving Analysis Report</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6; 
              margin: 0; 
              padding: 20px; 
              color: #333;
            }
            .header { 
              text-align: center; 
              border-bottom: 3px solid #030213; 
              padding-bottom: 20px; 
              margin-bottom: 30px;
            }
            .logo { 
              font-size: 28px; 
              font-weight: bold; 
              color: #030213; 
              margin-bottom: 10px;
            }
            .subtitle { 
              color: #666; 
              font-size: 16px;
            }
            .score-section { 
              background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); 
              padding: 20px; 
              border-radius: 10px; 
              margin: 20px 0; 
              text-align: center;
            }
            .score { 
              font-size: 48px; 
              font-weight: bold; 
              color: ${reportData.score >= 80 ? '#22c55e' : reportData.score >= 60 ? '#f59e0b' : '#ef4444'};
              margin-bottom: 10px;
            }
            .info-grid { 
              display: grid; 
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
              gap: 15px; 
              margin: 20px 0;
            }
            .info-item { 
              padding: 15px; 
              background: #f8f9fa; 
              border-radius: 8px;
            }
            .info-label { 
              font-weight: bold; 
              color: #666; 
              font-size: 12px; 
              text-transform: uppercase; 
              margin-bottom: 5px;
            }
            .info-value { 
              font-size: 16px; 
              color: #333;
            }
            .metrics-section { 
              margin: 30px 0;
            }
            .metric { 
              display: flex; 
              justify-content: space-between; 
              align-items: center; 
              padding: 10px 0; 
              border-bottom: 1px solid #eee;
            }
            .recommendations { 
              background: #fff3cd; 
              border: 1px solid #ffeeba; 
              border-radius: 8px; 
              padding: 20px; 
              margin: 20px 0;
            }
            .recommendations h3 { 
              color: #856404; 
              margin-top: 0;
            }
            .footer { 
              margin-top: 40px; 
              text-align: center; 
              color: #666; 
              font-size: 12px; 
              border-top: 1px solid #eee; 
              padding-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">🛡️ DRIVEGUARD AI</div>
            <div class="subtitle">Driving Behavior Analysis Report</div>
          </div>

          <div class="score-section">
            <div class="score">${reportData.score}/100</div>
            <div>Overall Driving Score</div>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Analysis Date</div>
              <div class="info-value">${reportData.date}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Duration</div>
              <div class="info-value">${reportData.duration}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Driver</div>
              <div class="info-value">${currentDriver?.name || reportData.userName || 'N/A'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Vehicle</div>
              <div class="info-value">${currentVehicle ? `${currentVehicle.plateNumber} (${currentVehicle.model})` : reportData.carNumber || 'N/A'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Video File</div>
              <div class="info-value">${reportData.fileName}</div>
            </div>
            ${userData?.accountType === 'enterprise' && reportData.isFromAffiliatedUser ? `
            <div class="info-item">
              <div class="info-label">Organization</div>
              <div class="info-value">${reportData.organizationName || 'N/A'}</div>
            </div>
            ` : ''}
          </div>

          <div class="metrics-section">
            <h3>Performance Breakdown</h3>
            <div class="metric">
              <span>Safety Score</span>
              <span><strong>${Math.floor(reportData.score * 0.9)}/100</strong></span>
            </div>
            <div class="metric">
              <span>Speed Management</span>
              <span><strong>${Math.floor(reportData.score * 0.95)}/100</strong></span>
            </div>
            <div class="metric">
              <span>Lane Discipline</span>
              <span><strong>${Math.floor(reportData.score * 0.85)}/100</strong></span>
            </div>
            <div class="metric">
              <span>Braking Behavior</span>
              <span><strong>${Math.floor(reportData.score * 0.92)}/100</strong></span>
            </div>
            <div class="metric">
              <span>Following Distance</span>
              <span><strong>${Math.floor(reportData.score * 0.88)}/100</strong></span>
            </div>
          </div>

          <div class="recommendations">
            <h3>🎯 Recommendations</h3>
            ${reportData.score >= 85 ? `
              <p><strong>Excellent driving performance!</strong> Continue maintaining these high standards:</p>
              <ul>
                <li>Keep up the excellent speed management</li>
                <li>Continue practicing defensive driving techniques</li>
                <li>Share your safe driving practices with other team members</li>
              </ul>
            ` : reportData.score >= 70 ? `
              <p><strong>Good driving with room for improvement:</strong></p>
              <ul>
                <li>Focus on smoother braking and acceleration</li>
                <li>Maintain better following distances</li>
                <li>Practice lane discipline during lane changes</li>
                <li>Consider additional defensive driving training</li>
              </ul>
            ` : `
              <p><strong>Immediate attention required:</strong></p>
              <ul>
                <li>Schedule mandatory driver safety training</li>
                <li>Review speed management techniques</li>
                <li>Practice emergency braking procedures</li>
                <li>Consider mentoring with experienced drivers</li>
                <li>Follow up analysis recommended within 30 days</li>
              </ul>
            `}
          </div>

          <div class="footer">
            <p>Generated by DRIVEGUARD AI on ${new Date().toLocaleDateString()}</p>
            <p>This report is confidential and intended for authorized personnel only.</p>
          </div>
        </body>
      </html>
    `;

    // Create and download PDF
    const blob = new Blob([pdfContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DRIVEGUARD_Report_${reportData.fileName.replace(/\.[^/.]+$/, '')}_${reportData.date.replace(/\//g, '-')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('PDF Report Generated', {
      description: 'Report downloaded as HTML file (can be converted to PDF by printing)',
    });
  };

  const generateAllReports = () => {
    if (analysisHistory.length === 0) {
      toast.error('No analysis history available');
      return;
    }

    let successCount = 0;
    let failCount = 0;

    // Generate reports with a small delay between each to avoid overwhelming the browser
    analysisHistory.forEach((analysis, index) => {
      setTimeout(() => {
        try {
          const currentDriver = analysis.driverId ? drivers.find(d => d.id === analysis.driverId) : null;
          const currentVehicle = analysis.vehicleId ? vehicles.find(v => v.id === analysis.vehicleId) : null;

          // Generate PDF content as HTML (same as single report)
          const pdfContent = `
            <!DOCTYPE html>
            <html>
              <head>
                <title>DRIVEGUARD AI - Driving Analysis Report</title>
                <style>
                  body { 
                    font-family: Arial, sans-serif; 
                    line-height: 1.6; 
                    margin: 0; 
                    padding: 20px; 
                    color: #333;
                  }
                  .header { 
                    text-align: center; 
                    border-bottom: 3px solid #030213; 
                    padding-bottom: 20px; 
                    margin-bottom: 30px;
                  }
                  .logo { 
                    font-size: 28px; 
                    font-weight: bold; 
                    color: #030213; 
                    margin-bottom: 10px;
                  }
                  .subtitle { 
                    color: #666; 
                    font-size: 16px;
                  }
                  .score-section { 
                    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); 
                    padding: 20px; 
                    border-radius: 10px; 
                    margin: 20px 0; 
                    text-align: center;
                  }
                  .score { 
                    font-size: 48px; 
                    font-weight: bold; 
                    color: ${analysis.score >= 80 ? '#22c55e' : analysis.score >= 60 ? '#f59e0b' : '#ef4444'};
                    margin-bottom: 10px;
                  }
                  .info-grid { 
                    display: grid; 
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
                    gap: 15px; 
                    margin: 20px 0;
                  }
                  .info-item { 
                    padding: 15px; 
                    background: #f8f9fa; 
                    border-radius: 8px;
                  }
                  .info-label { 
                    font-weight: bold; 
                    color: #666; 
                    font-size: 12px; 
                    text-transform: uppercase; 
                    margin-bottom: 5px;
                  }
                  .info-value { 
                    font-size: 16px; 
                    color: #333;
                  }
                  .metrics-section { 
                    margin: 30px 0;
                  }
                  .metric { 
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center; 
                    padding: 10px 0; 
                    border-bottom: 1px solid #eee;
                  }
                  .recommendations { 
                    background: #fff3cd; 
                    border: 1px solid #ffeeba; 
                    border-radius: 8px; 
                    padding: 20px; 
                    margin: 20px 0;
                  }
                  .recommendations h3 { 
                    color: #856404; 
                    margin-top: 0;
                  }
                  .footer { 
                    margin-top: 40px; 
                    text-align: center; 
                    color: #666; 
                    font-size: 12px; 
                    border-top: 1px solid #eee; 
                    padding-top: 20px;
                  }
                </style>
              </head>
              <body>
                <div class="header">
                  <div class="logo">🛡️ DRIVEGUARD AI</div>
                  <div class="subtitle">Driving Behavior Analysis Report</div>
                </div>

                <div class="score-section">
                  <div class="score">${analysis.score}/100</div>
                  <div>Overall Driving Score</div>
                </div>

                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-label">Analysis Date</div>
                    <div class="info-value">${analysis.date}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Duration</div>
                    <div class="info-value">${analysis.duration}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Driver</div>
                    <div class="info-value">${currentDriver?.name || analysis.userName || 'N/A'}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Vehicle</div>
                    <div class="info-value">${currentVehicle ? `${currentVehicle.plateNumber} (${currentVehicle.model})` : analysis.carNumber || 'N/A'}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Video File</div>
                    <div class="info-value">${analysis.fileName}</div>
                  </div>
                  ${userData?.accountType === 'enterprise' && analysis.isFromAffiliatedUser ? `
                  <div class="info-item">
                    <div class="info-label">Organization</div>
                    <div class="info-value">${analysis.organizationName || 'N/A'}</div>
                  </div>
                  ` : ''}
                </div>

                <div class="metrics-section">
                  <h3>Performance Breakdown</h3>
                  <div class="metric">
                    <span>Safety Score</span>
                    <span><strong>${Math.floor(analysis.score * 0.9)}/100</strong></span>
                  </div>
                  <div class="metric">
                    <span>Speed Management</span>
                    <span><strong>${Math.floor(analysis.score * 0.95)}/100</strong></span>
                  </div>
                  <div class="metric">
                    <span>Lane Discipline</span>
                    <span><strong>${Math.floor(analysis.score * 0.85)}/100</strong></span>
                  </div>
                  <div class="metric">
                    <span>Braking Behavior</span>
                    <span><strong>${Math.floor(analysis.score * 0.92)}/100</strong></span>
                  </div>
                  <div class="metric">
                    <span>Following Distance</span>
                    <span><strong>${Math.floor(analysis.score * 0.88)}/100</strong></span>
                  </div>
                </div>

                <div class="recommendations">
                  <h3>🎯 Recommendations</h3>
                  ${analysis.score >= 85 ? `
                    <p><strong>Excellent driving performance!</strong> Continue maintaining these high standards:</p>
                    <ul>
                      <li>Keep up the excellent speed management</li>
                      <li>Continue practicing defensive driving techniques</li>
                      <li>Share your safe driving practices with other team members</li>
                    </ul>
                  ` : analysis.score >= 70 ? `
                    <p><strong>Good driving with room for improvement:</strong></p>
                    <ul>
                      <li>Focus on smoother braking and acceleration</li>
                      <li>Maintain better following distances</li>
                      <li>Practice lane discipline during lane changes</li>
                      <li>Consider additional defensive driving training</li>
                    </ul>
                  ` : `
                    <p><strong>Immediate attention required:</strong></p>
                    <ul>
                      <li>Schedule mandatory driver safety training</li>
                      <li>Review speed management techniques</li>
                      <li>Practice emergency braking procedures</li>
                      <li>Consider mentoring with experienced drivers</li>
                      <li>Follow up analysis recommended within 30 days</li>
                    </ul>
                  `}
                </div>

                <div class="footer">
                  <p>Generated by DRIVEGUARD AI on ${new Date().toLocaleDateString()}</p>
                  <p>This report is confidential and intended for authorized personnel only.</p>
                </div>
              </body>
            </html>
          `;

          // Create and download PDF
          const blob = new Blob([pdfContent], { type: 'text/html' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `DRIVEGUARD_Report_${analysis.fileName.replace(/\.[^/.]+$/, '')}_${analysis.date.replace(/\//g, '-')}.html`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          successCount++;

          // Show completion toast after last report
          if (index === analysisHistory.length - 1) {
            setTimeout(() => {
              toast.success(`All Reports Generated! (${successCount}/${analysisHistory.length})`, {
                description: `${successCount} reports downloaded successfully. Check your downloads folder.`,
                duration: 5000,
              });
            }, 500);
          }
        } catch (error) {
          failCount++;
          console.error(`Failed to generate report for ${analysis.fileName}:`, error);
        }
      }, index * 500); // 500ms delay between each download
    });

    toast.info('Generating Reports...', {
      description: `Preparing ${analysisHistory.length} reports. Please wait...`,
      duration: 3000,
    });
  };

  const exportAnalysisHistoryCSV = () => {
    if (analysisHistory.length === 0) {
      toast.error('No analysis history available for export');
      return;
    }

    const headers = [
      'Analysis ID',
      'File Name', 
      'Date',
      'Score',
      'Duration',
      'Driver Name',
      'Driver ID',
      'Vehicle Plate',
      'Vehicle Model',
      'Car Number',
      'User Email',
      'User Name',
      'Organization',
      'Status'
    ];

    const csvData = analysisHistory.map(analysis => {
      const driver = analysis.driverId ? drivers.find(d => d.id === analysis.driverId) : null;
      const vehicle = analysis.vehicleId ? vehicles.find(v => v.id === analysis.vehicleId) : null;
      
      return [
        analysis.id,
        analysis.fileName,
        analysis.date,
        analysis.score,
        analysis.duration,
        driver?.name || analysis.userName || 'N/A',
        analysis.driverId || 'N/A',
        vehicle?.plateNumber || 'N/A',
        vehicle?.model || 'N/A',
        analysis.carNumber || 'N/A',
        analysis.userEmail || 'N/A',
        analysis.userName || 'N/A',
        analysis.organizationName || 'N/A',
        analysis.isFromAffiliatedUser ? 'Affiliated User' : 'Direct User'
      ].map(field => `"${field}"`).join(',');
    });

    const csvContent = [headers.join(','), ...csvData].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DRIVEGUARD_Analysis_History_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Analysis History Exported', {
      description: `${analysisHistory.length} records exported to CSV`,
    });
  };

  const exportDriverPerformanceCSV = () => {
    if (drivers.length === 0) {
      toast.error('No driver data available for export');
      return;
    }

    const headers = [
      'Driver ID',
      'Name',
      'Email',
      'License',
      'Join Date',
      'Assigned Vehicle',
      'Total Analyses',
      'Average Score',
      'Last Analysis',
      'Status',
      'Performance Level'
    ];

    const csvData = drivers.map(driver => {
      const performanceLevel = driver.averageScore >= 85 ? 'Excellent' : 
                              driver.averageScore >= 75 ? 'Good' : 
                              driver.averageScore >= 60 ? 'Needs Improvement' : 'Critical';
      
      return [
        driver.id,
        driver.name,
        driver.email,
        driver.license,
        driver.joinDate,
        driver.assignedVehicle || 'None',
        driver.totalAnalyses,
        driver.averageScore,
        driver.lastAnalysis || 'None',
        driver.status,
        performanceLevel
      ].map(field => `"${field}"`).join(',');
    });

    const csvContent = [headers.join(','), ...csvData].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DRIVEGUARD_Driver_Performance_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Driver Performance Exported', {
      description: `${drivers.length} driver records exported to CSV`,
    });
  };

  const exportFleetMetricsCSV = () => {
    if (vehicles.length === 0) {
      toast.error('No fleet data available for export');
      return;
    }

    const headers = [
      'Vehicle ID',
      'Plate Number',
      'Model',
      'Year',
      'Assigned Driver',
      'Driver Email',
      'Total Analyses',
      'Average Score',
      'Last Analysis Date',
      'Utilization Status'
    ];

    const csvData = vehicles.map(vehicle => {
      const assignedDriver = vehicle.assignedDriverId ? drivers.find(d => d.id === vehicle.assignedDriverId) : null;
      const vehicleAnalyses = analysisHistory.filter(a => a.vehicleId === vehicle.id);
      const avgScore = vehicleAnalyses.length > 0 
        ? Math.round(vehicleAnalyses.reduce((sum, a) => sum + a.score, 0) / vehicleAnalyses.length)
        : 0;
      const lastAnalysis = vehicleAnalyses.length > 0 
        ? vehicleAnalyses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date
        : 'None';

      return [
        vehicle.id,
        vehicle.plateNumber,
        vehicle.model,
        vehicle.year,
        assignedDriver?.name || 'Unassigned',
        assignedDriver?.email || 'N/A',
        vehicleAnalyses.length,
        avgScore,
        lastAnalysis,
        assignedDriver ? 'Active' : 'Available'
      ].map(field => `"${field}"`).join(',');
    });

    const csvContent = [headers.join(','), ...csvData].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DRIVEGUARD_Fleet_Metrics_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Fleet Metrics Exported', {
      description: `${vehicles.length} vehicle records exported to CSV`,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>PDF Reports</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button
              onClick={() => generatePDFReport()}
              disabled={!analysisData}
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Current Analysis Report</span>
            </Button>
            
            {analysisHistory.length > 0 && (
              <Button
                variant="outline"
                onClick={generateAllReports}
                className="flex items-center space-x-2"
              >
                <FileText className="h-4 w-4" />
                <span>Download All Reports ({analysisHistory.length})</span>
              </Button>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground">
            Generate detailed PDF reports with performance metrics, recommendations, and insights. Download all reports to create comprehensive archives.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileSpreadsheet className="h-5 w-5" />
            <span>Data Export</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button
              onClick={exportAnalysisHistoryCSV}
              disabled={analysisHistory.length === 0}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Analysis History</span>
            </Button>

            {userData?.accountType === 'enterprise' && (
              <>
                <Button
                  onClick={exportDriverPerformanceCSV}
                  disabled={drivers.length === 0}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <User className="h-4 w-4" />
                  <span>Driver Performance</span>
                </Button>

                <Button
                  onClick={exportFleetMetricsCSV}
                  disabled={vehicles.length === 0}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <Car className="h-4 w-4" />
                  <span>Fleet Metrics</span>
                </Button>
              </>
            )}
          </div>
          
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Export your data in CSV format for further analysis:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Analysis History:</strong> Complete record of all video analyses</li>
              {userData?.accountType === 'enterprise' && (
                <>
                  <li><strong>Driver Performance:</strong> Individual driver statistics and scores</li>
                  <li><strong>Fleet Metrics:</strong> Vehicle utilization and performance data</li>
                </>
              )}
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
            <div className="space-y-2">
              <h4 className="font-medium">Data Export Guidelines</h4>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>
                  • PDF reports are generated as HTML files for maximum compatibility
                </p>
                <p>
                  • CSV exports can be opened in Excel, Google Sheets, or any spreadsheet application
                </p>
                <p>
                  • All exports include complete metadata for comprehensive analysis
                </p>
                <p>
                  • Reports contain confidential information - handle according to your organization's data policies
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}