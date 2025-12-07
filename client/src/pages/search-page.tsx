import { useSearch, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { MetaTags } from "@/components/meta-tags";
import { StructuredData } from "@/components/structured-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { FileText, MessageSquare, Users, ArrowRight, Search as SearchIcon } from "lucide-react";
import type { Forum, MessageWithUser, FileWithChunks, User } from "@shared/schema";

interface SearchResults {
  forums: Forum[];
  files: (FileWithChunks & { user: User; forum: Forum })[];
  messages: (MessageWithUser & { forum: Forum })[];
}

export default function SearchPage() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const query = params.get("q") || "";

  const { data, isLoading } = useQuery<SearchResults>({
    queryKey: ["/api/search", query],
    enabled: !!query,
  });

  const totalResults = data
    ? data.forums.length + data.files.length + data.messages.length
    : 0;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SearchResultsPage",
    mainEntity: [
      ...(data?.forums.map((forum) => ({
        "@type": "DiscussionForumPosting",
        headline: forum.name,
        description: forum.description,
        url: `${window.location.origin}/forum/${forum.id}`,
      })) || []),
    ],
  };

  if (!query) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <SearchIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Search Forums</h1>
        <p className="text-muted-foreground">
          Enter a search term to find forums, files, and messages.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <MetaTags
        title={`Search results for "${query}" - Forum App`}
        description={`Search results for "${query}" across forums, files, and messages.`}
      />
      <StructuredData data={structuredData} />

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Search Results</h1>
        <p className="text-muted-foreground">
          Found {totalResults} results for "{query}"
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : (
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All ({totalResults})</TabsTrigger>
            <TabsTrigger value="forums">Forums ({data?.forums.length || 0})</TabsTrigger>
            <TabsTrigger value="files">Files ({data?.files.length || 0})</TabsTrigger>
            <TabsTrigger value="messages">Messages ({data?.messages.length || 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            {/* Forums Preview */}
            {data?.forums.length ? (
              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5" /> Forums
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {data.forums.slice(0, 6).map((forum) => (
                    <ForumCard key={forum.id} forum={forum} />
                  ))}
                </div>
              </section>
            ) : null}

            {/* Files Preview */}
            {data?.files.length ? (
              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5" /> Files
                </h2>
                <div className="space-y-3">
                  {data.files.slice(0, 5).map((file) => (
                    <FileCard key={file.id} file={file} />
                  ))}
                </div>
              </section>
            ) : null}

            {/* Messages Preview */}
            {data?.messages.length ? (
              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" /> Messages
                </h2>
                <div className="space-y-3">
                  {data.messages.slice(0, 5).map((message) => (
                    <MessageCard key={message.id} message={message} />
                  ))}
                </div>
              </section>
            ) : null}

            {totalResults === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No results found for "{query}"
              </div>
            )}
          </TabsContent>

          <TabsContent value="forums">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data?.forums.map((forum) => (
                <ForumCard key={forum.id} forum={forum} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="files">
            <div className="space-y-3">
              {data?.files.map((file) => (
                <FileCard key={file.id} file={file} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="messages">
            <div className="space-y-3">
              {data?.messages.map((message) => (
                <MessageCard key={message.id} message={message} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function ForumCard({ forum }: { forum: Forum }) {
  return (
    <Link href={`/forum/${forum.id}`}>
      <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader>
          <CardTitle className="text-lg">{forum.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {forum.description || "No description"}
          </p>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Created {formatDistanceToNow(new Date(forum.createdAt), { addSuffix: true })}</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function FileCard({ file }: { file: FileWithChunks & { user: User; forum: Forum } }) {
  return (
    <Link href={`/forum/${file.forumId}?file=${file.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate">{file.fileName}</h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>in {file.forum.name}</span>
              <span>•</span>
              <span>by {file.user.username}</span>
              <span>•</span>
              <span>{formatDistanceToNow(new Date(file.uploadedAt), { addSuffix: true })}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function MessageCard({ message }: { message: MessageWithUser & { forum: Forum } }) {
  return (
    <Link href={`/forum/${message.forumId}?message=${message.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm line-clamp-2 mb-2">{message.content}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>in {message.forum.name}</span>
                <span>•</span>
                <span>by {message.user.username}</span>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
