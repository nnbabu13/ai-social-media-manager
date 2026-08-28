import { createClient } from "@/lib/supabase/server";
import type { BusinessBrainContext, BrainCompletenessResult, KnowledgeHealthWarning } from "@/types/business-brain";
import type { BrainReadiness } from "@/types/brain-readiness";
import { evaluateBusinessBrainReadiness } from "./domains";

export async function getBusinessBrain(businessId: string): Promise<BusinessBrainContext | null> {
  const supabase = await createClient();

  const [businessRes, productsRes, goalsRes, brandRes, policiesRes, factsRes, faqsRes, locationsRes, offersRes, documentsRes, servicesRes, businessPersonaRes, customerPersonasRes, strategyRes, operatingRulesRes, autonomyConfigRes, brainVersionRes] =
    await Promise.all([
      supabase.from("businesses").select("id, name, slug, category, description, website_url, country, region, city, target_customers").eq("id", businessId).single(),
      supabase.from("business_products").select("name, description, price, price_visibility").eq("business_id", businessId).eq("is_active", true),
      supabase.from("business_goals").select("goal, is_primary").eq("business_id", businessId),
      supabase.from("brand_profiles").select("tone, style_description, avoid_words, tagline, brand_keywords, preferred_phrases, forbidden_phrases").eq("business_id", businessId).single(),
      supabase.from("ai_policies").select("*").eq("business_id", businessId).single(),
      supabase.from("business_facts").select("category, title, content").eq("business_id", businessId).eq("is_active", true).eq("approval_status", "approved"),
      supabase.from("business_faqs").select("question, answer, category").eq("business_id", businessId).eq("is_active", true).eq("approval_status", "approved"),
      supabase.from("business_locations").select("name, city, service_area").eq("business_id", businessId).eq("is_active", true),
      supabase.from("business_offers").select("name, description, discount_text, end_at").eq("business_id", businessId).eq("is_active", true),
      supabase.from("business_documents").select("title, content, document_type").eq("business_id", businessId).eq("status", "active").eq("approval_status", "approved"),
      supabase.from("business_services").select("name, description, price_text").eq("business_id", businessId).eq("is_active", true).eq("approval_status", "approved"),
      supabase.from("business_persona").select("personality_traits, tone, communication_style, brand_values, positioning, differentiators, content_personality, approved_claims, restricted_claims").eq("business_id", businessId).eq("approval_status", "approved").single(),
      supabase.from("customer_personas").select("id, name, description, segments, needs, pain_points, buying_triggers, objections, decision_factors, desired_outcomes, content_interests, preferred_channels, conversion_action, priority, confidence, source_type").eq("business_id", businessId).eq("is_active", true),
      supabase.from("social_strategies").select("primary_objective, content_pillars, content_mix, posting_cadence, conversion_strategy, cta_strategy, platform_strategy").eq("business_id", businessId).eq("strategy_status", "active").single(),
      supabase.from("ai_operating_rules").select("action_type, mode, risk_level, enabled").eq("business_id", businessId).eq("enabled", true),
      supabase.from("autonomy_configs").select("profile").eq("business_id", businessId).single(),
      supabase.from("brain_versions").select("version_number").eq("business_id", businessId).order("version_number", { ascending: false }).limit(1).maybeSingle(),
    ]);

  if (businessRes.error || !businessRes.data) return null;

  const now = new Date().toISOString();
  const activeOffers = (offersRes.data || []).filter(o => !o.end_at || o.end_at > now);

  const brain: BusinessBrainContext = {
    business: businessRes.data,
    products: productsRes.data || [],
    services: servicesRes.data || [],
    goals: goalsRes.data || [],
    brand: brandRes.data || null,
    policies: policiesRes.data || null,
    facts: factsRes.data || [],
    faqs: faqsRes.data || [],
    locations: locationsRes.data || [],
    offers: activeOffers,
    personas: customerPersonasRes.data || [],
    documents: documentsRes.data || [],
    business_persona: businessPersonaRes.data || null,
    customer_personas: customerPersonasRes.data || [],
    strategy: strategyRes.data || null,
    operations: autonomyConfigRes.data ? {
      autonomy_profile: autonomyConfigRes.data.profile,
      operating_rules: operatingRulesRes.data || [],
    } : null,
    brain_version: brainVersionRes.data?.version_number || 0,
  };

  const readiness = evaluateBusinessBrainReadiness(brain);

  return { ...brain, readiness };
}

