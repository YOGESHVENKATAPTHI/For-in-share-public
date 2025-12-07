import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useSearch, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useEntityTagManager, useTags, useMultipleEntityTags } from "@/hooks/use-tags";
import { queryClient } from "@/lib/queryClient";
import type { Forum, MessageWithUser, FileWithChunks } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft, Send, Upload as UploadIcon, Users, X,
  MessageSquare, FileText, Tag as TagIcon, Edit3,
  Search, X as XIcon
} from "lucide-react";
import { FileUpload } from "@/components/file-upload";
import { FileList } from "@/components/file-list";
import { FilePreviewDialog } from "@/components/file-preview-dialog";
import { UnifiedTimeline } from "@/components/unified-timeline";
import { PartialUploadsManager } from "@/components/partial-uploads-manager";
import { PeoplePanel } from "@/components/people-panel";
import { AccessRequestsManager } from "@/components/access-requests-manager";
import { TagFilter } from "@/components/tag-filter";
import { TagInput } from "@/components/tag-input";
import { StructuredData } from "@/components/structured-data";
import { MetaTags } from "@/components/meta-tags";
import { useIsMobile } from "@/hooks/use-mobile";
import { generateStructuredData } from "@/lib/seo-utils";

interface TagItem {
  id: string;
  name: string;
  color?: string | null;
}

