import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipBack,
  SkipForward,
  Loader2,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { FileWithChunks } from "@shared/schema";

interface VideoPreviewProps {
  file: FileWithChunks;
  className?: string;
  autoPlay?: boolean;
  showControls?: boolean;
  onError?: (error: string) => void;
}

export function VideoPreview({
  file,
  className,
  autoPlay = false,
  showControls = true,
  onError
}: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControlsBar, setShowControlsBar] = useState(true);
  const [error, setError] = useState<string | null>(null);
interface BufferedRange {
  start: number;
  end: number;
}

  const [bufferedRanges, setBufferedRanges] = useState<BufferedRange[]>([]);

  // Hide controls after 3 seconds of inactivity
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControlsBar(true);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControlsBar(false);
      }, 3000);
    }
  }, [isPlaying]);

  const [isBuffering, setIsBuffering] = useState(false);

  // Initialize video with direct streaming URL
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let isMounted = true;

    const initializeVideo = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Use the streaming URL directly - let the browser handle range requests
        const streamingUrl = `/api/files/${file.id}/stream`;
        video.src = streamingUrl;

        // Wait for metadata to load
        await new Promise((resolve, reject) => {
          const onLoadedMetadata = () => {
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            resolve(void 0);
          };

          const onError = (e: Event) => {
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            reject(new Error('Failed to load video metadata'));
          };

          video.addEventListener('loadedmetadata', onLoadedMetadata);
          video.addEventListener('error', onError);
        });

        setDuration(video.duration);

      } catch (err) {
        if (!isMounted) return;
        const errorMessage = err instanceof Error ? err.message : 'Failed to load video';
        setError(errorMessage);
        onError?.(errorMessage);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeVideo();

    return () => {
      isMounted = false;
      if (video) {
        video.src = '';
      }
    };
  }, [file.id, onError]);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleProgress = () => {
      if (video.buffered.length > 0) {
        const ranges: BufferedRange[] = [];
        for (let i = 0; i < video.buffered.length; i++) {
          ranges.push({
            start: video.buffered.start(i),
            end: video.buffered.end(i)
          });
        }
        setBufferedRanges(ranges);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setShowControlsBar(true);
    };

    const handleError = () => {
      setError('Video playback error');
      setIsLoading(false);
      onError?.('Video playback error');
    };

    const handleWaiting = () => {
      setIsBuffering(true);
    };

    const handleCanPlay = () => {
      setIsBuffering(false);
    };

    const handleCanPlayThrough = () => {
      setIsBuffering(false);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('progress', handleProgress);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('canplaythrough', handleCanPlayThrough);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('progress', handleProgress);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('canplaythrough', handleCanPlayThrough);
    };
  }, [onError]);

  // Fullscreen handling
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (isPlaying) {
        video.pause();
        setIsPlaying(false);
      } else {
        await video.play();
        setIsPlaying(true);
      }
    } catch (err) {
      console.error('Playback error:', err);
    }
  };

  const handleSeek = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;

    const newTime = value[0];
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = value[0];
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isMuted) {
      video.volume = volume;
      setIsMuted(false);
    } else {
      video.volume = 0;
      setIsMuted(true);
    }
  };

  const skipTime = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = Math.max(0, Math.min(duration, video.currentTime + seconds));
  };

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;

    try {
      if (!document.fullscreenElement) {
        await container.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className={cn("flex items-center justify-center h-64 bg-muted rounded-lg", className)}>
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn("relative bg-black rounded-lg overflow-hidden group", className)}
      onMouseMove={resetControlsTimeout}
      onMouseLeave={() => setShowControlsBar(false)}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        preload="metadata"
        playsInline
        onClick={togglePlay}
      />

      {/* Loading Overlay */}
      {(isLoading || isBuffering) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-white mx-auto mb-2" />
            <p className="text-white text-sm">
              {isBuffering ? 'Buffering...' : 'Loading video...'}
            </p>
          </div>
        </div>
      )}

      {/* Play Button Overlay */}
      {!isPlaying && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Button
            variant="secondary"
            size="lg"
            className="rounded-full w-16 h-16 bg-black/50 hover:bg-black/70 border-0"
            onClick={togglePlay}
          >
            <Play className="h-8 w-8 text-white ml-1" />
          </Button>
        </div>
      )}

      {/* Controls */}
      {showControls && showControlsBar && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          {/* Progress Bar */}
          <div className="mb-4">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              className="w-full"
              onValueChange={handleSeek}
            />
            {/* Buffered ranges indicator */}
            <div className="relative mt-1 h-1 bg-white/20 rounded">
              {bufferedRanges.map((range, index) => (
                <div
                  key={index}
                  className="absolute top-0 h-full bg-white/40 rounded"
                  style={{
                    left: `${(range.start / duration) * 100}%`,
                    width: `${((range.end - range.start) / duration) * 100}%`
                  }}
                />
              ))}
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={togglePlay}>
                {isPlaying ? (
                  <Pause className="h-4 w-4 text-white" />
                ) : (
                  <Play className="h-4 w-4 text-white" />
                )}
              </Button>

              <Button variant="ghost" size="sm" onClick={() => skipTime(-10)}>
                <SkipBack className="h-4 w-4 text-white" />
              </Button>

              <Button variant="ghost" size="sm" onClick={() => skipTime(10)}>
                <SkipForward className="h-4 w-4 text-white" />
              </Button>

              <div className="flex items-center gap-2 ml-4">
                <Button variant="ghost" size="sm" onClick={toggleMute}>
                  {isMuted ? (
                    <VolumeX className="h-4 w-4 text-white" />
                  ) : (
                    <Volume2 className="h-4 w-4 text-white" />
                  )}
                </Button>

                <div className="w-20">
                  <Slider
                    value={[isMuted ? 0 : volume]}
                    max={1}
                    step={0.1}
                    className="w-full"
                    onValueChange={handleVolumeChange}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-white text-sm">
              <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
              <Button variant="ghost" size="sm" onClick={toggleFullscreen}>
                {isFullscreen ? (
                  <Minimize className="h-4 w-4 text-white" />
                ) : (
                  <Maximize className="h-4 w-4 text-white" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}