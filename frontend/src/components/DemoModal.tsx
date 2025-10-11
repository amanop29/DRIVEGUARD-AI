import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { 
  Play, 
  Upload, 
  CheckCircle, 
  AlertTriangle, 
  Shield, 
  BarChart3, 
  Car, 
  Clock,
  X,
  ChevronRight,
  Eye,
  TrendingUp,
  TrendingDown,
  MapPin
} from 'lucide-react';

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type DemoStep = 'upload' | 'analyzing' | 'results' | 'insights';

export function DemoModal({ isOpen, onClose }: DemoModalProps) {
  const [currentStep, setCurrentStep] = useState<DemoStep>('upload');
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  const demoSteps = [
    { id: 'upload', title: 'Upload Video', icon: Upload },
    { id: 'analyzing', title: 'AI Analysis', icon: BarChart3 },
    { id: 'results', title: 'Results', icon: CheckCircle },
    { id: 'insights', title: 'Insights', icon: Eye }
  ];

  // Reset demo state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('upload');
      setAnalysisProgress(0);
      setIsAutoPlaying(false);
    }
  }, [isOpen]);

  // Auto-play functionality
  useEffect(() => {
    if (isAutoPlaying && currentStep === 'analyzing') {
      const interval = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev >= 100) {
            setCurrentStep('results');
            setIsAutoPlaying(false);
            return 100;
          }
          return prev + 2;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [isAutoPlaying, currentStep]);

  const startDemo = () => {
    setCurrentStep('analyzing');
    setIsAutoPlaying(true);
    setAnalysisProgress(0);
  };

  const nextStep = () => {
    const currentIndex = demoSteps.findIndex(step => step.id === currentStep);
    if (currentIndex < demoSteps.length - 1) {
      setCurrentStep(demoSteps[currentIndex + 1].id as DemoStep);
    }
  };

  const prevStep = () => {
    const currentIndex = demoSteps.findIndex(step => step.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(demoSteps[currentIndex - 1].id as DemoStep);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'upload':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Upload className="h-10 w-10 text-primary" />
              </div>
              <h3>Upload Your Driving Video</h3>
              <p className="text-muted-foreground">
                Simply drag and drop your driving footage or browse to select a video file.
              </p>
            </div>
            
            <Card className="border-dashed border-2 border-primary/20 bg-primary/5">
              <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
                <Car className="h-12 w-12 text-primary/60" />
                <div className="text-center space-y-2">
                  <p className="font-medium">demo_driving_video.mp4</p>
                  <p className="text-sm text-muted-foreground">15.2 MB • 3:45 duration</p>
                  <Badge variant="secondary" className="gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Ready to analyze
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-medium">Supported Formats</h4>
                <ul className="text-muted-foreground space-y-1">
                  <li>• MP4, AVI, MOV</li>
                  <li>• Max size: 500MB</li>
                  <li>• Min duration: 30s</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Best Results</h4>
                <ul className="text-muted-foreground space-y-1">
                  <li>• Dashboard cam view</li>
                  <li>• Clear road visibility</li>
                  <li>• Good lighting</li>
                </ul>
              </div>
            </div>

            <Button onClick={startDemo} className="w-full gap-2">
              <Play className="h-4 w-4" />
              Start Analysis
            </Button>
          </div>
        );

      case 'analyzing':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              </div>
              <h3>AI Analysis in Progress</h3>
              <p className="text-muted-foreground">
                Our advanced AI is analyzing your driving patterns and behavior
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Overall Progress</span>
                  <span>{analysisProgress}%</span>
                </div>
                <Progress value={analysisProgress} className="h-2" />
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Speed Analysis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Lane Detection</span>
                  </div>
                  <div className={`flex items-center gap-2 ${analysisProgress > 50 ? 'text-foreground' : 'text-muted-foreground'}`}>
                    <div className={`h-4 w-4 rounded-full border-2 ${analysisProgress > 50 ? 'bg-green-500 border-green-500' : 'border-muted-foreground'}`}>
                      {analysisProgress > 50 && <CheckCircle className="h-4 w-4 text-white" />}
                    </div>
                    <span>Braking Patterns</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className={`flex items-center gap-2 ${analysisProgress > 70 ? 'text-foreground' : 'text-muted-foreground'}`}>
                    <div className={`h-4 w-4 rounded-full border-2 ${analysisProgress > 70 ? 'bg-green-500 border-green-500' : 'border-muted-foreground'}`}>
                      {analysisProgress > 70 && <CheckCircle className="h-4 w-4 text-white" />}
                    </div>
                    <span>Turn Analysis</span>
                  </div>
                  <div className={`flex items-center gap-2 ${analysisProgress > 85 ? 'text-foreground' : 'text-muted-foreground'}`}>
                    <div className={`h-4 w-4 rounded-full border-2 ${analysisProgress > 85 ? 'bg-green-500 border-green-500' : 'border-muted-foreground'}`}>
                      {analysisProgress > 85 && <CheckCircle className="h-4 w-4 text-white" />}
                    </div>
                    <span>Risk Assessment</span>
                  </div>
                  <div className={`flex items-center gap-2 ${analysisProgress >= 100 ? 'text-foreground' : 'text-muted-foreground'}`}>
                    <div className={`h-4 w-4 rounded-full border-2 ${analysisProgress >= 100 ? 'bg-green-500 border-green-500' : 'border-muted-foreground'}`}>
                      {analysisProgress >= 100 && <CheckCircle className="h-4 w-4 text-white" />}
                    </div>
                    <span>Report Generation</span>
                  </div>
                </div>
              </div>
            </div>

            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-primary mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-medium text-sm">Advanced AI Processing</p>
                    <p className="text-xs text-muted-foreground">
                      Using computer vision and machine learning to analyze over 50 driving parameters
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'results':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>
              <h3>Analysis Complete</h3>
              <p className="text-muted-foreground">
                Your driving analysis is ready with detailed insights and scoring
              </p>
            </div>

            <Card className="border-green-200 dark:border-green-800">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Driving Score</CardTitle>
                <div className="text-4xl font-bold text-green-600 dark:text-green-400">87/100</div>
                <Badge variant="secondary" className="w-fit mx-auto">Good Driver</Badge>
              </CardHeader>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Speed Control</p>
                      <p className="font-medium">Excellent</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">92</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Braking</p>
                      <p className="font-medium">Good</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">85</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Lane Keeping</p>
                      <p className="font-medium">Needs Work</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-orange-600">78</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Turn Safety</p>
                      <p className="font-medium">Excellent</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">94</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">Trip Details</p>
                    <p className="text-xs text-muted-foreground">
                      Duration: 3:45 • Distance: 12.3 miles • Avg Speed: 35 mph
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button onClick={nextStep} className="w-full gap-2">
              View Detailed Insights
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        );

      case 'insights':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto">
                <Eye className="h-10 w-10 text-blue-600 dark:text-blue-400" />
              </div>
              <h3>Detailed Insights</h3>
              <p className="text-muted-foreground">
                Actionable recommendations to improve your driving
              </p>
            </div>

            <div className="space-y-4">
              <Card className="border-green-200 dark:border-green-800">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-medium text-sm text-green-700 dark:text-green-300">Strengths</p>
                      <p className="text-sm text-muted-foreground">
                        Excellent speed control and smooth acceleration. Maintains safe following distance.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-orange-200 dark:border-orange-800">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-medium text-sm text-orange-700 dark:text-orange-300">Areas to Improve</p>
                      <p className="text-sm text-muted-foreground">
                        Lane positioning could be more consistent. Consider using lane assist features.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-blue-200 dark:border-blue-800">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-medium text-sm text-blue-700 dark:text-blue-300">Risk Events</p>
                      <p className="text-sm text-muted-foreground">
                        2 minor events detected: Sharp turn at 0:45, Hard brake at 2:30
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-4">
                <div className="text-center space-y-3">
                  <Shield className="h-8 w-8 text-primary mx-auto" />
                  <div>
                    <p className="font-medium">Insurance Impact</p>
                    <p className="text-sm text-muted-foreground">
                      Your score qualifies for up to 15% premium reduction
                    </p>
                  </div>
                  <Badge variant="secondary" className="gap-1">
                    <TrendingDown className="h-3 w-3" />
                    Potential savings: $200/year
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Ready to get started with DRIVEGUARD AI?
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Close Demo
                </Button>
                <Button onClick={onClose} className="flex-1">
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[90vw] max-h-[75vh] overflow-y-auto">
        <DialogHeader className="px-6 pb-4">
          <DialogTitle className="text-lg sm:text-xl">DRIVEGUARD AI Demo</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Experience an interactive demonstration of how DRIVEGUARD AI analyzes driving videos.
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-4 px-6">
          {demoSteps.map((step, index) => {
            const isActive = step.id === currentStep;
            const isCompleted = demoSteps.findIndex(s => s.id === currentStep) > index;
            const IconComponent = step.icon;
            
            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className={`flex flex-col sm:flex-row items-center gap-2 ${isActive ? 'text-primary' : isCompleted ? 'text-green-600' : 'text-muted-foreground'}`}>
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                    isActive ? 'border-primary bg-primary/10' : 
                    isCompleted ? 'border-green-600 bg-green-100 dark:bg-green-900/20' : 
                    'border-muted-foreground/30'
                  }`}>
                    <IconComponent className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-medium text-center sm:text-left">{step.title}</span>
                </div>
                {index < demoSteps.length - 1 && (
                  <div className={`hidden sm:block w-full h-0.5 mx-4 ${isCompleted ? 'bg-green-600' : 'bg-muted-foreground/30'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="min-h-[300px] px-6 py-4">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        {currentStep !== 'upload' && currentStep !== 'analyzing' && currentStep !== 'insights' && (
          <div className="flex justify-between mt-4 px-6 pb-4">
            <Button variant="outline" onClick={prevStep} size="sm">
              Previous
            </Button>
            <Button onClick={nextStep} size="sm">
              Next
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}