import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Separator } from './ui/separator';
import { ReportsExport } from './ReportsExport';
import { 
  ArrowLeft,
  User,
  Building,
  Mail,
  Car,
  Calendar,
  FileText,
  BarChart3,
  Settings,
  Crown,
  Edit3,
  Save,
  X,
  LogOut,
  Users,
  Download
} from 'lucide-react';

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

interface OrganizationAffiliation {
  organizationId: string;
  organizationName: string;
  organizationType: 'insurance' | 'fleet-operator';
  affiliationCode: string;
  isActive: boolean;
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
}

interface ProfilePageProps {
  userData: UserData | null;
  analysisHistory: AnalysisRecord[];
  onBackToUpload: () => void;
  onUpdateUser: (user: UserData) => void;
  onLogout: () => void;
  onViewTeam?: () => void;
  onViewSettings?: () => void;
  onViewAnalysis?: (analysisId: string) => void;
  onLogoClick: () => void;
  onJoinOrganization: (affiliationCode: string) => boolean;
  onLeaveOrganization: () => void;
  organizations: OrganizationAffiliation[];
  drivers?: Driver[];
  vehicles?: Vehicle[];
}

const defaultUserData: UserData = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@company.com',
  company: 'Sample Corp',
  accountType: 'enterprise',
  businessType: 'insurance',
  carNumber: 'ABC-123',
  organizationId: 'default-org'
};

