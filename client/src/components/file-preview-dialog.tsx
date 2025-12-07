import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X, FileText, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Document, Page, pdfjs } from "react-pdf";
import type { FileWithChunks } from "@shared/schema";
import { VideoPreview } from "@/components/video-preview";

// Configure PDF.js worker with version-matched CDN
const configurePDFWorker = () => {
  try {
    // Use CDN that serves the exact version we have installed (5.4.296)
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.296/build/pdf.worker.mjs`;
    console.log("PDF.js worker configured with version-matched CDN");
  } catch (error) {
    console.warn("PDF.js worker configuration failed:", error);
    // Fallback: disable worker
    try {
      pdfjs.GlobalWorkerOptions.workerSrc = '';
      console.log("PDF.js worker disabled as fallback");
    } catch (fallbackError) {
      console.warn("Could not disable PDF worker:", fallbackError);
    }
  }
};

configurePDFWorker();

interface FilePreviewDialogProps {
  file: FileWithChunks | null;
  open: boolean;
  onClose: () => void;
  onDownload: (fileId: string) => void;
}

export function FilePreviewDialog({ file, open, onClose, onDownload }: FilePreviewDialogProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);

  useEffect(() => {
    if (!file || !open) {
      setPreviewUrl(null);
      setError(null);
      setNumPages(null);
      setPageNumber(1);
      return;
    }

    const mimeType = file.mimeType || "";

    if (mimeType.startsWith("image/")) {
      setLoading(true);
      setError(null);
      
      fetch(`/api/files/${file.id}/download`)
        .then(response => {
          if (!response.ok) throw new Error("Failed to load preview");
          return response.blob();
        })
        .then(blob => {
          const url = URL.createObjectURL(blob);
          setPreviewUrl(url);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message);
          setLoading(false);
        });
    } else if (mimeType === "application/pdf") {
      // For PDFs, we'll use react-pdf which handles the download internally
      setPreviewUrl(`/api/files/${file.id}/download`);
      setLoading(false);
      setError(null);
    } else if (mimeType.startsWith("video/")) {
      // For videos, create a blob URL directly
      setLoading(true);
      setError(null);
      
      fetch(`/api/files/${file.id}/download`)
        .then(response => {
          if (!response.ok) throw new Error("Failed to load preview");
          return response.blob();
        })
        .then(blob => {
          const url = URL.createObjectURL(blob);
          setPreviewUrl(url);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message);
          setLoading(false);
        });
    }

    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [file, open]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

    const onDocumentLoadError = (error: Error) => {
    console.error("PDF load error:", error);
    // Provide specific error messages based on the error type
    if (error.message.includes('worker') || error.message.includes('CORS') || error.message.includes('fetch') || error.message.includes('404')) {
      setError("PDF preview requires web worker support which is currently unavailable. Please download the file to view it.");
    } else if (error.message.includes('InvalidPDFException') || error.message.includes('corrupt')) {
      setError("The PDF file appears to be corrupted or invalid. Please try downloading it.");
    } else {
      setError("Failed to load PDF preview. The file may be too large or corrupted. Please download to view.");
    }
  };

  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(prev + 1, numPages || 1));
  };

  if (!file) return null;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const mimeType = file.mimeType || "";
  const isImage = mimeType.startsWith("image/");
  const isPDF = mimeType === "application/pdf";
  const isText = mimeType.startsWith("text/") || 
                 mimeType.includes("json") || 
                 mimeType.includes("xml") ||
                 mimeType.includes("javascript");
  const isVideo = mimeType.startsWith("video/");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="truncate pr-4">{file.fileName}</DialogTitle>
          <DialogDescription>
            File preview and download options
          </DialogDescription>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{formatFileSize(file.fileSize)}</span>
              <span>•</span>
              <span>Uploaded by {file.user.username}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDownload(file.id)}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden rounded-lg border bg-muted/30 flex items-center justify-center relative">
          {loading ? (
            <div className="space-y-4 p-8 w-full">
              <Skeleton className="h-96 w-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ) : error ? (
            <div className="text-center p-8">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button variant="outline" onClick={() => onDownload(file.id)}>
                <Download className="h-4 w-4 mr-2" />
                Download File
              </Button>
            </div>
          ) : isImage && previewUrl ? (
            <div className="w-full h-full p-4 overflow-auto">
              <img
                src={previewUrl}
                alt={file.fileName}
                className="max-w-full h-auto mx-auto rounded-lg shadow-lg"
              />
            </div>
          ) : isPDF && previewUrl ? (
            <div className="w-full h-full flex flex-col">
              <div className="flex-1 overflow-auto p-4">
                <Document
                  file={previewUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  loading={
                    <div className="flex items-center justify-center h-full">
                      <Skeleton className="h-96 w-80" />
                    </div>
                  }
                  error={
                    <div className="text-center p-8">
                      <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground mb-4">Failed to load PDF</p>
                      <Button variant="outline" onClick={() => onDownload(file.id)}>
                        <Download className="h-4 w-4 mr-2" />
                        Download File
                      </Button>
                    </div>
                  }
                >
                  <Page
                    pageNumber={pageNumber}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    className="shadow-lg"
                  />
                </Document>
              </div>
              {numPages && numPages > 1 && (
                <div className="flex items-center justify-center gap-4 p-4 border-t bg-background">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPrevPage}
                    disabled={pageNumber <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {pageNumber} of {numPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextPage}
                    disabled={pageNumber >= numPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ) : isText ? (
            <div className="text-center p-8">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">Text File Preview</p>
              <p className="text-sm text-muted-foreground mb-4">
                Download to view the contents of this file
              </p>
              <Button onClick={() => onDownload(file.id)}>
                <Download className="h-4 w-4 mr-2" />
                Download to View
              </Button>
            </div>
          ) : isVideo ? (
            <div className="w-full h-full">
              <VideoPreview
                file={file}
                className="w-full h-full"
                onError={(errorMsg) => setError(errorMsg)}
              />
            </div>
          ) : (
            <div className="text-center p-8">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">Preview Not Available</p>
              <p className="text-sm text-muted-foreground mb-4">
                This file type doesn't support preview. Download to view.
              </p>
              <Button onClick={() => onDownload(file.id)}>
                <Download className="h-4 w-4 mr-2" />
                Download File
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
