"use server";

import { createClient } from "@/lib/supabase/server";
import { decryptToken } from "@/lib/social/token-encryption";
import { MetaProvider, classifyMetaError } from "@/lib/social/providers/meta";
import { createServerAuditLog, AuditActions } from "@/lib/audit-server";
import { createServerNotification } from "@/lib/notifications-server";
import type { SyncStatus, PaginatedResult, NormalizedSocialPost, NormalizedSocialComment } from "@/types/social";

const metaProvider = new MetaProvider();
const MAX_SYNC_ITEMS = 5000;
const PAGE_SIZE = 100;

async function getDecryptedToken(accountId: string): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("social_account_credentials")
    .select("access_token_encrypted, token_expires_at")
    .eq("social_account_id", accountId)
    .single();

  if (error || !data) throw new Error("Credentials not found");

  if (data.token_expires_at && new Date(data.token_expires_at) < new Date()) {
    throw new Error("Token expired");
  }

  return decryptToken(data.access_token_encrypted);
}

async function updateSyncJob(
  jobId: string,
  update: Partial<{
    status: SyncStatus;
    progress: Record<string, unknown>;
    items_found: number;
    items_processed: number;
    error: string;
    started_at: string;
    completed_at: string;
  }>
) {
  const supabase = await createClient();
  await supabase.from("social_sync_jobs").update(update).eq("id", jobId);
}

