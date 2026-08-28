import { createClient } from "@/lib/supabase/server";
import type { Json, NotificationSeverity } from "@/types/database";
import { NotificationTypes, type NotificationType } from "@/lib/notifications";

interface NotificationParams {
  businessId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  severity?: NotificationSeverity;
  metadata?: Json;
}

export async function createServerNotification({
  businessId,
  userId,
  type,
  title,
  message,
  severity = "info",
  metadata = {},
}: NotificationParams) {
  const supabase = await createClient();

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

export { NotificationTypes };
export type { NotificationType };
