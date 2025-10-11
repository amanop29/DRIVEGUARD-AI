import React, { useRef, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize2, AlertTriangle, AlertCircle, Info, Zap, Filter, Keyboard } from 'lucide-react';
import { VideoAnalysisData } from '../utils/analysisData';

interface EventMarker {
  time: number;
  type: 'close_encounter' | 'traffic_violation' | 'bus_lane' | 'lane_change' | 'turn';
  label: string;
  severity: 'critical' | 'warning' | 'info';
  description?: string;
}

interface VideoPlayerProps {
  videoFilename: string;
  analysisData?: VideoAnalysisData | null;
}

export function VideoPlayer({ videoFilename, analysisData }: VideoPlayerProps) {
  // Debug: Log when component mounts or props change
  useEffect(() => {
    console.log('🎬 VideoPlayer mounted/updated:', {
      videoFilename,
      hasAnalysisData: !!analysisData,
      analysisData: analysisData ? {
        filename: analysisData.video_filename,
        hasMetadata: !!analysisData.video_metadata,
        duration: analysisData.video_metadata?.duration_seconds,
      } : null
    });
  }, [videoFilename, analysisData]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<EventMarker | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [hoveredMarker, setHoveredMarker] = useState<EventMarker | null>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [filterTypes, setFilterTypes] = useState<Set<string>>(new Set());
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [activeEvent, setActiveEvent] = useState<EventMarker | null>(null);

  // Generate event markers from analysis data
  const eventMarkers: EventMarker[] = React.useMemo(() => {
    if (!analysisData) {
      console.log('❌ No analysis data provided to VideoPlayer');
      return [];
    }
    
    console.log('📊 Processing analysis data:', {
      filename: analysisData.video_filename,
      hasCloseEncounters: !!analysisData.close_encounters?.close_encounters,
      closeEncountersCount: analysisData.close_encounters?.close_encounters?.length || 0,
      hasTrafficViolations: !!analysisData.traffic_signal_summary?.traffic_violation_windows,
      trafficViolationsCount: analysisData.traffic_signal_summary?.traffic_violation_windows?.length || 0,
      hasBusLaneViolations: !!analysisData.illegal_way_bus_lane?.violation_ranges,
      busLaneViolationsCount: analysisData.illegal_way_bus_lane?.violation_ranges?.length || 0,
    });
    
    const markers: EventMarker[] = [];
    
    // Get video duration from metadata (fallback to 30s if not available)
    const videoDuration = analysisData.video_metadata?.duration_seconds || 30;
    const fps = analysisData.video_metadata?.fps || 25;
    
    console.log('🎥 Video metadata:', { videoDuration, fps });
    
    // Helper function to fix incorrect timestamps (convert frame numbers to seconds if needed)
    const fixTimestamp = (time: number): number => {
      // If timestamp is way beyond video duration, it's likely a frame number
      if (time > videoDuration * 1.5) {
        const fixedTime = time / fps;
        console.log(`⚙️ Fixed timestamp: ${time} (frames) → ${fixedTime.toFixed(2)}s`);
        return fixedTime;
      }
      // Clamp to video duration
      return Math.min(time, videoDuration);
    };
    
    // Add close encounters
    analysisData.close_encounters?.close_encounters?.forEach((encounter, idx) => {
      const eventTime = fixTimestamp(encounter.peak_time || 0);
      console.log(`🚗 Close Encounter ${idx + 1}:`, {
        originalTime: encounter.peak_time,
        fixedTime: eventTime,
        where: encounter.where,
        score: encounter.peak_score
      });
      markers.push({
        time: eventTime,
        type: 'close_encounter',
        label: `Close Encounter ${idx + 1}`,
        severity: 'warning',
        description: `Vehicle proximity detected at ${encounter.where || 'unknown location'}. Peak expansion score: ${encounter.peak_score?.toFixed(2) || 'N/A'}`,
      });
    });
    
    // Add traffic violations (filter out hardcoded false positives)
    analysisData.traffic_signal_summary?.traffic_violation_windows?.forEach((violation, idx) => {
      // Skip the hardcoded false positive at 75.4-77.8 seconds
      // This is a known bug in the Python analysis that adds this to ALL videos
      if (violation.start_time === 75.4 && violation.end_time === 77.8) {
        console.warn('⚠️ Skipping hardcoded false positive traffic violation at 75.4-77.8s');
        return;
      }
      
      const startTime = fixTimestamp(violation.start_time || 0);
      const endTime = fixTimestamp(violation.end_time || 0);
      console.log(`🚦 Traffic Violation ${idx + 1}:`, {
        originalStart: violation.start_time,
        originalEnd: violation.end_time,
        fixedStart: startTime,
        fixedEnd: endTime,
        duration: (endTime - startTime).toFixed(1)
      });
      markers.push({
        time: startTime,
        type: 'traffic_violation',
        label: `Traffic Violation ${idx + 1}`,
        severity: 'critical',
        description: `Traffic signal violation detected. Duration: ${(endTime - startTime).toFixed(1)}s`,
      });
    });
    
    // Add bus lane violations
    analysisData.illegal_way_bus_lane?.violation_ranges?.forEach((range, idx) => {
      const startTime = fixTimestamp(range.start_time || 0);
      const endTime = fixTimestamp(range.end_time || 0);
      console.log(`🚌 Bus Lane Violation ${idx + 1}:`, {
        originalStart: range.start_time,
        originalEnd: range.end_time,
        fixedStart: startTime,
        fixedEnd: endTime
      });
      markers.push({
        time: startTime,
        type: 'bus_lane',
        label: `Bus Lane Violation ${idx + 1}`,
        severity: 'critical',
        description: `Bus lane violation detected. Duration: ${(endTime - startTime).toFixed(1)}s`,
      });
    });
    
    // Filter out any markers beyond video duration and sort by time
    const filteredMarkers = markers
      .filter(marker => {
        const isValid = marker.time >= 0 && marker.time <= videoDuration;
        if (!isValid) {
          console.warn(`⚠️ Filtering out marker "${marker.label}" at ${marker.time.toFixed(2)}s (video duration: ${videoDuration}s)`);
        }
        return isValid;
      })
      .sort((a, b) => a.time - b.time);
      
    console.log(`✅ Generated ${filteredMarkers.length} event markers:`, filteredMarkers.map(m => ({
      type: m.type,
      time: m.time.toFixed(2),
      label: m.label
    })));
    
    return filteredMarkers;
  }, [analysisData]);

  // Check if currently in an event
  useEffect(() => {
    const currentEvent = eventMarkers.find(marker => 
      Math.abs(marker.time - currentTime) < 2
    );
    setActiveEvent(currentEvent || null);
  }, [currentTime, eventMarkers]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skipTime(e.shiftKey ? -5 : -10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          skipTime(e.shiftKey ? 5 : 10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          changeVolume(0.1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          changeVolume(-0.1);
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'n':
          e.preventDefault();
          jumpToNextEvent();
          break;
        case 'p':
          e.preventDefault();
          jumpToPreviousEvent();
          break;
        case '0':
        case '1':
        case '2':
          e.preventDefault();
          const rates = [0.5, 1, 1.5, 2];
          const index = parseInt(e.key);
          if (rates[index]) {
            changePlaybackRate(rates[index]);
          }
          break;
        case '?':
          e.preventDefault();
          setShowKeyboardShortcuts(!showKeyboardShortcuts);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, currentTime, eventMarkers, showKeyboardShortcuts]);

  // Update current time and check for events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (time: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = time;
    setCurrentTime(time);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const bounds = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const percentage = x / bounds.width;
    const time = percentage * duration;
    handleSeek(time);
  };

  const handleProgressHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const bounds = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const percentage = x / bounds.width;
    const time = percentage * duration;
    setHoverTime(time);
  };

  const jumpToMarker = (marker: EventMarker) => {
    handleSeek(marker.time);
    setSelectedMarker(marker);
    if (!isPlaying && videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const jumpToNextEvent = () => {
    const nextEvent = eventMarkers.find(marker => marker.time > currentTime + 0.5);
    if (nextEvent) {
      jumpToMarker(nextEvent);
    }
  };

  const jumpToPreviousEvent = () => {
    const previousEvents = eventMarkers.filter(marker => marker.time < currentTime - 0.5);
    if (previousEvents.length > 0) {
      jumpToMarker(previousEvents[previousEvents.length - 1]);
    }
  };

  const skipTime = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    const newTime = Math.max(0, Math.min(video.currentTime + seconds, duration));
    handleSeek(newTime);
  };

  const changeVolume = (delta: number) => {
    const video = videoRef.current;
    if (!video) return;
    const newVolume = Math.max(0, Math.min(1, volume + delta));
    video.volume = newVolume;
    setVolume(newVolume);
    if (newVolume > 0 && isMuted) {
      video.muted = false;
      setIsMuted(false);
    }
  };

  const changePlaybackRate = (rate: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;
    
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      video.requestFullscreen();
    }
  };

  const toggleFilter = (type: string) => {
    const newFilters = new Set(filterTypes);
    if (newFilters.has(type)) {
      newFilters.delete(type);
    } else {
      newFilters.add(type);
    }
    setFilterTypes(newFilters);
  };

  const filteredMarkers = filterTypes.size === 0 
    ? eventMarkers 
    : eventMarkers.filter(marker => filterTypes.has(marker.type));

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getMarkerIcon = (type: EventMarker['type']) => {
    switch (type) {
      case 'close_encounter':
        return <AlertTriangle className="h-3 w-3" />;
      case 'traffic_violation':
      case 'bus_lane':
        return <AlertCircle className="h-3 w-3" />;
      default:
        return <Info className="h-3 w-3" />;
    }
  };

  const getMarkerColor = (severity: EventMarker['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500 hover:bg-red-600';
      case 'warning':
        return 'bg-orange-500 hover:bg-orange-600';
      case 'info':
        return 'bg-blue-500 hover:bg-blue-600';
    }
  };

  const getMarkerBadgeVariant = (severity: EventMarker['severity']) => {
    switch (severity) {
      case 'critical':
        return 'destructive' as const;
      case 'warning':
        return 'secondary' as const;
      case 'info':
        return 'default' as const;
    }
  };

  return (
    <Card className="relative overflow-hidden backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border border-white/20 dark:border-gray-800/20 shadow-lg">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm" />
      <div className="relative z-10">
        <CardHeader>
          <CardTitle className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span>Video Playback with Event Markers</span>
              {activeEvent && (
                <Badge variant="destructive" className="animate-pulse">
                  <Zap className="h-3 w-3 mr-1" />
                  {activeEvent.label}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowKeyboardShortcuts(!showKeyboardShortcuts)}
                title="Keyboard shortcuts"
              >
                <Keyboard className="h-4 w-4" />
              </Button>
              <Badge variant="outline">
                {filteredMarkers.length} Events
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Keyboard Shortcuts Panel */}
          {showKeyboardShortcuts && (
            <Card className="bg-muted/50 border-2 border-blue-500/50 mb-3">
              <CardContent className="pt-3 pb-3">
                <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm">
                  <Keyboard className="h-4 w-4" />
                  Keyboard Shortcuts
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div><kbd className="px-2 py-1 bg-background rounded text-xs">Space</kbd> Play/Pause</div>
                  <div><kbd className="px-2 py-1 bg-background rounded text-xs">←/→</kbd> Skip 10s</div>
                  <div><kbd className="px-2 py-1 bg-background rounded text-xs">↑/↓</kbd> Volume</div>
                  <div><kbd className="px-2 py-1 bg-background rounded text-xs">M</kbd> Mute</div>
                  <div><kbd className="px-2 py-1 bg-background rounded text-xs">F</kbd> Fullscreen</div>
                  <div><kbd className="px-2 py-1 bg-background rounded text-xs">N</kbd> Next Event</div>
                  <div><kbd className="px-2 py-1 bg-background rounded text-xs">P</kbd> Previous Event</div>
                  <div><kbd className="px-2 py-1 bg-background rounded text-xs">0-2</kbd> Speed</div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Enhanced Controls Bar */}
          <div className="flex items-center justify-between gap-3 p-3 bg-muted/30 rounded-lg flex-wrap">
            {/* Playback Speed */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Speed:</span>
              {[0.5, 1, 1.5, 2].map(rate => (
                <Button
                  key={rate}
                  variant={playbackRate === rate ? "default" : "outline"}
                  size="sm"
                  onClick={() => changePlaybackRate(rate)}
                  className="text-xs px-3 h-8"
                >
                  {rate}x
                </Button>
              ))}
            </div>

            {/* Debug Info Panel */}
            {!analysisData && (
              <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <span className="text-xs text-yellow-700 dark:text-yellow-300">
                  ⚠️ No analysis data loaded. Events timeline unavailable. Check browser console for details.
                </span>
              </div>
            )}
            
            {analysisData && eventMarkers.length === 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                <Info className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-xs text-green-700 dark:text-green-300">
                  ✅ Analysis loaded: No safety events detected in this video.
                </span>
              </div>
            )}
            
            {analysisData && eventMarkers.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                <AlertTriangle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs text-blue-700 dark:text-blue-300">
                  📊 {eventMarkers.length} safety event(s) detected. Duration: {analysisData.video_metadata?.duration_seconds?.toFixed(1)}s
                </span>
              </div>
            )}

            {/* Event Type Filters */}
            {eventMarkers.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Filter className="h-3 w-3" />
                  Filter:
                </span>
                {['close_encounter', 'traffic_violation', 'bus_lane'].map(type => (
                  <Button
                    key={type}
                    variant={filterTypes.has(type) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleFilter(type)}
                    className="text-xs capitalize h-8 px-3"
                  >
                    {type.replace('_', ' ')}
                  </Button>
                ))}
              </div>
            )}
          </div>
          {/* Video Player */}
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            <video
              ref={videoRef}
              className="w-full h-full"
              src={`http://localhost:3001/videos/${videoFilename}`}
              preload="metadata"
            >
              Your browser does not support video playback.
            </video>
            
            {/* Play overlay when paused */}
            {!isPlaying && (
              <div 
                className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
                onClick={togglePlay}
              >
                <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center hover:scale-110 transition-transform">
                  <Play className="h-10 w-10 text-gray-900 ml-1" />
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Progress Bar with Event Markers and Hover Preview */}
          <div className="space-y-2">
            <div 
              ref={progressBarRef}
              className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full cursor-pointer group"
              onClick={handleProgressClick}
              onMouseMove={handleProgressHover}
              onMouseLeave={() => setHoverTime(null)}
            >
              {/* Progress */}
              <div 
                className="absolute h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
              
              {/* Hover preview indicator */}
              {hoverTime !== null && (
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-2 h-6 bg-yellow-400/50 rounded transition-all"
                  style={{ left: `${(hoverTime / duration) * 100}%` }}
                />
              )}
              
              {/* Event markers on timeline - only show filtered */}
              {filteredMarkers.map((marker, idx) => (
                <div
                  key={idx}
                  className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full ${getMarkerColor(marker.severity)} cursor-pointer transform hover:scale-[2] transition-all z-10 shadow-lg`}
                  style={{ left: `${(marker.time / duration) * 100}%` }}
                  onClick={(e) => {
                    e.stopPropagation();
                    jumpToMarker(marker);
                  }}
                  onMouseEnter={() => setHoveredMarker(marker)}
                  onMouseLeave={() => setHoveredMarker(null)}
                  title={`${marker.label} at ${formatTime(marker.time)}`}
                >
                  {/* Pulse animation for nearby events */}
                  {Math.abs(marker.time - currentTime) < 3 && (
                    <div className={`absolute inset-0 rounded-full ${getMarkerColor(marker.severity)} animate-ping opacity-75`} />
                  )}
                </div>
              ))}
              
              {/* Current position indicator */}
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full shadow-lg z-20"
                style={{ left: `${(currentTime / duration) * 100}%` }}
              />

              {/* Hover tooltip */}
              {hoveredMarker && (
                <div 
                  className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl z-30 whitespace-nowrap"
                  style={{ left: `${(hoveredMarker.time / duration) * 100}%` }}
                >
                  <div className="font-semibold">{hoveredMarker.label}</div>
                  <div className="text-gray-300">{formatTime(hoveredMarker.time)}</div>
                  {hoveredMarker.description && (
                    <div className="text-gray-400 text-xs mt-1 max-w-xs">{hoveredMarker.description}</div>
                  )}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
                </div>
              )}

              {/* Hover time preview */}
              {hoverTime !== null && !hoveredMarker && (
                <div 
                  className="absolute bottom-full mb-2 bg-gray-900 text-white text-xs rounded px-2 py-1 shadow-xl z-30"
                  style={{ left: `${(hoverTime / duration) * 100}%`, transform: 'translateX(-50%)' }}
                >
                  {formatTime(hoverTime)}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
                </div>
              )}
            </div>
            
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground font-mono">{formatTime(currentTime)}</span>
              <span className="text-muted-foreground font-mono">{formatTime(duration)}</span>
            </div>

            {/* Mini timeline overview */}
            <div className="relative h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              {filteredMarkers.map((marker, idx) => (
                <div
                  key={idx}
                  className={`absolute h-full ${marker.severity === 'critical' ? 'bg-red-500' : marker.severity === 'warning' ? 'bg-orange-500' : 'bg-blue-500'}`}
                  style={{ 
                    width: '2px',
                    left: `${(marker.time / duration) * 100}%`
                  }}
                />
              ))}
            </div>
          </div>

          {/* Enhanced Control Buttons */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={jumpToPreviousEvent}
                title="Previous Event (P)"
                disabled={!eventMarkers.some(m => m.time < currentTime - 0.5)}
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => skipTime(-10)}
                title="Rewind 10s (←)"
              >
                <span className="text-xs">-10s</span>
              </Button>
              
              <Button
                variant="default"
                size="lg"
                onClick={togglePlay}
                className="px-6"
                title="Play/Pause (Space)"
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => skipTime(10)}
                title="Forward 10s (→)"
              >
                <span className="text-xs">+10s</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={jumpToNextEvent}
                title="Next Event (N)"
                disabled={!eventMarkers.some(m => m.time > currentTime + 0.5)}
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Volume Control */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMute}
                  title="Mute (M)"
                >
                  {isMuted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => changeVolume(parseFloat(e.target.value) - volume)}
                  className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  title="Volume (↑/↓)"
                />
                <span className="text-xs text-muted-foreground w-8">{Math.round(volume * 100)}%</span>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                title="Fullscreen (F)"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Enhanced Event Markers List */}
          {filteredMarkers.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Safety Events Timeline
                  <Badge variant="secondary" className="ml-2">
                    {filteredMarkers.length} / {eventMarkers.length}
                  </Badge>
                </h4>
                <div className="flex items-center gap-2">
                  {filteredMarkers.length > 3 && (
                    <span className="text-xs text-muted-foreground animate-bounce">
                      ↓ Scroll to see all
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilterTypes(new Set())}
                    className="text-xs"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar border border-gray-200 dark:border-gray-700 rounded-lg p-2 bg-gray-50/50 dark:bg-gray-900/50">
                {filteredMarkers.map((marker, idx) => {
                  const isActive = Math.abs(marker.time - currentTime) < 2;
                  const isPast = marker.time < currentTime;
                  
                  return (
                    <div
                      key={idx}
                      className={`group flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer transform hover:scale-[1.02] ${
                        selectedMarker === marker
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 shadow-lg'
                          : isActive
                          ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500 shadow-md animate-pulse'
                          : isPast
                          ? 'bg-muted/30 hover:bg-muted/50 border-border opacity-60'
                          : 'bg-muted/50 hover:bg-muted border-border'
                      }`}
                      onClick={() => jumpToMarker(marker)}
                    >
                      <Badge 
                        variant={getMarkerBadgeVariant(marker.severity)} 
                        className={`mt-0.5 transition-transform ${isActive ? 'scale-110' : ''}`}
                      >
                        {getMarkerIcon(marker.type)}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium truncate flex items-center gap-2">
                            {marker.label}
                            {isActive && <Zap className="h-3 w-3 text-yellow-500 animate-bounce" />}
                            {isPast && <span className="text-xs text-green-500">✓</span>}
                          </p>
                          <span className="text-xs text-muted-foreground whitespace-nowrap font-mono">
                            {formatTime(marker.time)}
                          </span>
                        </div>
                        {marker.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {marker.description}
                          </p>
                        )}
                        {/* Progress indicator for this event */}
                        <div className="mt-2 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all ${
                              isPast ? 'bg-green-500' : isActive ? 'bg-yellow-500' : 'bg-gray-300'
                            }`}
                            style={{ 
                              width: isPast ? '100%' : isActive ? '50%' : '0%' 
                            }}
                          />
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                        Click to jump
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : eventMarkers.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 mb-2">
                <span className="text-2xl">✅</span>
              </div>
              <p className="text-sm font-medium">No safety events detected in this video</p>
              <p className="text-xs mt-1">Great driving! All metrics within normal parameters.</p>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 mb-2">
                <Filter className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-sm font-medium">No events match the current filters</p>
              <p className="text-xs mt-1">{eventMarkers.length} event(s) hidden by filters</p>
              <Button
                variant="link"
                size="sm"
                onClick={() => setFilterTypes(new Set())}
                className="mt-2"
              >
                Clear all filters
              </Button>
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  );
}
