"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowLeft, RefreshCw, ExternalLink, BarChart3, MessageSquare } from "lucide-react";
import { runManualSync } from "@/app/actions/social-sync";
import { disconnectSocialAccount, getSocialPosts, getSocialComments } from "@/app/actions/social-accounts";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Account {
  id: string;
  platform: string;
  platform_account_id: string;
  account_name: string;
  username: string | null;
  account_type: string | null;
  profile_url: string | null;
  profile_image_url: string | null;
  status: string;
  connection_status: string;
  last_synced_at: string | null;
  last_successful_sync_at: string | null;
  last_sync_error: string | null;
  business_id: string;
}

interface Post {
  id: string;
  platform_post_id: string;
  post_type: string | null;
  caption: string | null;
  permalink: string | null;
  published_at: string | null;
  media_url: string | null;
}

interface Comment {
  id: string;
  platform_comment_id: string;
  author_name: string | null;
  text: string | null;
  created_at: string | null;
}

interface Metric {
  id: string;
  metric_date: string;
  followers_count: number | null;
  following_count: number | null;
  posts_count: number | null;
}

interface SyncJob {
  id: string;
  sync_type: string;
  status: string;
  items_found: number;
  items_processed: number;
  error: string | null;
  created_at: string;
  completed_at: string | null;
}

interface Props {
  account: Account;
  initialPosts: Post[];
  postsCount: number;
  initialMetrics: Metric[];
  syncJobs: SyncJob[];
  commentsData: Record<string, { data: Comment[]; total: number }>;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function truncate(text: string | null, max: number): string {
  if (!text) return "";
  return text.length > max ? text.slice(0, max) + "..." : text;
}

export function AccountDetailClient({
  account,
  initialPosts,
  postsCount,
  initialMetrics,
  syncJobs,
  commentsData,
}: Props) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [metrics] = useState<Metric[]>(initialMetrics);
  const [activeTab, setActiveTab] = useState("posts");

  const handleSync = async () => {
    setSyncing(true);
    try {
      await runManualSync(account.id, account.business_id, "");
      const updated = await getSocialPosts(account.id, { limit: 50 });
      setPosts(updated.data as Post[]);
    } catch {
      // silent
    } finally {
      setSyncing(false);
    }
  };

  const latestMetric = metrics[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/accounts")}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Accounts
        </Button>
      </div>

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          {account.profile_image_url ? (
            <img src={account.profile_image_url} alt="" className="h-16 w-16 rounded-full" />
          ) : (
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-xl font-bold">
              {account.account_name.charAt(0)}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">{account.account_name}</h1>
            {account.username && <p className="text-muted-foreground">@{account.username}</p>}
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={account.status === "active" ? "default" : "secondary"}>
                {account.status}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {account.platform} / {account.account_type?.replace("_", " ")}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSync} disabled={syncing} variant="outline" size="sm">
            {syncing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
            Sync now
          </Button>
          {account.profile_url && (
            <a href={account.profile_url} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </a>
          )}
        </div>
      </div>

      {account.last_sync_error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-800">
            {account.last_sync_error}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Followers</div>
            <div className="text-2xl font-bold">{latestMetric?.followers_count?.toLocaleString() ?? "—"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Following</div>
            <div className="text-2xl font-bold">{latestMetric?.following_count?.toLocaleString() ?? "—"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Posts</div>
            <div className="text-2xl font-bold">{latestMetric?.posts_count?.toLocaleString() ?? postsCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Last sync</div>
            <div className="text-sm font-medium">{formatDateTime(account.last_successful_sync_at)}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="posts" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="posts">Posts ({postsCount})</TabsTrigger>
          <TabsTrigger value="syncs">Sync History</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-4">
          {posts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No posts imported yet. Run a sync to import posts.
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => (
              <Card key={post.id}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {post.media_url && (
                      <img src={post.media_url} alt="" className="h-20 w-20 rounded object-cover" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm whitespace-pre-wrap">{truncate(post.caption, 300)}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>{formatDate(post.published_at)}</span>
                        {post.permalink && (
                          <a href={post.permalink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            View on {account.platform}
                          </a>
                        )}
                      </div>
                      {commentsData[post.id] && commentsData[post.id].total > 0 && (
                        <div className="mt-3 border-t pt-3">
                          <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" /> {commentsData[post.id].total} comments
                          </div>
                          {commentsData[post.id].data.map((comment) => (
                            <div key={comment.id} className="text-xs ml-4 mb-1">
                              <span className="font-medium">{comment.author_name || "Unknown"}:</span>{" "}
                              {truncate(comment.text, 150)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="syncs" className="space-y-4">
          {syncJobs.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No sync history yet.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Type</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Items</th>
                      <th className="text-left p-3 font-medium">Started</th>
                      <th className="text-left p-3 font-medium">Completed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {syncJobs.map((job) => (
                      <tr key={job.id} className="border-b last:border-0">
                        <td className="p-3">{job.sync_type}</td>
                        <td className="p-3">
                          <Badge variant={job.status === "completed" ? "default" : job.status === "failed" ? "destructive" : "secondary"}>
                            {job.status}
                          </Badge>
                        </td>
                        <td className="p-3">{job.items_processed}</td>
                        <td className="p-3">{formatDateTime(job.created_at)}</td>
                        <td className="p-3">{formatDateTime(job.completed_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