function TagList({ tags }: { tags: TagItem[] }) {
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

export default function ForumPage() {
  const [, params] = useRoute("/forum/:id");
  const search = useSearch();
  const forumId = params?.id;
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [message, setMessage] = useState("");
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showPeoplePanel, setShowPeoplePanel] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    fileId: string;
    progress: number;
    status: string;
    error?: string;
  } | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [messages, setMessages] = useState<MessageWithUser[]>([]);
  const [viewMode, setViewMode] = useState<"timeline" | "files">("timeline");
  const [previewFile, setPreviewFile] = useState<FileWithChunks | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editingForumTags, setEditingForumTags] = useState(false);
  const [selectedFilterTagIds, setSelectedFilterTagIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Parse URL parameters for deep linking
  const urlParams = new URLSearchParams(search);
  const scrollToMessage = urlParams.get('message');
  const scrollToFile = urlParams.get('file');

  const { data: forum, isLoading: forumLoading } = useQuery<Forum>({
    queryKey: ["/api/forums", forumId],
    enabled: !!forumId,
  });

  const { data: initialMessages, isLoading: messagesLoading } = useQuery<MessageWithUser[]>({
    queryKey: ["/api/forums", forumId, "messages"],
    enabled: !!forumId,
  });

  const { data: files, isLoading: filesLoading } = useQuery<FileWithChunks[]>({
    queryKey: ["/api/forums", forumId, "files"],
    enabled: !!forumId,
  });

  // Get forum tags for SEO
  const { selectedTags: forumTags } = forumId ? useEntityTagManager('forum', forumId) : { selectedTags: [] };

  // Get all available tags for filtering
  const { data: allTags = [] } = useTags();

  // Initialize messages from query data
  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  // WebSocket connection for real-time messages
  useEffect(() => {
    if (!forumId || !user) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    // Connect to the same host as the current page (works for both dev and production)
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    console.log("Connecting to WebSocket:", wsUrl);
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log("WebSocket connected");
      socket.send(JSON.stringify({ type: "join", forumId }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "message" && data.forumId === forumId) {
        setMessages((prev) => [...prev, data.message]);
      } else if (data.type === "upload_progress") {
        setUploadProgress(data);
      } else if (data.type === "access_request_update" && data.forumId === forumId) {
        // Refresh forum data when access request status changes
        console.log("Access request update received in forum:", data);
        queryClient.invalidateQueries({ queryKey: ["/api/forums", forumId] });
        queryClient.invalidateQueries({ queryKey: ["/api/forums", forumId, "members"] });
        queryClient.invalidateQueries({ queryKey: ["/api/forums", forumId, "access-requests"] });
      } else if (data.type === 'comment_created' && data.forumId === forumId) {
        // Live update for newly created comment
        const comment = data.comment;
        if (comment) {
          // Invalidate comments for the specific entity
          queryClient.invalidateQueries({ queryKey: ["/api/comments", comment.entityType, comment.entityId] });

          // Also refresh messages/files if needed so UI that shows counts or previews updates
          if (comment.entityType === 'message') {
            queryClient.invalidateQueries({ queryKey: ["/api/forums", forumId, "messages"] });
          } else if (comment.entityType === 'file') {
            queryClient.invalidateQueries({ queryKey: ["/api/forums", forumId, "files"] });
          }

          // Optionally show a subtle toast for comments created by others
          if (comment.userId !== user?.id) {
            toast({
              title: 'New comment',
              description: `New comment on ${comment.entityType}`,
            });
          }
        }
      } else if (data.type === 'comment_updated' && data.forumId === forumId) {
        const comment = data.comment;
        if (comment) {
          queryClient.invalidateQueries({ queryKey: ["/api/comments", comment.entityType, comment.entityId] });
        }
      } else if (data.type === 'comment_deleted' && data.forumId === forumId) {
        const { entityType, entityId } = data;
        if (entityType && entityId) {
          queryClient.invalidateQueries({ queryKey: ["/api/comments", entityType, entityId] });
        }
      } else if (data.type === "file_uploaded" && data.forumId === forumId) {
        // Refresh files list when a new file is uploaded
        console.log("File uploaded:", data.file);
        queryClient.invalidateQueries({ queryKey: ["/api/forums", forumId, "files"] });
        // Also refresh partial uploads as one might have completed
        queryClient.invalidateQueries({ queryKey: ["/api/partial-uploads"] });
      } else if (data.type === "member_added" && data.forumId === forumId) {
        // Refresh members list when a new member is added
        console.log("Member added:", data);
        queryClient.invalidateQueries({ queryKey: ["/api/forums", forumId, "members"] });
      } else if (data.type === "comment_created" && data.forumId === forumId) {
        // Refresh comments for the entity when a new comment is created
        console.log("Comment created:", data.comment);
        queryClient.invalidateQueries({ queryKey: ["/api/comments", data.comment.entityType, data.comment.entityId] });
      } else if (data.type === "comment_updated" && data.forumId === forumId) {
        // Refresh comments for the entity when a comment is updated
        console.log("Comment updated:", data.comment);
        queryClient.invalidateQueries({ queryKey: ["/api/comments", data.comment.entityType, data.comment.entityId] });
      } else if (data.type === "comment_deleted" && data.forumId === forumId) {
        // Refresh comments for the entity when a comment is deleted
        console.log("Comment deleted:", data.commentId);
        queryClient.invalidateQueries({ queryKey: ["/api/comments", data.entityType, data.entityId] });
      } else if (data.type === "tag_created") {
        // Refresh tags when a new tag is created
        console.log("Tag created:", data.tag);
        queryClient.invalidateQueries({ queryKey: ['tags'] });
      } else if (data.type === "tag_updated") {
        // Refresh tags when a tag is updated
        console.log("Tag updated:", data.tag);
        queryClient.invalidateQueries({ queryKey: ['tags'] });
      } else if (data.type === "tag_deleted") {
        // Refresh tags when a tag is deleted
        console.log("Tag deleted:", data.tagId);
        queryClient.invalidateQueries({ queryKey: ['tags'] });
      } else if (data.type === "tags_assigned" && data.forumId === forumId) {
        // Refresh entity tags when tags are assigned
        console.log("Tags assigned:", data);
        queryClient.invalidateQueries({ queryKey: ['tags', 'entity', data.entityType, data.entityId] });
      } else if (data.type === "tag_removed" && data.forumId === forumId) {
        // Refresh entity tags when a tag is removed
        console.log("Tag removed:", data);
        queryClient.invalidateQueries({ queryKey: ['tags', 'entity', data.entityType, data.entityId] });
      } else if (data.type === "error") {
        console.error("WebSocket error:", data.message);
        // You could show a toast notification here
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    socket.onclose = () => {
      console.log("WebSocket disconnected");
    };

    setWs(socket);

    return () => {
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close();
      }
    };
  }, [forumId, user]);

  const handleSendMessage = (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    if (!message.trim() || !ws || !forumId) return;

    ws.send(JSON.stringify({
      type: "message",
      forumId,
      content: message,
    }));

    setMessage("");
  };

  const handlePreview = (file: FileWithChunks) => {
    setPreviewFile(file);
    setPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
    setPreviewFile(null);
  };

  // Prepare entities for batch tag fetching when filtering is active
  const allEntities = React.useMemo(() => {
    const entities: Array<{ type: string; id: string }> = [];
    if (messages) {
      messages.forEach(msg => entities.push({ type: 'message', id: msg.id }));
    }
    if (files) {
      files.forEach(file => entities.push({ type: 'file', id: file.id }));
    }
    return entities;
  }, [messages, files]);

  // Fetch tags for all entities when filtering is active
  const { data: entityTagsMap = {} } = useMultipleEntityTags(
    selectedFilterTagIds.length > 0 ? allEntities : []
  );

  // Filter messages and files based on selected tags
  const filteredMessages = React.useMemo(() => {
    if (selectedFilterTagIds.length === 0) return messages || [];

    return (messages || []).filter(message => {
      const messageTags = entityTagsMap[`message-${message.id}`] || [];
      const messageTagIds = messageTags.map(tag => tag.id);
      return selectedFilterTagIds.some(tagId => messageTagIds.includes(tagId));
    });
  }, [messages, selectedFilterTagIds, entityTagsMap]);

  const filteredFiles = React.useMemo(() => {
    if (selectedFilterTagIds.length === 0) return files || [];

    return (files || []).filter(file => {
      const fileTags = entityTagsMap[`file-${file.id}`] || [];
      const fileTagIds = fileTags.map(tag => tag.id);
      return selectedFilterTagIds.some(tagId => fileTagIds.includes(tagId));
    });
  }, [files, selectedFilterTagIds, entityTagsMap]);

  // Apply search filtering to already tag-filtered results
  const searchFilteredMessages = React.useMemo(() => {
    if (!searchQuery.trim()) return filteredMessages;

    const query = searchQuery.toLowerCase().trim();
    return filteredMessages.filter(message => {
      return (
        message.content.toLowerCase().includes(query) ||
        message.user.username.toLowerCase().includes(query)
      );
    });
  }, [filteredMessages, searchQuery]);

  const searchFilteredFiles = React.useMemo(() => {
    if (!searchQuery.trim()) return filteredFiles;

    const query = searchQuery.toLowerCase().trim();
    return filteredFiles.filter(file => {
      return (
        file.fileName.toLowerCase().includes(query) ||
        file.user.username.toLowerCase().includes(query)
      );
    });
  }, [filteredFiles, searchQuery]);

  // Forum Tags Section Component
  const ForumTagsSection = ({
    forumId,
    isCreator,
    editing,
    onEditingChange
  }: {
    forumId: string;
    isCreator: boolean;
    editing: boolean;
    onEditingChange: (editing: boolean) => void;
  }) => {
    const {
      selectedTags,
      availableTags,
      handleTagsChange,
      handleCreateTag,
      isUpdating,
    } = useEntityTagManager('forum', forumId);

    if (editing) {
      return (
        <div className="mt-2 p-3 border rounded-lg bg-muted/50">
          <TagInput
            selectedTags={selectedTags}
            onTagsChange={handleTagsChange}
            availableTags={availableTags}
            onCreateTag={handleCreateTag}
            placeholder="Add tags to this forum..."
            maxTags={20}
          />
          <div className="flex justify-end mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEditingChange(false)}
              disabled={isUpdating}
            >
              Done
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 mt-2">
        {selectedTags.length > 0 && <TagList tags={selectedTags} />}
        {isCreator && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => onEditingChange(true)}
          >
            <TagIcon className="h-3 w-3 mr-1" />
            {selectedTags.length > 0 ? 'Edit' : 'Add Tags'}
          </Button>
        )}
      </div>
    );
  };

  if (forumLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <Skeleton className="h-8 w-64 mx-auto mb-4 bg-zinc-800" />
          <Skeleton className="h-4 w-48 mx-auto bg-zinc-800" />
        </div>
      </div>
    );
  }

  if (!forum) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2 text-zinc-100">Forum not found</h2>
          <p className="text-zinc-400 mb-6">The forum you're looking for doesn't exist.</p>
          <Link href="/">
            <Button className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200">Back to Forums</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Forum Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <Link href="/">
                <Button variant="ghost" size="icon" data-testid="button-back" className="shrink-0 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-semibold truncate text-zinc-100">{forum.name}</h1>
                {forum.description && (
                  <p className="text-sm text-zinc-400 truncate md:whitespace-normal">{forum.description}</p>
                )}

                {/* Forum Tags */}
                {forumId && (
                  <ForumTagsSection
                    forumId={forumId}
                    isCreator={forum.creatorId === user?.id}
                    editing={editingForumTags}
                    onEditingChange={setEditingForumTags}
                  />
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              {/* Search Input */}
              <div className="relative flex-1 md:w-64 lg:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <Input
                  type="text"
                  placeholder="Search messages and files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-9 w-full bg-zinc-900 border-zinc-800 text-zinc-100 focus:border-zinc-700 rounded-none"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-zinc-400 hover:text-zinc-100"
                    onClick={() => setSearchQuery("")}
                  >
                    <XIcon className="h-3 w-3" />
                  </Button>
                )}
              </div>
              {searchQuery && (
                <Badge variant="secondary" className="text-xs shrink-0 hidden sm:inline-flex bg-zinc-900 text-zinc-400 border-zinc-800">
                  {searchFilteredMessages.length + searchFilteredFiles.length} results
                </Badge>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowPeoplePanel(true)}
                data-testid="button-show-people"
                className="shrink-0 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900"
              >
                <Users className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Tag Filter */}
        <div className="border-b border-zinc-800">
          <div className="container mx-auto px-4 py-3">
            <TagFilter
              availableTags={allTags}
              selectedTagIds={selectedFilterTagIds}
              onTagSelectionChange={setSelectedFilterTagIds}
            />
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="border-b border-zinc-800">
          <div className="container mx-auto px-4">
            <div className="flex gap-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("timeline")}
                className={`rounded-none border-b-2 hover:bg-zinc-900 ${viewMode === "timeline" ? "border-zinc-100 text-zinc-100" : "border-transparent text-zinc-400 hover:text-zinc-100"}`}
              >
                
                Timeline
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("files")}
                className={`rounded-none border-b-2 hover:bg-zinc-900 ${viewMode === "files" ? "border-zinc-100 text-zinc-100" : "border-transparent text-zinc-400 hover:text-zinc-100"}`}
              >
                
                Files ({searchFilteredFiles.length})
              </Button>
            </div>
          </div>
        </div>
      </header>



      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col bg-zinc-950">
        {viewMode === "timeline" ? (
          <>
            {/* Unified Timeline */}
            {messagesLoading || filesLoading ? (
              <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-10 w-10 rounded-full shrink-0 bg-zinc-800" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-24 bg-zinc-800" />
                      <Skeleton className="h-16 w-full max-w-md bg-zinc-800" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto pb-24">
                <UnifiedTimeline
                  messages={searchFilteredMessages}
                  files={searchFilteredFiles}
                  forumId={forumId!}
                  scrollToMessage={scrollToMessage}
                  scrollToFile={scrollToFile}
                />
              </div>
            )}
          </>
        ) : (
          /* Files List View */
          <div className="flex-1 overflow-y-auto p-4 pb-24">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-100">Files</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFileUpload(!showFileUpload)}
                className="border-zinc-800 text-zinc-100 hover:bg-zinc-900"
              >
                <UploadIcon className="h-4 w-4 mr-2" />
                Upload File
              </Button>
            </div>

            {showFileUpload && (
              <div className="mb-6">
                <FileUpload
                  forumId={forumId!}
                  onUploadComplete={() => setShowFileUpload(false)}
                  uploadProgress={uploadProgress}
                  onUploadProgressChange={setUploadProgress}
                />
              </div>
            )}

            <FileList
              files={searchFilteredFiles}
              isLoading={filesLoading}
              forumId={forumId!}
              onPreview={handlePreview}
            />
          </div>
        )}
      </div>

      {/* Fixed Message Input - Only show in timeline view */}
      {viewMode === "timeline" && (
        <div className="fixed bottom-0 left-0 right-0 border-t border-zinc-800 bg-zinc-950 z-20">
          <div className="container mx-auto px-4 py-3">
            <PartialUploadsManager
              forumId={forumId!}
              onResumeUpload={(partialUpload) => {
                toast({
                  title: "Resume Upload",
                  description: `To resume uploading "${partialUpload.fileName}", please select the same file again in the upload area.`,
                });
              }}
            />

            {showFileUpload && (
              <div className="mb-3 p-4 rounded-none bg-zinc-900 border border-zinc-800">
                <FileUpload
                  forumId={forumId!}
                  onUploadComplete={() => setShowFileUpload(false)}
                  uploadProgress={uploadProgress}
                  onUploadProgressChange={setUploadProgress}
                />
              </div>
            )}

            <form onSubmit={handleSendMessage} className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setShowFileUpload(!showFileUpload)}
                data-testid="button-toggle-file-upload"
                className="h-12 w-12 rounded-none border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900"
              >
                {showFileUpload ? <X className="h-5 w-5" /> : <UploadIcon className="h-5 w-5" />}
              </Button>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={isMobile ? "Type a message... (Ctrl+Enter to send)" : "Type a message... (Shift+Enter for new line)"}
                className="flex-1 min-h-[48px] max-h-32 resize-none rounded-none bg-zinc-900 border-zinc-800 text-zinc-100 focus:border-zinc-700"
                data-testid="input-message"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (isMobile) {
                      // On mobile: Enter creates new line, Ctrl+Enter sends
                      if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                      // Let Enter create new line naturally
                    } else {
                      // On desktop: Shift+Enter creates new line, Enter sends
                      if (!e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }
                  }
                }}
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={!message.trim()} 
                data-testid="button-send"
                className="h-12 w-12 rounded-none bg-zinc-100 text-zinc-950 hover:bg-zinc-200"
              >
                <Send className="h-5 w-5" />
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* People Panel Side Sheet */}
      <Sheet open={showPeoplePanel} onOpenChange={setShowPeoplePanel}>
        <SheetContent side="right" className="w-full sm:w-[400px] p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>People</SheetTitle>
          </SheetHeader>
          <PeoplePanel
            forumId={forumId!}
            isCreator={forum.creatorId === user?.id}
          />
        </SheetContent>
      </Sheet>

      {/* File Preview Dialog */}
      <FilePreviewDialog
        file={previewFile}
        open={previewOpen}
        onClose={handleClosePreview}
        onDownload={(fileId) => {
          // Handle download through the same logic as timeline
          const xhr = new XMLHttpRequest();
          const file = files?.find((f) => f.id === fileId);

          xhr.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              const percentComplete = (e.loaded / e.total) * 100;
              // Could add download progress here if needed
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
            }
          });

          xhr.responseType = "blob";
          xhr.open("GET", `/api/files/${fileId}/download`);
          xhr.send();
        }}
      />

      {/* Structured Data for SEO */}
      {forum && (
        <>
          <MetaTags
            title={forum.metaTitle || forum.name}
            description={(forum.metaDescription || forum.description) || undefined}
            keywords={forum.keywords || undefined}
            image={forum.ogImage || undefined}
            url={window.location.href}
            type="website"
          />
          <StructuredData
            data={generateStructuredData('forum', {
              id: forum.id,
              title: forum.name,
              description: forum.description || undefined,
              url: window.location.href,
              author: user ? { name: user.username, id: user.id } : undefined,
              tags: forumTags.map(tag => ({
                id: tag.id,
                name: tag.name,
                description: tag.description || null,
                color: tag.color || null,
                createdAt: new Date(tag.createdAt)
              })),
              createdAt: forum.createdAt.toString(),
              image: forum.ogImage || undefined,
            })}
          />
        </>
      )}
    </div>
  );
}