export function buildBusinessContext(brain: BusinessBrainContext): string {
  const sections: string[] = [];

  sections.push(`Business: ${brain.business.name}`);
  if (brain.business.category) sections.push(`Category: ${brain.business.category}`);
  if (brain.business.description) sections.push(`Description: ${brain.business.description}`);
  if (brain.business.country || brain.business.region || brain.business.city) {
    sections.push(`Location: [${brain.business.city}, ${brain.business.region}, ${brain.business.country}]`.replace(/,\s*\]/, "]"));
  }
  if (brain.business.target_customers) sections.push(`Target customers: ${brain.business.target_customers}`);

  if (brain.products.length > 0) {
    sections.push("\nProducts:");
    brain.products.forEach(p => {
      sections.push(`- ${p.name}: ${p.description || "No description"}`);
      if (p.price_visibility === "public" && p.price) sections.push(`  Price: $${p.price}`);
    });
  }

  if (brain.services.length > 0) {
    sections.push("\nServices:");
    brain.services.forEach(s => {
      sections.push(`- ${s.name}: ${s.description || "No description"}`);
    });
  }

  if (brain.goals.length > 0) {
    sections.push("\nGoals:");
    brain.goals.forEach(g => {
      sections.push(`- ${g.goal}${g.is_primary ? " (PRIMARY)" : ""}`);
    });
  }

  if (brain.brand) {
    sections.push("\nBrand Voice:");
    if (brain.brand.tone) sections.push(`Tone: ${brain.brand.tone}`);
    if (brain.brand.style_description) sections.push(`Style: ${brain.brand.style_description}`);
    if (brain.brand.avoid_words) sections.push(`Avoid: ${brain.brand.avoid_words}`);
    if (brain.brand.tagline) sections.push(`Tagline: ${brain.brand.tagline}`);
    if (brain.brand.forbidden_phrases?.length) sections.push(`Never say: ${brain.brand.forbidden_phrases.join(", ")}`);
  }

  if (brain.facts.length > 0) {
    sections.push("\nBusiness Facts:");
    brain.facts.forEach(f => sections.push(`- [${f.category}] ${f.title}: ${f.content}`));
  }

  if (brain.faqs.length > 0) {
    sections.push("\nFAQs:");
    brain.faqs.forEach(f => sections.push(`Q: ${f.question}\nA: ${f.answer}`));
  }

  if (brain.locations.length > 0) {
    sections.push("\nLocations:");
    brain.locations.forEach(l => sections.push(`- ${l.name}${l.city ? ` (${l.city})` : ""}${l.service_area ? ` - Service area: ${l.service_area}` : ""}`));
  }

  if (brain.personas.length > 0) {
    sections.push("\nCustomer Personas (Basic):");
    brain.personas.forEach(p => {
      sections.push(`- ${p.name}: ${p.description || "No description"}`);
      if (p.pain_points) sections.push(`  Pain points: ${p.pain_points}`);
      if (p.needs) sections.push(`  Needs: ${p.needs}`);
    });
  }

  if (brain.business_persona) {
    sections.push("\nBusiness Persona (How AI represents the brand):");
    if (brain.business_persona.tone.length > 0) sections.push(`Tone: ${brain.business_persona.tone.join(", ")}`);
    if (brain.business_persona.communication_style) sections.push(`Style: ${brain.business_persona.communication_style}`);
    if (brain.business_persona.positioning) sections.push(`Positioning: ${brain.business_persona.positioning}`);
    if (brain.business_persona.brand_values.length > 0) sections.push(`Values: ${brain.business_persona.brand_values.join(", ")}`);
    if (brain.business_persona.approved_claims.length > 0) sections.push(`Can claim: ${brain.business_persona.approved_claims.join("; ")}`);
    if (brain.business_persona.restricted_claims.length > 0) sections.push(`Must not claim: ${brain.business_persona.restricted_claims.join("; ")}`);
  }

  if (brain.customer_personas && brain.customer_personas.length > 0) {
    sections.push("\nCustomer Personas (Detailed):");
    brain.customer_personas.forEach(p => {
      sections.push(`- ${p.name} (${p.priority}): ${p.description || "No description"}`);
      if (p.needs && p.needs.length > 0) sections.push(`  Needs: ${p.needs.join(", ")}`);
      if (p.pain_points && p.pain_points.length > 0) sections.push(`  Pain points: ${p.pain_points.join(", ")}`);
      if (p.buying_triggers && p.buying_triggers.length > 0) sections.push(`  Triggers: ${p.buying_triggers.join(", ")}`);
      if (p.objections && p.objections.length > 0) sections.push(`  Objections: ${p.objections.join(", ")}`);
      if (p.conversion_action) sections.push(`  Conversion: ${p.conversion_action}`);
    });
  }

  if (brain.policies) {
    sections.push("\nAI Policies:");
    sections.push(`Autonomy level: ${brain.policies.autonomy_level}`);
    if (brain.policies.require_approval_discount) sections.push("- Requires approval for discounts");
    if (brain.policies.require_approval_refund) sections.push("- Requires approval for refunds");
    if (brain.policies.require_approval_pricing) sections.push("- Requires approval for pricing changes");
    if (brain.policies.require_approval_legal) sections.push("- Requires approval for legal claims");
    if (brain.policies.require_approval_medical) sections.push("- Requires approval for medical claims");
  }

  if (brain.strategy) {
    sections.push("\nSocial Strategy:");
    if (brain.strategy.primary_objective) sections.push(`Primary goal: ${brain.strategy.primary_objective.objective}`);
    if (brain.strategy.posting_cadence) sections.push(`Posting: ${brain.strategy.posting_cadence.posts_per_week} posts/week`);
    if (brain.strategy.content_pillars && brain.strategy.content_pillars.length > 0) {
      sections.push("Content pillars:");
      brain.strategy.content_pillars.forEach(p => sections.push(`  - ${p.name} (${p.recommended_percentage}%)`));
    }
    if (brain.strategy.conversion_strategy) sections.push(`Primary CTA: ${brain.strategy.conversion_strategy.primary_action}`);
    if (brain.strategy.platform_strategy && brain.strategy.platform_strategy.length > 0) {
      const primary = brain.strategy.platform_strategy.find(p => p.priority === "primary");
      if (primary) sections.push(`Primary platform: ${primary.platform}`);
    }
  }

  if (brain.operations) {
    sections.push("\nAI Operating Rules:");
    sections.push(`Autonomy profile: ${brain.operations.autonomy_profile}`);
    if (brain.operations.operating_rules.length > 0) {
      const autoActions = brain.operations.operating_rules.filter(r => r.mode === "auto").map(r => r.action_type);
      const approvalActions = brain.operations.operating_rules.filter(r => r.mode === "approval").map(r => r.action_type);
      const humanOnlyActions = brain.operations.operating_rules.filter(r => r.mode === "human_only").map(r => r.action_type);
      if (autoActions.length > 0) sections.push(`Can do automatically: ${autoActions.join(", ")}`);
      if (approvalActions.length > 0) sections.push(`Needs approval: ${approvalActions.join(", ")}`);
      if (humanOnlyActions.length > 0) sections.push(`Human only: ${humanOnlyActions.join(", ")}`);
    }
  }

  return sections.join("\n");
}

