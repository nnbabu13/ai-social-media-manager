import type { BusinessBrainContext } from "@/types/business-brain";
import type {
  BrainDomain,
  BrainDomainStatus,
  DomainReadiness,
  BrainReadiness,
  OptionalDomain,
  FutureDomain,
} from "@/types/brain-readiness";
import { REQUIRED_DOMAINS, OPTIONAL_DOMAINS, FUTURE_DOMAINS } from "@/types/brain-readiness";

function complete(domain: BrainDomain, evidence: string[]): DomainReadiness {
  return { domain, status: "complete", evidence, missing: [], confidence: "high" };
}

function partial(domain: BrainDomain, evidence: string[], missingItems: string[]): DomainReadiness {
  return { domain, status: "partial", evidence, missing: missingItems, confidence: "medium" };
}

function missingStatus(domain: BrainDomain, missingItems: string[]): DomainReadiness {
  return { domain, status: "missing", evidence: [], missing: missingItems, confidence: "low" };
}

function notApplicable(domain: BrainDomain, reason: string): DomainReadiness {
  return { domain, status: "not_applicable", evidence: [reason], missing: [], confidence: "high" };
}

function noneStatus(domain: BrainDomain, reason: string): DomainReadiness {
  return { domain, status: "none", evidence: [reason], missing: [], confidence: "high" };
}

// --- REQUIRED DOMAIN EVALUATORS ---

function evaluateIdentity(brain: BusinessBrainContext): DomainReadiness {
  const evidence: string[] = [];
  const missing: string[] = [];

  if (brain.business.name) {
    evidence.push(`Business name: ${brain.business.name}`);
  } else {
    missing.push("Business name is not set");
  }

  if (brain.business.category) {
    evidence.push(`Category: ${brain.business.category}`);
  } else {
    missing.push("Business category is not set");
  }

  if (brain.business.description && brain.business.description.length > 20) {
    evidence.push("Business description provided");
  } else {
    missing.push("Business description is missing or too short");
  }

  if (brain.business.city || brain.business.region) {
    const location = [brain.business.city, brain.business.region, brain.business.country].filter(Boolean).join(", ");
    evidence.push(`Location: ${location}`);
  }

  if (missing.length === 0) return complete("identity", evidence);
  if (evidence.length > 0) return partial("identity", evidence, missing);
  return missingStatus("identity", missing);
}

function evaluateOfferings(brain: BusinessBrainContext): DomainReadiness {
  const evidence: string[] = [];
  const missing: string[] = [];

  if (brain.products.length > 0) {
    const names = brain.products.map(p => p.name).join(", ");
    evidence.push(`Products: ${names}`);
  }

  if (brain.services.length > 0) {
    const names = brain.services.map(s => s.name).join(", ");
    evidence.push(`Services: ${names}`);
  }

  if (evidence.length > 0) {
    return complete("offerings", evidence);
  }

  // Check business facts for offering information
  const offeringFacts = brain.facts.filter(f =>
    f.category === "products" || f.category === "services"
  );
  if (offeringFacts.length > 0) {
    offeringFacts.forEach(f => evidence.push(`Fact: ${f.title} - ${f.content}`));
    return complete("offerings", evidence);
  }

  return missingStatus("offerings", ["No products or services have been defined"]);
}

function evaluateAudience(brain: BusinessBrainContext): DomainReadiness {
  const evidence: string[] = [];
  const missing: string[] = [];

  if (brain.business.target_customers) {
    evidence.push(`Target customers: ${brain.business.target_customers}`);
  }

  if (brain.personas.length > 0) {
    const names = brain.personas.map(p => p.name).join(", ");
    evidence.push(`Customer personas: ${names}`);
  }

  // Check facts for audience information
  const audienceFacts = brain.facts.filter(f =>
    f.category === "customers" || f.category === "customer_insight"
  );
  audienceFacts.forEach(f => evidence.push(`Insight: ${f.content}`));

  if (evidence.length > 0) {
    return complete("audience", evidence);
  }

  return missingStatus("audience", ["No customer segments or target audience defined"]);
}

