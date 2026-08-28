import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getBusinessBrain } from "@/lib/business-brain";
import type { BusinessBrainContext } from "@/types/business-brain";

export type BrainChangeType =
  | "business_updated"
  | "offering_updated"
  | "audience_updated"
  | "faq_updated"
  | "knowledge_updated"
  | "business_persona_updated"
  | "customer_persona_updated"
  | "strategy_updated"
  | "operations_updated"
  | "policy_updated"
  | "brain_initialized";

export function buildSnapshot(brain: BusinessBrainContext) {
  return {
    business: brain.business,
    products: brain.products,
    services: brain.services,
    goals: brain.goals,
    brand: brain.brand,
    policies: brain.policies,
    facts: brain.facts,
    faqs: brain.faqs,
    locations: brain.locations,
    offers: brain.offers,
    customer_personas: brain.customer_personas,
    business_persona: brain.business_persona,
    strategy: brain.strategy,
    operations: brain.operations,
    readiness: brain.readiness ? {
      score: brain.readiness.score,
      status: brain.readiness.status,
    } : null,
  };
}

export async function createBusinessBrainVersion({
  businessId,
  changeType,
  changeSummary,
  createdBy,
}: {
  businessId: string;
  changeType: BrainChangeType;
  changeSummary?: string;
  createdBy?: string;
}): Promise<{ version: number; error?: string }> {
  const brain = await getBusinessBrain(businessId);
  if (!brain) {
    return { version: 0, error: "Business not found" };
  }

  const serviceClient = await createServiceClient();
  const snapshot = buildSnapshot(brain);

  const { data: currentVersion } = await serviceClient
    .from("brain_versions")
    .select("version_number")
    .eq("business_id", businessId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextVersion = (currentVersion?.version_number || 0) + 1;

  const { error } = await serviceClient
    .from("brain_versions")
    .insert({
      business_id: businessId,
      version_number: nextVersion,
      snapshot,
      change_summary: changeSummary || changeType,
      created_by: createdBy || null,
    });

  if (error) {
    if (error.code === "23505") {
      const retryVersion = nextVersion + 1;
      const { error: retryError } = await serviceClient
        .from("brain_versions")
        .insert({
          business_id: businessId,
          version_number: retryVersion,
          snapshot,
          change_summary: changeSummary || changeType,
          created_by: createdBy || null,
        });

      if (retryError) {
        return { version: 0, error: "Failed to create brain version" };
      }

      await serviceClient.from("ai_action_audit_log").insert({
        business_id: businessId,
        event_type: "BUSINESS_BRAIN_VERSION_CREATED",
        reason: JSON.stringify({ changeType, version: retryVersion, summary: changeSummary }),
      });

      return { version: retryVersion };
    }
    return { version: 0, error: "Failed to create brain version" };
  }

  await serviceClient.from("ai_action_audit_log").insert({
    business_id: businessId,
    event_type: "BUSINESS_BRAIN_VERSION_CREATED",
    reason: JSON.stringify({ changeType, version: nextVersion, summary: changeSummary }),
  });

  return { version: nextVersion };
}
