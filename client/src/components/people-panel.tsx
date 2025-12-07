import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import type { ForumMember, AccessRequestWithUser, User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, UserCheck, UserPlus, Check, X, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface PeoplePanelProps {
  forumId: string;
  isCreator: boolean;
}

export function PeoplePanel({ forumId, isCreator }: PeoplePanelProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("members");

  const { data: members, isLoading: membersLoading } = useQuery<(ForumMember & { user: User })[]>({
    queryKey: [`/api/forums/${forumId}/members`],
    select: (data: any[]) => {
      return data.map(member => ({
        ...member,
        user: member.user || { id: member.userId, username: 'Unknown', email: '' }
      }));
    },
  });

  const { data: accessRequests, isLoading: requestsLoading } = useQuery<AccessRequestWithUser[]>({
    queryKey: [`/api/forums/${forumId}/access-requests`],
    enabled: isCreator,
  });

  const handleRequestMutation = useMutation({
    mutationFn: async ({ requestId, status }: { requestId: string; status: "approved" | "rejected" }) => {
      const response = await fetch(`/api/access-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        throw new Error(await response.text());
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/forums/${forumId}/access-requests`] });
      queryClient.invalidateQueries({ queryKey: [`/api/forums/${forumId}/members`] });
      toast({
        title: "Request processed",
        description: "Access request has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const pendingRequests = accessRequests?.filter(req => req.status === "pending") || [];
  const resolvedRequests = accessRequests?.filter(req => req.status !== "pending") || [];

  return (
    <Card className="h-full flex flex-col rounded-none border-l border-zinc-800 bg-zinc-950">
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-zinc-100" />
          <h3 className="font-semibold text-zinc-100">People</h3>
          {pendingRequests.length > 0 && (
            <Badge variant="destructive" className="ml-auto">
              {pendingRequests.length}
            </Badge>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2 mx-4 mt-4 bg-zinc-900 text-zinc-400">
          <TabsTrigger value="members" className="text-xs data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100">
            <UserCheck className="h-3 w-3 mr-1" />
            Members ({members?.length || 0})
          </TabsTrigger>
          {isCreator && (
            <TabsTrigger value="requests" className="text-xs relative data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100">
              <UserPlus className="h-3 w-3 mr-1" />
              Requests ({pendingRequests.length})
              {pendingRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-destructive rounded-full" />
              )}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="members" className="flex-1 m-0 mt-2">
          <ScrollArea className="h-[400px] px-4">
            {membersLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-2">
                    <Skeleton className="h-10 w-10 rounded-full bg-zinc-800" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-24 mb-1 bg-zinc-800" />
                      <Skeleton className="h-3 w-32 bg-zinc-800" />
                    </div>
                  </div>
                ))}
              </div>
            ) : members && members.length > 0 ? (
              <div className="space-y-1">
                {members.map((member) => (
                  <div
                    key={member.userId}
                    className="flex items-center gap-3 p-2 rounded-none hover:bg-zinc-900 transition-colors"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="text-sm bg-zinc-800 text-zinc-100">
                        {member.user?.username?.charAt(0).toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-zinc-100">
                        {member.user?.username || 'Unknown User'}
                      </p>
                      <p className="text-xs text-zinc-400 truncate">
                        {member.user?.email || ''}
                      </p>
                    </div>
                    {member.role && member.role !== "member" && (
                      <Badge variant="secondary" className="text-xs bg-zinc-800 text-zinc-300 hover:bg-zinc-700">
                        {member.role}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center text-zinc-500">
                <Users className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">No members yet</p>
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        {isCreator && (
          <TabsContent value="requests" className="flex-1 m-0 mt-2">
            <ScrollArea className="h-[400px] px-4">
              {requestsLoading ? (
                <div className="space-y-3">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="p-3 border border-zinc-800 rounded-none">
                      <div className="flex items-center gap-3 mb-2">
                        <Skeleton className="h-8 w-8 rounded-full bg-zinc-800" />
                        <Skeleton className="h-4 w-24 bg-zinc-800" />
                      </div>
                      <div className="flex gap-2">
                        <Skeleton className="h-8 flex-1 bg-zinc-800" />
                        <Skeleton className="h-8 flex-1 bg-zinc-800" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : pendingRequests.length > 0 ? (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-zinc-400 mb-2 px-2">
                    Pending Requests
                  </div>
                  {pendingRequests.map((request) => (
                    <Card key={request.id} className="p-3 border-zinc-800 bg-zinc-900 rounded-none">
                      <div className="flex items-start gap-3 mb-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs bg-zinc-800 text-zinc-100">
                            {request.user.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate text-zinc-100">
                            {request.user.username}
                          </p>
                          <p className="text-xs text-zinc-400">
                            {new Date(request.requestedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs gap-1 border-zinc-700 text-zinc-400">
                          <Clock className="h-3 w-3" />
                          Pending
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          className="flex-1 bg-zinc-100 text-zinc-950 hover:bg-zinc-200 rounded-none"
                          onClick={() => handleRequestMutation.mutate({ 
                            requestId: request.id, 
                            status: "approved" 
                          })}
                          disabled={handleRequestMutation.isPending}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="flex-1 rounded-none"
                          onClick={() => handleRequestMutation.mutate({ 
                            requestId: request.id, 
                            status: "rejected" 
                          })}
                          disabled={handleRequestMutation.isPending}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </Card>
                  ))}
                  
                  {resolvedRequests.length > 0 && (
                    <>
                      <div className="text-xs font-medium text-zinc-400 mt-4 mb-2 px-2">
                        Resolved Requests
                      </div>
                      {resolvedRequests.map((request) => (
                        <div
                          key={request.id}
                          className="flex items-center gap-3 p-2 rounded-none bg-zinc-900"
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs bg-zinc-800 text-zinc-300">
                              {request.user.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate text-zinc-100">
                              {request.user.username}
                            </p>
                            <p className="text-xs text-zinc-400">
                              {request.status === "approved" ? "Approved" : "Rejected"}
                              {request.resolvedAt && ` · ${new Date(request.resolvedAt).toLocaleDateString()}`}
                            </p>
                          </div>
                          <Badge 
                            variant={request.status === "approved" ? "default" : "secondary"}
                            className="text-xs rounded-none"
                          >
                            {request.status === "approved" ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <X className="h-3 w-3" />
                            )}
                          </Badge>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center text-zinc-500">
                  <UserPlus className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No access requests</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        )}
      </Tabs>
    </Card>
  );
}