function evaluateCustomerNeeds(brain: BusinessBrainContext): DomainReadiness {
  const evidence: string[] = [];
  const missing: string[] = [];

  // Check personas for needs
  const personasWithNeeds = brain.personas.filter(p => p.needs && p.needs.length > 0);
  if (personasWithNeeds.length > 0) {
    personasWithNeeds.forEach(p => evidence.push(`${p.name} needs: ${p.needs}`));
  }

  // Check facts for needs
  const needsFacts = brain.facts.filter(f =>
    f.category === "customer_needs" || f.category === "pain_points"
  );
  needsFacts.forEach(f => evidence.push(`Need: ${f.content}`));

  // Check target_customers as partial evidence
  if (evidence.length === 0 && brain.business.target_customers) {
    return partial("customer_needs", [`Target audience known: ${brain.business.target_customers}`], [
      "Specific customer needs or pain points not yet defined"
    ]);
  }

  if (evidence.length > 0) {
    return complete("customer_needs", evidence);
  }

  return missingStatus("customer_needs", ["No customer needs or pain points have been identified"]);
}

function evaluateCustomerQuestions(brain: BusinessBrainContext): DomainReadiness {
  const evidence: string[] = [];
  const missing: string[] = [];

  if (brain.faqs.length > 0) {
    evidence.push(`${brain.faqs.length} FAQ(s) available`);
    brain.faqs.slice(0, 3).forEach(f => evidence.push(`Q: ${f.question}`));
    return complete("customer_questions", evidence);
  }

  // Check facts for question-related information
  const questionFacts = brain.facts.filter(f =>
    f.category === "customer_service" || f.category === "policies"
  );
  if (questionFacts.length > 0) {
    questionFacts.forEach(f => evidence.push(`Policy info: ${f.content}`));
    return complete("customer_questions", evidence);
  }

  // Having products/services and a description means the AI can likely answer basic questions
  if (brain.products.length > 0 || brain.services.length > 0) {
    if (brain.business.description) {
      return partial("customer_questions", [
        "Business has products/services and description",
        "AI can infer basic answers from available information"
      ], [
        "No explicit FAQs defined — AI will use general business knowledge"
      ]);
    }
  }

  return missingStatus("customer_questions", [
    "No FAQs or customer service information available",
    "AI may not be able to answer routine customer questions"
  ]);
}

function evaluateCustomerJourney(brain: BusinessBrainContext): DomainReadiness {
  const evidence: string[] = [];
  const missing: string[] = [];

  // Check facts for journey information
  const journeyFacts = brain.facts.filter(f =>
    f.category === "delivery" || f.category === "ordering" || f.category === "process"
  );
  journeyFacts.forEach(f => evidence.push(`Journey: ${f.content}`));

  // Check if location/service area implies a journey
  if (brain.locations.length > 0) {
    evidence.push(`Service locations defined: ${brain.locations.length}`);
  }

  // Check brand for communication style that implies journey
  if (brain.brand?.tone) {
    evidence.push(`Communication tone: ${brain.brand.tone}`);
  }

  // Check goals for conversion intent (implies journey understanding)
  if (brain.goals.length > 0) {
    evidence.push(`Business goals defined: ${brain.goals.map(g => g.goal).join(", ")}`);
  }

  // Check conversion facts
  const conversionFacts = brain.facts.filter(f =>
    f.category === "conversion" || f.category === "call_to_action"
  );
  conversionFacts.forEach(f => evidence.push(`Conversion: ${f.content}`));

  if (evidence.length >= 2) {
    return complete("customer_journey", evidence);
  }

  if (evidence.length === 1) {
    return partial("customer_journey", evidence, [
      "Customer journey is partially understood — more context would help"
    ]);
  }

  return missingStatus("customer_journey", [
    "No information about how customers discover, enquire, or purchase"
  ]);
}

function evaluateBrand(brain: BusinessBrainContext): DomainReadiness {
  const evidence: string[] = [];
  const missing: string[] = [];

  if (brain.brand?.tone) {
    evidence.push(`Tone: ${brain.brand.tone}`);
  } else {
    missing.push("Brand tone not defined");
  }

  if (brain.brand?.style_description) {
    evidence.push(`Style: ${brain.brand.style_description}`);
  } else {
    missing.push("Writing style not defined");
  }

  if (brain.brand?.tagline) {
    evidence.push(`Tagline: ${brain.brand.tagline}`);
  }

  if (brain.brand?.avoid_words) {
    evidence.push(`Avoid words: ${brain.brand.avoid_words}`);
  }

  if (missing.length === 0) return complete("brand", evidence);
  if (evidence.length > 0) return partial("brand", evidence, missing);
  return missingStatus("brand", missing);
}

