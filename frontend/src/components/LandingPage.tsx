import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { HeroSection } from './HeroSection';
import { FeaturesSections } from './FeaturesSections';
import { DemoModal } from './DemoModal';
import { Logo } from './Logo';
import { 
  Shield, 
  BarChart3, 
  Camera, 
  ArrowRight,
  Play,
  Clock,
  User,
  Settings,
  Moon,
  Sun
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

interface LandingPageProps {
  onGetStarted: () => void;
  onSignUp: () => void;
  onLogin: () => void;
  isAuthenticated: boolean;
  userData: UserData | null;
  onViewProfile: () => void;
  onViewDashboard?: () => void;
  onViewSettings?: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onLogoClick: () => void;
}

export function LandingPage({ onGetStarted, onSignUp, onLogin, isAuthenticated, userData, onViewProfile, onViewDashboard, onViewSettings, isDarkMode, onToggleDarkMode, onLogoClick }: LandingPageProps) {
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6 max-w-7xl mx-auto">
        <Logo onClick={onLogoClick} size="md" />
        
        <div className="flex items-center space-x-4">
          {/* Dark Mode Toggle */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onToggleDarkMode}
            className="w-9 h-9 p-0"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
          
          {isAuthenticated && userData ? (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-sm">
                  Welcome, {userData.accountType === 'enterprise' ? (userData.company || 'Enterprise User') : userData.firstName}!
                </span>
              </div>
              {onViewDashboard && (
                <Button variant="ghost" onClick={onViewDashboard} className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Dashboard
                </Button>
              )}
              {onViewSettings && (
                <Button variant="ghost" onClick={onViewSettings} className="gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
              )}
            </div>
          ) : (
            <>
              <Button variant="outline" onClick={onLogin}>
                Log In
              </Button>
              <Button onClick={onSignUp}>
                Sign Up
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </nav>

      <HeroSection onGetStarted={onGetStarted} />

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">How DRIVEGUARD AI Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our advanced AI technology analyzes driving videos to provide comprehensive behavioral insights
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <Camera className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Upload Video</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Simply upload any driving video from dashcams, mobile phones, or fleet cameras
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardHeader>
                <Settings className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>AI Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Our AI processes speed, lane changes, braking patterns, and safety violations in seconds
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardHeader>
                <BarChart3 className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Get Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Receive detailed reports with scoring, recommendations, and actionable insights
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Interactive Demo Section */}
          <div className="text-center space-y-6">
            <div className="bg-gradient-to-r from-primary/10 to-blue-600/10 rounded-2xl p-8 space-y-4">
              <h3 className="text-2xl font-bold">See It In Action</h3>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Experience our AI-powered analysis with an interactive demo showing real-time processing and insights
              </p>
              <Button size="lg" onClick={() => setIsDemoOpen(true)} className="gap-2">
                <Play className="h-5 w-5" />
                Watch Interactive Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      <FeaturesSections />

      {/* Key Benefits */}
      <section className="py-20 px-4 bg-secondary/10">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">Why Choose DRIVEGUARD AI?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Advanced technology meets practical business solutions
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Clock className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Instant Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Get comprehensive driving reports in under 30 seconds with our cloud-based AI processing
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <Shield className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Enterprise Security</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Bank-level encryption and compliance with data protection regulations worldwide
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <BarChart3 className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Actionable Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Not just data - get specific recommendations and training suggestions for improvement
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      

      {/* Footer with special DRIVEGUARD AI text effect */}
      <footer className="relative overflow-hidden">
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
          <div className="text-[12rem] md:text-[16rem] lg:text-[20rem] font-bold text-primary/10 whitespace-nowrap pointer-events-none select-none">
            DRIVEGUARD AI
          </div>
        </div>
        <div className="relative z-10 bg-background/90 backdrop-blur-sm border-t py-8 p-[0px]">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <p className="leading-none text-[96px] font-[Spartan] not-italic no-underline bg-gradient-to-r from-red-600 via-red-400 to-red-800 bg-clip-text text-transparent animate-pulse px-[0px] py-[45px] m-[0px] font-bold">
              DRIVEGUARD AI
            </p>
          </div>
        </div>
      </footer>
      
      <DemoModal 
        isOpen={isDemoOpen} 
        onClose={() => setIsDemoOpen(false)} 
      />
    </div>
  );
}