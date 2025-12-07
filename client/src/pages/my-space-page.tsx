import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import type { ForumWithCreator } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MessageSquare, Lock, Globe, Plus, LogOut, User, Trash2, 
  Users, Home, Settings
} from "lucide-react";
import { Logo } from "@/components/logo";
import { formatDistanceToNow } from "date-fns";
import { CreateForumDialog } from "@/components/create-forum-dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { AppFooter } from "@/components/app-footer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function MySpacePage() {
  const { user, logoutMutation, pendingRequestsCount } = useAuth();
  const [, setLocation] = useLocation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [forumToDelete, setForumToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: forums, isLoading } = useQuery<ForumWithCreator[]>({
    queryKey: [`/api/users/${user?.id}/forums`],
    enabled: !!user?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: async (forumId: string) => {
      const response = await fetch(`/api/forums/${forumId}`, {
        method: "DELETE",
        credentials: "include",
      });
      
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/forums`] });
      queryClient.invalidateQueries({ queryKey: ["/api/forums"] });
      toast({
        title: "Forum deleted",
        description: "The forum and all its data have been permanently removed.",
      });
      setForumToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Deletion failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-zinc-950 pb-20">
      {/* Modern Header with Glass Effect */}
      <header className="sticky top-0 z-50 bg-zinc-950 border-b border-zinc-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 sm:h-18 items-center justify-between">
            {/* Enhanced Logo */}
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="relative">
                <Logo className="h-6 sm:h-8 w-auto invert flex-shrink-0" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-zinc-100">
                  ForInShare
                </h1>
                <p className="text-xs sm:text-sm text-zinc-400 hidden sm:block">
                  My Dashboard
                </p>
              </div>
            </div>

            {/* Desktop Navigation - Enhanced */}
            <div className="hidden lg:flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => setLocation("/")}
                className="gap-2 px-4 py-2 rounded-none text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900"
              >
                <Home className="h-4 w-4" />
                Home
              </Button>
              <div className="flex items-center gap-3 px-4 py-2 bg-zinc-900 border border-zinc-800">
                <div className="w-8 h-8 bg-zinc-800 flex items-center justify-center text-zinc-100 text-sm font-semibold">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-zinc-100">{user?.username}</span>
                {pendingRequestsCount > 0 && (
                  <Badge className="bg-zinc-100 text-zinc-950 text-xs px-2 py-1 rounded-none">
                    {pendingRequestsCount}
                  </Badge>
                )}
              </div>
              <Button
                variant="outline"
                onClick={() => logoutMutation.mutate()}
                className="gap-2 px-4 py-2 rounded-none border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>

            {/* Mobile Navigation - Enhanced */}
            <div className="flex lg:hidden items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/")}
                className="h-10 w-10 p-0 rounded-none hover:bg-zinc-900 text-zinc-100"
                aria-label="Go to home page"
              >
                <Home className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => logoutMutation.mutate()}
                className="h-10 w-10 p-0 rounded-none hover:bg-zinc-900 text-zinc-100"
                aria-label="Logout"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-zinc-900 border-b border-zinc-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="max-w-4xl mx-auto">
            <div className="animate-fade-in text-center sm:text-left">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-zinc-100">
                My Space
              </h1>
              <p className="text-lg sm:text-xl text-zinc-400 mb-8 max-w-2xl leading-relaxed">
                Manage and organize your forums. Monitor activity, handle requests, and grow your communities.
              </p>
              
              {/* Stats Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
                <div className="bg-zinc-950 border border-zinc-800 p-4 sm:p-6 text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-zinc-100 mb-2">
                    {forums?.length || 0}
                  </div>
                  <div className="text-sm text-zinc-400">Forums Created</div>
                </div>
                <div className="bg-zinc-950 border border-zinc-800 p-4 sm:p-6 text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-zinc-100 mb-2">
                    {forums?.reduce((acc, forum) => {
                      const memberCount = typeof forum.memberCount === 'object' && forum.memberCount !== null
                        ? (forum.memberCount as any).count || 0
                        : forum.memberCount || 0;
                      return acc + memberCount;
                    }, 0) || 0}
                  </div>
                  <div className="text-sm text-zinc-400">Total Members</div>
                </div>
                <div className="bg-zinc-950 border border-zinc-800 p-4 sm:p-6 text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-zinc-100 mb-2">
                    {typeof pendingRequestsCount === 'number' ? pendingRequestsCount : 0}
                  </div>
                  <div className="text-sm text-zinc-400">Pending Requests</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center sm:justify-start items-center">
                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  size="lg"
                  className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200 border-0 px-8 py-4 rounded-none font-semibold"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create New Forum
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 pb-32 sm:pb-36">
        {/* Section Header */}
        <div className="mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-zinc-100">Your Forums</h2>
          <p className="text-zinc-400">
            Manage your communities and track their growth
          </p>
        </div>

        {/* Forums Grid - Modern Design */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 p-6 animate-pulse">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <Skeleton className="h-6 w-3/4 rounded-none bg-zinc-800" />
                    <Skeleton className="h-8 w-8 rounded-none bg-zinc-800" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16 rounded-none bg-zinc-800" />
                    <Skeleton className="h-5 w-20 rounded-none bg-zinc-800" />
                  </div>
                  <Skeleton className="h-4 w-full rounded-none bg-zinc-800" />
                  <Skeleton className="h-4 w-2/3 rounded-none bg-zinc-800" />
                  <div className="flex justify-between pt-4 border-t border-zinc-800">
                    <Skeleton className="h-4 w-24 rounded-none bg-zinc-800" />
                    <Skeleton className="h-8 w-20 rounded-none bg-zinc-800" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : forums && forums.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
            {forums.map((forum, index) => (
              <div 
                key={forum.id}
                className="group relative animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                
                <Card className="relative bg-zinc-900 border border-zinc-800 rounded-none overflow-hidden h-full">
                  <CardHeader className="pb-4">
                    {/* Forum header with actions */}
                    <div className="flex items-start justify-between mb-4">
                      <Link href={`/forum/${forum.id}`} className="flex-1 min-w-0">
                        <CardTitle className="text-lg font-bold line-clamp-2 text-zinc-100 hover:text-zinc-300 transition-colors cursor-pointer mb-2">
                          {forum.name}
                        </CardTitle>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 flex-shrink-0 opacity-60 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-zinc-800 rounded-none"
                        onClick={(e) => {
                          e.preventDefault();
                          setForumToDelete(forum.id);
                        }}
                        aria-label={`Delete ${forum.name} forum`}
                      >
                        <Trash2 className="h-4 w-4 text-zinc-400 hover:text-red-500" />
                      </Button>
                    </div>

                    {/* Status badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      {forum.isPublic ? (
                        <Badge className="inline-flex items-center gap-1.5 px-3 py-1 rounded-none text-xs font-medium bg-zinc-800 text-zinc-300 border-zinc-700">
                          <Globe className="h-3 w-3" />
                          Public
                        </Badge>
                      ) : (
                        <Badge className="inline-flex items-center gap-1.5 px-3 py-1 rounded-none text-xs font-medium bg-zinc-800 text-zinc-300 border-zinc-700">
                          <Lock className="h-3 w-3" />
                          Private
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs gap-1 bg-zinc-950 text-zinc-400 border-zinc-800 rounded-none">
                        <Users className="h-3 w-3" />
                        {typeof forum.memberCount === 'object' && forum.memberCount !== null
                          ? (forum.memberCount as any).count || 0
                          : forum.memberCount || 0} members
                      </Badge>
                    </div>

                    {/* Description */}
                    {forum.description && (
                      <CardDescription className="text-sm leading-relaxed line-clamp-3 mb-4 text-zinc-400">
                        {forum.description}
                      </CardDescription>
                    )}
                  </CardHeader>

                  <CardContent className="pt-0">
                    {/* Forum stats and actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                      <span className="text-xs text-zinc-500 truncate">
                        Created {formatDistanceToNow(new Date(forum.createdAt), { addSuffix: true })}
                      </span>
                      <Link href={`/forum/${forum.id}`}>
                        <Button 
                          size="sm" 
                          className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200 border-0 rounded-none px-4 py-2 font-medium"
                        >
                          Manage
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto text-center py-16 sm:py-20">
            <div className="relative">
              
              <div className="relative bg-zinc-900 border border-zinc-800 p-12 sm:p-16 rounded-none">
                <div className="animate-slide-up">
                  {/* Logo */}
                  {/* <div className="relative">
                <Logo className="h-6 ml-5 sm:h-8 w-auto invert flex-shrink-0" />
              </div> */}

                  <h3 className="text-2xl sm:text-3xl font-bold mb-4 text-zinc-100">
                    Your Forum Journey Starts Here
                  </h3>
                  
                  <p className="text-base sm:text-lg text-zinc-400 mb-8 max-w-lg mx-auto leading-relaxed">
                    Create your first forum and start building amazing communities. Share files, chat in real-time, and collaborate with your team seamlessly.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Button 
                      onClick={() => setIsCreateDialogOpen(true)} 
                      size="lg" 
                      className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200 border-0 px-8 py-4 rounded-none font-semibold"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Create Your First Forum
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <AppFooter />

      {/* Dialogs */}
      <CreateForumDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />

      <AlertDialog open={!!forumToDelete} onOpenChange={() => setForumToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Forum?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                This will permanently delete the forum and all associated data including:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>All messages and chat history</li>
                <li>All uploaded files (removed from Dropbox)</li>
                <li>All member associations</li>
                <li>All access requests</li>
              </ul>
              <p className="font-medium text-destructive mt-3">
                This action cannot be undone.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => forumToDelete && deleteMutation.mutate(forumToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
