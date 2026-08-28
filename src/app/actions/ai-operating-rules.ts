"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getDefaultRiskLevel, getDefaultMode, resolveAIActionPolicy, detectRuleConflicts } from "@/lib/ai-operating-rules/policy-resolver";
import type { AIOperatingRule, CustomAIRule, AIEscalationRule, AutonomyConfig, AIActionType } from "@/types/ai-operating-rules";
import { AI_ACTION_TYPES } from "@/types/ai-operating-rules";
import { revalidatePath } from "next/cache";
import { createBusinessBrainVersion } from "@/lib/business-brain/versioning";

export async function getAIOperatingRules(businessId: string): Promise<{
  operatingRules: AIOperatingRule[];
  customRules: CustomAIRule[];
  escalationRules: AIEscalationRule[];
  autonomyConfig: AutonomyConfig | null;
}> {
  const supabase = await createClient();

  const [operatingRulesRes, customRulesRes, escalationRulesRes, autonomyConfigRes] = await Promise.all([
    supabase.from("ai_operating_rules").select("*").eq("business_id", businessId),
    supabase.from("custom_ai_rules").select("*").eq("business_id", businessId),
    supabase.from("ai_escalation_rules").select("*").eq("business_id", businessId),
    supabase.from("autonomy_configs").select("*").eq("business_id", businessId).single(),
  ]);

  return {
    operatingRules: operatingRulesRes.data || [],
    customRules: customRulesRes.data || [],
    escalationRules: escalationRulesRes.data || [],
    autonomyConfig: autonomyConfigRes.data || null,
  };
}

export async function initializeDefaultRules(businessId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const serviceClient = await createServiceClient();

  const { data: existing } = await serviceClient
    .from("ai_operating_rules")
    .select("id")
    .eq("business_id", businessId)
    .limit(1);

  if (existing && existing.length > 0) {
    return { success: true, message: "Rules already initialized" };
  }

  const defaultRules = AI_ACTION_TYPES.map(actionType => ({
    business_id: businessId,
    action_type: actionType,
    mode: getDefaultMode(actionType),
    risk_level: getDefaultRiskLevel(actionType),
    enabled: true,
    source_type: "system_default" as const,
  }));

  const result = await serviceClient.from("ai_operating_rules").insert(defaultRules);

  if (result.error) {
    return { error: "Failed to initialize rules" };
  }

  await serviceClient.from("autonomy_configs").insert({
    business_id: businessId,
    profile: "assistant",
    minimum_confidence_for_auto: 0.9,
  });

  await serviceClient.from("ai_action_audit_log").insert({
    business_id: businessId,
    event_type: "AI_POLICY_CREATED",
    reason: "Default rules initialized",
  });

  await createBusinessBrainVersion({
    businessId,
    changeType: "operations_updated",
    changeSummary: "Default AI operating rules initialized",
    createdBy: user.id,
  });

  revalidatePath("/business-brain");
  revalidatePath("/business-brain/operations");

  return { success: true };
}