export function calculateCompleteness(brain: BusinessBrainContext): BrainCompletenessResult {
  if (!brain.readiness) {
    const readiness = evaluateBusinessBrainReadiness(brain);
    brain.readiness = readiness;
  }

  const r = brain.readiness;
  const sections = {
    business: { score: 0, max: 15, missing: [] as string[] },
    products: { score: 0, max: 15, missing: [] as string[] },
    customers: { score: 0, max: 20, missing: [] as string[] },
    goals: { score: 0, max: 10, missing: [] as string[] },
    brand: { score: 0, max: 10, missing: [] as string[] },
    faqs: { score: 0, max: 10, missing: [] as string[] },
    facts: { score: 0, max: 10, missing: [] as string[] },
    locations: { score: 0, max: 5, missing: [] as string[] },
    offers: { score: 0, max: 5, missing: [] as string[] },
    interview: { score: 0, max: 0, missing: [] as string[] },
  };

  // Identity domain → business section
  const identity = r.domains.find(d => d.domain === "identity");
  if (identity?.status === "complete") {
    sections.business.score = 15;
  } else {
    sections.business.missing = identity?.missing || [];
  }

  // Offerings domain → products section
  const offerings = r.domains.find(d => d.domain === "offerings");
  if (offerings?.status === "complete") {
    sections.products.score = 15;
  } else {
    sections.products.missing = offerings?.missing || [];
  }

  // Audience + customer_needs → customers section
  const audience = r.domains.find(d => d.domain === "audience");
  const needs = r.domains.find(d => d.domain === "customer_needs");
  if (audience?.status === "complete" && needs?.status === "complete") {
    sections.customers.score = 20;
  } else {
    sections.customers.missing = [...(audience?.missing || []), ...(needs?.missing || [])];
  }

  // Goals domain
  const goalsDomain = r.domains.find(d => d.domain === "goals");
  if (goalsDomain?.status === "complete") {
    sections.goals.score = 10;
  } else {
    sections.goals.missing = goalsDomain?.missing || [];
  }

  // Brand domain
  const brandDomain = r.domains.find(d => d.domain === "brand");
  if (brandDomain?.status === "complete") {
    sections.brand.score = 10;
  } else {
    sections.brand.missing = brandDomain?.missing || [];
  }

  // customer_questions → faqs section
  const questions = r.domains.find(d => d.domain === "customer_questions");
  if (questions?.status === "complete") {
    sections.faqs.score = 10;
  } else {
    sections.faqs.missing = questions?.missing || [];
  }

  // Facts contribute to completeness through other domains
  if (brain.facts.length >= 3) sections.facts.score = 10;
  else if (brain.facts.length > 0) sections.facts.score = brain.facts.length * 3;
  else sections.facts.missing.push("No business facts");

  // Locations
  if (brain.locations.length > 0) sections.locations.score = 5;
  else sections.locations.missing.push("No locations added");

  // Offers (optional)
  if (brain.offers.length > 0) sections.offers.score = 5;
  else sections.offers.missing.push("No active offers");

  return {
    percentage: r.score,
    sections,
  };
}

