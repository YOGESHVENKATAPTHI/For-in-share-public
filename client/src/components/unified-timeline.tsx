import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import type { MessageWithUser, FileWithChunks } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useEntityTagManager } from "@/hooks/use-tags";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { FilePreviewDialog } from "@/components/file-preview-dialog";
import { CommentsSection } from "@/components/comments-section";
import { TagInput } from "@/components/tag-input";
import { 
  File, Download, Copy, Check, Eye,
  FileText, Image as ImageIcon, FileVideo, 
  FileArchive, User, Tag as TagIcon, Edit3,
  Share2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type TimelineItem = {
  type: "message" | "file";
  date: Date;
  data: MessageWithUser | FileWithChunks;
};

interface UnifiedTimelineProps {
  messages: MessageWithUser[];
  files: FileWithChunks[];
  forumId: string;
  scrollToMessage?: string | null;
  scrollToFile?: string | null;
}

// Separate component for timeline items to properly handle hooks
function TimelineItem({ 
  item, 
  index, 
  copiedId, 
  setCopiedId, 
  downloadingFiles, 
  setDownloadingFiles, 
  previewFile, 
  setPreviewFile, 
  setPreviewOpen, 
  editingTags, 
  setEditingTags,
  downloadMutation,
  handleCopyMessage,
  handleShareItem,
  getInitials,
  getFileIcon,
  formatFileSize,
  renderMessageContent,
  handlePreview,
  forumId
}: {
  item: TimelineItem;
  index: number;
  copiedId: string | null;
  setCopiedId: (id: string | null) => void;
  downloadingFiles: Record<string, number>;
  setDownloadingFiles: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  previewFile: FileWithChunks | null;
  setPreviewFile: (file: FileWithChunks | null) => void;
  setPreviewOpen: (open: boolean) => void;
  editingTags: string | null;
  setEditingTags: (id: string | null) => void;
  downloadMutation: any;
  handleCopyMessage: (content: string, id: string) => void;
  handleShareItem: (type: 'message' | 'file', id: string) => void;
  getInitials: (username: string) => string;
  getFileIcon: (mimeType?: string | null) => JSX.Element;
  formatFileSize: (bytes: number) => string;
  renderMessageContent: (content: string) => JSX.Element;
  handlePreview: (file: FileWithChunks) => void;
  forumId: string;
}) {
  if (item.type === "message") {
    const message = item.data as MessageWithUser;
    const isCopied = copiedId === message.id;

    return (
      <div key={`msg-${message.id}`} id={`message-${message.id}`} className="flex gap-3 group">
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarFallback className="bg-primary text-primary-foreground">
            {getInitials(message.user.username)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-semibold text-sm">
              {message.user.username}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
            </span>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-none px-3 py-2 inline-flex items-start gap-2 group/message hover:bg-zinc-800 transition-colors">
            <div className="text-sm break-words flex-1 text-zinc-100">
              {renderMessageContent(message.content)}
            </div>
            <div className="flex gap-1 flex-shrink-0 mt-0.5">
              <Button
                variant="ghost"
                size="sm"
                className="opacity-70 sm:opacity-0 sm:group-hover/message:opacity-100 transition-opacity h-6 w-6 p-0 text-zinc-400 hover:text-zinc-100"
                onClick={() => handleCopyMessage(message.content, message.id)}
                title="Copy message"
              >
                {isCopied ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="opacity-70 sm:opacity-0 sm:group-hover/message:opacity-100 transition-opacity h-6 w-6 p-0 text-zinc-400 hover:text-zinc-100"
                onClick={() => handleShareItem('message', message.id)}
                title="Share message"
              >
                <Share2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          {/* Tags section */}
          <MessageTagsSection
            messageId={message.id}
            editingTags={editingTags}
            setEditingTags={setEditingTags}
          />
          
          <CommentsSection
            entityType="message"
            entityId={message.id}
            forumId={forumId}
          />
        </div>
      </div>
    );
  } else {
    const file = item.data as FileWithChunks;
    const isDownloading = file.id in downloadingFiles;
    const downloadProgress = downloadingFiles[file.id] || 0;
    const canPreview = file.mimeType?.startsWith("image/") || 
                     file.mimeType === "application/pdf" || 
                     file.mimeType?.startsWith("video/");

    return (
      <div key={`file-${file.id}`} id={`file-${file.id}`} className="flex gap-3">
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarFallback className="bg-primary text-primary-foreground">
            {getInitials(file.user.username)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-semibold text-sm">
              {file.user.username}
            </span>
            <span className="text-xs text-muted-foreground">
              uploaded {formatDistanceToNow(new Date(file.uploadedAt), { addSuffix: true })}
            </span>
          </div>
          <Card 
            className={`overflow-hidden transition-shadow rounded-none bg-zinc-900 border-zinc-800 ${canPreview ? 'cursor-pointer hover:bg-zinc-800' : ''}`}
            onClick={() => canPreview && handlePreview(file)}
          >
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 text-zinc-400">
                  {getFileIcon(file.mimeType)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate text-zinc-100" title={file.fileName}>
                    {file.fileName}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <span>{formatFileSize(file.fileSize)}</span>
                    {canPreview && (
                      <>
                        <span>•</span>
                        
                      </>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {canPreview && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-zinc-400 hover:text-zinc-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreview(file);
                      }}
                    >
                      <Eye className="h-4 w-4 md:mr-1" />
                      <span className="hidden md:inline">Preview</span>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-zinc-700 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800"
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadMutation.mutate(file.id);
                    }}
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <span className="text-xs">{Math.round(downloadProgress)}%</span>
                    ) : (
                      <>
                        <Download className="h-4 w-4 md:mr-1" />
                        <span className="hidden md:inline">Download</span>
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-zinc-400 hover:text-zinc-100"
                    onClick={(e) => {
                      handleShareItem('file', file.id);
                    }}
                    title="Share file"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {isDownloading && (
                <Progress value={downloadProgress} className="mt-2 h-1 bg-zinc-800" />
              )}
            </CardContent>
          </Card>
          
          {/* Tags section */}
          <FileTagsSection
            fileId={file.id}
            editingTags={editingTags}
            setEditingTags={setEditingTags}
          />
          
          <CommentsSection
            entityType="file"
            entityId={file.id}
            forumId={forumId}
          />
        </div>
      </div>
    );
  }
}

import { useIsMobile } from "@/hooks/use-mobile";
import type { Tag } from "@shared/schema";

function TagList({ tags }: { tags: Tag[] }) {
  const isMobile = useIsMobile();
  const limit = isMobile ? 1 : 3;
  const displayTags = tags.slice(0, limit);
  const remaining = tags.length - limit;

  return (
    <div className="flex flex-wrap gap-1">
      {displayTags.map((tag) => (
        <Badge
          key={tag.id}
          variant="outline"
          className="text-xs"
          style={{ borderColor: tag.color || "#6b7280", color: tag.color || "#6b7280" }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full mr-1"
            style={{ backgroundColor: tag.color || "#6b7280" }}
          />
          {tag.name}
        </Badge>
      ))}
      {remaining > 0 && (
        <Badge variant="outline" className="text-xs text-muted-foreground">
          +{remaining}...
        </Badge>
      )}
    </div>
  );
}

// Separate component for message tags to handle hooks properly
function MessageTagsSection({ 
  messageId, 
  editingTags, 
  setEditingTags 
}: { 
  messageId: string; 
  editingTags: string | null; 
  setEditingTags: (id: string | null) => void; 
}) {
  const {
    selectedTags,
    availableTags,
    handleTagsChange,
    handleCreateTag,
    isUpdating,
  } = useEntityTagManager('message', messageId);

  return (
    <div className="flex items-center gap-2 mt-1">
      {editingTags === `message-${messageId}` ? (
        <div className="mt-2 p-2 border rounded-lg bg-muted/50 w-full">
          <TagInput
            selectedTags={selectedTags}
            onTagsChange={handleTagsChange}
            availableTags={availableTags}
            onCreateTag={handleCreateTag}
            placeholder="Add tags..."
            maxTags={10}
          />
          <div className="flex justify-end mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingTags(null)}
              disabled={isUpdating}
            >
              Done
            </Button>
          </div>
        </div>
      ) : (
        <>
          {selectedTags.length > 0 && <TagList tags={selectedTags} />}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => setEditingTags(`message-${messageId}`)}
          >
            <TagIcon className="h-3 w-3 mr-1" />
            {selectedTags.length > 0 ? 'Edit' : 'Tag'}
          </Button>
        </>
      )}
    </div>
  );
}

// Separate component for file tags to handle hooks properly
function FileTagsSection({ 
  fileId, 
  editingTags, 
  setEditingTags 
}: { 
  fileId: string; 
  editingTags: string | null; 
  setEditingTags: (id: string | null) => void; 
}) {
  const {
    selectedTags,
    availableTags,
    handleTagsChange,
    handleCreateTag,
    isUpdating,
  } = useEntityTagManager('file', fileId);

  return (
    <div className="flex items-center gap-2 mt-1">
      {editingTags === `file-${fileId}` ? (
        <div className="mt-2 p-2 border rounded-lg bg-muted/50 w-full">
          <TagInput
            selectedTags={selectedTags}
            onTagsChange={handleTagsChange}
            availableTags={availableTags}
            onCreateTag={handleCreateTag}
            placeholder="Add tags..."
            maxTags={10}
          />
          <div className="flex justify-end mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingTags(null)}
              disabled={isUpdating}
            >
              Done
            </Button>
          </div>
        </div>
      ) : (
        <>
          {selectedTags.length > 0 && <TagList tags={selectedTags} />}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => setEditingTags(`file-${fileId}`)}
          >
            <TagIcon className="h-3 w-3 mr-1" />
            {selectedTags.length > 0 ? 'Edit' : 'Tag'}
          </Button>
        </>
      )}
    </div>
  );
}

export function UnifiedTimeline({ messages, files, forumId, scrollToMessage, scrollToFile }: UnifiedTimelineProps) {
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadingFiles, setDownloadingFiles] = useState<Record<string, number>>({});
  const [previewFile, setPreviewFile] = useState<FileWithChunks | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editingTags, setEditingTags] = useState<string | null>(null);
  const timelineEndRef = useRef<HTMLDivElement>(null);

  const timelineItems: TimelineItem[] = [
    ...messages.map((msg) => ({
      type: "message" as const,
      date: new Date(msg.createdAt),
      data: msg,
    })),
    ...files.map((file) => ({
      type: "file" as const,
      date: new Date(file.uploadedAt),
      data: file,
    })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  const getInitials = (username: string) => {
    return username.slice(0, 2).toUpperCase();
  };

  const handleCopyMessage = (message: string, id: string) => {
    navigator.clipboard.writeText(message);
    setCopiedId(id);
    toast({
      title: "Copied!",
      description: "Message copied to clipboard",
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShareItem = async (type: 'message' | 'file', id: string) => {
    try {
      // Production-ready URL generation with fallback support
      const getBaseUrl = () => {
        // Check for custom base URL (useful for reverse proxy/CDN deployments)
        if (import.meta.env.VITE_BASE_URL) {
          return import.meta.env.VITE_BASE_URL;
        }
        // Fallback to current origin (works for most deployments)
        return window.location.origin;
      };

      const baseUrl = getBaseUrl();
      const forumUrl = `${baseUrl}/forum/${forumId}?${type}=${id}`;

      // Validate URL before copying
      try {
        new URL(forumUrl);
      } catch {
        throw new Error('Invalid URL generated');
      }

      // Copy to clipboard
      await navigator.clipboard.writeText(forumUrl);

      toast({
        title: "Link copied!",
        description: `Shareable ${type} link copied to clipboard`,
      });
    } catch (error) {
      console.error('Failed to copy link to clipboard:', error);
      toast({
        title: "Copy failed",
        description: "Unable to copy link to clipboard. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getFileIcon = (mimeType?: string | null) => {
    if (!mimeType) return <File className="h-5 w-5 text-muted-foreground" />;
    
    if (mimeType.startsWith("image/")) {
      return <ImageIcon className="h-5 w-5 text-blue-500" />;
    } else if (mimeType.startsWith("video/")) {
      return <FileVideo className="h-5 w-5 text-purple-500" />;
    } else if (mimeType.includes("pdf")) {
      return <FileText className="h-5 w-5 text-red-500" />;
    } else if (mimeType.includes("zip") || mimeType.includes("archive")) {
      return <FileArchive className="h-5 w-5 text-yellow-500" />;
    }
    return <FileText className="h-5 w-5 text-muted-foreground" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderMessageContent = (content: string) => {
    // Simple code block detection and rendering
    const codeBlockRegex = /```([\s\S]*?)```/g;
    const inlineCodeRegex = /`([^`]+)`/g;
    
    // Split content by code blocks
    const parts = [];
    let lastIndex = 0;
    let match;
    
    // Handle code blocks
    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        const beforeText = content.slice(lastIndex, match.index);
        if (beforeText.trim()) {
          parts.push(
            <span key={`text-${lastIndex}`} className="whitespace-pre-wrap">
              {renderInlineCode(beforeText)}
            </span>
          );
        }
      }
      
      // Add code block
      const codeContent = match[1];
      parts.push(
        <pre key={`code-${match.index}`} className="bg-gray-100 dark:bg-gray-800 rounded p-3 mt-2 mb-2 overflow-x-auto text-sm font-mono border">
          <code>{codeContent}</code>
        </pre>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < content.length) {
      const remainingText = content.slice(lastIndex);
      if (remainingText.trim()) {
        parts.push(
          <span key={`text-${lastIndex}`} className="whitespace-pre-wrap">
            {renderInlineCode(remainingText)}
          </span>
        );
      }
    }
    
    // If no code blocks found, just render with preserved whitespace
    if (parts.length === 0) {
      return (
        <span className="whitespace-pre-wrap">
          {renderInlineCode(content)}
        </span>
      );
    }
    
    return <>{parts}</>;
  };

  const renderInlineCode = (text: string) => {
    const inlineCodeRegex = /`([^`]+)`/g;
    const boldRegex = /\*\*([^*]+)\*\*/g;
    const italicRegex = /\*([^*]+)\*/g;
    
    // First handle inline code
    let processedText = text.replace(inlineCodeRegex, '\u0000CODE:$1\u0000');
    
    // Then handle bold
    processedText = processedText.replace(boldRegex, '\u0001BOLD:$1\u0001');
    
    // Then handle italic
    processedText = processedText.replace(italicRegex, '\u0002ITALIC:$1\u0002');
    
    // Split by our markers and render
    const parts = processedText.split(/(\u0000[^\u0000]*\u0000|\u0001[^\u0001]*\u0001|\u0002[^\u0002]*\u0002)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('\u0000CODE:') && part.endsWith('\u0000')) {
        const code = part.slice(6, -1);
        return (
          <code key={index} className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono">
            {code}
          </code>
        );
      } else if (part.startsWith('\u0001BOLD:') && part.endsWith('\u0001')) {
        const boldText = part.slice(6, -1);
        return <strong key={index}>{boldText}</strong>;
      } else if (part.startsWith('\u0002ITALIC:') && part.endsWith('\u0002')) {
        const italicText = part.slice(8, -1);
        return <em key={index}>{italicText}</em>;
      } else {
        return part;
      }
    });
  };

  const downloadMutation = useMutation({
    mutationFn: async (fileId: string) => {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            setDownloadingFiles((prev) => ({
              ...prev,
              [fileId]: percentComplete,
            }));
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const blob = xhr.response;
            const url = window.URL.createObjectURL(blob);
            const file = files.find((f) => f.id === fileId) as FileWithChunks;
            
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
    onError: (error: Error) => {
      toast({
        title: "Download failed",
        description: error.message,
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: "Download complete",
        description: "File downloaded successfully",
      });
    },
  });

  const handlePreview = (file: FileWithChunks) => {
    setPreviewFile(file);
    setPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
    setTimeout(() => setPreviewFile(null), 300);
  };

  // Auto-scroll to bottom when new items are added
  useEffect(() => {
    timelineEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [timelineItems.length]);

  // Auto-scroll to specific message or file when URL parameters are present
  useEffect(() => {
    if (scrollToMessage || scrollToFile) {
      // Small delay to ensure DOM is fully rendered
      const timer = setTimeout(() => {
        const targetId = scrollToMessage ? `message-${scrollToMessage}` : `file-${scrollToFile}`;
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          // Add a highlight effect
          element.classList.add("ring-2", "ring-primary", "ring-opacity-50");
          setTimeout(() => {
            element.classList.remove("ring-2", "ring-primary", "ring-opacity-50");
          }, 3000);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [timelineItems.length, scrollToMessage, scrollToFile]);

  if (timelineItems.length === 0) {
    return (
      <div className="flex-1 flex items-start justify-center text-muted-foreground pt-20">
        <div className="text-center">
          <p className="text-lg mb-2">No messages or files yet</p>
          <p className="text-sm">Start a conversation or upload a file</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <FilePreviewDialog
        file={previewFile}
        open={previewOpen}
        onClose={handleClosePreview}
        onDownload={(fileId) => downloadMutation.mutate(fileId)}
      />
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {timelineItems.map((item, index) => (
          <TimelineItem
            key={item.type === "message" ? `msg-${(item.data as MessageWithUser).id}` : `file-${(item.data as FileWithChunks).id}`}
            item={item}
            index={index}
            copiedId={copiedId}
            setCopiedId={setCopiedId}
            downloadingFiles={downloadingFiles}
            setDownloadingFiles={setDownloadingFiles}
            previewFile={previewFile}
            setPreviewFile={setPreviewFile}
            setPreviewOpen={setPreviewOpen}
            editingTags={editingTags}
            setEditingTags={setEditingTags}
            downloadMutation={downloadMutation}
            handleCopyMessage={handleCopyMessage}
            handleShareItem={handleShareItem}
            getInitials={getInitials}
            getFileIcon={getFileIcon}
            formatFileSize={formatFileSize}
            renderMessageContent={renderMessageContent}
            handlePreview={handlePreview}
            forumId={forumId}
          />
        ))}
        <div ref={timelineEndRef} />
      </div>
    </>
  );
}