function evaluatePositioning(brain: BusinessBrainContext): DomainReadiness {
  const evidence: string[] = [];
  const missing: string[] = [];

  // Check facts for positioning/differentiation
  const positionFacts = brain.facts.filter(f =>
    f.category === "brand" || f.category === "differentiation" || f.category === "unique_selling"
  );
  positionFacts.forEach(f => evidence.push(`Positioning: ${f.content}`));

  // Check facts for differentiators
  const diffFacts = brain.facts.filter(f =>
    f.title?.toLowerCase().includes("different") ||
    f.title?.toLowerCase().includes("unique") ||
    f.title?.toLowerCase().includes("special") ||
    f.content?.toLowerCase().includes("different") ||
    f.content?.toLowerCase().includes("unique") ||
    f.content?.toLowerCase().includes("special")
  );
  diffFacts.forEach(f => evidence.push(`Differentiator: ${f.content}`));

  // Having brand tone + description implies some positioning
  if (evidence.length === 0 && brain.brand?.tone && brain.business.description) {
    return partial("positioning", [
      `Brand tone: ${brain.brand.tone}`,
      "Business description available"
    ], [
      "Explicit differentiators or value propositions not defined"
    ]);
  }

  if (evidence.length > 0) {
    return complete("positioning", evidence);
  }

  return missingStatus("positioning", [
    "No explicit differentiators or value propositions defined"
  ]);
}

function evaluateConversion(brain: BusinessBrainContext): DomainReadiness {
  const evidence: string[] = [];
  const missing: string[] = [];

  // Check facts for conversion actions
  const conversionFacts = brain.facts.filter(f =>
    f.category === "conversion" || f.category === "call_to_action"
  );
  conversionFacts.forEach(f => evidence.push(`Conversion: ${f.content}`));

  // Check if website exists (implies online conversion)
  if (brain.business.website_url) {
    evidence.push(`Website: ${brain.business.website_url}`);
  }

  // Check goals for conversion hints
  const conversionGoals = brain.goals.filter(g =>
    g.goal?.toLowerCase().includes("lead") ||
    g.goal?.toLowerCase().includes("enquir") ||
    g.goal?.toLowerCase().includes("sale") ||
    g.goal?.toLowerCase().includes("book") ||
    g.goal?.toLowerCase().includes("visit") ||
    g.goal?.toLowerCase().includes("call") ||
    g.goal?.toLowerCase().includes("whatsapp") ||
    g.goal?.toLowerCase().includes("customer")
  );
  conversionGoals.forEach(g => evidence.push(`Goal implies conversion: ${g.goal}`));

  // Check target_customers as evidence of understanding conversion path
  if (brain.business.target_customers) {
    evidence.push(`Target audience defined: ${brain.business.target_customers}`);
  }

  if (evidence.length > 0) {
    return complete("conversion", evidence);
  }

  // Having any goal at all suggests some conversion intent
  if (brain.goals.length > 0) {
    return partial("conversion", [
      `Goals defined: ${brain.goals.map(g => g.goal).join(", ")}`
    ], [
      "Specific conversion action (call, WhatsApp, visit, etc.) not explicitly defined"
    ]);
  }

  return missingStatus("conversion", [
    "No conversion action defined",
    "AI does not know what customers should do next"
  ]);
}