function OrganizationJoinForm({ onJoinOrganization }: { onJoinOrganization: (code: string) => boolean }) {
  const [affiliationCode, setAffiliationCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!affiliationCode.trim()) return;
    
    setIsSubmitting(true);
    const success = onJoinOrganization(affiliationCode.trim());
    setIsSubmitting(false);
    
    if (success) {
      setAffiliationCode('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="affiliationCode">Affiliation Code</Label>
        <Input
          id="affiliationCode"
          placeholder="Enter your organization's affiliation code"
          value={affiliationCode}
          onChange={(e) => setAffiliationCode(e.target.value)}
          disabled={isSubmitting}
        />
        <p className="text-xs text-muted-foreground">
          Contact your organization administrator for the affiliation code
        </p>
      </div>
      <Button type="submit" disabled={!affiliationCode.trim() || isSubmitting} className="w-full">
        {isSubmitting ? 'Joining...' : 'Join Organization'}
      </Button>
    </form>
  );
}

export function ProfilePage({ userData, analysisHistory, onBackToUpload, onUpdateUser, onLogout, onViewTeam, onViewSettings, onViewAnalysis, onLogoClick, onJoinOrganization, onLeaveOrganization, organizations, drivers = [], vehicles = [] }: ProfilePageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<UserData>(userData || defaultUserData);

  // Sync editedData when userData changes
  useEffect(() => {
    if (userData) {
      setEditedData(userData);
    }
  }, [userData]);

  const handleSave = () => {
    onUpdateUser(editedData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedData(userData || defaultUserData);
    setIsEditing(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 90) return 'default';
    if (score >= 80) return 'secondary';
    if (score >= 70) return 'outline';
    return 'destructive';
  };

  const currentUser = userData || editedData;
  const firstName = currentUser?.firstName || 'U';
  const lastName = currentUser?.lastName || '';
  const initials = `${firstName[0] || 'U'}${lastName[0] || ''}`;
  const totalAnalyses = analysisHistory?.length || 0;
  const averageScore = totalAnalyses > 0 ? Math.round(analysisHistory.reduce((sum, analysis) => sum + analysis.score, 0) / totalAnalyses) : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile-responsive Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <Button variant="ghost" onClick={onBackToUpload} size="sm">
                <ArrowLeft className="mr-1 sm:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Back to Dashboard</span>
                <span className="sm:hidden">Back</span>
              </Button>
              <Separator orientation="vertical" className="h-6 hidden sm:block" />
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm sm:text-base">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-base sm:text-lg font-semibold">{firstName} {lastName}</h1>
                  <div className="flex items-center space-x-2">
                    <Badge variant={currentUser.accountType === 'enterprise' ? 'default' : 'secondary'} className="text-xs">
                      {currentUser.accountType === 'enterprise' ? (
                        <>
                          <Crown className="mr-1 h-2 w-2 sm:h-3 sm:w-3" />
                          <span className="hidden sm:inline">
                            Enterprise {currentUser.businessType ? `(${currentUser.businessType === 'fleet-operator' ? 'Fleet' : 'Insurance'})` : ''}
                          </span>
                          <span className="sm:hidden">Ent</span>
                        </>
                      ) : (
                        <>
                          <User className="mr-1 h-2 w-2 sm:h-3 sm:w-3" />
                          <span className="hidden sm:inline">Individual</span>
                          <span className="sm:hidden">Ind</span>
                        </>
                      )}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant={isEditing ? "outline" : "default"} 
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? (
                  <>
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Edit3 className="mr-2 h-4 w-4" />
                    Edit Profile
                  </>
                )}
              </Button>
              {onViewSettings && (
                <Button variant="outline" onClick={onViewSettings}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Button>
              )}
              <Button 
                variant="ghost" 
                onClick={onLogout}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className={`grid w-full ${currentUser.accountType === 'enterprise' ? 'grid-cols-5' : 'grid-cols-5'}`}>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analysis">Analysis History</TabsTrigger>
            <TabsTrigger value="reports">Reports & Export</TabsTrigger>
            {currentUser.accountType === 'individual' && (
              <TabsTrigger value="organization">Organization</TabsTrigger>
            )}
            {currentUser.accountType === 'enterprise' && (
              <TabsTrigger value="team">Team Management</TabsTrigger>
            )}
            <TabsTrigger value="settings">Account Type</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Profile Stats */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Analyses</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalAnalyses}</div>
                  <p className="text-xs text-muted-foreground">
                    This month: {Math.floor(totalAnalyses * 0.6)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${getScoreColor(averageScore)}`}>
                    {averageScore}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +5% from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Account Status</CardTitle>
                  {currentUser.accountType === 'enterprise' ? 
                    <Crown className="h-4 w-4 text-yellow-600" /> : 
                    <User className="h-4 w-4 text-muted-foreground" />
                  }
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {currentUser.accountType === 'enterprise' ? 'Premium' : 'Basic'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {currentUser.accountType === 'enterprise' ? 'Unlimited analyses' : '10 analyses/month'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Profile Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Profile Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={editedData.firstName}
                          onChange={(e) => setEditedData({...editedData, firstName: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={editedData.lastName}
                          onChange={(e) => setEditedData({...editedData, lastName: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={editedData.email}
                        onChange={(e) => setEditedData({...editedData, email: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        value={editedData.company}
                        onChange={(e) => setEditedData({...editedData, company: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="carNumber">Car Number (Optional)</Label>
                      <Input
                        id="carNumber"
                        placeholder="e.g., ABC-123"
                        value={editedData.carNumber || ''}
                        onChange={(e) => setEditedData({...editedData, carNumber: e.target.value})}
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button onClick={handleSave}>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </Button>
                      <Button variant="outline" onClick={handleCancel}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Full Name</p>
                          <p className="text-sm text-muted-foreground">{firstName} {lastName}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Email</p>
                          <p className="text-sm text-muted-foreground">{currentUser.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Company</p>
                          <p className="text-sm text-muted-foreground">{currentUser.company}</p>
                        </div>
                      </div>
                      {currentUser.carNumber && (
                        <div className="flex items-center space-x-3">
                          <Car className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Car Number</p>
                            <p className="text-sm text-muted-foreground">{currentUser.carNumber}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Analysis History</CardTitle>
                <p className="text-sm text-muted-foreground">
                  View all your previous driving behavior analyses
                </p>
              </CardHeader>
              <CardContent>
                {totalAnalyses > 0 ? (
                  <div className="space-y-4">
                    {analysisHistory.map((analysis) => (
                      <div key={analysis.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => onViewAnalysis?.(analysis.id)}>
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium">{analysis.fileName}</p>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3" />
                                <span>{analysis.date}</span>
                              </div>
                              <span>Duration: {analysis.duration}</span>
                              {analysis.carNumber && (
                                <div className="flex items-center space-x-1">
                                  <Car className="h-3 w-3" />
                                  <span>{analysis.carNumber}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={getScoreBadgeVariant(analysis.score)}>
                            Score: {analysis.score}%
                          </Badge>
                          <Button variant="ghost" size="sm">
                            View Report
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No analyses yet</p>
                    <p className="text-sm text-muted-foreground">Upload your first driving video to get started</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <ReportsExport 
              analysisData={analysisHistory[0]}
              analysisHistory={analysisHistory}
              drivers={drivers}
              vehicles={vehicles}
              userData={currentUser}
            />
          </TabsContent>

          {currentUser.accountType === 'enterprise' && (
            <TabsContent value="team" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Team Management</span>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Manage your drivers, assign vehicles, and monitor team performance
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center py-8">
                    <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Full Team Management</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      Access comprehensive team management features including driver management, 
                      vehicle assignment, performance tracking, and rankings.
                    </p>
                    <Button 
                      onClick={onViewTeam}
                      className="bg-gradient-to-r from-primary to-primary/80"
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Open Team Management
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                      <h4 className="font-medium">Driver Management</h4>
                      <p className="text-sm text-muted-foreground">Add, remove, and manage your team drivers</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <Car className="h-8 w-8 text-primary mx-auto mb-2" />
                      <h4 className="font-medium">Vehicle Assignment</h4>
                      <p className="text-sm text-muted-foreground">Assign vehicles to drivers and track usage</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <BarChart3 className="h-8 w-8 text-primary mx-auto mb-2" />
                      <h4 className="font-medium">Performance Analytics</h4>
                      <p className="text-sm text-muted-foreground">View rankings and team performance metrics</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {currentUser.accountType === 'individual' && (
            <TabsContent value="organization" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building className="h-5 w-5" />
                    <span>Organization Affiliation</span>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Connect with your insurance company or fleet operator to share driving analytics
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {currentUser.affiliatedOrganizationId ? (
                    // Already affiliated
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50 dark:bg-green-900/20">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center">
                            <Building className="h-5 w-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <p className="font-medium text-green-900 dark:text-green-100">
                              {currentUser.affiliatedOrganizationName}
                            </p>
                            <p className="text-sm text-green-600 dark:text-green-400">
                              {currentUser.affiliatedOrganizationType === 'insurance' ? 'Insurance Company' : 'Fleet Operator'}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="border-green-200 text-green-700 dark:border-green-800 dark:text-green-300">
                          Connected
                        </Badge>
                      </div>
                      
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">Benefits of Organization Affiliation</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Your driving analyses are automatically shared with your organization</li>
                          <li>• Potential insurance premium discounts based on your driving score</li>
                          <li>• Access to organization-specific safety programs and training</li>
                          <li>• Comparative analytics against organization benchmarks</li>
                        </ul>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        onClick={onLeaveOrganization}
                        className="w-full"
                      >
                        Leave Organization
                      </Button>
                    </div>
                  ) : (
                    // Not affiliated - show join form
                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">Available Organizations</h4>
                        <div className="space-y-2">
                          {organizations.filter(org => org.isActive).map(org => (
                            <div key={org.organizationId} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                  <Building className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium">{org.organizationName}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {org.organizationType === 'insurance' ? 'Insurance Company' : 'Fleet Operator'}
                                  </p>
                                </div>
                              </div>
                              <Badge variant="secondary">Code: {org.affiliationCode}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <OrganizationJoinForm onJoinOrganization={onJoinOrganization} />
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Account Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Account Type</p>
                      <p className="text-sm text-muted-foreground">
                        {currentUser.accountType === 'enterprise' ? 
                          'Enterprise account with unlimited analyses' : 
                          'Individual account with limited analyses'
                        }
                      </p>
                    </div>
                    <Badge variant={currentUser.accountType === 'enterprise' ? 'default' : 'secondary'}>
                      {currentUser.accountType === 'enterprise' ? 
                        `Enterprise ${currentUser.businessType ? `(${currentUser.businessType === 'fleet-operator' ? 'Fleet' : 'Insurance'})` : ''}` : 
                        'Individual'
                      }
                    </Badge>
                  </div>
                  

                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-medium">Preferences</h3>
                  <div className="space-y-2">
                    <Label>Default Car Number</Label>
                    <Input 
                      placeholder="Enter default car number" 
                      value={isEditing ? editedData.carNumber || '' : currentUser.carNumber || ''}
                      onChange={(e) => setEditedData({...editedData, carNumber: e.target.value})}
                      disabled={!isEditing}
                      readOnly={!isEditing}
                    />
                    <p className="text-xs text-muted-foreground">
                      This will be pre-filled when uploading videos
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

