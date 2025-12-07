import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Lock, Users, UserPlus, CheckCircle, Clock, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { ForumWithCreator, AccessRequest } from "@shared/schema";

export function PrivateForumAccess() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedForum, setSelectedForum] = useState<ForumWithCreator | null>(null);

  // Search for private forums
  const { data: forums, isLoading } = useQuery<ForumWithCreator[]>({
    queryKey: ["/api/forums"],
    enabled: searchQuery.length > 2,
  });

  const filteredForums = forums?.filter((forum) =>
    !forum.isPublic &&
    (forum.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     forum.description?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Check access request status for a forum
  const { data: accessRequestStatus } = useQuery<{
    hasAccess: boolean;
    requestStatus?: string;
    requestId?: string;
  }>({
    queryKey: ["/api/forums", selectedForum?.id, "access-status"],
    enabled: !!selectedForum,
  });

  // Request access mutation
  const requestAccessMutation = useMutation({
    mutationFn: async (forumId: string) => {
      return apiRequest("POST", "/api/access-requests", { forumId });
    },
    onSuccess: () => {
      toast({
        title: "Access request sent",
        description: "Your request has been sent to the forum administrator.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/forums", selectedForum?.id, "access-status"] });
      setSelectedForum(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Request failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRequestAccess = (forum: ForumWithCreator) => {
    requestAccessMutation.mutate(forum.id);
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case "approved":
        return "Approved";
      case "rejected":
        return "Rejected";
      case "pending":
        return "Pending";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Request Access to Private Forums
          </CardTitle>
          <CardDescription>
            Search for private forums and request access to join them
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search private forums..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {searchQuery.length > 2 && (
            <div className="mt-4">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Searching...
                </div>
              ) : forums && forums.length > 0 ? (
                <div className="space-y-3">
                  {forums.map((forum) => (
                    <Card key={forum.id} className="border-l-4 border-l-orange-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium">{forum.name}</h3>
                              <Badge variant="secondary" className="text-xs">
                                <Lock className="h-3 w-3 mr-1" />
                                Private
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {forum.description || "No description"}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {forum.memberCount || 0} members
                              </span>
                              <span>Created by {forum.creator.username}</span>
                            </div>
                          </div>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedForum(forum)}
                              >
                                <UserPlus className="h-4 w-4 mr-2" />
                                Request Access
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Request Access to {forum.name}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="p-4 bg-muted rounded-lg">
                                  <h4 className="font-medium mb-2">Forum Details</h4>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {forum.description || "No description available"}
                                  </p>
                                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <span>Created by {forum.creator.username}</span>
                                    <span>{forum.memberCount || 0} members</span>
                                  </div>
                                </div>

                                {accessRequestStatus?.hasAccess ? (
                                  <div className="text-center p-4">
                                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                                    <p className="font-medium text-green-700">You already have access to this forum</p>
                                  </div>
                                ) : accessRequestStatus?.requestStatus ? (
                                  <div className="text-center p-4">
                                    {getStatusIcon(accessRequestStatus.requestStatus)}
                                    <p className="font-medium mt-2">
                                      Your access request is {getStatusText(accessRequestStatus.requestStatus).toLowerCase()}
                                    </p>
                                    {accessRequestStatus.requestStatus === "pending" && (
                                      <p className="text-sm text-muted-foreground mt-1">
                                        The forum administrator will review your request soon.
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-center">
                                    <p className="text-sm text-muted-foreground mb-4">
                                      Send an access request to the forum administrator. They will review and approve or deny your request.
                                    </p>
                                    <Button
                                      onClick={() => handleRequestAccess(forum)}
                                      disabled={requestAccessMutation.isPending}
                                    >
                                      {requestAccessMutation.isPending ? "Sending..." : "Send Access Request"}
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No private forums found matching "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}