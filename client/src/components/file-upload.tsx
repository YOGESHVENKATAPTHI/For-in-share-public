import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, File, X, Check, Play, RotateCcw } from "lucide-react";

interface FileUploadProps {
  forumId: string;
  onUploadComplete?: () => void;
  uploadProgress?: {
    fileId: string;
    progress: number;
    status: string;
    error?: string;
  } | null;
  onUploadProgressChange?: (progress: {
    fileId: string;
    progress: number;
    status: string;
    error?: string;
  } | null) => void;
}

interface PartialUpload {
  id: string;
  fileName: string;
  fileSize: number;
  uploadedChunks: number;
  totalChunks: number;
  progress: number;
}

export function FileUpload({ forumId, onUploadComplete, uploadProgress, onUploadProgressChange }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [httpUploadProgress, setHttpUploadProgress] = useState(0);
  const [uploadedBytes, setUploadedBytes] = useState(0);
  const [partialUpload, setPartialUpload] = useState<PartialUpload | null>(null);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [fileChecksum, setFileChecksum] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Clear upload progress when upload completes or fails
  useEffect(() => {
    if (uploadProgress?.status === 'completed' || uploadProgress?.status === 'error') {
      const timer = setTimeout(() => {
        onUploadProgressChange?.(null);
      }, 3000); // Clear after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [uploadProgress, onUploadProgressChange]);

  // Calculate file checksum when file is selected
  useEffect(() => {
    if (selectedFile) {
      calculateChecksum(selectedFile);
    } else {
      setFileChecksum(null);
      setPartialUpload(null);
      setShowResumeDialog(false);
    }
  }, [selectedFile]);

  const calculateChecksum = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    setFileChecksum(hashHex);
    return hashHex;
  };

  const checkPartialUploadMutation = useMutation({
    mutationFn: async (checksum: string) => {
      const formData = new FormData();
      formData.append("file", new Blob([]), "dummy"); // Empty file to trigger multer
      formData.append("forumId", forumId);
      formData.append("checksum", checksum);

      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });

      if (response.status === 200) {
        const data = await response.json();
        if (data.resumeRequired) {
          setPartialUpload(data.partialUpload);
          setShowResumeDialog(true);
          throw new Error("RESUME_REQUIRED");
        }
      }
      return response;
    },
    onError: (error: Error) => {
      if (error.message !== "RESUME_REQUIRED") {
        toast({
          title: "Error",
          description: "Failed to check for existing uploads",
          variant: "destructive",
        });
      }
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ file, checksum, resumeUploadId }: { file: File; checksum: string; resumeUploadId?: string }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("forumId", forumId);
      formData.append("checksum", checksum);
      if (resumeUploadId) {
        formData.append("resumeUploadId", resumeUploadId);
      }

      // Create XMLHttpRequest for progress tracking
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            setHttpUploadProgress(percentComplete);
            setUploadedBytes(e.loaded);
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener("error", () => {
          reject(new Error("Upload failed"));
        });

        xhr.open("POST", "/api/files/upload");
        xhr.send(formData);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forums", forumId, "files"] });
      queryClient.invalidateQueries({ queryKey: ["/api/partial-uploads"] });
      toast({
        title: "File uploaded",
        description: "Your file has been uploaded successfully.",
      });
      setSelectedFile(null);
      setHttpUploadProgress(0);
      setUploadedBytes(0);
      setPartialUpload(null);
      setShowResumeDialog(false);
      onUploadComplete?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
      setHttpUploadProgress(0);
      setUploadedBytes(0);
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size limit (10MB maximum)
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "File too large",
          description: `File size (${(file.size / (1024 * 1024)).toFixed(2)}MB) exceeds the maximum limit of 10MB`,
          variant: "destructive",
        });
        // Clear the input
        e.target.value = '';
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !fileChecksum) return;

    // Check for existing partial upload first
    try {
      await checkPartialUploadMutation.mutateAsync(fileChecksum);
      // If no partial upload found, proceed with upload
      uploadMutation.mutate({ file: selectedFile, checksum: fileChecksum });
    } catch (error) {
      // If RESUME_REQUIRED error, the dialog will show
      // Otherwise, proceed with upload
      if ((error as Error).message !== "RESUME_REQUIRED") {
        uploadMutation.mutate({ file: selectedFile, checksum: fileChecksum });
      }
    }
  };

  const handleResumeUpload = () => {
    if (selectedFile && fileChecksum && partialUpload) {
      uploadMutation.mutate({ 
        file: selectedFile, 
        checksum: fileChecksum, 
        resumeUploadId: partialUpload.id 
      });
      setShowResumeDialog(false);
    }
  };

  const handleCancelResume = () => {
    setShowResumeDialog(false);
    setPartialUpload(null);
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setHttpUploadProgress(0);
    setUploadedBytes(0);
    setPartialUpload(null);
    setShowResumeDialog(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <Card className="border-card-border">
      <CardContent className="p-3">
        {!selectedFile ? (
          <div className="flex flex-col items-center justify-center py-4 border-2 border-dashed border-border rounded-lg hover:border-primary/50 transition-colors">
            <Upload className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm font-medium mb-2">Upload a file</p>
            <p className="text-xs text-muted-foreground mb-4">Click to select a file (max 10MB)</p>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              id="file-input"
              data-testid="input-file"
            />
            <label htmlFor="file-input">
              <Button variant="outline" size="sm" asChild>
                <span>Choose File</span>
              </Button>
            </label>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <File className="h-10 w-10 text-primary shrink-0 mt-1" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(selectedFile.size)}
                </p>
              </div>
              {!uploadMutation.isPending && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCancel}
                  className="shrink-0"
                  data-testid="button-cancel-upload"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {showResumeDialog && partialUpload && (
              <div className="p-4 border border-orange-200 rounded-lg bg-orange-50">
                <p className="text-sm font-medium text-orange-800 mb-2">
                  Partial upload found for this file
                </p>
                <p className="text-xs text-orange-700 mb-3">
                  {Math.round(partialUpload.progress)}% uploaded
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={handleResumeUpload}
                    size="sm"
                    className="flex-1"
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Resume Upload
                  </Button>
                  <Button
                    onClick={handleCancelResume}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Start Over
                  </Button>
                </div>
              </div>
            )}

            {uploadMutation.isPending && (
              <div className="space-y-2">
                <Progress 
                  value={uploadProgress?.progress || httpUploadProgress} 
                  className="h-2" 
                />
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>
                    {uploadProgress ? (
                      uploadProgress.status === 'completed' ? 'Upload complete!' :
                      uploadProgress.status === 'error' ? `Upload failed` :
                      uploadProgress.status === 'resuming' ? 'Resuming upload...' :
                      'Uploading...'
                    ) : (
                      `${formatBytes(uploadedBytes)} / ${formatBytes(selectedFile.size)}`
                    )}
                  </span>
                  <span>{Math.round(uploadProgress?.progress || httpUploadProgress)}%</span>
                </div>
                {uploadProgress && uploadProgress.status !== 'completed' && uploadProgress.status !== 'error' && (
                  <div className="text-xs text-muted-foreground text-center">
                    {uploadProgress.status === 'resuming' ? 'Resuming from previous upload...' : 'Uploading file...'}
                  </div>
                )}
              </div>
            )}

            {uploadMutation.isSuccess && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Check className="h-4 w-4" />
                <span>Upload complete!</span>
              </div>
            )}

            {!uploadMutation.isPending && !uploadMutation.isSuccess && !showResumeDialog && (
              <div className="flex gap-2">
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  size="sm"
                  className="flex-1"
                  data-testid="button-upload"
                  disabled={checkPartialUploadMutation.isPending}
                >
                  {checkPartialUploadMutation.isPending ? "Checking..." : "Upload"}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
