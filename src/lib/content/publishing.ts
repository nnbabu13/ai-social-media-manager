import { createClient } from "@/lib/supabase/server";
import { MetaPublisher, type PublishInput } from "./publishers/meta-publisher";

export interface PublishJob {
  id: string;
  contentScheduleId: string;
  contentItemId: string;
  socialAccountId: string;
  status: string;
  attemptCount: number;
  lastError?: string;
  providerPostId?: string;
  idempotencyKey: string;
  createdAt: string;
}

export async function createPublishJob(
  scheduleId: string,
  contentItemId: string,
  socialAccountId: string
): Promise<{ success: boolean; jobId?: string; error?: string }> {
  const supabase = await createClient();

  const idempotencyKey = `pub_${scheduleId}_${Date.now()}`;

  const { data, error } = await supabase
    .from("content_publish_jobs")
    .insert({
      content_schedule_id: scheduleId,
      content_item_id: contentItemId,
      social_account_id: socialAccountId,
      status: "queued",
      idempotency_key: idempotencyKey,
    })
    .select("id")
    .single();

  if (error) {
    return { success: false, error: "Failed to create publish job" };
  }

  return { success: true, jobId: data.id };
}

export async function processPublishJob(jobId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { data: job, error: jobErr } = await supabase
    .from("content_publish_jobs")
    .select(`
      *,
      content_schedules (*),
      content_items (*),
      social_accounts (*)
    `)
    .eq("id", jobId)
    .single();

  if (jobErr || !job) {
    return { success: false, error: "Job not found" };
  }

  if (job.status !== "queued" && job.status !== "failed") {
    return { success: false, error: "Job cannot be processed in current state" };
  }

  if (job.attempt_count >= job.max_attempts) {
    return { success: false, error: "Max attempts exceeded" };
  }

  await supabase
    .from("content_publish_jobs")
    .update({
      status: "processing",
      attempt_count: job.attempt_count + 1,
      started_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  await supabase
    .from("content_schedules")
    .update({ status: "publishing" })
    .eq("id", job.content_schedule_id);

  await supabase
    .from("content_items")
    .update({ status: "publishing" })
    .eq("id", job.content_item_id);

  const publisher = new MetaPublisher();
  const content = job.content_items as any;
  const account = job.social_accounts as any;

  const publishInput: PublishInput = {
    accountId: account.platform_user_id || account.id,
    caption: content.body || "",
    mediaUrl: content.media_url,
    mediaType: (content.media_type as "image" | "video") || "image",
  };

  const result = await publisher.publishPost(publishInput, account.access_token_encrypted);

  if (result.success) {
    await supabase
      .from("content_publish_jobs")
      .update({
        status: "published",
        provider_post_id: result.providerPostId,
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    await supabase
      .from("content_schedules")
      .update({
        status: "published",
        provider_post_id: result.providerPostId,
        published_at: new Date().toISOString(),
      })
      .eq("id", job.content_schedule_id);

    await supabase
      .from("content_items")
      .update({ status: "published" })
      .eq("id", job.content_item_id);

    if (result.providerPostId) {
      await supabase.from("social_posts").insert({
        social_account_id: job.social_account_id,
        platform_post_id: result.providerPostId,
        content: content.body,
        media_url: content.media_url,
        posted_at: new Date().toISOString(),
      });
    }

    return { success: true };
  } else {
    const newStatus = result.retryable && job.attempt_count + 1 < job.max_attempts
      ? "queued"
      : "failed";

    await supabase
      .from("content_publish_jobs")
      .update({
        status: newStatus,
        last_error: result.error,
        error_type: classifyError(result.errorCode),
      })
      .eq("id", jobId);

    if (newStatus === "failed") {
      await supabase
        .from("content_schedules")
        .update({ status: "failed", failure_reason: result.error })
        .eq("id", job.content_schedule_id);

      await supabase
        .from("content_items")
        .update({ status: "failed" })
        .eq("id", job.content_item_id);
    }

    return { success: false, error: result.error };
  }
}

function classifyError(errorCode?: number): string {
  if (!errorCode) return "unknown_error";

  if (errorCode === 190) return "token_expired";
  if (errorCode === 4 || errorCode === 17) return "rate_limited";
  if (errorCode === 324 || errorCode === 368) return "permission_error";
  if (errorCode >= 500) return "network_error";

  return "provider_error";
}

export async function retryPublishJob(jobId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { data: job, error } = await supabase
    .from("content_publish_jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (error || !job) {
    return { success: false, error: "Job not found" };
  }

  if (job.status !== "failed") {
    return { success: false, error: "Only failed jobs can be retried" };
  }

  const { error: updateErr } = await supabase
    .from("content_publish_jobs")
    .update({
      status: "queued",
      last_error: null,
      error_type: null,
    })
    .eq("id", jobId);

  if (updateErr) {
    return { success: false, error: "Failed to retry job" };
  }

  return processPublishJob(jobId);
}

export async function getPublishJobs(businessId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("content_publish_jobs")
    .select(`
      *,
      content_items (id, title, pillar, status),
      social_accounts (id, platform, username)
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return [];

  return data || [];
}
