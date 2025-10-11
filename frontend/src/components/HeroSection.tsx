import React, { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { DemoModal } from './DemoModal';
import { CheckCircle, Play, Camera } from 'lucide-react';

interface HeroSectionProps {
  onGetStarted: () => void;
}

export function HeroSection({ onGetStarted }: HeroSectionProps) {
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  return (
    <section className="relative py-20 px-4">
      <div className="max-w-7xl mx-auto text-center space-y-8">
        <Badge variant="secondary" className="text-sm">
          AI-Powered Driver Analysis Platform
        </Badge>
        
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-red-600 via-red-400 to-red-800 bg-clip-text text-transparent">
            DRIVEGUARD AI
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl text-[24px] italic font-bold font-normal mx-[275px] mx-[280px] my-[0px]">
            AI-powered driver behavior analysis for insurance, fleets, and individual drivers
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button size="lg" onClick={onGetStarted} className="gap-2">
            <Play className="h-5 w-5" />
            Try Free Analysis
          </Button>
          <Button variant="outline" size="lg" className="gap-2" onClick={() => setIsDemoOpen(true)}>
            <Camera className="h-5 w-5" />
            Watch Demo
          </Button>
        </div>
        
        <div className="flex justify-center items-center space-x-8 text-sm text-muted-foreground">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>No Setup Required</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Instant Results</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Enterprise Ready</span>
          </div>
        </div>
      </div>

      <DemoModal 
        isOpen={isDemoOpen} 
        onClose={() => setIsDemoOpen(false)} 
      />
    </section>
  );
}