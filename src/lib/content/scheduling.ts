import { createClient } from "@/lib/supabase/server";
import { transitionContent } from "./state-machine";

export interface ScheduleContentInput {
  contentItemId: string;
  socialAccountId: string;
  scheduledAt: Date;
  timezone: string;
  provider?: string;
}

export interface ScheduleResult {
  success: boolean;
  scheduleId?: string;
  error?: string;
}

export async function scheduleContent(input: ScheduleContentInput): Promise<ScheduleResult> {
  const supabase = await createClient();

  const { data: content, error: contentErr } = await supabase
    .from("content_items")
    .select("id, status")
    .eq("id", input.contentItemId)
    .single();

  if (contentErr || !content) {
    return { success: false, error: "Content not found" };
  }

  const transition = transitionContent(content.status as any, "scheduled");
  if (!transition.valid) {
    return { success: false, error: transition.error };
  }

  const { data: existing } = await supabase
    .from("content_schedules")
    .select("id")
    .eq("content_item_id", input.contentItemId)
    .eq("social_account_id", input.socialAccountId)
    .not("status", "in", "(cancelled,failed)")
    .single();

  if (existing) {
    return { success: false, error: "Content already scheduled for this account" };
  }

  const scheduledAtUtc = new Date(input.scheduledAt);
  const now = new Date();
  if (scheduledAtUtc <= now) {
    return { success: false, error: "Scheduled time must be in the future" };
  }

  const { data: schedule, error: scheduleErr } = await supabase
    .from("content_schedules")
    .insert({
      content_item_id: input.contentItemId,
      social_account_id: input.socialAccountId,
      scheduled_at: input.scheduledAt.toISOString(),
      scheduled_at_utc: scheduledAtUtc.toISOString(),
      timezone: input.timezone,
      status: "confirmed",
      provider: input.provider || "meta",
    })
    .select("id")
    .single();

  if (scheduleErr) {
    return { success: false, error: "Failed to create schedule" };
  }

  const { error: updateErr } = await supabase
    .from("content_items")
    .update({ status: "scheduled" })
    .eq("id", input.contentItemId);

  if (updateErr) {
    await supabase.from("content_schedules").delete().eq("id", schedule.id);
    return { success: false, error: "Failed to update content status" };
  }

  return { success: true, scheduleId: schedule.id };
}

export async function rescheduleContent(
  scheduleId: string,
  newScheduledAt: Date,
  timezone: string
): Promise<ScheduleResult> {
  const supabase = await createClient();

  const { data: schedule, error } = await supabase
    .from("content_schedules")
    .select("id, content_item_id, status")
    .eq("id", scheduleId)
    .single();

  if (error || !schedule) {
    return { success: false, error: "Schedule not found" };
  }

  if (schedule.status === "publishing" || schedule.status === "published") {
    return { success: false, error: "Cannot reschedule a published post" };
  }

  if (newScheduledAt <= new Date()) {
    return { success: false, error: "Scheduled time must be in the future" };
  }

  const { error: updateErr } = await supabase
    .from("content_schedules")
    .update({
      scheduled_at: newScheduledAt.toISOString(),
      scheduled_at_utc: newScheduledAt.toISOString(),
      timezone,
      status: "confirmed",
    })
    .eq("id", scheduleId);

  if (updateErr) {
    return { success: false, error: "Failed to reschedule" };
  }

  return { success: true, scheduleId };
}

export async function cancelSchedule(scheduleId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { data: schedule, error } = await supabase
    .from("content_schedules")
    .select("id, content_item_id, status")
    .eq("id", scheduleId)
    .single();

  if (error || !schedule) {
    return { success: false, error: "Schedule not found" };
  }

  if (schedule.status === "published") {
    return { success: false, error: "Cannot cancel a published post" };
  }

  const { error: updateErr } = await supabase
    .from("content_schedules")
    .update({ status: "cancelled" })
    .eq("id", scheduleId);

  if (updateErr) {
    return { success: false, error: "Failed to cancel schedule" };
  }

  const hasOtherSchedules = await supabase
    .from("content_schedules")
    .select("id")
    .eq("content_item_id", schedule.content_item_id)
    .not("status", "in", "(cancelled,failed)")
    .limit(1);

  if (!hasOtherSchedules.data || hasOtherSchedules.data.length === 0) {
    await supabase
      .from("content_items")
      .update({ status: "approved" })
      .eq("id", schedule.content_item_id);
  }

  return { success: true };
}

export async function getSchedulesForContent(contentItemId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("content_schedules")
    .select(`
      *,
      social_accounts (
        id,
        platform,
        username,
        display_name
      )
    `)
    .eq("content_item_id", contentItemId)
    .order("scheduled_at", { ascending: true });

  if (error) return [];

  return data || [];
}

export async function getUpcomingSchedules(businessId: string, days: number = 7) {
  const supabase = await createClient();
  const now = new Date();
  const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from("content_schedules")
    .select(`
      *,
      content_items (
        id, title, body, pillar, persona,
        objective, platform_content
      ),
      social_accounts (
        id, platform, username
      )
    `)
    .gte("scheduled_at_utc", now.toISOString())
    .lte("scheduled_at_utc", future.toISOString())
    .not("status", "in", "(cancelled,failed)")
    .order("scheduled_at_utc", { ascending: true });

  if (error) return [];

  return data || [];
}
