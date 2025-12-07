import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Trash2, 
  Play, 
  File, 
  Clock,
  AlertTriangle
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface PartialUpload {
  id: string;
  forumId: string;
  userId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  checksum: string;
  totalChunks: number;
  uploadedChunks: number[];
  createdAt: string;
  updatedAt: string;
}

interface PartialUploadsManagerProps {
  forumId: string;
  onResumeUpload?: (partialUpload: PartialUpload) => void;
}

export function PartialUploadsManager({ forumId, onResumeUpload }: PartialUploadsManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: partialUploads, isLoading } = useQuery<PartialUpload[]>({
    queryKey: ["/api/partial-uploads"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/partial-uploads/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partial-uploads"] });
      toast({
        title: "Partial upload deleted",
        description: "The partial upload has been removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to delete partial upload.",
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString() + " " + 
           new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Filter partial uploads for this forum
  const forumPartialUploads = partialUploads?.filter(pu => pu.forumId === forumId) || [];

  if (isLoading) {
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Partial Uploads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (forumPartialUploads.length === 0) {
    return null;
  }

  return (
    <Card className="mb-4 border-orange-200">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2 text-orange-800">
          <AlertTriangle className="h-4 w-4" />
          Partial Uploads ({forumPartialUploads.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {forumPartialUploads.map((upload) => {
          const progress = (upload.uploadedChunks.length / upload.totalChunks) * 100;
          
          return (
            <div key={upload.id} className="border border-orange-200 rounded-lg p-3 bg-orange-50">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <File className="h-4 w-4 text-orange-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-orange-900 truncate">
                      {upload.fileName}
                    </p>
                    <p className="text-xs text-orange-700">
                      {formatBytes(upload.fileSize)} • {Math.round(progress)}% uploaded
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">
                  {Math.round(progress)}%
                </Badge>
              </div>

              <Progress value={progress} className="h-2 mb-2" />

              <div className="flex items-center justify-between text-xs text-orange-600">
                <span>Started {formatDate(upload.createdAt)}</span>
                <span>Last updated {formatDate(upload.updatedAt)}</span>
              </div>

              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 border-orange-300 text-orange-700 hover:bg-orange-100"
                  onClick={() => onResumeUpload?.(upload)}
                >
                  <Play className="h-3 w-3 mr-1" />
                  Resume
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-300 text-red-700 hover:bg-red-50"
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Partial Upload</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this partial upload? 
                        All uploaded data will be permanently removed and cannot be recovered.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteMutation.mutate(upload.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}