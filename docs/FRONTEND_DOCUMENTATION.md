# Frontend Documentation

**React + TypeScript Application Architecture**  
**Date:** October 9, 2025

---

## 🎨 Frontend Overview

### **Technology Stack**
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui (Radix UI primitives)
- **Charts:** Recharts
- **Icons:** Lucide React
- **Notifications:** Sonner (toast notifications)
- **State Management:** React Hooks (useState, useEffect)

---

## 📁 Project Structure

```
src/
├── main.tsx                    # Application entry point
├── App.tsx                     # Main application component
├── index.css                   # Global styles & Tailwind imports
│
├── components/                 # React components
│   ├── LandingPage.tsx        # Login/register page
│   ├── UploadPage.tsx         # Video upload interface
│   ├── AnalysisDashboard.tsx  # Main analysis view
│   ├── PerformanceMetrics.tsx # Metrics cards
│   ├── VideoPlayer.tsx        # Interactive video player
│   ├── AnalysisCharts.tsx     # Data visualization
│   ├── ProfilePage.tsx        # User profile
│   ├── SettingsPage.tsx       # Settings & preferences
│   ├── Logo.tsx               # Logo component
│   │
│   └── ui/                    # UI primitives (shadcn/ui)
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── select.tsx
│       ├── switch.tsx
│       ├── tabs.tsx
│       ├── chart.tsx
│       └── ...
│
├── utils/                     # Utility functions
│   ├── analysisData.ts       # Data types & interfaces
│   ├── videoUtils.ts         # Video processing utilities
│   ├── intelligentSummary.ts # AI summary generation
│   └── strengthsAndFocusAreas.ts # Performance analysis
│
├── styles/                    # Component-specific styles
│   └── VideoPlayer.css
│
└── types/                     # TypeScript type definitions
    └── index.ts
```

---

## 🔧 Core Components

### **1. App.tsx - Main Application**

**Purpose:** Root component managing application state and routing

```typescript
import React, { useState, useEffect } from 'react';

type AppState = 
  | 'landing'
  | 'upload'
  | 'analyzing'
  | 'results'
  | 'profile'
  | 'settings';

interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  accountType: 'individual' | 'enterprise';
  analyses: AnalysisData[];
}

export default function App() {
  const [appState, setAppState] = useState<AppState>('landing');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisData[]>([]);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null);
  
  // Theme management
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
    }
  }, []);
  
  // Handle login
  const handleLogin = async (email: string, password: string) => {
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      setUserData(data.user);
      setAnalysisHistory(data.user.analyses || []);
      setAppState('upload');
    }
  };
  
  // Handle video upload and analysis
  const handleVideoUpload = async (file: File) => {
    setAppState('analyzing');
    
    const formData = new FormData();
    formData.append('video', file);
    formData.append('userId', userData.id);
    formData.append('userEmail', userData.email);
    
    const response = await fetch('http://localhost:3001/api/analyze', {
      method: 'POST',
      body: formData
    });
    
    const analysisData = await response.json();
    
    // Create new analysis entry
    const newAnalysis: AnalysisData = {
      id: Date.now().toString(),
      fileName: file.name,
      date: new Date().toLocaleDateString(),
      score: analysisData.driving_scores.overall_score,
      duration: formatDuration(analysisData.video_metadata.duration_seconds),
      ...analysisData
    };
    
    // Update state
    setAnalysisHistory(prev => [newAnalysis, ...prev]);
    setSelectedAnalysisId(newAnalysis.id);
    setAppState('results');
    
    // Save to backend
    await saveAnalysisToUser(userData.id, newAnalysis);
  };
  
  // Render appropriate component based on state
  return (
    <div className="min-h-screen bg-background">
      {appState === 'landing' && (
        <LandingPage 
          onLogin={handleLogin}
          onRegister={handleRegister}
        />
      )}
      
      {appState === 'upload' && (
        <UploadPage
          userData={userData}
          onVideoUpload={handleVideoUpload}
          onViewProfile={() => setAppState('profile')}
          onViewSettings={() => setAppState('settings')}
        />
      )}
      
      {appState === 'analyzing' && (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary" />
            <p className="mt-4">Analyzing video...</p>
          </div>
        </div>
      )}
      
      {appState === 'results' && (
        <AnalysisDashboard
          userData={userData}
          analysisHistory={analysisHistory}
          selectedAnalysisId={selectedAnalysisId}
          onAnalysisSelect={setSelectedAnalysisId}
          onBackToUpload={() => setAppState('upload')}
        />
      )}
      
      {appState === 'profile' && (
        <ProfilePage
          userData={userData}
          onBack={() => setAppState('upload')}
        />
      )}
      
      {appState === 'settings' && (
        <SettingsPage
          userData={userData}
          onBack={() => setAppState('upload')}
        />
      )}
    </div>
  );
}
```