export function getBrainHealthWarnings(brain: BusinessBrainContext): KnowledgeHealthWarning[] {
  const warnings: KnowledgeHealthWarning[] = [];

  // Use domain-based readiness if available
  if (!brain.readiness) {
    brain.readiness = evaluateBusinessBrainReadiness(brain);
  }

  const readiness = brain.readiness;

  // Convert missing/partial required domains to warnings
  for (const domain of readiness.required_missing) {
    const severity = domain.status === "missing" ? "warning" : "info";
    warnings.push({
      type: "missing",
      severity,
      section: domain.domain,
      message: domain.missing.join("; ") || `${domain.domain} needs more information`,
    });
  }

  // Check for expired offers
  const now = new Date();
  const expiredOffers = brain.offers.filter(o => {
    if (!o.end_at) return false;
    return new Date(o.end_at) < now;
  });

  if (expiredOffers.length > 0) {
    warnings.push({ type: "expired", severity: "warning", section: "offers", message: `${expiredOffers.length} promotion(s) may have expired` });
  }

  // Check for duplicate facts with different sources
  const factMap = new Map<string, Array<{ content: string; source?: string }>>();
  for (const fact of brain.facts) {
    const key = fact.title.toLowerCase().trim();
    if (!factMap.has(key)) {
      factMap.set(key, []);
    }
    factMap.get(key)!.push({ content: fact.content, source: fact.category });
  }

  for (const [title, entries] of Array.from(factMap.entries())) {
    if (entries.length > 1) {
      const hasConflict = entries.some(e => e.content !== entries[0].content);
      if (hasConflict) {
        warnings.push({
          type: "conflict",
          severity: "warning",
          section: "facts",
          message: `Conflicting information found for "${title}"`,
        });
      }
    }
  }

  // Check for duplicate FAQs with different answers
  const faqMap = new Map<string, string[]>();
  for (const faq of brain.faqs) {
    const key = faq.question.toLowerCase().trim();
    if (!faqMap.has(key)) {
      faqMap.set(key, []);
    }
    faqMap.get(key)!.push(faq.answer);
  }

  for (const [question, answers] of Array.from(faqMap.entries())) {
    if (answers.length > 1) {
      const hasConflict = answers.some(a => a !== answers[0]);
      if (hasConflict) {
        warnings.push({
          type: "conflict",
          severity: "warning",
          section: "faqs",
          message: `Conflicting answers found for "${question}"`,
        });
      }
    }
  }

  return warnings;
}

