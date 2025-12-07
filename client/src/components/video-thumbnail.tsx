import { useState, useEffect, useRef } from "react";
import { Play, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FileWithChunks } from "@shared/schema";

interface VideoThumbnailProps {
  file: FileWithChunks;
  className?: string;
  size?: "sm" | "md" | "lg";
  showPlayButton?: boolean;
  onClick?: () => void;
}

export function VideoThumbnail({
  file,
  className,
  size = "md",
  showPlayButton = true,
  onClick
}: VideoThumbnailProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-32 h-24",
    lg: "w-48 h-32"
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const generateThumbnail = async () => {
      try {
        setIsLoading(true);
        setError(false);

        // Load a small chunk of the video for thumbnail generation
        const response = await fetch(`/api/files/${file.id}/stream`, {
          headers: {
            'Range': 'bytes=0-524287' // Load first 512KB
          }
        });

        if (!response.ok) {
          throw new Error('Failed to load video chunk');
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        video.src = url;

        // Wait for video to load metadata
        await new Promise((resolve, reject) => {
          const onLoadedMetadata = () => {
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            resolve(void 0);
          };

          const onError = () => {
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            reject(new Error('Video load error'));
          };

          video.addEventListener('loadedmetadata', onLoadedMetadata);
          video.addEventListener('error', onError);
        });

        // Seek to 10% of the video for a representative thumbnail
        video.currentTime = video.duration * 0.1;

        // Wait for seek to complete and capture thumbnail
        await new Promise((resolve) => {
          const onSeeked = () => {
            video.removeEventListener('seeked', onSeeked);

            // Create canvas and draw video frame
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (ctx) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;

              // Draw the current frame
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

              // Convert to blob
              canvas.toBlob((blob) => {
                if (blob) {
                  const thumbnailUrl = URL.createObjectURL(blob);
                  setThumbnailUrl(thumbnailUrl);
                }
                resolve(void 0);
              }, 'image/jpeg', 0.8);
            } else {
              resolve(void 0);
            }
          };

          video.addEventListener('seeked', onSeeked);
        });

        // Clean up
        URL.revokeObjectURL(url);

      } catch (err) {
        console.warn('Thumbnail generation failed:', err);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };

    generateThumbnail();

    return () => {
      if (thumbnailUrl) {
        URL.revokeObjectURL(thumbnailUrl);
      }
    };
  }, [file.id]);

  return (
    <div
      className={cn(
        "relative bg-muted rounded-lg overflow-hidden flex items-center justify-center cursor-pointer group",
        sizeClasses[size],
        className
      )}
      onClick={onClick}
    >
      {/* Hidden video element for thumbnail generation */}
      <video
        ref={videoRef}
        className="hidden"
        preload="metadata"
        muted
        playsInline
      />

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="flex items-center justify-center bg-muted">
          <div className="w-8 h-8 bg-muted-foreground/20 rounded flex items-center justify-center">
            <Play className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      )}

      {/* Thumbnail */}
      {thumbnailUrl && !isLoading && !error && (
        <>
          <img
            src={thumbnailUrl}
            alt={`${file.fileName} thumbnail`}
            className="w-full h-full object-cover"
          />

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          {/* Play button */}
          {showPlayButton && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-8 h-8 bg-black/60 rounded-full flex items-center justify-center">
                <Play className="h-4 w-4 text-white ml-0.5" />
              </div>
            </div>
          )}

          {/* Duration badge */}
          <div className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-1 py-0.5 rounded">
            Video
          </div>
        </>
      )}

      {/* Fallback for no thumbnail */}
      {!thumbnailUrl && !isLoading && !error && (
        <div className="flex items-center justify-center bg-muted">
          <Play className="h-6 w-6 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}