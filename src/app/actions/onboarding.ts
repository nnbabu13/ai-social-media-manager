"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { initializeDefaultRules } from "./ai-operating-rules";
import { createBusinessBrainVersion } from "@/lib/business-brain/versioning";

interface OnboardingData {
  business: {
    name: string;
    slug: string;
    category: string;
    website_url: string | null;
    description: string | null;
    country: string | null;
    region: string | null;
    city: string | null;
    target_customers: string | null;
  };
  goals: { goal: string; is_primary: boolean }[];
  brand: {
    tone: string;
    style_description: string | null;
    avoid_words: string | null;
  };
  aiPolicy: {
    autonomy_level: "assistant" | "manager";
    require_approval_discount: boolean;
    require_approval_refund: boolean;
    require_approval_complaint: boolean;
    require_approval_pricing: boolean;
    require_approval_legal: boolean;
    require_approval_medical: boolean;
    require_approval_partnership: boolean;
    require_approval_promises: boolean;
  };
}

export async function completeOnboarding(data: OnboardingData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in" };
  }

  const svc = await createServiceClient();

  const { data: business, error: businessError } = await svc
    .from("businesses")
    .insert(data.business)
    .select()
    .single();

  if (businessError) {
    return { error: businessError.message };
  }

  const { error: memberError } = await svc.from("business_members").insert({
    business_id: business.id,
    user_id: user.id,
    role: "owner",
  });

  if (memberError) {
    return { error: memberError.message };
  }

  if (data.goals.length > 0) {
    await svc.from("business_goals").insert(
      data.goals.map((g) => ({
        business_id: business.id,
        goal: g.goal,
        is_primary: g.is_primary,
      }))
    );
  }

  await svc.from("brand_profiles").insert({
    business_id: business.id,
    tone: data.brand.tone,
    style_description: data.brand.style_description,
    avoid_words: data.brand.avoid_words,
  });

  await svc.from("ai_policies").insert({
    business_id: business.id,
    ...data.aiPolicy,
  });

  await svc.from("audit_logs").insert({
    business_id: business.id,
    user_id: user.id,
    action: "business_created",
    entity_type: "business",
    entity_id: business.id,
    metadata: { business_name: business.name },
  });

  await initializeDefaultRules(business.id);

  await createBusinessBrainVersion({
    businessId: business.id,
    changeType: "brain_initialized",
    changeSummary: "Business created and initialized",
    createdBy: user.id,
  });

  revalidatePath("/dashboard");
  revalidatePath("/business");

  return { success: true, businessId: business.id };
}