export async function updateOperatingRule(ruleId: string, updates: Partial<AIOperatingRule>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const serviceClient = await createServiceClient();

  const { id, business_id, ...updateData } = updates;

  const result = await serviceClient
    .from("ai_operating_rules")
    .update({
      ...updateData,
      source_type: "owner_confirmed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", ruleId)
    .select()
    .single();

  if (result.error) {
    return { error: "Failed to update rule" };
  }

  await serviceClient.from("ai_action_audit_log").insert({
    business_id: result.data.business_id,
    event_type: "AI_POLICY_UPDATED",
    action_type: result.data.action_type,
    mode: result.data.mode,
    reason: "Owner updated operating rule",
  });

  await createBusinessBrainVersion({
    businessId: result.data.business_id,
    changeType: "operations_updated",
    changeSummary: `Updated rule: ${result.data.action_type} → ${result.data.mode}`,
    createdBy: user.id,
  });

  revalidatePath("/business-brain");
  revalidatePath("/business-brain/operations");

  return { rule: result.data };
}

export async function updateAutonomyProfile(businessId: string, profile: AIActionType extends infer T ? string : never) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const serviceClient = await createServiceClient();

  const { data: existing } = await serviceClient
    .from("autonomy_configs")
    .select("id")
    .eq("business_id", businessId)
    .single();

  let result;
  if (existing) {
    result = await serviceClient
      .from("autonomy_configs")
      .update({
        profile,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select()
      .single();
  } else {
    result = await serviceClient
      .from("autonomy_configs")
      .insert({
        business_id: businessId,
        profile,
      })
      .select()
      .single();
  }

  if (result.error) {
    return { error: "Failed to update profile" };
  }

  await serviceClient.from("ai_action_audit_log").insert({
    business_id: businessId,
    event_type: "AI_AUTONOMY_PROFILE_CHANGED",
    reason: `Profile changed to ${profile}`,
  });

  await createBusinessBrainVersion({
    businessId,
    changeType: "operations_updated",
    changeSummary: `Autonomy profile changed to ${profile}`,
    createdBy: user.id,
  });

  revalidatePath("/business-brain");
  revalidatePath("/business-brain/operations");

  return { config: result.data };
}

export async function addCustomRule(businessId: string, rule: Omit<CustomAIRule, "id" | "created_at" | "updated_at">) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const serviceClient = await createServiceClient();

  const result = await serviceClient
    .from("custom_ai_rules")
    .insert({
      ...rule,
      business_id: businessId,
      source_type: "owner_confirmed",
    })
    .select()
    .single();

  if (result.error) {
    return { error: "Failed to add rule" };
  }

  await serviceClient.from("ai_action_audit_log").insert({
    business_id: businessId,
    event_type: "AI_POLICY_CREATED",
    reason: `Custom rule added: ${rule.name}`,
  });

  revalidatePath("/business-brain");
  revalidatePath("/business-brain/operations");

  return { rule: result.data };
}

export async function updateCustomRule(ruleId: string, updates: Partial<CustomAIRule>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const serviceClient = await createServiceClient();

  const { id, business_id, ...updateData } = updates;

  const result = await serviceClient
    .from("custom_ai_rules")
    .update({
      ...updateData,
      updated_at: new Date().toISOString(),
    })
    .eq("id", ruleId)
    .select()
    .single();

  if (result.error) {
    return { error: "Failed to update rule" };
  }

  await serviceClient.from("ai_action_audit_log").insert({
    business_id: result.data.business_id,
    event_type: "AI_POLICY_UPDATED",
    reason: `Custom rule updated: ${result.data.name}`,
  });

  revalidatePath("/business-brain");
  revalidatePath("/business-brain/operations");

  return { rule: result.data };
}

export async function deleteCustomRule(ruleId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const serviceClient = await createServiceClient();

  const { data: rule } = await serviceClient
    .from("custom_ai_rules")
    .select("business_id, name")
    .eq("id", ruleId)
    .single();

  const result = await serviceClient
    .from("custom_ai_rules")
    .delete()
    .eq("id", ruleId);

  if (result.error) {
    return { error: "Failed to delete rule" };
  }

  if (rule) {
    await serviceClient.from("ai_action_audit_log").insert({
      business_id: rule.business_id,
      event_type: "AI_POLICY_DELETED",
      reason: `Custom rule deleted: ${rule.name}`,
    });
  }

  revalidatePath("/business-brain");
  revalidatePath("/business-brain/operations");

  return { success: true };
}

export async function addEscalationRule(businessId: string, rule: Omit<AIEscalationRule, "id" | "created_at" | "updated_at">) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const serviceClient = await createServiceClient();

  const result = await serviceClient
    .from("ai_escalation_rules")
    .insert({
      ...rule,
      business_id: businessId,
    })
    .select()
    .single();

  if (result.error) {
    return { error: "Failed to add escalation rule" };
  }

  revalidatePath("/business-brain");
  revalidatePath("/business-brain/operations");

  return { rule: result.data };
}

export async function deleteEscalationRule(ruleId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const serviceClient = await createServiceClient();

  const result = await serviceClient
    .from("ai_escalation_rules")
    .delete()
    .eq("id", ruleId);

  if (result.error) {
    return { error: "Failed to delete escalation rule" };
  }

  revalidatePath("/business-brain");
  revalidatePath("/business-brain/operations");

  return { success: true };
}

export async function getAuditLog(businessId: string, limit = 50) {
  const supabase = await createClient();

  const { data: logs } = await supabase
    .from("ai_action_audit_log")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return logs || [];
}
