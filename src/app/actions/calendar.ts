"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  scheduleContent,
  rescheduleContent,
  cancelSchedule,
  getSchedulesForContent,
  getUpcomingSchedules,
  type ScheduleContentInput,
} from "@/lib/content/scheduling";
import {
  createPublishJob,
  processPublishJob,
  retryPublishJob,
  getPublishJobs,
} from "@/lib/content/publishing";
import { transitionContent } from "@/lib/content/state-machine";

export async function scheduleContentAction(input: ScheduleContentInput) {
  const result = await scheduleContent(input);
  if (result.success) {
    revalidatePath("/content/calendar");
    revalidatePath("/content");
  }
  return result;
}

export async function rescheduleAction(scheduleId: string, newDate: Date, timezone: string) {
  const result = await rescheduleContent(scheduleId, newDate, timezone);
  if (result.success) {
    revalidatePath("/content/calendar");
    revalidatePath("/content");
  }
  return result;
}

export async function cancelScheduleAction(scheduleId: string) {
  const result = await cancelSchedule(scheduleId);
  if (result.success) {
    revalidatePath("/content/calendar");
    revalidatePath("/content");
  }
  return result;
}

export async function approveContentAction(contentItemId: string) {
  const supabase = await createClient();

  const { data: content, error } = await supabase
    .from("content_items")
    .select("id, status")
    .eq("id", contentItemId)
    .single();

  if (error || !content) {
    return { success: false, error: "Content not found" };
  }

  const transition = transitionContent(content.status as any, "approved");
  if (!transition.valid) {
    return { success: false, error: transition.error };
  }

  const { error: updateErr } = await supabase
    .from("content_items")
    .update({
      status: "approved",
      approved_at: new Date().toISOString(),
    })
    .eq("id", contentItemId);

  if (updateErr) {
    return { success: false, error: "Failed to approve content" };
  }

  revalidatePath("/content");
  revalidatePath("/content/calendar");
  return { success: true };
}

export async function publishNowAction(contentItemId: string, socialAccountId: string) {
  const supabase = await createClient();

  const { data: content, error: contentErr } = await supabase
    .from("content_items")
    .select("id, status")
    .eq("id", contentItemId)
    .single();

  if (contentErr || !content) {
    return { success: false, error: "Content not found" };
  }

  if (content.status !== "approved") {
    return { success: false, error: "Content must be approved before publishing" };
  }

  const { data: account, error: accountErr } = await supabase
    .from("social_accounts")
    .select("id, status, access_token_encrypted")
    .eq("id", socialAccountId)
    .single();

  if (accountErr || !account) {
    return { success: false, error: "Social account not found" };
  }

  if (account.status !== "active") {
    return { success: false, error: "Social account is not active" };
  }

  if (!account.access_token_encrypted) {
    return { success: false, error: "Social account needs to be reconnected" };
  }

  const scheduleResult = await scheduleContent({
    contentItemId,
    socialAccountId,
    scheduledAt: new Date(),
    timezone: "UTC",
    provider: "meta",
  });

  if (!scheduleResult.success || !scheduleResult.scheduleId) {
    return { success: false, error: scheduleResult.error || "Failed to create schedule" };
  }

  const jobResult = await createPublishJob(scheduleResult.scheduleId, contentItemId, socialAccountId);
  if (!jobResult.success || !jobResult.jobId) {
    return { success: false, error: jobResult.error || "Failed to create publish job" };
  }

  const processResult = await processPublishJob(jobResult.jobId);

  revalidatePath("/content");
  revalidatePath("/content/calendar");

  return processResult;
}

export async function retryPublishAction(jobId: string) {
  const result = await retryPublishJob(jobId);
  if (result.success) {
    revalidatePath("/content");
    revalidatePath("/content/calendar");
    revalidatePath("/content/history");
  }
  return result;
}

export async function getSchedulesForContentAction(contentItemId: string) {
  return getSchedulesForContent(contentItemId);
}

export async function getUpcomingSchedulesAction(businessId: string, days: number = 7) {
  return getUpcomingSchedules(businessId, days);
}

export async function getCalendarSchedulesAction(startDate: string, endDate: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("content_schedules")
    .select(`
      *,
      content_items (
        id, title, body, pillar, persona,
        objective, platform_content, status,
        current_version, brain_version, strategy_version
      ),
      social_accounts (
        id, platform, username
      )
    `)
    .gte("scheduled_at_utc", startDate)
    .lte("scheduled_at_utc", endDate)
    .not("status", "in", "(cancelled)")
    .order("scheduled_at_utc", { ascending: true });

  if (error) return [];

  return data || [];
}

export async function getPublishHistoryAction(businessId: string) {
  return getPublishJobs(businessId);
}

export async function getContentForCalendarAction(businessId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("content_items")
    .select(`
      id, title, body, pillar, persona,
      objective, status, platform_content,
      current_version, brain_version, strategy_version,
      created_at, updated_at
    `)
    .eq("business_id", businessId)
    .in("status", ["draft", "review", "approved", "scheduled", "publishing", "published", "failed"])
    .order("created_at", { ascending: false });

  if (error) return [];

  return data || [];
}