// ========== Create and run initial sync ==========
export async function runInitialSync(accountId: string, businessId: string, userId: string) {
  const supabase = await createClient();

  const { data: job, error: jobErr } = await supabase
    .from("social_sync_jobs")
    .insert({
      business_id: businessId,
      social_account_id: accountId,
      sync_type: "initial",
      status: "processing",
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (jobErr || !job) throw new Error(`Failed to create sync job: ${jobErr?.message}`);

  const jobId = job.id;

  await supabase
    .from("social_accounts")
    .update({ status: "syncing", last_sync_started_at: new Date().toISOString() })
    .eq("id", accountId);

  await createServerAuditLog({
    businessId,
    userId,
    action: AuditActions.SOCIAL_SYNC_STARTED,
    entityType: "social_sync_job",
    entityId: jobId,
    metadata: { account_id: accountId, sync_type: "initial" },
  });

  try {
    const accessToken = await getDecryptedToken(accountId);

    const { data: account } = await supabase
      .from("social_accounts")
      .select("platform, platform_account_id")
      .eq("id", accountId)
      .single();

    if (!account) throw new Error("Account not found");

    let totalPosts = 0;
    let totalComments = 0;

    // Sync posts
    const postsResult = await syncPosts(
      accountId,
      account.platform_account_id,
      accessToken,
      jobId
    );
    totalPosts = postsResult;

    // Sync comments for each post
    const { data: posts } = await supabase
      .from("social_posts")
      .select("id, platform_post_id")
      .eq("social_account_id", accountId);

    if (posts) {
      for (const post of posts) {
        try {
          const comments = await syncComments(
            accountId,
            post.id,
            post.platform_post_id,
            accessToken
          );
          totalComments += comments;
        } catch {
          // Continue with next post if comment sync fails
        }
      }
    }

    // Sync metrics
    await syncMetrics(accountId, account.platform_account_id, accessToken);

    await updateSyncJob(jobId, {
      status: "completed",
      items_found: totalPosts + totalComments,
      items_processed: totalPosts + totalComments,
      completed_at: new Date().toISOString(),
    });

    await supabase
      .from("social_accounts")
      .update({
        status: "active",
        last_synced_at: new Date().toISOString(),
        last_successful_sync_at: new Date().toISOString(),
        last_sync_error: null,
      })
      .eq("id", accountId);

    await createServerAuditLog({
      businessId,
      userId,
      action: AuditActions.SOCIAL_SYNC_COMPLETED,
      entityType: "social_sync_job",
      entityId: jobId,
      metadata: { posts: totalPosts, comments: totalComments },
    });

    return { success: true, posts: totalPosts, comments: totalComments };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    const { retryable, reauthRequired } = classifyMetaError(error);

    const status = reauthRequired ? "expired" : "error";
    const connStatus = reauthRequired ? "expired" : "error";

    await supabase
      .from("social_accounts")
      .update({
        status,
        connection_status: connStatus,
        last_sync_error: msg,
      })
      .eq("id", accountId);

    await updateSyncJob(jobId, {
      status: "failed",
      error: msg,
      completed_at: new Date().toISOString(),
    });

    await createServerAuditLog({
      businessId,
      userId,
      action: AuditActions.SOCIAL_SYNC_FAILED,
      entityType: "social_sync_job",
      entityId: jobId,
      metadata: { error: msg, retryable, reauth_required: reauthRequired },
    });

    if (reauthRequired) {
      const { data: bizData } = await supabase
        .from("social_accounts")
        .select("business_id")
        .eq("id", accountId)
        .single();

      const { data: userData } = await supabase.auth.getUser();

      if (bizData && userData.user) {
        await createServerNotification({
          businessId: bizData.business_id,
          userId: userData.user.id,
          type: "account_disconnected",
          title: "Social account connection expired",
          message: `Your social account needs to be reconnected. Please go to Accounts and reconnect.`,
          severity: "warning",
        });
      }
    }

    return { success: false, error: msg, retryable, reauthRequired };
  }
}

// ========== Run manual sync ==========
export async function runManualSync(accountId: string, businessId: string, userId: string) {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("social_sync_jobs")
    .select("id")
    .eq("social_account_id", accountId)
    .in("status", ["queued", "processing"])
    .limit(1);

  if (existing && existing.length > 0) {
    return { success: false, error: "Sync already in progress" };
  }

  return runInitialSync(accountId, businessId, userId);
}

// ========== Sync posts (internal) ==========
async function syncPosts(
  accountId: string,
  platformAccountId: string,
  accessToken: string,
  jobId: string
): Promise<number> {
  const supabase = await createClient();
  const token = { access_token: accessToken };
  let totalUpserted = 0;
  let totalFound = 0;
  let since: string | undefined;

  const { data: lastSync } = await supabase
    .from("social_accounts")
    .select("last_successful_sync_at")
    .eq("id", accountId)
    .single();

  if (lastSync?.last_successful_sync_at) {
    since = Math.floor(
      new Date(lastSync.last_successful_sync_at).getTime() / 1000
    ).toString();
  }

  while (totalFound < MAX_SYNC_ITEMS) {
    const result = await metaProvider.fetchPosts({
      accountId: platformAccountId,
      token,
      options: { limit: PAGE_SIZE, since },
    });

    if (result.data.length === 0) break;

    const rows = result.data.map((post) => ({
      social_account_id: accountId,
      platform_post_id: post.platform_post_id,
      post_type: post.post_type,
      caption: post.caption,
      permalink: post.permalink,
      published_at: post.published_at || null,
      media_url: post.media_url,
      thumbnail_url: post.thumbnail_url,
      raw_data: post.raw_data || {},
    }));

    const { data: upserted } = await supabase
      .from("social_posts")
      .upsert(rows, {
        onConflict: "social_account_id,platform_post_id",
        ignoreDuplicates: false,
      })
      .select("id");

    totalUpserted += upserted?.length || 0;
    totalFound += result.data.length;

    await updateSyncJob(jobId, {
      progress: { posts_found: totalFound, posts_upserted: totalUpserted },
      items_found: totalFound,
      items_processed: totalUpserted,
    });

    if (!result.paging?.next) break;

    since = undefined;
  }

  return totalUpserted;
}

// ========== Sync comments (internal) ==========
async function syncComments(
  accountId: string,
  socialPostId: string,
  platformPostId: string,
  accessToken: string
): Promise<number> {
  const supabase = await createClient();
  const token = { access_token: accessToken };
  let totalUpserted = 0;

  const result = await metaProvider.fetchComments({
    postId: platformPostId,
    token,
    options: { limit: PAGE_SIZE },
  });

  if (result.data.length === 0) return 0;

  const rows = result.data.map((comment) => ({
    social_account_id: accountId,
    social_post_id: socialPostId,
    platform_comment_id: comment.platform_comment_id,
    parent_platform_comment_id: comment.parent_platform_comment_id,
    author_platform_id: comment.author_platform_id,
    author_name: comment.author_name,
    text: comment.text,
    created_at: comment.created_at || null,
    raw_data: comment.raw_data || {},
  }));

  const { data: upserted } = await supabase
    .from("social_comments")
    .upsert(rows, {
      onConflict: "social_account_id,platform_comment_id",
      ignoreDuplicates: false,
    })
    .select("id");

  totalUpserted = upserted?.length || 0;

  // Handle pagination
  if (result.paging?.next) {
    // For now, we only fetch first page of comments
    // Future: implement cursor-based pagination
  }

  return totalUpserted;
}

// ========== Sync metrics (internal) ==========
async function syncMetrics(
  accountId: string,
  platformAccountId: string,
  accessToken: string
) {
  const supabase = await createClient();
  const token = { access_token: accessToken };

  const metrics = await metaProvider.fetchMetrics({
    accountId: platformAccountId,
    token,
  });

  const today = new Date().toISOString().split("T")[0];

  await supabase.from("social_account_metrics").upsert(
    {
      social_account_id: accountId,
      metric_date: today,
      followers_count: metrics.followers_count,
      following_count: metrics.following_count,
      posts_count: metrics.posts_count,
      raw_data: metrics.raw_data || {},
    },
    { onConflict: "social_account_id,metric_date" }
  );
}
