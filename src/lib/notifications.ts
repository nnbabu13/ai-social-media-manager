import type { Json, NotificationSeverity } from "@/types/database";

interface NotificationParams {
  businessId: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  severity?: NotificationSeverity;
  metadata?: Json;
}

export async function createNotification({
  businessId,
  userId,
  type,
  title,
  message,
  severity = "info",
  metadata = {},
}: NotificationParams) {
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();

  const { error } = await supabase.from("notifications").insert({
    business_id: businessId,
    user_id: userId,
    type,
    title,
    message,
    severity,
    metadata,
  });

  if (error) {
    console.error("Failed to create notification:", error);
  }
}

export const NotificationTypes = {
  CUSTOMER_COMPLAINT: "customer_complaint",
  HIGH_VALUE_LEAD: "high_value_lead",
  ACCOUNT_DISCONNECTED: "account_disconnected",
  PUBLISHING_FAILED: "publishing_failed",
  AI_ACTION_REQUIRES_APPROVAL: "ai_action_requires_approval",
  BUSINESS_CREATED: "business_created",
  ONBOARDING_COMPLETED: "onboarding_completed",
} as const;

export type NotificationType = (typeof NotificationTypes)[keyof typeof NotificationTypes];
