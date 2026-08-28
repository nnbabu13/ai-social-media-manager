import { createClient } from "@/lib/supabase/server";
import type { ContentGenerationContext } from "@/types/content";

export async function buildContentGenerationContext(params: {
  businessId: string;
  platform: ContentGenerationContext["platform"];
  objective: ContentGenerationContext["objective"];
  pillar: string;
  topic?: string;
  cta?: string;
  personaId?: string;
  socialObservationIds?: string[];
}): Promise<ContentGenerationContext> {
  const supabase = await createClient();

  const [
    businessRes,
    productsRes,
    servicesRes,
    goalsRes,
    brandRes,
    personaRes,
    strategyRes,
    factsRes,
    faqsRes,
    brainVersionRes,
    strategyVersionRes,
  ] = await Promise.all([
    supabase.from("businesses").select("id, name, category, description, target_customers, language_preferences").eq("id", params.businessId).single(),
    supabase.from("business_products").select("name").eq("business_id", params.businessId),
    supabase.from("business_services").select("name").eq("business_id", params.businessId),
    supabase.from("business_goals").select("goal, is_primary").eq("business_id", params.businessId),
    supabase.from("brand_profiles").select("tone, style_description, brand_keywords, forbidden_phrases, emoji_preference, language_preferences").eq("business_id", params.businessId).single(),
    params.personaId
      ? supabase.from("customer_personas").select("name, description, pain_points, needs").eq("id", params.personaId).single()
      : supabase.from("customer_personas").select("name, description, pain_points, needs").eq("business_id", params.businessId).eq("is_active", true).order("priority", { ascending: false }).limit(1).single(),
    supabase.from("social_strategies").select("primary_objective, content_pillars, target_audiences, content_themes, brand_voice_guidelines, posting_frequency").eq("business_id", params.businessId).eq("strategy_status", "active").single(),
    supabase.from("business_facts").select("title, content, category").eq("business_id", params.businessId).eq("is_active", true),
    supabase.from("business_faqs").select("question, answer").eq("business_id", params.businessId).eq("is_active", true),
    supabase.from("brain_versions").select("version_number").eq("business_id", params.businessId).order("version_number", { ascending: false }).limit(1).single(),
    supabase.from("social_strategies").select("version_number").eq("business_id", params.businessId).order("version_number", { ascending: false }).limit(1).single(),
  ]);

  if (!businessRes.data) throw new Error("Business not found");

  let socialInsights: ContentGenerationContext["socialInsights"] = [];
  if (params.socialObservationIds && params.socialObservationIds.length > 0) {
    const { data: obs } = await supabase
      .from("social_observations")
      .select("title, summary, observation_type")
      .in("id", params.socialObservationIds);
    socialInsights = obs || [];
  }

  const business = businessRes.data;

  return {
    businessBrain: {
      name: business.name,
      category: business.category,
      description: business.description || undefined,
      products: productsRes.data?.map((p) => p.name) || [],
      services: servicesRes.data?.map((s) => s.name) || [],
      facts: factsRes.data?.map((f) => ({ title: f.title, content: f.content, category: f.category })) || [],
      faqs: faqsRes.data?.map((f) => ({ question: f.question, answer: f.answer })) || [],
      goals: goalsRes.data?.map((g) => ({ goal: g.goal, is_primary: g.is_primary })) || [],
      brand: brandRes.data ? {
        tone: brandRes.data.tone || undefined,
        styleDescription: brandRes.data.style_description || undefined,
        brandKeywords: brandRes.data.brand_keywords || [],
        forbiddenPhrases: brandRes.data.forbidden_phrases || [],
        emojiPreference: brandRes.data.emoji_preference || undefined,
      } : undefined,
      language: business.language_preferences?.[0] || undefined,
    },
    strategy: strategyRes.data ? {
      primaryObjective: strategyRes.data.primary_objective || undefined,
      contentPillars: (strategyRes.data.content_pillars as string[]) || [],
      targetAudiences: (strategyRes.data.target_audiences as string[]) || [],
      contentThemes: (strategyRes.data.content_themes as string[]) || [],
      brandVoiceGuidelines: strategyRes.data.brand_voice_guidelines || undefined,
      postingFrequency: strategyRes.data.posting_frequency || undefined,
    } : {},
    targetPersona: personaRes.data ? {
      name: personaRes.data.name,
      description: personaRes.data.description || undefined,
      painPoints: personaRes.data.pain_points || undefined,
      needs: personaRes.data.needs || undefined,
    } : undefined,
    socialInsights,
    platform: params.platform,
    objective: params.objective,
    pillar: params.pillar,
    topic: params.topic,
    cta: params.cta,
    brainVersion: brainVersionRes.data?.version_number || undefined,
    strategyVersion: strategyVersionRes.data?.version_number || undefined,
  };
}