function evaluatePolicies(brain: BusinessBrainContext): DomainReadiness {
  const evidence: string[] = [];
  const missing: string[] = [];

  // Check business facts for policies
  const policyFacts = brain.facts.filter(f =>
    f.category === "policies" || f.category === "pricing" || f.category === "delivery"
  );
  policyFacts.forEach(f => evidence.push(`Policy: ${f.content}`));

  // Check if pricing approach is known
  const pricingFacts = brain.facts.filter(f =>
    f.category === "pricing" || f.title?.toLowerCase().includes("price")
  );
  if (pricingFacts.length > 0) {
    pricingFacts.forEach(f => evidence.push(`Pricing: ${f.content}`));
  }

  // Products with price information
  const productsWithPrice = brain.products.filter(p => p.price || p.price_visibility === "public");
  if (productsWithPrice.length > 0) {
    evidence.push("Product pricing is visible");
  }

  // Services with price information
  const servicesWithPrice = brain.services.filter(s => s.price_text);
  if (servicesWithPrice.length > 0) {
    evidence.push("Service pricing is available");
  }

  if (evidence.length >= 2) {
    return complete("policies", evidence);
  }

  if (evidence.length === 1) {
    return partial("policies", evidence, [
      "Some policy information exists — more coverage would improve AI responses"
    ]);
  }

  // Default: AI can use safe defaults for basic policies
  return partial("policies", [], [
    "No explicit pricing or policy information defined",
    "AI will use safe defaults (ask owner before answering pricing questions)"
  ]);
}

function evaluateAIRules(brain: BusinessBrainContext): DomainReadiness {
  const evidence: string[] = [];

  if (brain.policies) {
    evidence.push(`Autonomy level: ${brain.policies.autonomy_level}`);

    const approvalRules = [
      { key: "require_approval_discount", label: "Discounts" },
      { key: "require_approval_refund", label: "Refunds" },
      { key: "require_approval_complaint", label: "Complaints" },
      { key: "require_approval_pricing", label: "Pricing" },
      { key: "require_approval_legal", label: "Legal claims" },
      { key: "require_approval_medical", label: "Medical claims" },
      { key: "require_approval_partnership", label: "Partnerships" },
      { key: "require_approval_promises", label: "Promises" },
    ];

    const configured = approvalRules.filter(r => brain.policies![r.key as keyof typeof brain.policies]);
    if (configured.length > 0) {
      evidence.push(`${configured.length} approval rules configured`);
    }

    return complete("ai_rules", evidence);
  }

  // Default AI policies exist in schema but may not be explicitly set
  return partial("ai_rules", [
    "Default AI policies in place (assistant mode, all approvals required)"
  ], [
    "AI autonomy level not explicitly configured by owner"
  ]);
}

function evaluateContentStrategy(brain: BusinessBrainContext): DomainReadiness {
  const evidence: string[] = [];
  const missing: string[] = [];

  // Check brand for content preferences
  if (brain.brand) {
    if (brain.brand.preferred_phrases && brain.brand.preferred_phrases.length > 0) {
      evidence.push(`Preferred phrases: ${brain.brand.preferred_phrases.join(", ")}`);
    }
    if (brain.brand.forbidden_phrases && brain.brand.forbidden_phrases.length > 0) {
      evidence.push(`Forbidden phrases: ${brain.brand.forbidden_phrases.join(", ")}`);
    }
    if (brain.brand.tone) {
      evidence.push(`Content tone: ${brain.brand.tone}`);
    }
  }

  // Check goals for content objectives
  const contentGoals = brain.goals.filter(g =>
    g.goal?.toLowerCase().includes("content") ||
    g.goal?.toLowerCase().includes("engage") ||
    g.goal?.toLowerCase().includes("social") ||
    g.goal?.toLowerCase().includes("awareness") ||
    g.goal?.toLowerCase().includes("brand")
  );
  contentGoals.forEach(g => evidence.push(`Content goal: ${g.goal}`));

  // Check facts for content-related information
  const contentFacts = brain.facts.filter(f =>
    f.category === "content" || f.category === "social_media"
  );
  contentFacts.forEach(f => evidence.push(`Content info: ${f.content}`));

  // Having brand tone + goals is usually enough for basic content strategy
  if (evidence.length >= 2) {
    return complete("content_strategy", evidence);
  }

  // Brand tone alone with any business goals implies some content direction
  if (brain.brand?.tone && brain.goals.length > 0) {
    return complete("content_strategy", [
      `Brand tone: ${brain.brand.tone}`,
      `Goals: ${brain.goals.map(g => g.goal).join(", ")}`
    ]);
  }

  if (brain.brand?.tone) {
    return partial("content_strategy", [
      `Brand tone: ${brain.brand.tone}`
    ], [
      "Business goals not defined — AI lacks content direction"
    ]);
  }

  return missingStatus("content_strategy", [
    "No content strategy information available",
    "AI does not know what content to create or how to approach it"
  ]);
}

