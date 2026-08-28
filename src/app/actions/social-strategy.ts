"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getBusinessBrain } from "@/lib/business-brain";
import { generateSocialStrategy, validateContentMixPercentages } from "@/lib/social-strategy";
import type { SocialStrategy, ContentPillar } from "@/types/social-strategy";
import { socialStrategySchema } from "@/types/social-strategy";
import { revalidatePath } from "next/cache";
import { createBusinessBrainVersion } from "@/lib/business-brain/versioning";

export async function getSocialStrategy(businessId: string): Promise<{ strategy: SocialStrategy | null; pillars: ContentPillar[] }> {
  const supabase = await createClient();

  const [strategyRes, pillarsRes] = await Promise.all([
    supabase
      .from("social_strategies")
      .select("*")
      .eq("business_id", businessId)
      .single(),
    supabase
      .from("content_pillars")
      .select("*")
      .eq("business_id", businessId)
      .order("recommended_percentage", { ascending: false }),
  ]);

  return {
    strategy: strategyRes.data,
    pillars: pillarsRes.data || [],
  };
}

export async function generateStrategy(businessId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const brain = await getBusinessBrain(businessId);
  if (!brain) return { error: "Business not found" };

  const { strategy: generatedStrategy, pillars: generatedPillars } = generateSocialStrategy(brain);

  const mixValidation = validateContentMixPercentages(generatedStrategy.content_mix);
  if (!mixValidation.valid) {
    return { error: `Content mix must total 100%. Currently at ${100 - mixValidation.remaining}%` };
  }

  const serviceClient = await createServiceClient();

  const { data: existingStrategy } = await serviceClient
    .from("social_strategies")
    .select("id, strategy_status, source_type")
    .eq("business_id", businessId)
    .single();

  const isExistingApproved = existingStrategy &&
    (existingStrategy.strategy_status === "active" || existingStrategy.strategy_status === "approved") &&
    existingStrategy.source_type === "owner_confirmed";

  let strategyResult;
  if (existingStrategy) {
    const newStatus = isExistingApproved ? "review" : "draft";

    strategyResult = await serviceClient
      .from("social_strategies")
      .update({
        ...generatedStrategy,
        business_id: businessId,
        strategy_status: newStatus,
        source_type: "ai_derived",
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingStrategy.id)
      .select()
      .single();
  } else {
    strategyResult = await serviceClient
      .from("social_strategies")
      .insert({
        ...generatedStrategy,
        business_id: businessId,
      })
      .select()
      .single();
  }

  if (strategyResult.error) {
    return { error: "Failed to save strategy", details: strategyResult.error.message };
  }

  await serviceClient
    .from("content_pillars")
    .delete()
    .eq("business_id", businessId);

  const strategyId = strategyResult.data.id;
  const insertedPillars: ContentPillar[] = [];

  for (const pillar of generatedPillars) {
    const result = await serviceClient
      .from("content_pillars")
      .insert({
        ...pillar,
        business_id: businessId,
        strategy_id: strategyId,
      })
      .select()
      .single();

    if (result.data) {
      insertedPillars.push(result.data);
    }
  }

  await serviceClient.from("strategy_versions").insert({
    business_id: businessId,
    strategy_id: strategyId,
    version_number: 1,
    strategy_snapshot: generatedStrategy,
    changed_fields: ["full_generation"],
    reason: isExistingApproved ? "AI regeneration pending review" : "Initial AI-generated strategy",
    user_id: user.id,
  });

  await createBusinessBrainVersion({
    businessId,
    changeType: "strategy_updated",
    changeSummary: isExistingApproved
      ? "AI strategy regenerated - pending owner review"
      : "Initial AI strategy created",
    createdBy: user.id,
  });

  revalidatePath("/business-brain");
  revalidatePath("/business-brain/strategy");

  return {
    strategy: strategyResult.data,
    pillars: insertedPillars,
    requiresReview: isExistingApproved,
  };
}

export async function updateStrategy(businessId: string, updates: Partial<SocialStrategy>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const serviceClient = await createServiceClient();

  const { data: existing } = await serviceClient
    .from("social_strategies")
    .select("id, version_number")
    .eq("business_id", businessId)
    .single();

  if (!existing) {
    return { error: "No strategy found" };
  }

  const { id, ...updateData } = updates;

  const result = await serviceClient
    .from("social_strategies")
    .update({
      ...updateData,
      source_type: "owner_confirmed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", existing.id)
    .select()
    .single();

  if (result.error) {
    return { error: "Failed to update strategy" };
  }

  await serviceClient.from("strategy_versions").insert({
    business_id: businessId,
    strategy_id: existing.id,
    version_number: (existing.version_number || 1) + 1,
    strategy_snapshot: updateData,
    changed_fields: Object.keys(updateData),
    user_id: user.id,
  });

  await createBusinessBrainVersion({
    businessId,
    changeType: "strategy_updated",
    changeSummary: `Strategy updated: ${Object.keys(updateData).join(", ")}`,
    createdBy: user.id,
  });

  revalidatePath("/business-brain");
  revalidatePath("/business-brain/strategy");

  return { strategy: result.data };
}

export async function approveStrategy(businessId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const serviceClient = await createServiceClient();

  const { data: currentStrategy } = await serviceClient
    .from("social_strategies")
    .select("id, strategy_status")
    .eq("business_id", businessId)
    .single();

  if (currentStrategy?.strategy_status === "active") {
    await serviceClient
      .from("social_strategies")
      .update({ strategy_status: "archived" })
      .eq("business_id", businessId)
      .neq("id", currentStrategy.id);
  }

  const result = await serviceClient
    .from("social_strategies")
    .update({
      strategy_status: "approved",
      source_type: "owner_confirmed",
      updated_at: new Date().toISOString(),
    })
    .eq("business_id", businessId)
    .select()
    .single();

  if (result.error) {
    return { error: "Failed to approve strategy" };
  }

  await createBusinessBrainVersion({
    businessId,
    changeType: "strategy_updated",
    changeSummary: "Strategy approved by owner",
    createdBy: user.id,
  });

  revalidatePath("/business-brain");
  revalidatePath("/business-brain/strategy");

  return { strategy: result.data };
}

export async function activateStrategy(businessId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const serviceClient = await createServiceClient();

  await serviceClient
    .from("social_strategies")
    .update({ strategy_status: "approved" })
    .eq("business_id", businessId)
    .neq("strategy_status", "active");

  const result = await serviceClient
    .from("social_strategies")
    .update({
      strategy_status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("business_id", businessId)
    .select()
    .single();

  if (result.error) {
    return { error: "Failed to activate strategy" };
  }

  await createBusinessBrainVersion({
    businessId,
    changeType: "strategy_updated",
    changeSummary: "Strategy activated",
    createdBy: user.id,
  });

  revalidatePath("/business-brain");
  revalidatePath("/business-brain/strategy");

  return { strategy: result.data };
}

export async function updatePillar(pillarId: string, updates: Partial<ContentPillar>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const serviceClient = await createServiceClient();

  const { id, strategy_id, business_id, ...updateData } = updates;

  const result = await serviceClient
    .from("content_pillars")
    .update({
      ...updateData,
      source_type: "owner_confirmed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", pillarId)
    .select()
    .single();

  if (result.error) {
    return { error: "Failed to update pillar" };
  }

  revalidatePath("/business-brain");
  revalidatePath("/business-brain/strategy");

  return { pillar: result.data };
}

export async function addPillar(businessId: string, strategyId: string, pillar: Omit<ContentPillar, "id" | "strategy_id" | "created_at" | "updated_at">) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const serviceClient = await createServiceClient();

  const result = await serviceClient
    .from("content_pillars")
    .insert({
      ...pillar,
      business_id: businessId,
      strategy_id: strategyId,
      source_type: "owner_confirmed",
      approval_status: "approved",
    })
    .select()
    .single();

  if (result.error) {
    return { error: "Failed to add pillar" };
  }

  revalidatePath("/business-brain");
  revalidatePath("/business-brain/strategy");

  return { pillar: result.data };
}

export async function deletePillar(pillarId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const serviceClient = await createServiceClient();

  const result = await serviceClient
    .from("content_pillars")
    .delete()
    .eq("id", pillarId);

  if (result.error) {
    return { error: "Failed to delete pillar" };
  }

  revalidatePath("/business-brain");
  revalidatePath("/business-brain/strategy");

  return { success: true };
}

export async function getStrategyVersions(businessId: string) {
  const supabase = await createClient();

  const { data: versions } = await supabase
    .from("strategy_versions")
    .select("*")
    .eq("business_id", businessId)
    .order("version_number", { ascending: false })
    .limit(10);

  return versions || [];
}
