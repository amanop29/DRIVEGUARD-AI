import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { Checkbox } from './ui/checkbox';
import { Logo } from './Logo';
import { 
  ArrowLeft, 
  Mail, 
  Lock, 
  Eye,
  EyeOff,
  Zap,
  Shield,
  BarChart3
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

interface LoginPageProps {
  onSuccess: (userData?: UserData, rememberMe?: boolean) => void;
  onBackToLanding: () => void;
  onSwitchToSignUp: () => void;
  onLogoClick: () => void;
}

export function LoginPage({ onSuccess, onBackToLanding, onSwitchToSignUp, onLogoClick }: LoginPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Call backend API to login
      const response = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Login failed');
      }

      // Login successful - prepare user data
      const mockUserData: UserData = {
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        email: data.user.email,
        company: data.user.company || '',
        accountType: data.user.accountType,
        businessType: data.user.businessType || undefined,
        carNumber: data.user.carNumber || '',
        affiliatedOrganizationId: data.user.affiliatedOrganizationId || undefined,
        affiliatedOrganizationName: data.user.affiliatedOrganizationName || undefined,
        affiliatedOrganizationType: data.user.affiliatedOrganizationType || undefined,
        organizationId: data.user.organizationId || undefined
      };

      // Save to localStorage
      localStorage.setItem('userData', JSON.stringify(mockUserData));

      setTimeout(() => {
        onSuccess(mockUserData);
      }, 500);

    } catch (error: any) {
      console.error('Login error:', error);
      
      // Fallback to test credentials if API fails
      let mockUserData: UserData | null = null;
      
      if (formData.email === '1@test.in' && formData.password === '1234') {
        mockUserData = {
          firstName: 'John',
          lastName: 'Individual',
          email: '1@test.in',
          company: '',
          accountType: 'individual',
          carNumber: 'IND-001'
        };
      } else if (formData.email === '2@test.in' && formData.password === '1234') {
        mockUserData = {
          firstName: 'Jane',
          lastName: 'Enterprise',
          email: '2@test.in',
          company: 'SecureRisk Insurance Group',
          accountType: 'enterprise',
          businessType: 'insurance',
          organizationId: 'ins-002'
        };
      } else if (formData.email === '3@test.in' && formData.password === '1234') {
        mockUserData = {
          firstName: 'Mike',
          lastName: 'Fleet',
          email: '3@test.in',
          company: 'RapidTransport Fleet Solutions',
          accountType: 'enterprise',
          businessType: 'fleet-operator',
          organizationId: 'fleet-001'
        };
      }

      if (mockUserData) {
        // Use test credentials
        localStorage.setItem('userData', JSON.stringify(mockUserData));
        setTimeout(() => {
          onSuccess(mockUserData, formData.rememberMe);
        }, 500);
      } else {
        // Neither API nor test credentials worked
        setError(error.message || 'Invalid email or password');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const quickFeatures = [
    {
      icon: Zap,
      title: 'Instant Analysis',
      description: 'Get driving insights in under 30 seconds'
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Bank-level encryption and data protection'
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Comprehensive behavioral metrics and reporting'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6 max-w-7xl mx-auto border-b">
        <Button variant="ghost" onClick={onBackToLanding}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>
        
        <Logo size="sm" />

        <div className="w-24" /> {/* Spacer for center alignment */}
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Welcome back */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                Welcome Back to DRIVEGUARD AI
              </h1>
              <p className="text-xl text-muted-foreground">
                Continue building intelligent driver analytics that transform your business.
              </p>
            </div>

            <div className="space-y-6">
              {quickFeatures.map((feature, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center flex-shrink-0">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right side - Login form */}
          <div className="max-w-md mx-auto w-full">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Sign In to Your Account</CardTitle>
                <p className="text-muted-foreground">Continue your AI-powered journey</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className="pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="rememberMe"
                        checked={formData.rememberMe}
                        onCheckedChange={(checked) => handleInputChange('rememberMe', checked as boolean)}
                      />
                      <Label htmlFor="rememberMe" className="text-sm">
                        Remember me
                      </Label>
                    </div>
                    <button
                      type="button"
                      className="text-sm text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>

                  {error && (
                    <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </form>

                <div className="text-center space-y-4">
                  {/* Test credentials info */}
                  <div className="bg-muted/30 rounded-lg p-3 text-left">
                    <p className="text-sm font-medium mb-2">Test Accounts:</p>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p><strong>Individual:</strong> 1@test.in / 1234</p>
                      <p><strong>Enterprise (Insurance):</strong> 2@test.in / 1234</p>
                      <p><strong>Enterprise (Fleet):</strong> 3@test.in / 1234</p>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    Don't have an account?{' '}
                    <button
                      onClick={onSwitchToSignUp}
                      className="text-primary hover:underline"
                    >
                      Create one now
                    </button>
                  </p>
                  

                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}