---

### **2. LandingPage.tsx - Authentication**

**Purpose:** Login and registration interface

```typescript
interface LandingPageProps {
  onLogin: (email: string, password: string) => void;
  onRegister: (userData: RegisterData) => void;
}

export function LandingPage({ onLogin, onRegister }: LandingPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLogin) {
      onLogin(email, password);
    } else {
      onRegister({
        email,
        password,
        firstName,
        lastName,
        company,
        accountType
      });
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Logo />
          <CardTitle>{isLogin ? 'Welcome Back' : 'Create Account'}</CardTitle>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            
            <Button type="submit" className="w-full">
              {isLogin ? 'Sign In' : 'Sign Up'}
            </Button>
          </form>
          
          <Button
            variant="link"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? 'Need an account?' : 'Already have an account?'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

### **3. UploadPage.tsx - Video Upload**

**Purpose:** Drag-and-drop video upload interface

```typescript
export function UploadPage({ userData, onVideoUpload }: UploadPageProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    
    if (file && file.type === 'video/mp4') {
      if (file.size <= 500 * 1024 * 1024) {  // 500MB limit
        onVideoUpload(file);
      } else {
        toast.error('File too large. Maximum 500MB.');
      }
    } else {
      toast.error('Please upload MP4 files only');
    }
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onVideoUpload(file);
    }
  };
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Logo />
          <div className="flex gap-2">
            <Button variant="outline" onClick={onViewProfile}>
              <User className="h-4 w-4 mr-2" />
              Profile
            </Button>
            <Button variant="outline" onClick={onViewSettings}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </header>
      
      {/* Upload Area */}
      <div className="container mx-auto px-4 py-12">
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-12 text-center transition-colors",
            isDragging ? "border-primary bg-primary/5" : "border-gray-300"
          )}
          onDragOver={handleDragOver}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <Upload className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          
          <h2 className="text-2xl font-bold mb-2">
            Upload Dashcam Video
          </h2>
          
          <p className="text-gray-600 mb-6">
            Drag and drop your MP4 file here, or click to browse
          </p>
          
          <Button onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Select Video
          </Button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <p className="text-sm text-gray-500 mt-4">
            Maximum file size: 500MB • MP4 format only
          </p>
        </div>
        
        {/* Recent Analyses */}
        {analysisHistory.length > 0 && (
          <div className="mt-12">
            <h3 className="text-xl font-bold mb-4">Recent Analyses</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {analysisHistory.slice(0, 6).map((analysis) => (
                <Card key={analysis.id} className="cursor-pointer hover:shadow-lg transition">
                  <CardHeader>
                    <CardTitle className="text-sm">{analysis.fileName}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between">
                      <span className="text-2xl font-bold">{analysis.score}</span>
                      <span className="text-sm text-gray-500">{analysis.date}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

### **4. AnalysisDashboard.tsx - Main Results View**

**Purpose:** Display comprehensive analysis results

```typescript
export function AnalysisDashboard({
  userData,
  analysisHistory,
  selectedAnalysisId,
  onAnalysisSelect
}: AnalysisDashboardProps) {
  const selectedAnalysis = analysisHistory.find(a => a.id === selectedAnalysisId);
  
  if (!selectedAnalysis) {
    return <div>No analysis selected</div>;
  }
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onBackToUpload}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-bold">{selectedAnalysis.fileName}</h1>
              <p className="text-sm text-gray-500">{selectedAnalysis.date}</p>
            </div>
          </div>
          
          {/* Analysis Selector */}
          <Select value={selectedAnalysisId} onValueChange={onAnalysisSelect}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {analysisHistory.map((analysis) => (
                <SelectItem key={analysis.id} value={analysis.id}>
                  {analysis.fileName} - {analysis.score}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>
      
      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Overall Score */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-6xl font-bold text-primary mb-2">
                {selectedAnalysis.driving_scores.overall_score}
              </div>
              <div className="text-xl text-gray-600">
                {selectedAnalysis.driving_scores.category}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Performance Metrics */}
        <PerformanceMetrics analysisData={selectedAnalysis} />
        
        {/* AI-Generated Summary */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>AI-Generated Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <IntelligentSummary analysisData={selectedAnalysis} />
          </CardContent>
        </Card>
        
        {/* Video Player */}
        <VideoPlayer 
          videoFileName={selectedAnalysis.fileName}
          analysisData={selectedAnalysis}
        />
        
        {/* Charts */}
        <AnalysisCharts analysisData={selectedAnalysis} />
        
        {/* Export Options */}
        <div className="flex gap-4 mt-8">
          <Button onClick={() => exportToPDF(selectedAnalysis)}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" onClick={() => exportToCSV(selectedAnalysis)}>
            <FileText className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>
    </div>
  );
}
```

---

### **5. PerformanceMetrics.tsx - Metrics Cards**

**Purpose:** Display key performance indicators

```typescript
export function PerformanceMetrics({ analysisData }: PerformanceMetricsProps) {
  const metrics = [
    {
      title: 'Average Speed',
      value: Math.round(analysisData.average_speed_kmph),
      unit: 'km/h',
      icon: Gauge,
      status: analysisData.average_speed_kmph <= 80 ? 'good' : 'warning',
      change: 'Within limits'
    },
    {
      title: 'Close Encounters',
      value: analysisData.close_encounters.event_count,
      unit: 'events',
      icon: AlertTriangle,
      status: analysisData.close_encounters.event_count > 10 ? 'danger' : 
              analysisData.close_encounters.event_count > 5 ? 'warning' : 'good',
      change: analysisData.close_encounters.event_count > 10 ? 
              'Too close to vehicles' : 'Safe distance maintained'
    },
    {
      title: 'Traffic Violations',
      value: analysisData.traffic_signal_summary.violations.length,
      unit: 'violations',
      icon: Octagon,
      status: analysisData.traffic_signal_summary.violations.length > 0 ? 'danger' : 'good',
      change: analysisData.traffic_signal_summary.violations.length === 0 ? 
              'No violations' : `${analysisData.traffic_signal_summary.violations.length} violations`
    },
    {
      title: 'Lane Changes',
      value: analysisData.lane_change_count.turn_count,
      unit: 'changes',
      icon: Navigation,
      status: analysisData.lane_change_count.turn_count > 10 ? 'warning' : 'good',
      change: `${analysisData.lane_change_count.left} left, ${analysisData.lane_change_count.right} right`
    },
    {
      title: 'Bus Lane Violations',
      value: analysisData.illegal_way_bus_lane.violation_detected ? 1 : 0,
      unit: 'violations',
      icon: Bus,
      status: analysisData.illegal_way_bus_lane.violation_detected ? 'danger' : 'good',
      change: analysisData.illegal_way_bus_lane.violation_detected ? 
              'Bus lane entered' : 'No violations'
    },
    {
      title: 'Overall Violations',
      value: analysisData.safety_violation,
      unit: 'total',
      icon: Shield,
      status: analysisData.safety_violation > 3 ? 'danger' : 
              analysisData.safety_violation > 0 ? 'warning' : 'good',
      change: `${analysisData.safety_violation} safety concerns`
    }
  ];
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {metrics.map((metric) => (
        <Card key={metric.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {metric.title}
            </CardTitle>
            <metric.icon className={cn(
              "h-4 w-4",
              metric.status === 'good' && "text-green-600",
              metric.status === 'warning' && "text-yellow-600",
              metric.status === 'danger' && "text-red-600"
            )} />
          </CardHeader>
          
          <CardContent>
            <div className="text-3xl font-bold">
              {metric.value}
              <span className="text-sm font-normal text-gray-500 ml-2">
                {metric.unit}
              </span>
            </div>
            
            <p className={cn(
              "text-xs mt-2 font-medium px-2 py-1 rounded-full inline-block",
              metric.status === 'good' && "bg-green-100 text-green-800",
              metric.status === 'warning' && "bg-yellow-100 text-yellow-800",
              metric.status === 'danger' && "bg-red-100 text-red-800"
            )}>
              {metric.change}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

---

### **6. VideoPlayer.tsx - Interactive Video Player**

**Purpose:** Video playback with event markers and timeline

```typescript
interface VideoEvent {
  time: number;
  type: 'close_encounter' | 'traffic_violation' | 'bus_lane';
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export function VideoPlayer({ videoFileName, analysisData }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [filteredEventTypes, setFilteredEventTypes] = useState<string[]>([]);
  
  // Generate event markers from analysis data
  const events: VideoEvent[] = useMemo(() => {
    const markers: VideoEvent[] = [];
    
    // Close encounters
    analysisData.close_encounters.close_encounters.forEach((encounter) => {
      markers.push({
        time: encounter.start_time,
        type: 'close_encounter',
        severity: encounter.peak_score > 0.5 ? 'high' : 
                 encounter.peak_score > 0.3 ? 'medium' : 'low',
        description: `Close encounter ${encounter.where} - ${encounter.min_distance_m.toFixed(1)}m`
      });
    });
    
    // Traffic violations
    analysisData.traffic_signal_summary.violations.forEach((violation) => {
      markers.push({
        time: violation.start_time,
        type: 'traffic_violation',
        severity: 'high',
        description: 'Traffic signal violation'
      });
    });
    
    // Bus lane violations
    if (analysisData.illegal_way_bus_lane.violation_detected) {
      analysisData.illegal_way_bus_lane.violation_ranges.forEach((range) => {
        markers.push({
          time: range.start_time,
          type: 'bus_lane',
          severity: 'high',
          description: 'Bus lane violation'
        });
      });
    }
    
    return markers.sort((a, b) => a.time - b.time);
  }, [analysisData]);
  
  // Filter events
  const visibleEvents = events.filter(event => 
    !filteredEventTypes.includes(event.type)
  );
  
  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };
  
  const handleNextEvent = () => {
    const nextEvent = visibleEvents.find(e => e.time > currentTime);
    if (nextEvent) {
      handleSeek(nextEvent.time);
    }
  };
  
  const handlePreviousEvent = () => {
    const previousEvent = [...visibleEvents]
      .reverse()
      .find(e => e.time < currentTime - 1);
    if (previousEvent) {
      handleSeek(previousEvent.time);
    }
  };
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case ' ':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'ArrowLeft':
          handleSeek(Math.max(0, currentTime - 5));
          break;
        case 'ArrowRight':
          handleSeek(Math.min(duration, currentTime + 5));
          break;
        case 'n':
        case 'N':
          handleNextEvent();
          break;
        case 'p':
        case 'P':
          handlePreviousEvent();
          break;
        case 'm':
        case 'M':
          setVolume(volume => volume > 0 ? 0 : 1);
          break;
        case 'f':
        case 'F':
          videoRef.current?.requestFullscreen();
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentTime, duration, volume]);
  
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Video Analysis</CardTitle>
      </CardHeader>
      
      <CardContent>
        {/* Video Element */}
        <div className="relative bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            src={`/videos/${videoFileName}`}
            className="w-full"
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          />
          
          {/* Event Overlays */}
          {visibleEvents.map((event, index) => {
            const isActive = Math.abs(event.time - currentTime) < 1;
            return isActive && (
              <div
                key={index}
                className="absolute top-4 right-4 bg-red-600 text-white px-3 py-2 rounded-lg"
              >
                {event.description}
              </div>
            );
          })}
        </div>
        
        {/* Timeline with Event Markers */}
        <div className="relative mt-4">
          <input
            type="range"
            min={0}
            max={duration}
            value={currentTime}
            onChange={(e) => handleSeek(Number(e.target.value))}
            className="w-full"
          />
          
          {/* Event Markers */}
          <div className="relative h-2 mt-1">
            {visibleEvents.map((event, index) => (
              <div
                key={index}
                className={cn(
                  "absolute w-1 h-full cursor-pointer",
                  event.severity === 'high' && "bg-red-500",
                  event.severity === 'medium' && "bg-yellow-500",
                  event.severity === 'low' && "bg-blue-500"
                )}
                style={{ left: `${(event.time / duration) * 100}%` }}
                onClick={() => handleSeek(event.time)}
                title={event.description}
              />
            ))}
          </div>
        </div>
        
        {/* Controls */}
        <div className="flex items-center gap-4 mt-4">
          <Button size="sm" variant="outline" onClick={handlePlayPause}>
            {isPlaying ? <Pause /> : <Play />}
          </Button>
          
          <Button size="sm" variant="outline" onClick={handlePreviousEvent}>
            <SkipBack className="h-4 w-4" />
          </Button>
          
          <Button size="sm" variant="outline" onClick={handleNextEvent}>
            <SkipForward className="h-4 w-4" />
          </Button>
          
          <div className="flex-1">
            <span className="text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          
          {/* Playback Speed */}
          <Select value={playbackRate.toString()} onValueChange={(v) => {
            const rate = Number(v);
            setPlaybackRate(rate);
            if (videoRef.current) {
              videoRef.current.playbackRate = rate;
            }
          }}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0.5">0.5x</SelectItem>
              <SelectItem value="1">1x</SelectItem>
              <SelectItem value="1.5">1.5x</SelectItem>
              <SelectItem value="2">2x</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Volume */}
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4" />
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={volume}
              onChange={(e) => {
                const vol = Number(e.target.value);
                setVolume(vol);
                if (videoRef.current) {
                  videoRef.current.volume = vol;
                }
              }}
              className="w-20"
            />
          </div>
        </div>
        
        {/* Event Filter */}
        <div className="flex gap-2 mt-4">
          <Button
            size="sm"
            variant={filteredEventTypes.includes('close_encounter') ? 'outline' : 'default'}
            onClick={() => {
              setFilteredEventTypes(prev =>
                prev.includes('close_encounter')
                  ? prev.filter(t => t !== 'close_encounter')
                  : [...prev, 'close_encounter']
              );
            }}
          >
            Close Encounters
          </Button>
          
          <Button
            size="sm"
            variant={filteredEventTypes.includes('traffic_violation') ? 'outline' : 'default'}
            onClick={() => {
              setFilteredEventTypes(prev =>
                prev.includes('traffic_violation')
                  ? prev.filter(t => t !== 'traffic_violation')
                  : [...prev, 'traffic_violation']
              );
            }}
          >
            Traffic Violations
          </Button>
          
          <Button
            size="sm"
            variant={filteredEventTypes.includes('bus_lane') ? 'outline' : 'default'}
            onClick={() => {
              setFilteredEventTypes(prev =>
                prev.includes('bus_lane')
                  ? prev.filter(t => t !== 'bus_lane')
                  : [...prev, 'bus_lane']
              );
            }}
          >
            Bus Lane
          </Button>
        </div>
        
        {/* Event List */}
        <div className="mt-6 max-h-64 overflow-y-auto">
          <h4 className="font-semibold mb-2">Events ({visibleEvents.length})</h4>
          <div className="space-y-2">
            {visibleEvents.map((event, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                onClick={() => handleSeek(event.time)}
              >
                <div>
                  <div className="font-medium">{event.description}</div>
                  <div className="text-sm text-gray-500">
                    {formatTime(event.time)}
                  </div>
                </div>
                <div className={cn(
                  "px-2 py-1 rounded text-xs font-medium",
                  event.severity === 'high' && "bg-red-100 text-red-800",
                  event.severity === 'medium' && "bg-yellow-100 text-yellow-800",
                  event.severity === 'low' && "bg-blue-100 text-blue-800"
                )}>
                  {event.severity}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Keyboard Shortcuts Help */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
          <strong>Keyboard Shortcuts:</strong>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <span>Space: Play/Pause</span>
            <span>←/→: Skip 5s</span>
            <span>N: Next Event</span>
            <span>P: Previous Event</span>
            <span>M: Mute/Unmute</span>
            <span>F: Fullscreen</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

### **7. AnalysisCharts.tsx - Data Visualization**

**Purpose:** Display analysis data as charts

```typescript
import { LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function AnalysisCharts({ analysisData }: AnalysisChartsProps) {
  // Prepare data for charts
  const scoreData = [
    { name: 'Safety', value: analysisData.driving_scores.safety_score },
    { name: 'Compliance', value: analysisData.driving_scores.compliance_score },
    { name: 'Efficiency', value: analysisData.driving_scores.efficiency_score }
  ];
  
  const violationData = [
    { name: 'Traffic', value: analysisData.traffic_signal_summary.violations.length },
    { name: 'Bus Lane', value: analysisData.illegal_way_bus_lane.violation_detected ? 1 : 0 },
    { name: 'Close Encounters', value: analysisData.close_encounters.event_count }
  ];
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Score Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Score Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={scoreData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      {/* Safety Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Safety Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={violationData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                label
              />
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 🎨 Styling & Theming

### **Tailwind CSS Configuration**

```typescript
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        // ... more theme colors
      }
    }
  }
}
```

### **Dark Mode Implementation**

```typescript
// Toggle dark mode
const toggleDarkMode = () => {
  if (document.documentElement.classList.contains('dark')) {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  } else {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  }
};
```

---

## 🔐 State Management

### **User Authentication State**
```typescript
const [userData, setUserData] = useState<UserData | null>(() => {
  const saved = localStorage.getItem('userData');
  return saved ? JSON.parse(saved) : null;
});

useEffect(() => {
  if (userData) {
    localStorage.setItem('userData', JSON.stringify(userData));
  } else {
    localStorage.removeItem('userData');
  }
}, [userData]);
```

### **Analysis History State**
```typescript
const [analysisHistory, setAnalysisHistory] = useState<AnalysisData[]>([]);
const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null);

const selectedAnalysis = analysisHistory.find(a => a.id === selectedAnalysisId);
```

---

## 📱 Responsive Design

**Mobile-First Approach:**
```typescript
// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Content */}
</div>

// Responsive text
<h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">
  {title}
</h1>

// Mobile menu
<div className="block lg:hidden">
  {/* Mobile menu button */}
</div>
```

---

## 🚀 Performance Optimizations

1. **Code Splitting** - Vite automatic code splitting
2. **Lazy Loading** - React.lazy for route components
3. **Memoization** - useMemo for expensive calculations
4. **Debouncing** - Debounced search and filter inputs
5. **Image Optimization** - Lazy loading images

---

**This frontend architecture provides a modern, responsive, and user-friendly interface for driving behavior analysis.**
