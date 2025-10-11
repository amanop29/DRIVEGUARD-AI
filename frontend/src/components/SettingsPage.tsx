import React, { useState } from 'react';
import { Shield, User, Moon, Sun, ArrowLeft, Save, Monitor } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Logo } from './Logo';
import { toast } from 'sonner';

interface SettingsPageProps {
  userData: any;
  onBackToUpload: () => void;
  onViewProfile: () => void;
  onViewDashboard: () => void;
  onUpdateUser: (userData: any) => void;
  onLogoClick?: () => void;
}

interface SettingsData {
  // Account Settings
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  phone: string;
  
  // Appearance
  theme: string;
  language: string;
  timezone: string;
}

export function SettingsPage({ userData, onBackToUpload, onViewProfile, onViewDashboard, onUpdateUser, onLogoClick }: SettingsPageProps) {
  const [settings, setSettings] = useState<SettingsData>({
    firstName: userData?.firstName || '',
    lastName: userData?.lastName || '',
    email: userData?.email || '',
    company: userData?.company || '',
    phone: userData?.phone || '',
    theme: 'system',
    language: 'en',
    timezone: 'UTC'
  });

  // Check if dark mode is currently active
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.classList.contains('dark')
  );

  // Sync state with actual theme on mount
  React.useEffect(() => {
    const currentIsDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(currentIsDark);
    setSettings(prev => ({ ...prev, theme: currentIsDark ? 'dark' : 'light' }));
  }, []);

  const handleSave = () => {
    // Update user data
    onUpdateUser({
      ...userData,
      firstName: settings.firstName,
      lastName: settings.lastName,
      email: settings.email,
      company: settings.company
    });

    toast.success('Settings saved successfully', {
      description: 'Your preferences have been updated.'
    });
  };

  const toggleTheme = () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
    setSettings(prev => ({ ...prev, theme: newTheme }));
    
    toast.success(`Switched to ${newTheme} mode`, {
      description: `The interface is now in ${newTheme} mode.`
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile-optimized Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={onBackToUpload} className="lg:hidden">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Logo 
                onClick={onLogoClick} 
                size="sm"
                className="flex-shrink-0"
                showText={false}
              />
              <span className="hidden sm:inline font-bold">DRIVEGUARD AI</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onViewProfile} className="hidden sm:flex">
                <User className="h-4 w-4 mr-2" />
                Profile
              </Button>
              <Button size="sm" onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 lg:py-8">
        <div className="max-w-4xl mx-auto">
          {/* Desktop breadcrumb - hidden on mobile */}
          <div className="hidden lg:flex items-center gap-2 mb-6 text-sm text-muted-foreground">
            <button onClick={onViewDashboard} className="hover:text-foreground">Dashboard</button>
            <span>/</span>
            <button onClick={onViewProfile} className="hover:text-foreground">Profile</button>
            <span>/</span>
            <span>Settings</span>
          </div>

          <div className="mb-6">
            <h1 className="mb-2">Settings & Preferences</h1>
            <p className="text-muted-foreground">
              Manage your account and display preferences
            </p>
          </div>

          {/* Mobile-optimized Tabs */}
          <Tabs defaultValue="account" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 h-auto">
              <TabsTrigger value="account" className="flex flex-col gap-1 py-3 px-4">
                <User className="h-4 w-4" />
                <span className="text-xs sm:text-sm">Account</span>
              </TabsTrigger>
              <TabsTrigger value="appearance" className="flex flex-col gap-1 py-3 px-4">
                <Monitor className="h-4 w-4" />
                <span className="text-xs sm:text-sm">Display</span>
              </TabsTrigger>
            </TabsList>

            {/* Account Settings */}
            <TabsContent value="account" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription>
                    Update your personal and company information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={settings.firstName}
                        onChange={(e) => setSettings(prev => ({ ...prev, firstName: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={settings.lastName}
                        onChange={(e) => setSettings(prev => ({ ...prev, lastName: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={settings.email}
                      onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        value={settings.company}
                        onChange={(e) => setSettings(prev => ({ ...prev, company: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={settings.phone}
                        onChange={(e) => setSettings(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>





            {/* Appearance */}
            <TabsContent value="appearance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Display Settings</CardTitle>
                  <CardDescription>
                    Customize the appearance and behavior of the interface
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Dark Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Toggle between light and dark theme
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sun className="h-4 w-4" />
                      <Switch
                        checked={isDarkMode}
                        onCheckedChange={toggleTheme}
                      />
                      <Moon className="h-4 w-4" />
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Language</Label>
                      <Select
                        value={settings.language}
                        onValueChange={(value) => setSettings(prev => ({ ...prev, language: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Español</SelectItem>
                          <SelectItem value="fr">Français</SelectItem>
                          <SelectItem value="de">Deutsch</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Timezone</Label>
                      <Select
                        value={settings.timezone}
                        onValueChange={(value) => setSettings(prev => ({ ...prev, timezone: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="America/New_York">Eastern Time</SelectItem>
                          <SelectItem value="America/Chicago">Central Time</SelectItem>
                          <SelectItem value="America/Denver">Mountain Time</SelectItem>
                          <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Mobile-only bottom action bar */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t p-4">
            <div className="flex gap-3">
              <Button variant="outline" onClick={onViewProfile} className="flex-1">
                <User className="h-4 w-4 mr-2" />
                Profile
              </Button>
              <Button onClick={handleSave} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </Button>
            </div>
          </div>

          {/* Add bottom padding for mobile action bar */}
          <div className="lg:hidden h-20" />
        </div>
      </div>
    </div>
  );
}