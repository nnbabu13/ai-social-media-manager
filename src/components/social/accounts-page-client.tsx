"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, RefreshCw, Unlink, AlertCircle, CheckCircle2, Facebook, Instagram } from "lucide-react";
import { startFacebookOAuth, startInstagramOAuth, disconnectSocialAccount, reconnectSocialAccount, getSocialAccounts } from "@/app/actions/social-accounts";
import { runManualSync } from "@/app/actions/social-sync";
import { cn } from "@/lib/utils";

interface SocialAccount {
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
  last_sync_started_at: string | null;
  last_synced_at: string | null;
  last_successful_sync_at: string | null;
  last_sync_error: string | null;
  created_at: string;
}

interface Props {
  businessId: string;
  businessName: string;
  initialAccounts: SocialAccount[];
}

function PlatformIcon({ platform }: { platform: string }) {
  if (platform === "facebook") return <Facebook className="h-5 w-5 text-blue-600" />;
  if (platform === "instagram") return <Instagram className="h-5 w-5 text-pink-600" />;
  return null;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "active") return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle2 className="h-3 w-3 mr-1" />Connected</Badge>;
  if (status === "syncing") return <Badge className="bg-blue-100 text-blue-800 border-blue-200"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Syncing</Badge>;
  if (status === "error") return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Error</Badge>;
  if (status === "expired") return <Badge className="bg-amber-100 text-amber-800 border-amber-200"><AlertCircle className="h-3 w-3 mr-1" />Expired</Badge>;
  if (status === "disconnected") return <Badge variant="secondary">Disconnected</Badge>;
  return <Badge variant="outline">Not connected</Badge>;
}

function formatTimeAgo(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function AccountsPageClient({ businessId, businessName, initialAccounts }: Props) {
  const searchParams = useSearchParams();
  const [accounts, setAccounts] = useState<SocialAccount[]>(initialAccounts);
  const [loading, setLoading] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const error = searchParams.get("error");
    const connected = searchParams.get("connected");
    if (error) {
      setMessage({ type: "error", text: decodeURIComponent(error) });
    } else if (connected === "true") {
      setMessage({ type: "success", text: "Account connected successfully!" });
    }
  }, [searchParams]);

  const handleConnect = async (platform: "facebook" | "instagram") => {
    setLoading(platform);
    try {
      const fn = platform === "facebook" ? startFacebookOAuth : startInstagramOAuth;
      const { url } = await fn(businessId);
      window.location.href = url;
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to start connection" });
      setLoading(null);
    }
  };

  const handleDisconnect = async (accountId: string) => {
    if (!confirm("Disconnect this account? Your AI manager will stop receiving new information from this account.")) return;
    setLoading(accountId);
    try {
      await disconnectSocialAccount(accountId, "");
      setAccounts((prev) =>
        prev.map((a) => (a.id === accountId ? { ...a, status: "disconnected", connection_status: "disconnected" } : a))
      );
      setMessage({ type: "success", text: "Account disconnected" });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to disconnect" });
    } finally {
      setLoading(null);
    }
  };

  const handleSync = async (account: SocialAccount) => {
    setSyncing(account.id);
    try {
      await runManualSync(account.id, businessId, "");
      const updated = await getSocialAccounts(businessId);
      setAccounts(updated as SocialAccount[]);
      setMessage({ type: "success", text: "Sync complete" });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Sync failed" });
    } finally {
      setSyncing(null);
    }
  };

  const handleReconnect = async (accountId: string) => {
    setLoading(accountId);
    try {
      const { url } = await reconnectSocialAccount(accountId, "");
      window.location.href = url;
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to reconnect" });
      setLoading(null);
    }
  };

  const connectedAccounts = accounts.filter((a) => a.status !== "disconnected" && a.connection_status !== "disconnected");
  const hasFacebook = connectedAccounts.some((a) => a.platform === "facebook");
  const hasInstagram = connectedAccounts.some((a) => a.platform === "instagram");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Social Accounts</h1>
        <p className="text-muted-foreground">Connect your social accounts so your AI manager can learn from your social presence.</p>
      </div>

      {message && (
        <div
          className={cn(
            "p-4 rounded-md text-sm",
            message.type === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"
          )}
        >
          {message.text}
          <button className="ml-2 underline" onClick={() => setMessage(null)}>Dismiss</button>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Connect your accounts</CardTitle>
          <CardDescription>
            We&apos;ll connect your account and import supported information so your AI can understand your existing social presence.
            We will not publish or reply automatically during this setup phase.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          {!hasFacebook && (
            <Button
              onClick={() => handleConnect("facebook")}
              disabled={loading === "facebook"}
              variant="outline"
              className="gap-2"
            >
              {loading === "facebook" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Facebook className="h-4 w-4" />}
              Connect Facebook
            </Button>
          )}
          {!hasInstagram && (
            <Button
              onClick={() => handleConnect("instagram")}
              disabled={loading === "instagram"}
              variant="outline"
              className="gap-2"
            >
              {loading === "instagram" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Instagram className="h-4 w-4" />}
              Connect Instagram
            </Button>
          )}
          {hasFacebook && hasInstagram && (
            <p className="text-sm text-muted-foreground">All supported platforms are connected.</p>
          )}
        </CardContent>
      </Card>

      {connectedAccounts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Connected accounts</h2>
          {connectedAccounts.map((account) => (
            <Card key={account.id}>
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <PlatformIcon platform={account.platform} />
                  <div>
                    <div className="font-medium">{account.account_name}</div>
                    {account.username && <div className="text-sm text-muted-foreground">@{account.username}</div>}
                    <div className="text-xs text-muted-foreground mt-1">
                      Last synced: {formatTimeAgo(account.last_successful_sync_at)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={account.status} />
                  {account.status === "active" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSync(account)}
                      disabled={syncing === account.id}
                    >
                      {syncing === account.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                      Sync now
                    </Button>
                  )}
                  {account.profile_url && (
                    <a href={account.profile_url} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="ghost">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </a>
                  )}
                  {account.status === "expired" && (
                    <Button size="sm" variant="outline" onClick={() => handleReconnect(account.id)}>
                      Reconnect
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDisconnect(account.id)}
                    disabled={loading === account.id}
                  >
                    <Unlink className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
              {account.last_sync_error && (
                <div className="px-6 pb-4">
                  <p className="text-sm text-red-600">{account.last_sync_error}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