function evaluateGoals(brain: BusinessBrainContext): DomainReadiness {
  const evidence: string[] = [];

  if (brain.goals.length > 0) {
    const primary = brain.goals.find(g => g.is_primary);
    if (primary) {
      evidence.push(`Primary goal: ${primary.goal}`);
    }
    if (brain.goals.length > 1) {
      evidence.push(`Additional goals: ${brain.goals.filter(g => !g.is_primary).map(g => g.goal).join(", ")}`);
    }
    return complete("goals", evidence);
  }

  // Check facts for goal information
  const goalFacts = brain.facts.filter(f =>
    f.category === "goals" || f.title?.toLowerCase().includes("goal") || f.title?.toLowerCase().includes("objective")
  );
  if (goalFacts.length > 0) {
    goalFacts.forEach(f => evidence.push(`Goal: ${f.content}`));
    return complete("goals", evidence);
  }

  return missingStatus("goals", [
    "No business goals defined",
    "AI does not know what the business wants to achieve"
  ]);
}

// --- OPTIONAL DOMAIN EVALUATORS ---

function evaluateOffers(brain: BusinessBrainContext): DomainReadiness {
  if (brain.offers.length > 0) {
    return { domain: "offers", status: "complete", evidence: [`${brain.offers.length} active offer(s)`], missing: [], confidence: "high" };
  }
  return { domain: "offers", status: "none", evidence: ["No active offers"], missing: [], confidence: "high" };
}

function evaluateCompetitors(brain: BusinessBrainContext): DomainReadiness {
  const compFacts = brain.facts.filter(f =>
    f.category === "competitors" || f.title?.toLowerCase().includes("competitor")
  );
  if (compFacts.length > 0) {
    return { domain: "competitors", status: "complete", evidence: compFacts.map(f => f.content), missing: [], confidence: "high" };
  }
  return { domain: "competitors", status: "optional", evidence: [], missing: ["Competitor information not provided"], confidence: "low" };
}

function evaluateSeasonality(brain: BusinessBrainContext): DomainReadiness {
  const seasonFacts = brain.facts.filter(f =>
    f.category === "seasonality" || f.title?.toLowerCase().includes("season")
  );
  if (seasonFacts.length > 0) {
    return { domain: "seasonality", status: "complete", evidence: seasonFacts.map(f => f.content), missing: [], confidence: "high" };
  }
  return { domain: "seasonality", status: "optional", evidence: [], missing: ["Seasonality information not provided"], confidence: "low" };
}

function evaluateWebsite(brain: BusinessBrainContext): DomainReadiness {
  if (brain.business.website_url) {
    return { domain: "website", status: "complete", evidence: [`Website: ${brain.business.website_url}`], missing: [], confidence: "high" };
  }
  return { domain: "website", status: "not_applicable", evidence: ["No website — this is optional"], missing: [], confidence: "high" };
}

function evaluateAdditionalPersonas(brain: BusinessBrainContext): DomainReadiness {
  if (brain.personas.length > 1) {
    return { domain: "additional_personas", status: "complete", evidence: [`${brain.personas.length} personas defined`], missing: [], confidence: "high" };
  }
  return { domain: "additional_personas", status: "optional", evidence: [], missing: ["Additional personas not defined"], confidence: "low" };
}

function evaluateAdditionalProducts(brain: BusinessBrainContext): DomainReadiness {
  if (brain.products.length > 1) {
    return { domain: "additional_products", status: "complete", evidence: [`${brain.products.length} products defined`], missing: [], confidence: "high" };
  }
  return { domain: "additional_products", status: "optional", evidence: [], missing: ["Additional products not defined"], confidence: "low" };
}

function evaluateAdditionalServices(brain: BusinessBrainContext): DomainReadiness {
  if (brain.services.length > 1) {
    return { domain: "additional_services", status: "complete", evidence: [`${brain.services.length} services defined`], missing: [], confidence: "high" };
  }
  return { domain: "additional_services", status: "optional", evidence: [], missing: ["Additional services not defined"], confidence: "low" };
}

function evaluateHistoricalSocialData(brain: BusinessBrainContext): DomainReadiness {
  return { domain: "historical_social_data", status: "future", evidence: [], missing: [], confidence: "high" };
}

