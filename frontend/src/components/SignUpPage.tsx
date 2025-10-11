import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Logo } from './Logo';
import { 
  Shield,
  ArrowLeft, 
  Mail, 
  Lock, 
  User, 
  Building, 
  CheckCircle,
  Eye,
  EyeOff,
  Car,
  Crown,
  Briefcase,
  Truck
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

interface SignUpPageProps {
  onSuccess: (userData: UserData) => void;
  onBackToLanding: () => void;
  onSwitchToLogin: () => void;
  onLogoClick: () => void;
}

export function SignUpPage({ onSuccess, onBackToLanding, onSwitchToLogin, onLogoClick }: SignUpPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    password: '',
    confirmPassword: '',
    accountType: 'individual' as 'individual' | 'enterprise',
    businessType: '' as 'insurance' | 'fleet-operator' | '',
    carNumber: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);

    try {
      // Call backend API to register user
      const response = await fetch('http://localhost:3001/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          company: formData.accountType === 'enterprise' ? formData.company : '',
          accountType: formData.accountType,
          businessType: formData.businessType || null,
          carNumber: formData.carNumber
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Registration failed');
      }

      // Registration successful
      const userData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        company: formData.accountType === 'enterprise' ? formData.company : '',
        accountType: formData.accountType,
        businessType: formData.businessType || undefined,
        carNumber: formData.carNumber
      };

      // Save to localStorage for session persistence
      localStorage.setItem('userData', JSON.stringify(userData));
      
      setTimeout(() => {
        onSuccess(userData);
      }, 500);

    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.message || 'Failed to register. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const benefits = [
    'Advanced AI-powered driver analysis',
    'Real-time behavioral insights',
    'Customizable risk assessment',
    'Enterprise-grade security',
    '24/7 technical support'
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6 max-w-7xl mx-auto border-b">
        <Button variant="ghost" onClick={onBackToLanding}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>
        
        <Logo size="md" />

        <div className="w-24" /> {/* Spacer for center alignment */}
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Benefits */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                Join the Future of Driver Intelligence
              </h1>
              <p className="text-xl text-muted-foreground">
                Get started with DRIVEGUARD AI and transform how you analyze driver behavior.
              </p>
            </div>

            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-muted-foreground">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right side - Sign up form */}
          <div className="max-w-md mx-auto w-full">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Create Your Account</CardTitle>
                <p className="text-muted-foreground">Start your free trial today</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="firstName"
                          type="text"
                          placeholder="John"
                          value={formData.firstName}
                          onChange={(e) => handleInputChange('firstName', e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        type="text"
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@company.com"
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
                        placeholder="Create a strong password"
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

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accountType">Account Type</Label>
                    <Select 
                      value={formData.accountType} 
                      onValueChange={(value) => {
                        handleInputChange('accountType', value);
                        // Reset business type and company when switching to individual
                        if (value === 'individual') {
                          handleInputChange('businessType', '');
                          handleInputChange('company', '');
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select account type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4" />
                            <span>Individual</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="enterprise">
                          <div className="flex items-center space-x-2">
                            <Crown className="h-4 w-4" />
                            <span>Enterprise</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.accountType === 'enterprise' && (
                    <div className="space-y-2">
                      <Label htmlFor="businessType">Type of Business</Label>
                      <Select 
                        value={formData.businessType} 
                        onValueChange={(value) => handleInputChange('businessType', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select business type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="insurance">
                            <div className="flex items-center space-x-2">
                              <Shield className="h-4 w-4" />
                              <span>Insurance Company</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="fleet-operator">
                            <div className="flex items-center space-x-2">
                              <Truck className="h-4 w-4" />
                              <span>Fleet Operator</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {formData.accountType === 'enterprise' && (
                    <div className="space-y-2">
                      <Label htmlFor="company">Company</Label>
                      <div className="relative">
                        <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="company"
                          type="text"
                          placeholder="Your Company"
                          value={formData.company}
                          onChange={(e) => handleInputChange('company', e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="carNumber">Car Number (Optional)</Label>
                    <div className="relative">
                      <Car className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="carNumber"
                        type="text"
                        placeholder="e.g., ABC-123"
                        value={formData.carNumber}
                        onChange={(e) => handleInputChange('carNumber', e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This will be your default car number for analyses
                    </p>
                  </div>

                  {error && (
                    <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </form>

                <div className="text-center space-y-4">
                  <div className="relative">
                    <Separator />
                    <span className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-muted-foreground text-sm">
                      or
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <button
                      onClick={onSwitchToLogin}
                      className="text-primary hover:underline"
                    >
                      Sign in
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