import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useTags, useMultipleEntityTags } from "@/hooks/use-tags";
import { useIsMobile } from "@/hooks/use-mobile";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ForumWithCreator } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CreateForumDialog } from "@/components/create-forum-dialog";
import { AppFooter } from "@/components/app-footer";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

// Helper to generate deterministic patterns based on forum ID
const getForumPattern = (id: string) => {
  const patterns = [
    "radial-gradient(circle, #3f3f46 1px, transparent 1px)", // Dots (zinc-700)
    "repeating-linear-gradient(45deg, #18181b, #18181b 10px, #27272a 10px, #27272a 20px)", // Stripes (zinc-900/800)
    "linear-gradient(to right, #27272a 1px, transparent 1px), linear-gradient(to bottom, #27272a 1px, transparent 1px)", // Grid (zinc-800)
    "linear-gradient(135deg, #18181b 0%, #09090b 100%)", // Subtle Gradient (zinc-900/950)
    "repeating-radial-gradient(circle at 0 0, transparent 0, #18181b 10px), repeating-linear-gradient(#27272a, #27272a)", // Circles
  ];
  const index = id.charCodeAt(0) % patterns.length;
  return { 
    backgroundImage: patterns[index], 
    backgroundSize: index === 0 ? '20px 20px' : index === 2 ? '40px 40px' : 'auto' 
  };
};