function evaluateAdvancedMetrics(brain: BusinessBrainContext): DomainReadiness {
  return { domain: "advanced_metrics", status: "future", evidence: [], missing: [], confidence: "high" };
}

// --- FUTURE DOMAIN EVALUATORS ---

function evaluateFutureDomain(domain: FutureDomain): DomainReadiness {
  return { domain, status: "future", evidence: [], missing: [], confidence: "high" };
}

// --- ORCHESTRATOR ---

const REQUIRED_EVALUATORS: Record<BrainDomain, (brain: BusinessBrainContext) => DomainReadiness> = {
  identity: evaluateIdentity,
  offerings: evaluateOfferings,
  audience: evaluateAudience,
  customer_needs: evaluateCustomerNeeds,
  customer_questions: evaluateCustomerQuestions,
  customer_journey: evaluateCustomerJourney,
  brand: evaluateBrand,
  positioning: evaluatePositioning,
  conversion: evaluateConversion,
  policies: evaluatePolicies,
  ai_rules: evaluateAIRules,
  content_strategy: evaluateContentStrategy,
  goals: evaluateGoals,
};

const OPTIONAL_EVALUATORS: Record<OptionalDomain, (brain: BusinessBrainContext) => DomainReadiness> = {
  offers: evaluateOffers,
  competitors: evaluateCompetitors,
  seasonality: evaluateSeasonality,
  website: evaluateWebsite,
  additional_personas: evaluateAdditionalPersonas,
  additional_products: evaluateAdditionalProducts,
  additional_services: evaluateAdditionalServices,
  historical_social_data: evaluateHistoricalSocialData,
  advanced_metrics: evaluateAdvancedMetrics,
};

export function evaluateBusinessBrainReadiness(brain: BusinessBrainContext): BrainReadiness {
  const requiredDomains = REQUIRED_DOMAINS.map(domain => REQUIRED_EVALUATORS[domain](brain));
  const optionalDomains = OPTIONAL_DOMAINS.map(domain => OPTIONAL_EVALUATORS[domain](brain));
  const futureDomains = FUTURE_DOMAINS.map(domain => evaluateFutureDomain(domain));

  const allDomains = [...requiredDomains, ...optionalDomains, ...futureDomains];

  const completedRequired = requiredDomains.filter(d => d.status === "complete").length;
  const totalRequired = requiredDomains.length;
  const score = Math.round((completedRequired / totalRequired) * 100);

  const requiredMissing = requiredDomains.filter(d => d.status === "missing" || d.status === "partial");
  const optionalMissing = optionalDomains.filter(d => d.status === "optional");

  return {
    score,
    status: requiredMissing.length === 0 ? "ready" : "needs_attention",
    domains: allDomains,
    required_missing: requiredMissing,
    optional_missing: optionalMissing,
    future_domains: futureDomains,
  };
}

export function getDomainDisplayName(domain: BrainDomain | OptionalDomain | FutureDomain): string {
  const names: Record<string, string> = {
    identity: "Business identity",
    offerings: "Products & services",
    audience: "Customers",
    customer_needs: "Customer needs",
    customer_questions: "Customer questions",
    customer_journey: "Customer journey",
    brand: "Brand voice",
    positioning: "Positioning",
    conversion: "Conversion action",
    policies: "Business policies",
    ai_rules: "AI rules",
    content_strategy: "Content strategy",
    goals: "Business goals",
    offers: "Offers & promotions",
    competitors: "Competitors",
    seasonality: "Seasonality",
    website: "Website",
    additional_personas: "Additional personas",
    additional_products: "Additional products",
    additional_services: "Additional services",
    historical_social_data: "Historical social data",
    advanced_metrics: "Advanced metrics",
    social_presence: "Social media presence",
    social_history: "Social history",
    audience_behavior: "Audience behavior",
    content_performance: "Content performance",
    social_conversations: "Social conversations",
  };
  return names[domain] || domain;
}

export function getStatusIcon(status: BrainDomainStatus): string {
  switch (status) {
    case "complete": return "✅";
    case "partial": return "⚠️";
    case "missing": return "❌";
    case "not_applicable": return "✅";
    case "none": return "✅";
    case "future": return "○";
    case "optional": return "ℹ";
  }
}
