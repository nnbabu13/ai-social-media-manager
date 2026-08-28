import type { Json } from "@/types/database";

interface AuditLogParams {
  businessId: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Json;
}

export async function createAuditLog({
  businessId,
  userId,
  action,
  entityType,
  entityId,
  metadata = {},
}: AuditLogParams) {
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase.from("audit_logs").insert({
    business_id: businessId,
    user_id: userId || user?.id || null,
    action,
    entity_type: entityType,
    entity_id: entityId || null,
    metadata,
  });

  if (error) {
    console.error("Failed to create audit log:", error);
  }
}

export const AuditActions = {
  BUSINESS_CREATED: "business_created",
  BUSINESS_UPDATED: "business_updated",
  GOALS_UPDATED: "goals_updated",
  BRAND_PROFILE_UPDATED: "brand_profile_updated",
  AI_POLICY_UPDATED: "ai_policy_updated",
  PRODUCT_CREATED: "product_created",
  PRODUCT_UPDATED: "product_updated",
  PRODUCT_DELETED: "product_deleted",
  USER_LOGGED_IN: "user_logged_in",
  SOCIAL_ACCOUNT_CONNECT_STARTED: "social_account_connect_started",
  SOCIAL_ACCOUNT_CONNECTED: "social_account_connected",
  SOCIAL_ACCOUNT_CONNECTION_FAILED: "social_account_connection_failed",
  SOCIAL_ACCOUNT_RECONNECTED: "social_account_reconnected",
  SOCIAL_ACCOUNT_DISCONNECTED: "social_account_disconnected",
  SOCIAL_SYNC_STARTED: "social_sync_started",
  SOCIAL_SYNC_COMPLETED: "social_sync_completed",
  SOCIAL_SYNC_FAILED: "social_sync_failed",
  SOCIAL_TOKEN_EXPIRED: "social_token_expired",
  SOCIAL_PERMISSION_ERROR: "social_permission_error",
} as const;

export type AuditAction = (typeof AuditActions)[keyof typeof AuditActions];
