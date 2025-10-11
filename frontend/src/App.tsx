import React, { useState } from 'react';
import { LandingPage } from './components/LandingPage';
import { SignUpPage } from './components/SignUpPage';
import { LoginPage } from './components/LoginPage';
import { ProfilePage } from './components/ProfilePage';
import { VideoUpload } from './components/VideoUpload';
import { AnalysisDashboard } from './components/AnalysisDashboard';
import { TeamManagement } from './components/TeamManagement';
import { SettingsPage } from './components/SettingsPage';
import { Dashboard } from './components/Dashboard';
import { getVideoDuration } from './utils/videoUtils';
import { saveUserData, loadUserData, clearUserData, clearTestAccountData } from './utils/dataStorage';

import { toast } from 'sonner';
import { Toaster } from './components/ui/sonner';

type AppState = 'landing' | 'signup' | 'login' | 'upload' | 'analyzing' | 'results' | 'profile' | 'team' | 'settings' | 'dashboard';

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

interface OrganizationAffiliation {
  organizationId: string;
  organizationName: string;
  organizationType: 'insurance' | 'fleet-operator';
  affiliationCode: string;
  isActive: boolean;
}

export default function App() {
  const [appState, setAppState] = useState<AppState>('landing');
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null);
  const [analysisFile, setAnalysisFile] = useState<File | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisRecord[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationAffiliation[]>([
    {
      organizationId: 'ins-001',
      organizationName: 'SafeDrive Insurance Co.',
      organizationType: 'insurance',
      affiliationCode: 'SDI2024',
      isActive: true
    },
    {
      organizationId: 'ins-002',
      organizationName: 'SecureRisk Insurance Group',
      organizationType: 'insurance',
      affiliationCode: 'SRI2024',
      isActive: true
    }
  ]);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });

  const handleGetStarted = () => {
    try {
      if (isAuthenticated) {
        setAppState('dashboard');
      } else {
        setAppState('signup');
      }
    } catch (error) {
      console.error('Error in handleGetStarted:', error);
      setAppState('signup');
    }
  };



  const handleSignUp = () => {
    setAppState('signup');
  };

  const handleLogin = () => {
    setAppState('login');
  };

  // Helper function to sync analysis scores with backend data
  const syncAnalysisScores = async (analyses: AnalysisRecord[]): Promise<AnalysisRecord[]> => {
    try {
      const response = await fetch('http://localhost:3001/api/merged-analysis');
      if (response.ok) {
        const analysisData = await response.json();
        return analyses.map(analysis => {
          const videoAnalysis = analysisData[analysis.fileName];
          if (videoAnalysis?.driving_scores?.overall_score) {
            return {
              ...analysis,
              score: Math.round(videoAnalysis.driving_scores.overall_score)
            };
          }
          return analysis;
        });
      }
    } catch (error) {
      console.warn('Could not sync analysis scores:', error);
    }
    return analyses;
  };

  const handleAuthSuccess = async (user?: UserData, rememberMe?: boolean) => {
    try {
      setIsAuthenticated(true);
      if (user) {
        setUserData(user);
        
        // Handle "Remember me" functionality
        if (rememberMe) {
          localStorage.setItem('rememberedUser', JSON.stringify({
            email: user.email,
            userData: user,
            timestamp: Date.now()
          }));
        }
        
        // Check if this is a test account
        const isTestAccount = user.email === '1@test.in' || user.email === '2@test.in' || user.email === '3@test.in';
        
        // Load user's analysis history from backend
        try {
          const response = await fetch(`http://localhost:3001/api/user-analyses/${encodeURIComponent(user.email)}`);
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.analyses && data.analyses.length > 0) {
              // Sync scores with current backend data
              const syncedAnalyses = await syncAnalysisScores(data.analyses);
              setAnalysisHistory(syncedAnalyses);
              
              toast.success(`Welcome back, ${user.firstName}!`, {
                description: `Loaded ${data.analyses.length} previous ${data.analyses.length === 1 ? 'analysis' : 'analyses'}.`
              });
            } else {
              // No previous analyses
              setAnalysisHistory([]);
              toast.success('Welcome to DriveGuard AI!', {
                description: user.accountType === 'enterprise' 
                  ? 'Start by uploading driving videos to build your analytics dashboard.'
                  : 'Upload your first driving video to get detailed behavior analysis.'
              });
            }
          } else {
            // API failed, try localStorage as fallback (for test accounts)
            if (isTestAccount) {
              const storedData = loadUserData(user.email);
              if (storedData) {
                const syncedAnalyses = await syncAnalysisScores(storedData.analysisHistory || []);
                setAnalysisHistory(syncedAnalyses);
                setDrivers(storedData.drivers || []);
                setVehicles(storedData.vehicles || []);
                
                toast.success('Welcome back!', {
                  description: `Loaded ${syncedAnalyses.length || 0} previous analyses.`
                });
              } else {
                setAnalysisHistory([]);
                setDrivers([]);
                setVehicles([]);
              }
            } else {
              // Clean slate for all new users
              setAnalysisHistory([]);
              setDrivers([]);
              setVehicles([]);
              
              if (user.accountType === 'enterprise') {
                toast.success('Welcome to DriveGuard AI!', {
                  description: 'Start by uploading driving videos to build your fleet analytics.'
                });
              } else {
                toast.success('Welcome to DriveGuard AI!', {
                  description: 'Upload your first driving video to get detailed behavior analysis.'
                });
              }
            }
          }
        } catch (apiError) {
          console.error('Error loading user analyses:', apiError);
          // Fallback to localStorage
          const storedData = loadUserData(user.email);
          if (storedData && storedData.analysisHistory) {
            const syncedAnalyses = await syncAnalysisScores(storedData.analysisHistory);
            setAnalysisHistory(syncedAnalyses);
            setDrivers(storedData.drivers || []);
            setVehicles(storedData.vehicles || []);
          } else {
            setAnalysisHistory([]);
            setDrivers([]);
            setVehicles([]);
          }
          
          toast.success(`Welcome, ${user.firstName}!`);
        }
      }
      setAppState('dashboard');
    } catch (error) {
      console.error('Error in handleAuthSuccess:', error);
      setAppState('landing');
    }
  };

  const handleViewProfile = () => {
    setAppState('profile');
  };

  const handleViewTeam = () => {
    setAppState('team');
  };

  const handleViewSettings = () => {
    try {
      setAppState('settings');
    } catch (error) {
      console.error('Error in handleViewSettings:', error);
    }
  };

  const handleUpdateUser = async (updatedUser: UserData) => {
    try {
      // Update local state immediately for UI responsiveness
      setUserData(updatedUser);
      
      // Save to backend
      if (updatedUser.email) {
        const response = await fetch('http://localhost:3001/api/update-user', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: updatedUser.email,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            company: updatedUser.company,
            carNumber: updatedUser.carNumber,
            accountType: updatedUser.accountType,
            businessType: updatedUser.businessType
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            toast.success('Profile updated successfully!', {
              description: 'Your changes have been saved.'
            });
            
            // Also update localStorage
            localStorage.setItem('userData', JSON.stringify(updatedUser));
          } else {
            throw new Error(data.error || 'Failed to update profile');
          }
        } else {
          throw new Error('Failed to update profile');
        }
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to save changes', {
        description: 'Your changes were saved locally but could not be synced to the server.'
      });
      
      // Still keep the local update
      localStorage.setItem('userData', JSON.stringify(updatedUser));
    }
  };

  const handleBackToUpload = () => {
    setAppState('upload');
  };

  const handleViewDashboard = () => {
    try {
      setAppState('dashboard');
    } catch (error) {
      console.error('Error in handleViewDashboard:', error);
    }
  };

  const handleViewAnalysis = (analysisId: string) => {
    setSelectedAnalysisId(analysisId);
    setAppState('results');
  };

  const handleBackToLanding = () => {
    setAppState('landing');
  };

  const handleLogoClick = () => {
    setAppState('landing');
  };

  const handleUploadComplete = async (file: File, carNumber?: string, driverId?: string, vehicleId?: string) => {
    setAppState('analyzing');
    
    // Get actual video duration (may fail and return 'Unknown')
    let videoDuration = await getVideoDuration(file);
    
    // Simulate analysis processing time
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Load actual driving score and duration from analysis data
    let score = 84; // Default fallback score
    try {
      const response = await fetch('http://localhost:3001/api/merged-analysis');
      if (response.ok) {
        const analysisData = await response.json();
        const videoAnalysis = analysisData[file.name];
        if (videoAnalysis?.driving_scores?.overall_score) {
          score = Math.round(videoAnalysis.driving_scores.overall_score);
        }
        // Get duration from analysis metadata if available
        if (videoAnalysis?.video_metadata?.duration_seconds) {
          const durationInSeconds = Math.floor(videoAnalysis.video_metadata.duration_seconds);
          const minutes = Math.floor(durationInSeconds / 60);
          const seconds = durationInSeconds % 60;
          videoDuration = seconds === 0 ? `${minutes}min` : `${minutes}m${seconds}s`;
        }
      }
    } catch (error) {
      console.warn('Could not load driving score, using default:', error);
    }
    
    // Create new analysis record
    const newAnalysis: AnalysisRecord = {
      id: Date.now().toString(),
      fileName: file.name,
      date: new Date().toLocaleDateString(),
      score: score,
      duration: videoDuration, // Use actual video duration from analysis or video element
      carNumber: carNumber,
      driverId: driverId,
      vehicleId: vehicleId,
      // Add user and organization tracking
      userId: userData?.email,
      userEmail: userData?.email,
      userName: `${userData?.firstName} ${userData?.lastName}`,
      organizationId: userData?.accountType === 'enterprise' 
        ? userData?.organizationId 
        : userData?.affiliatedOrganizationId,
      organizationName: userData?.accountType === 'enterprise' 
        ? userData?.company 
        : userData?.affiliatedOrganizationName,
      isFromAffiliatedUser: userData?.accountType === 'individual' && !!userData?.affiliatedOrganizationId
    };
    
    // Update driver statistics if driverId is provided
    if (driverId) {
      setDrivers(prevDrivers => 
        prevDrivers.map(driver => {
          if (driver.id === driverId) {
            const previousScore = driver.averageScore;
            const newTotalAnalyses = driver.totalAnalyses + 1;
            const newAverageScore = Math.round(
              ((driver.averageScore * driver.totalAnalyses) + score) / newTotalAnalyses
            );
            
            // Check for performance alerts
            if (newAverageScore <= 60) {
              toast.error(`Critical Performance Alert: ${driver.name}`, {
                description: `Driver score dropped to ${newAverageScore}. Immediate attention required.`,
                action: {
                  label: 'View Team',
                  onClick: () => setAppState('team')
                }
              });
            } else if (newAverageScore <= 75 && previousScore > 75) {
              toast.warning(`Performance Warning: ${driver.name}`, {
                description: `Driver score dropped to ${newAverageScore}. Consider additional training.`,
                action: {
                  label: 'View Team',
                  onClick: () => setAppState('team')
                }
              });
            } else if (score < previousScore - 15) {
              toast('Performance Drop Detected', {
                description: `${driver.name}'s latest score (${score}) is significantly lower than average.`,
                action: {
                  label: 'View Analysis',
                  onClick: () => {} // Could link to detailed analysis
                }
              });
            }
            
            return {
              ...driver,
              totalAnalyses: newTotalAnalyses,
              averageScore: newAverageScore,
              lastAnalysis: new Date().toLocaleDateString()
            };
          }
          return driver;
        })
      );
    }
    
    setAnalysisHistory(prev => [newAnalysis, ...prev]);
    setAnalysisFile(file);
    
    // Set the newly created analysis as the selected one
    setSelectedAnalysisId(newAnalysis.id);
    
    // Save analysis to backend for logged-in users
    if (userData?.email) {
      try {
        await fetch('http://localhost:3001/api/save-analysis', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: userData.email,
            analysisData: newAnalysis
          })
        });
        console.log('Analysis saved to user account');
      } catch (error) {
        console.error('Failed to save analysis to backend:', error);
        // Still save to localStorage as fallback
        saveUserData(userData.email, {
          analysisHistory: [newAnalysis, ...analysisHistory],
          drivers,
          vehicles,
          lastLogin: new Date().toISOString()
        });
      }
    }
    
    setAppState('results');
  };



  const handleAddDriver = (driverData: Omit<Driver, 'id' | 'totalAnalyses' | 'averageScore' | 'joinDate' | 'lastAnalysis'>): string => {
    const newDriver: Driver = {
      ...driverData,
      id: Date.now().toString(),
      joinDate: new Date().toLocaleDateString(),
      totalAnalyses: 0,
      averageScore: 0,
    };
    
    setDrivers(prev => [...prev, newDriver]);
    return newDriver.id;
  };

  const handleAddVehicle = (vehicleData: Omit<Vehicle, 'id'>): string => {
    const newVehicle: Vehicle = {
      ...vehicleData,
      id: Date.now().toString(),
    };
    
    setVehicles(prev => [...prev, newVehicle]);
    return newVehicle.id;
  };

  const handleJoinOrganization = (affiliationCode: string): boolean => {
    const organization = organizations.find(org => org.affiliationCode === affiliationCode && org.isActive);
    
    if (organization && userData?.accountType === 'individual') {
      const updatedUserData: UserData = {
        ...userData,
        affiliatedOrganizationId: organization.organizationId,
        affiliatedOrganizationName: organization.organizationName,
        affiliatedOrganizationType: organization.organizationType
      };
      
      setUserData(updatedUserData);
      
      toast.success('Successfully joined organization!', {
        description: `You are now affiliated with ${organization.organizationName}. Your analyses will be visible to your organization.`
      });
      
      return true;
    }
    
    toast.error('Invalid affiliation code', {
      description: 'Please check the code and try again, or contact your organization administrator.'
    });
    
    return false;
  };

  const handleLeaveOrganization = () => {
    if (userData?.accountType === 'individual' && userData?.affiliatedOrganizationId) {
      const updatedUserData: UserData = {
        ...userData,
        affiliatedOrganizationId: undefined,
        affiliatedOrganizationName: undefined,
        affiliatedOrganizationType: undefined
      };
      
      setUserData(updatedUserData);
      
      toast.success('Left organization', {
        description: 'You are no longer affiliated with the organization. Your future analyses will be private.'
      });
    }
  };

  const handleReset = () => {
    setAnalysisFile(null);
    setAppState('upload');
  };

  const handleLogout = () => {
    // Clear remembered user if logging out explicitly
    localStorage.removeItem('rememberedUser');
    
    // Data is already saved via useEffect, so we just clear the state
    setIsAuthenticated(false);
    setUserData(null);
    setAnalysisHistory([]);
    setAnalysisFile(null);
    setDrivers([]);
    setVehicles([]);
    setAppState('landing');
    
    toast.success('Logged out successfully', {
      description: 'Your data has been saved and will be available when you log back in.'
    });
  };

  const toggleDarkMode = () => {
    try {
      const newDarkMode = !isDarkMode;
      setIsDarkMode(newDarkMode);
      
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('darkMode', JSON.stringify(newDarkMode));
      }
      
      // Apply dark class to document
      if (typeof document !== 'undefined') {
        if (newDarkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    } catch (error) {
      console.error('Error toggling dark mode:', error);
    }
  };



  // Apply dark mode on initial load
  React.useEffect(() => {
    try {
      if (typeof document !== 'undefined') {
        if (isDarkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    } catch (error) {
      console.error('Error applying dark mode:', error);
    }
  }, [isDarkMode]);

  // Check for remembered user on app initialization
  React.useEffect(() => {
    try {
      // Clear test account data on app initialization to ensure clean state
      clearTestAccountData();
      
      const rememberedUser = localStorage.getItem('rememberedUser');
      if (rememberedUser) {
        const { email, userData, timestamp } = JSON.parse(rememberedUser);
        
        // Check if the remembered session is still valid (30 days)
        const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
        if (Date.now() - timestamp < thirtyDaysInMs) {
          // Auto-login the remembered user
          handleAuthSuccess(userData, true);
          toast.success('Welcome back!', {
            description: 'You were automatically logged in.'
          });
        } else {
          // Remove expired remembered user
          localStorage.removeItem('rememberedUser');
        }
      }
    } catch (error) {
      console.error('Error checking remembered user:', error);
      localStorage.removeItem('rememberedUser');
    }
  }, []);

  // Save user data whenever it changes
  React.useEffect(() => {
    if (isAuthenticated && userData?.email) {
      try {
        saveUserData(userData.email, {
          analysisHistory,
          drivers,
          vehicles,
          lastLogin: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error saving user data:', error);
      }
    }
  }, [isAuthenticated, userData?.email, analysisHistory, drivers, vehicles]);



  if (appState === 'landing') {
    return (
      <LandingPage 
        onGetStarted={handleGetStarted} 
        onSignUp={handleSignUp} 
        onLogin={handleLogin} 
        isAuthenticated={isAuthenticated} 
        userData={userData} 
        onViewProfile={handleViewProfile} 
        onViewDashboard={handleViewDashboard} 
        onViewSettings={handleViewSettings} 
        isDarkMode={isDarkMode} 
        onToggleDarkMode={toggleDarkMode} 
        onLogoClick={handleLogoClick} 
      />
    );
  }

  if (appState === 'signup') {
    return <SignUpPage onSuccess={handleAuthSuccess} onBackToLanding={handleBackToLanding} onSwitchToLogin={handleLogin} onLogoClick={handleLogoClick} />;
  }

  if (appState === 'login') {
    return <LoginPage onSuccess={handleAuthSuccess} onBackToLanding={handleBackToLanding} onSwitchToSignUp={handleSignUp} onLogoClick={handleLogoClick} />;
  }

  if (appState === 'profile') {
    return <ProfilePage userData={userData} analysisHistory={analysisHistory} onBackToUpload={handleViewDashboard} onUpdateUser={handleUpdateUser} onLogout={handleLogout} onViewTeam={handleViewTeam} onViewSettings={handleViewSettings} onViewAnalysis={handleViewAnalysis} onLogoClick={handleLogoClick} onJoinOrganization={handleJoinOrganization} onLeaveOrganization={handleLeaveOrganization} organizations={organizations} drivers={drivers} vehicles={vehicles} />;
  }

  if (appState === 'team') {
    return <TeamManagement userData={userData} drivers={drivers} vehicles={vehicles} onSetDrivers={setDrivers} onSetVehicles={setVehicles} onBackToUpload={handleBackToUpload} onViewProfile={handleViewProfile} onViewDashboard={handleViewDashboard} analysisHistory={analysisHistory} onLogoClick={handleLogoClick} />;
  }

  if (appState === 'settings') {
    return <SettingsPage userData={userData} onBackToUpload={handleBackToUpload} onViewProfile={handleViewProfile} onViewDashboard={handleViewDashboard} onUpdateUser={handleUpdateUser} onLogoClick={handleLogoClick} />;
  }

  if (appState === 'dashboard') {
    // Filter analyses for enterprise users to include their own + affiliated users
    let dashboardAnalyses = [];
    
    try {
      if (userData?.accountType === 'enterprise') {
        dashboardAnalyses = analysisHistory.filter(analysis => {
          // Safely check for organization matches
          const userOrgId = userData?.organizationId;
          const userCompany = userData?.company;
          const analysisOrgId = analysis.organizationId;
          const analysisOrgName = analysis.organizationName;
          
          return (userOrgId && analysisOrgId === userOrgId) ||
                 (userCompany && (analysisOrgId === userCompany || analysisOrgName === userCompany)) ||
                 analysis.isFromAffiliatedUser;
        });
      } else {
        dashboardAnalyses = analysisHistory.filter(analysis => analysis.userId === userData?.email);
      }
    } catch (error) {
      console.error('Error filtering dashboard analyses:', error);
      dashboardAnalyses = [];
    }
    
    return (
      <Dashboard 
        userData={userData} 
        analysisHistory={dashboardAnalyses} 
        drivers={drivers} 
        vehicles={vehicles} 
        onBackToUpload={handleBackToUpload} 
        onViewProfile={handleViewProfile} 
        onViewTeam={handleViewTeam} 
        onViewAnalysis={handleViewAnalysis} 
        onLogoClick={handleLogoClick} 
      />
    );
  }

  if (appState === 'analyzing') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <h2>Analyzing Video...</h2>
          <p className="text-muted-foreground">
            Processing driving behavior patterns, speed analysis, and safety metrics
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {appState === 'upload' ? (
          <VideoUpload 
            onUploadComplete={handleUploadComplete}
            onViewProfile={handleViewProfile} 
            onBackToDashboard={handleViewDashboard} 
            userData={userData} 
            onViewTeam={handleViewTeam}
            drivers={drivers}
            vehicles={vehicles}
            onAddDriver={handleAddDriver}
            onAddVehicle={handleAddVehicle}
            onLogoClick={handleLogoClick}
          />
        ) : (
          <AnalysisDashboard 
            fileName={
              selectedAnalysisId 
                ? analysisHistory.find(a => a.id === selectedAnalysisId)?.fileName || ''
                : analysisHistory[0]?.fileName || ''
            } 
            onReset={handleReset}
            onViewProfile={handleViewProfile}
            onViewDashboard={handleViewDashboard}
            analysisData={selectedAnalysisId ? analysisHistory.find(a => a.id === selectedAnalysisId) : analysisHistory[0]}
            drivers={drivers}
            vehicles={vehicles}
            onLogoClick={handleLogoClick}
            analysisHistory={analysisHistory}
            userData={userData}
          />
        )}
      </div>

      <Toaster richColors position="top-right" />
    </div>
  );
}