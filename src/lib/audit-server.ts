import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";
import { AuditActions, type AuditAction } from "@/lib/audit";

interface AuditLogParams {
  businessId: string;
  userId?: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  metadata?: Json;
}

export async function createServerAuditLog({
  businessId,
  userId,
  action,
  entityType,
  entityId,
  metadata = {},
}: AuditLogParams) {
  const supabase = await createClient();

  const { error } = await supabase.from("audit_logs").insert({
    business_id: businessId,
    user_id: userId || null,
    action,
    entity_type: entityType,
    entity_id: entityId || null,
    metadata,
  });

  if (error) {
    console.error("Failed to create audit log:", error);
  }
}

export { AuditActions };
export type { AuditAction };
