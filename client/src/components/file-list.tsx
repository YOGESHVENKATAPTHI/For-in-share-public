import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import type { FileWithChunks } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { File, Download, Trash2, FileText, User, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { VideoThumbnail } from "@/components/video-thumbnail";

interface FileListProps {
  files: FileWithChunks[];
  isLoading: boolean;
  forumId: string;
  onPreview?: (file: FileWithChunks) => void;
}

export function FileList({ files, isLoading, forumId, onPreview }: FileListProps) {
  const { toast } = useToast();
  const [downloadingFiles, setDownloadingFiles] = useState<Record<string, {
    progress: number;
    bytesDownloaded: number;
    totalBytes: number;
    speed: number;
    startTime: number;
    eta: number;
  }>>({});

  const downloadMutation = useMutation({
    mutationFn: async (fileId: string) => {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const file = files.find((f) => f.id === fileId);
        const totalBytes = file?.fileSize || 0;
        const startTime = Date.now();
        let lastBytesDownloaded = 0;
        let lastTime = startTime;

        xhr.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const bytesDownloaded = e.loaded;
            const percentComplete = (bytesDownloaded / totalBytes) * 100;
            const currentTime = Date.now();
            const timeElapsed = (currentTime - lastTime) / 1000; // seconds

            // Calculate speed (bytes per second)
            const bytesDelta = bytesDownloaded - lastBytesDownloaded;
            const speed = timeElapsed > 0 ? bytesDelta / timeElapsed : 0;

            // Calculate ETA (estimated time of arrival)
            const remainingBytes = totalBytes - bytesDownloaded;
            const eta = speed > 0 ? remainingBytes / speed : 0;

            setDownloadingFiles((prev) => ({
              ...prev,
              [fileId]: {
                progress: percentComplete,
                bytesDownloaded,
                totalBytes,
                speed,
                startTime,
                eta,
              },
            }));

            lastBytesDownloaded = bytesDownloaded;
            lastTime = currentTime;
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const blob = xhr.response;
            const url = window.URL.createObjectURL(blob);
            
            const a = document.createElement("a");
            a.href = url;
            a.download = file?.fileName || "download";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            setDownloadingFiles((prev) => {
              const { [fileId]: _, ...rest } = prev;
              return rest;
            });

            resolve(null);
          } else {
            reject(new Error(`Download failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener("error", () => {
          reject(new Error("Download failed"));
        });

        xhr.responseType = "blob";
        xhr.open("GET", `/api/files/${fileId}/download`);
        xhr.send();
      });
    },
    onError: (error: Error, fileId: string) => {
      toast({
        title: "Download failed",
        description: error.message,
        variant: "destructive",
      });
      setDownloadingFiles((prev) => {
        const { [fileId]: _, ...rest } = prev;
        return rest;
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (fileId: string) => {
      await apiRequest("DELETE", `/api/files/${fileId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forums", forumId, "files"] });
      toast({
        title: "File deleted",
        description: "File has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatSpeed = (bytesPerSecond: number) => {
    if (bytesPerSecond === 0) return "0 B/s";
    const k = 1024;
    const sizes = ["B/s", "KB/s", "MB/s", "GB/s"];
    const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k));
    return Math.round((bytesPerSecond / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatTime = (seconds: number) => {
    if (seconds === 0 || !isFinite(seconds)) return "--";
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-md shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-9 w-9 rounded-md" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FileText className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No files yet</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Upload files to share them with forum members
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {files.map((file) => {
        const downloadInfo = downloadingFiles[file.id];
        const isDownloading = !!downloadInfo;

        return (
          <Card key={file.id} className="border-zinc-800 bg-zinc-900 rounded-none hover:bg-zinc-800 transition-colors" data-testid={`file-${file.id}`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {file.mimeType?.startsWith("video/") ? (
                  <VideoThumbnail
                    file={file}
                    size="md"
                    className="shrink-0 cursor-pointer"
                    onClick={() => onPreview?.(file)}
                  />
                ) : (
                  <div className="p-2 rounded-none bg-zinc-800 shrink-0">
                    <File className="h-6 w-6 text-zinc-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate mb-1 text-zinc-100">{file.fileName}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400">
                    <span>{formatBytes(file.fileSize)}</span>
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {file.user.username}
                    </span>
                    <span>{formatDistanceToNow(new Date(file.uploadedAt), { addSuffix: true })}</span>
                  </div>

                  {isDownloading && (
                    <div className="mt-3 space-y-2">
                      <Progress value={downloadInfo.progress} className="h-2 bg-zinc-800" />
                      <div className="flex justify-between items-center text-xs text-zinc-400">
                        <span>
                          {formatBytes(downloadInfo.bytesDownloaded)} / {formatBytes(downloadInfo.totalBytes)}
                        </span>
                        <span>{Math.round(downloadInfo.progress)}%</span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-zinc-400">
                        <span>Speed: {formatSpeed(downloadInfo.speed)}</span>
                        <span>ETA: {formatTime(downloadInfo.eta)}</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  {onPreview && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onPreview(file)}
                      data-testid={`button-preview-${file.id}`}
                      className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => downloadMutation.mutate(file.id)}
                    disabled={isDownloading || downloadMutation.isPending}
                    data-testid={`button-download-${file.id}`}
                    className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(file.id)}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-${file.id}`}
                    className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