export async function searchBusinessKnowledge(
  businessId: string,
  query: string,
  types?: string[]
): Promise<Record<string, unknown[]>> {
  const supabase = await createClient();
  const results: Record<string, unknown[]> = {};

  const searchTypes = types || ["products", "services", "faqs", "facts", "offers", "locations", "personas"];

  if (searchTypes.includes("products")) {
    const { data } = await supabase
      .from("business_products")
      .select("id, name, description")
      .eq("business_id", businessId)
      .eq("is_active", true)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(10);
    results.products = data || [];
  }

  if (searchTypes.includes("services")) {
    const { data } = await supabase
      .from("business_services")
      .select("id, name, description")
      .eq("business_id", businessId)
      .eq("is_active", true)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(10);
    results.services = data || [];
  }

  if (searchTypes.includes("faqs")) {
    const { data } = await supabase
      .from("business_faqs")
      .select("id, question, answer")
      .eq("business_id", businessId)
      .eq("is_active", true)
      .or(`question.ilike.%${query}%,answer.ilike.%${query}%`)
      .limit(10);
    results.faqs = data || [];
  }

  if (searchTypes.includes("facts")) {
    const { data } = await supabase
      .from("business_facts")
      .select("id, title, content, category")
      .eq("business_id", businessId)
      .eq("is_active", true)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .limit(10);
    results.facts = data || [];
  }

  if (searchTypes.includes("offers")) {
    const { data } = await supabase
      .from("business_offers")
      .select("id, name, description")
      .eq("business_id", businessId)
      .eq("is_active", true)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(10);
    results.offers = data || [];
  }

  if (searchTypes.includes("locations")) {
    const { data } = await supabase
      .from("business_locations")
      .select("id, name, address, city")
      .eq("business_id", businessId)
      .eq("is_active", true)
      .or(`name.ilike.%${query}%,address.ilike.%${query}%,city.ilike.%${query}%`)
      .limit(10);
    results.locations = data || [];
  }

  if (searchTypes.includes("personas")) {
    const { data } = await supabase
      .from("customer_personas")
      .select("id, name, description")
      .eq("business_id", businessId)
      .eq("is_active", true)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(10);
    results.personas = data || [];
  }

  return results;
}
