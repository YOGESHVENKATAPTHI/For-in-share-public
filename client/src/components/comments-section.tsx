import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { CommentWithUser } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  MessageCircle,
  Send,
  MoreVertical,
  Edit,
  Trash2,
  Reply
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CommentsSectionProps {
  entityType: "message" | "file";
  entityId: string;
  forumId: string;
}

interface CommentItemProps {
  comment: CommentWithUser;
  entityType: string;
  entityId: string;
  forumId: string;
  depth?: number;
  maxDepth?: number;
}

function CommentItem({ comment, entityType, entityId, forumId, depth = 0, maxDepth = 5 }: CommentItemProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [editContent, setEditContent] = useState(comment.content);

  const getInitials = (username: string) => {
    return username.slice(0, 2).toUpperCase();
  };

  const createCommentMutation = useMutation({
    mutationFn: async (data: { entityType: string; entityId: string; parentId?: string; content: string }) => {
      const res = await apiRequest("POST", "/api/comments", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/comments", entityType, entityId] });
      setReplyContent("");
      setIsReplying(false);
      toast({
        title: "Comment added",
        description: "Your comment has been posted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add comment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateCommentMutation = useMutation({
    mutationFn: async (data: { content: string }) => {
      const res = await apiRequest("PUT", `/api/comments/${comment.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/comments", entityType, entityId] });
      setIsEditing(false);
      toast({
        title: "Comment updated",
        description: "Your comment has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update comment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/comments/${comment.id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/comments", entityType, entityId] });
      toast({
        title: "Comment deleted",
        description: "Your comment has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete comment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleReply = () => {
    if (!replyContent.trim()) return;
    createCommentMutation.mutate({
      entityType: "comment",
      entityId: comment.id,
      parentId: comment.id,
      content: replyContent.trim(),
    });
  };

  const handleEdit = () => {
    if (!editContent.trim()) return;
    updateCommentMutation.mutate({
      content: editContent.trim(),
    });
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this comment?")) {
      deleteCommentMutation.mutate();
    }
  };

  const canEdit = user?.id === comment.userId;
  const canReply = depth < maxDepth;

  return (
    <div className={`relative ${depth > 0 ? 'ml-6 pl-4 border-l-2 border-muted' : ''}`}>
      <Card className="mb-3">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {getInitials(comment.user.username)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-sm">
                  {comment.user.username}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </span>
                {comment.updatedAt !== comment.createdAt && (
                  <span className="text-xs text-muted-foreground">(edited)</span>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-2">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="min-h-[80px] resize-none"
                    placeholder="Edit your comment..."
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleEdit}
                      disabled={!editContent.trim() || updateCommentMutation.isPending}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setEditContent(comment.content);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-sm whitespace-pre-wrap break-words">
                  {comment.content}
                </div>
              )}

              {!isEditing && (
                <div className="flex items-center gap-2 mt-3">
                  {canReply && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsReplying(!isReplying)}
                      className="h-7 px-2 text-xs"
                    >
                      <Reply className="h-3 w-3 mr-1" />
                      Reply
                    </Button>
                  )}

                  {canEdit && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setIsEditing(true)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={handleDelete}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {isReplying && (
        <Card className="mb-3 ml-11">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {getInitials(user?.username || "")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder={isMobile ? `Reply to ${comment.user.username}... (Ctrl+Enter to send)` : `Reply to ${comment.user.username}... (Shift+Enter for new line)`}
                  className="min-h-[80px] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (isMobile) {
                        // On mobile: Enter creates new line, Ctrl+Enter sends
                        if (e.ctrlKey || e.metaKey) {
                          e.preventDefault();
                          handleReply();
                        }
                      } else {
                        // On desktop: Shift+Enter creates new line, Enter sends
                        if (!e.shiftKey) {
                          e.preventDefault();
                          handleReply();
                        }
                      }
                    }
                  }}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleReply}
                    disabled={!replyContent.trim() || createCommentMutation.isPending}
                  >
                    <Send className="h-3 w-3 mr-1" />
                    Reply
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsReplying(false);
                      setReplyContent("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Render replies */}
      {comment.replies && comment.replies.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          entityType={entityType}
          entityId={entityId}
          forumId={forumId}
          depth={depth + 1}
          maxDepth={maxDepth}
        />
      ))}
    </div>
  );
}

export function CommentsSection({ entityType, entityId, forumId }: CommentsSectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [newComment, setNewComment] = useState("");
  const [showComments, setShowComments] = useState(false);

  const { data: comments, isLoading } = useQuery<CommentWithUser[]>({
    queryKey: ["/api/comments", entityType, entityId],
    enabled: showComments,
  });

  const createCommentMutation = useMutation({
    mutationFn: async (data: { entityType: string; entityId: string; content: string }) => {
      const res = await apiRequest("POST", "/api/comments", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/comments", entityType, entityId] });
      setNewComment("");
      setShowComments(true);
      toast({
        title: "Comment added",
        description: "Your comment has been posted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add comment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;
    createCommentMutation.mutate({
      entityType,
      entityId,
      content: newComment.trim(),
    });
  };

  const commentCount = comments?.reduce((count, comment) => {
    const countReplies = (replies: CommentWithUser[]): number => {
      return replies.reduce((sum, reply) => sum + 1 + countReplies(reply.replies || []), 0);
    };
    return count + 1 + countReplies(comment.replies || []);
  }, 0) || 0;

  return (
    <div className="mt-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowComments(!showComments)}
        className="text-muted-foreground hover:text-foreground"
      >
        <MessageCircle className="h-4 w-4 mr-2" />
        {commentCount > 0 ? `${commentCount} comment${commentCount !== 1 ? 's' : ''}` : 'Add comment'}
      </Button>

      {showComments && (
        <div className="mt-4 space-y-4">
          {/* New comment input */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {user?.username ? user.username.slice(0, 2).toUpperCase() : "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={isMobile ? "Write a comment... (Ctrl+Enter to send)" : "Write a comment... (Shift+Enter for new line)"}
                    className="min-h-[80px] resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (isMobile) {
                          // On mobile: Enter creates new line, Ctrl+Enter sends
                          if (e.ctrlKey || e.metaKey) {
                            e.preventDefault();
                            handleSubmitComment();
                          }
                        } else {
                          // On desktop: Shift+Enter creates new line, Enter sends
                          if (!e.shiftKey) {
                            e.preventDefault();
                            handleSubmitComment();
                          }
                        }
                      }
                    }}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSubmitComment}
                      disabled={!newComment.trim() || createCommentMutation.isPending}
                    >
                      <Send className="h-3 w-3 mr-1" />
                      Comment
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setNewComment("")}
                      disabled={!newComment.trim()}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comments list */}
          <div className="space-y-2">
            {isLoading ? (
              <div className="text-center text-muted-foreground py-4">
                Loading comments...
              </div>
            ) : comments && comments.length > 0 ? (
              comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  entityType={entityType}
                  entityId={entityId}
                  forumId={forumId}
                />
              ))
            ) : (
              <div className="text-center text-muted-foreground py-4">
                No comments yet. Be the first to comment!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}