export default function HomePage() {
  const { user, logoutMutation, pendingRequestsCount } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedForum, setSelectedForum] = useState<ForumWithCreator | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);

  // Debounce search query for performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: forums, isLoading } = useQuery<ForumWithCreator[]>({
    queryKey: ["/api/forums"],
  });

  // Track search mutation
  const trackSearchMutation = useMutation({
    mutationFn: async (params: { query: string; resultsCount: number }) => {
      return apiRequest("POST", "/api/search/track", {
        query: params.query,
        resultsCount: params.resultsCount,
        sessionId: Math.random().toString(36).substring(7) // Simple session ID
      });
    },
  });

  // Prepare forum entities for tag fetching
  const forumEntities = useMemo(() => 
    forums ? forums.map(forum => ({ type: 'forum', id: forum.id })) : [],
    [forums]
  );

  // Fetch tags for all forums
  const { data: forumTagsMap = {} } = useMultipleEntityTags(forumEntities);

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
      queryClient.invalidateQueries({ queryKey: ["/api/forums"] });
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

  // Enhanced search with fuzzy matching and relevance scoring
  const filteredForums = useMemo(() => {
    if (!forums) return [];
    if (!debouncedSearchQuery.trim()) return forums;

    const query = debouncedSearchQuery.toLowerCase().trim();
    const searchTerms = query.split(/\s+/);

    const scoredForums = forums.map(forum => {
      let score = 0;
      const forumTags = forumTagsMap[`forum-${forum.id}`] || [];
      
      // Forum name matching (highest priority)
      if (forum.name.toLowerCase().includes(query)) {
        score += 100;
      }
      searchTerms.forEach(term => {
        if (forum.name.toLowerCase().includes(term)) {
          score += 50;
        }
      });

      // Creator name matching (high priority)
      if (forum.creator.username.toLowerCase().includes(query)) {
        score += 80;
      }
      searchTerms.forEach(term => {
        if (forum.creator.username.toLowerCase().includes(term)) {
          score += 40;
        }
      });

      // Tag matching (high priority)
      forumTags.forEach(tag => {
        if (tag.name.toLowerCase().includes(query)) {
          score += 70;
        }
        searchTerms.forEach(term => {
          if (tag.name.toLowerCase().includes(term)) {
            score += 35;
          }
        });
      });

      // Description matching (medium priority)
      if (forum.description?.toLowerCase().includes(query)) {
        score += 30;
      }
      searchTerms.forEach(term => {
        if (forum.description?.toLowerCase().includes(term)) {
          score += 15;
        }
      });

      return { forum, score };
    });

    // Filter forums with score > 0 and sort by relevance
    return scoredForums
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ forum }) => forum);
  }, [forums, debouncedSearchQuery, forumTagsMap]);

  // Track search when results change
  useEffect(() => {
    if (debouncedSearchQuery.trim().length >= 2) {
      const resultsCount = filteredForums?.length || 0;
      trackSearchMutation.mutate({ 
        query: debouncedSearchQuery.trim(), 
        resultsCount 
      });
    }
  }, [debouncedSearchQuery, filteredForums?.length]);

  const handleRequestAccess = (forum: ForumWithCreator) => {
    requestAccessMutation.mutate(forum.id);
  };

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!user) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "access_request_update" || data.type === "forum_created" || data.type === "forum_deleted") {
        queryClient.invalidateQueries({ queryKey: ["/api/forums"] });
      }
      if (data.type === "access_request_update" || data.type === "access_request_created") {
        queryClient.invalidateQueries({ queryKey: ["/api/user/pending-requests"] });
      }
    };

    setWs(socket);

    return () => {
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close();
      }
    };
  }, [user]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-zinc-100 selection:text-zinc-900">
      {/* Responsive Header */}
      <header className="border-b border-zinc-800 py-4 sm:py-6 sticky top-0 bg-zinc-950/90 backdrop-blur-sm z-50">
        <div className="container mx-auto px-4 sm:px-6 flex justify-between items-center">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <Logo className="h-6 sm:h-8 w-auto invert flex-shrink-0" />
            <h1 className="text-lg sm:text-xl font-bold tracking-tight break-words">
              ForInShare
              <span className="hidden sm:inline">.</span>
            </h1>
          </div>
          
          <nav className="flex items-center gap-4 sm:gap-6 lg:gap-8">
            <Link 
              href="/my-space" 
              className="text-xs sm:text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors whitespace-nowrap"
            >
              <span className="hidden sm:inline">My Space</span>
              <span className="sm:hidden">Space</span>
            </Link>
          
            <button 
              onClick={() => logoutMutation.mutate()} 
              className="text-xs sm:text-sm font-medium text-zinc-400 hover:text-red-400 transition-colors whitespace-nowrap"
            >
              Logout
            </button>
          </nav>
        </div>
      </header>

      {/* Responsive Hero */}
      <section className="py-16 sm:py-24 md:py-32 border-b border-zinc-800 bg-zinc-950 relative overflow-hidden">
        {/* Background Texture - Responsive */}
        <div 
          className="absolute inset-0 opacity-[0.3] sm:opacity-[0.4] animate-whirlpool origin-center pointer-events-none" 
          style={{ 
            backgroundImage: 'radial-gradient(circle at center, #52525b 1.5px, transparent 1.5px), radial-gradient(circle at center, #3f3f46 2.5px, transparent 2.5px)', 
            backgroundSize: '24px 24px, 48px 48px',
            backgroundPosition: '0 0, 12px 12px'
          }}
        ></div>
        
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl relative z-10">
          <h2 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-8 sm:mb-12 leading-[0.9] text-zinc-100">
            Connect.<br/>
            Share.<br/>
            <span className="text-zinc-600">Collaborate.</span>
          </h2>
          
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 sm:gap-12">
            <p className="text-lg sm:text-xl text-zinc-400 max-w-xl leading-relaxed">
              A minimal space for communities to thrive. Share files, discuss ideas, and build together without the noise.
            </p>
            
            <button 
              onClick={() => setIsCreateDialogOpen(true)} 
              className="group flex items-center gap-3 sm:gap-4 text-base sm:text-lg font-medium hover:text-zinc-300 transition-colors text-zinc-100 self-start lg:self-auto"
            >
              <span className="border-b border-zinc-100 pb-1 group-hover:border-zinc-400 whitespace-nowrap">
                <span className="hidden sm:inline">Start a Community</span>
                <span className="sm:hidden">Start Community</span>
              </span>
              <span className="text-xl sm:text-2xl transition-transform group-hover:translate-x-1">→</span>
            </button>
          </div>
        </div>
      </section>

      {/* Content Area */}
      <main className="container mx-auto px-4 sm:px-6 py-12 sm:py-20">
        {/* Responsive Search */}
        <div className="mb-12 sm:mb-16 max-w-3xl">
          <label className="block text-xs sm:text-sm font-medium text-zinc-500 mb-3 sm:mb-4 tracking-widest uppercase">
            Find a Community
          </label>
          <input 
            type="text" 
            placeholder="Search by name, tag, or creator..." 
            className="w-full text-2xl sm:text-3xl md:text-4xl font-medium border-b-2 border-zinc-800 py-3 sm:py-4 focus:outline-none focus:border-zinc-100 transition-colors placeholder:text-zinc-700 bg-transparent text-zinc-100"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Responsive Forum Grid */}
        <div className="space-y-0">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 animate-pulse">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-56 sm:h-64 bg-zinc-900 rounded-none"></div>
              ))}
            </div>
          ) : filteredForums && filteredForums.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              {filteredForums.map((forum, index) => {
                const hasAccess = forum.hasAccess || false;
                const forumTags = forumTagsMap[`forum-${forum.id}`] || [];
                const patternStyle = getForumPattern(forum.id);
                
                // Allow full names with line wrapping
                const maxCreatorLength = isMobile ? 12 : 18;
                const truncatedCreator = forum.creator.username.length > maxCreatorLength 
                  ? `${forum.creator.username.substring(0, maxCreatorLength - 3)}...` 
                  : forum.creator.username;
                const maxTagsToShow = isMobile ? 2 : 3;

                return (
                  <div 
                    key={forum.id} 
                    className="group relative bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-all duration-300 flex flex-col overflow-hidden rounded-none touch-manipulation"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    {/* Responsive Pattern Header */}
                    <div className="h-16 sm:h-20 md:h-24 w-full border-b border-zinc-800 opacity-50 group-hover:opacity-80 transition-opacity" style={patternStyle}></div>

                    <div className="p-4 sm:p-6 lg:p-8 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-3 sm:mb-4 gap-3">
                        <h3 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight text-zinc-100 group-hover:text-white transition-colors leading-tight break-words flex-1 pr-2">
                          {forum.name}
                        </h3>
                        {!forum.isPublic && (
                          <span className="shrink-0 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-zinc-500 border border-zinc-700 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-none bg-zinc-950">
                            Private
                          </span>
                        )}
                      </div>
                      
                      <p className="text-zinc-400 text-sm sm:text-base leading-relaxed mb-4 sm:mb-6 lg:mb-8 line-clamp-2 sm:line-clamp-3 flex-1">
                        {forum.description || "No description provided."}
                      </p>
                      
                      <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4 sm:mb-6 lg:mb-8">
                        {forumTags.slice(0, maxTagsToShow).map(tag => {
                          return (
                            <span key={tag.id} className="text-xs font-medium text-zinc-400 bg-zinc-800 px-2 py-1 rounded-none break-words" title={tag.name}>
                              #{tag.name}
                            </span>
                          );
                        })}
                        {forumTags.length > maxTagsToShow && (
                          <span className="text-xs font-medium text-zinc-500 px-2 py-1">
                            +{forumTags.length - maxTagsToShow}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-4 sm:pt-6 border-t border-zinc-800 mt-auto gap-3">
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Creator</span>
                          <span className="text-sm font-medium text-zinc-200 break-words" title={forum.creator.username}>
                            <span className="block sm:hidden">{truncatedCreator}</span>
                            <span className="hidden sm:block">{forum.creator.username}</span>
                          </span>
                        </div>

                        <div className="flex-shrink-0">
                          {hasAccess ? (
                            <Link href={`/forum/${forum.id}`}>
                              <Button className="rounded-none bg-zinc-100 text-zinc-900 hover:bg-zinc-200 px-3 sm:px-4 lg:px-6 text-xs sm:text-sm h-8 sm:h-9 lg:h-10">
                                <span className="hidden sm:inline">Enter Forum</span>
                                <span className="sm:hidden">Enter</span>
                              </Button>
                            </Link>
                          ) : forum.requestStatus === 'pending' ? (
                            <Button disabled variant="outline" className="rounded-none border-amber-900/50 text-amber-500 bg-amber-950/30 px-3 sm:px-4 text-xs sm:text-sm h-8 sm:h-9">
                              <span className="hidden sm:inline">Request Pending</span>
                              <span className="sm:hidden">Pending</span>
                            </Button>
                          ) : forum.requestStatus === 'rejected' ? (
                            <Button disabled variant="outline" className="rounded-none border-red-900/50 text-red-500 bg-red-950/30 px-3 sm:px-4 text-xs sm:text-sm h-8 sm:h-9">
                              <span className="hidden sm:inline">Access Denied</span>
                              <span className="sm:hidden">Denied</span>
                            </Button>
                          ) : (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  onClick={() => setSelectedForum(forum)}
                                  variant="outline"
                                  className="rounded-none border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all px-3 sm:px-4 text-xs sm:text-sm h-8 sm:h-9"
                                >
                                  <span className="hidden sm:inline">Request Access</span>
                                  <span className="sm:hidden">Request</span>
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-800 text-zinc-100 rounded-none mx-4">
                                <DialogHeader>
                                  <DialogTitle className="text-lg sm:text-xl font-bold">Request Access</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 sm:space-y-6 py-4">
                                  <div className="bg-zinc-950 p-3 sm:p-4 rounded-none border border-zinc-800">
                                    <p className="text-sm text-zinc-400 mb-2">
                                      You are requesting to join <strong className="break-words">{forum.name}</strong>.
                                    </p>
                                    <p className="text-xs text-zinc-600">
                                      The administrator will review your request.
                                    </p>
                                  </div>
                                  <Button
                                    onClick={() => handleRequestAccess(forum)}
                                    disabled={requestAccessMutation.isPending}
                                    className="w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200 h-10 sm:h-12 text-sm sm:text-base rounded-none"
                                  >
                                    {requestAccessMutation.isPending ? "Sending..." : "Send Request"}
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 sm:py-24 text-center border-t border-zinc-800">
              <p className="text-lg sm:text-xl text-zinc-400 mb-6 sm:mb-8 px-4">
                No communities found matching your search.
              </p>
              <button 
                onClick={() => setSearchQuery("")}
                className="text-zinc-100 font-medium border-b border-zinc-100 pb-0.5 hover:text-zinc-400 hover:border-zinc-400 transition-colors text-sm sm:text-base"
              >
                Clear search
              </button>
            </div>
          )}
        </div>
      </main>

      <AppFooter />

      <CreateForumDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
}
