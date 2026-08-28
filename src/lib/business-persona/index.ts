import type { BusinessBrainContext } from "@/types/business-brain";
import type { BusinessPersona } from "@/types/business-persona";

interface BusinessPersonaInput {
  personality_traits: string[];
  tone: string[];
  communication_style: string;
  brand_values: string[];
  positioning: string;
  differentiators: string[];
  preferred_languages: string[];
  preferred_phrases: string[];
  forbidden_phrases: string[];
  emoji_preference: "none" | "minimal" | "moderate" | "frequent";
  formality: "casual" | "balanced" | "professional";
  content_personality: string[];
  customer_facing_behavior: string;
  brand_promises: string[];
  approved_claims: string[];
  restricted_claims: string[];
}

function deriveEmojiPreference(tone: string[]): "none" | "minimal" | "moderate" | "frequent" {
  const toneStr = tone.join(" ").toLowerCase();
  if (toneStr.includes("professional") || toneStr.includes("formal")) return "minimal";
  if (toneStr.includes("friendly") || toneStr.includes("casual")) return "moderate";
  if (toneStr.includes("fun") || toneStr.includes("playful")) return "frequent";
  return "minimal";
}

function deriveFormality(tone: string[], style: string): "casual" | "balanced" | "professional" {
  const combined = [...tone, style].join(" ").toLowerCase();
  if (combined.includes("professional") || combined.includes("formal") || combined.includes("authoritative")) {
    return "professional";
  }
  if (combined.includes("casual") || combined.includes("friendly") || combined.includes("relaxed")) {
    return "casual";
  }
  return "balanced";
}

function deriveCommunicationStyle(tone: string[], description: string | null): string {
  const toneStr = tone.join(", ");
  const length = description && description.length > 100 ? "detailed" : "concise";
  return `Tone: ${toneStr}. Style: ${length} and clear.`;
}

function deriveContentPersonality(tone: string[], category: string | null): string[] {
  const personality: string[] = [];
  const toneStr = tone.join(" ").toLowerCase();

  if (toneStr.includes("professional") || toneStr.includes("authoritative")) {
    personality.push("informative");
    personality.push("expert");
  }
  if (toneStr.includes("friendly") || toneStr.includes("warm")) {
    personality.push("approachable");
    personality.push("helpful");
  }
  if (toneStr.includes("fun") || toneStr.includes("playful")) {
    personality.push("entertaining");
    personality.push("creative");
  }

  if (category) {
    const cat = category.toLowerCase();
    if (cat.includes("restaurant") || cat.includes("food")) {
      personality.push("appetizing");
      personality.push("visual");
    }
    if (cat.includes("salon") || cat.includes("beauty")) {
      personality.push("inspirational");
      personality.push("trendy");
    }
    if (cat.includes("tech") || cat.includes("software")) {
      personality.push("educational");
      personality.push("clear");
    }
  }

  if (personality.length === 0) {
    personality.push("professional");
    personality.push("helpful");
  }

  return Array.from(new Set(personality));
}

function deriveApprovedClaims(
  products: BusinessBrainContext["products"],
  services: BusinessBrainContext["services"],
  differentiators: string | null
): string[] {
  const claims: string[] = [];

  if (products.length > 0) {
    claims.push(`Offers ${products.length} product(s)`);
  }
  if (services.length > 0) {
    claims.push(`Provides ${services.length} service(s)`);
  }
  if (differentiators) {
    claims.push(differentiators);
  }

  return claims;
}

function deriveRestrictedClaims(
  products: BusinessBrainContext["products"],
  services: BusinessBrainContext["services"]
): string[] {
  const restricted: string[] = [];

  restricted.push("Claims about competitor quality or pricing");
  restricted.push("Unverified statistics or percentages");
  restricted.push("Guarantees without owner confirmation");
  restricted.push("Price commitments without owner confirmation");

  return restricted;
}

function deriveBrandValues(
  tone: string[],
  differentiators: string | null,
  description: string | null
): string[] {
  const values: string[] = [];
  const toneStr = tone.join(" ").toLowerCase();

  if (toneStr.includes("quality") || toneStr.includes("premium")) {
    values.push("Quality");
  }
  if (toneStr.includes("reliable") || toneStr.includes("trust")) {
    values.push("Reliability");
  }
  if (toneStr.includes("friendly") || toneStr.includes("warm")) {
    values.push("Customer Focus");
  }
  if (toneStr.includes("innovative") || toneStr.includes("creative")) {
    values.push("Innovation");
  }

  if (differentiators) {
    if (differentiators.toLowerCase().includes("local")) {
      values.push("Community");
    }
    if (differentiators.toLowerCase().includes("sustain")) {
      values.push("Sustainability");
    }
  }

  if (description && description.toLowerCase().includes("family")) {
    values.push("Family Values");
  }

  if (values.length === 0) {
    values.push("Customer Focus");
    values.push("Quality");
  }

  return Array.from(new Set(values));
}

function derivePositioning(
  business: BusinessBrainContext["business"],
  differentiators: string | null
): string {
  const parts: string[] = [];

  if (business.category) {
    parts.push(`A ${business.category.toLowerCase()} business`);
  }

  if (business.city || business.region) {
    const location = [business.city, business.region].filter(Boolean).join(", ");
    parts.push(`in ${location}`);
  }

  if (differentiators) {
    parts.push(`that ${differentiators.toLowerCase()}`);
  }

  if (parts.length === 0) {
    return "A business focused on delivering value to customers";
  }

  return parts.join(" ");
}

export function generateBusinessPersonaFromBrain(
  brain: BusinessBrainContext
): Omit<BusinessPersona, "id" | "created_at" | "updated_at"> {
  const tone = brain.brand?.tone ? [brain.brand.tone] : ["professional"];
  const style = brain.brand?.style_description || "";
  const description = brain.business.description;

  const differentiators = brain.facts
    .filter(f => f.category === "differentiators" || f.category === "positioning")
    .map(f => f.content)
    .join("; ") || null;

  const personalityTraits = [
    ...tone.map(t => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()),
  ];

  if (description && description.toLowerCase().includes("local")) {
    personalityTraits.push("Local");
  }
  if (differentiators && differentiators.toLowerCase().includes("quality")) {
    personalityTraits.push("Quality-focused");
  }

  const communicationStyle = deriveCommunicationStyle(tone, description);
  const brandValues = deriveBrandValues(tone, differentiators, description);
  const positioning = derivePositioning(brain.business, differentiators);
  const contentPersonality = deriveContentPersonality(tone, brain.business.category);
  const approvedClaims = deriveApprovedClaims(brain.products, brain.services, differentiators);
  const restrictedClaims = deriveRestrictedClaims(brain.products, brain.services);

  return {
    business_id: "",
    personality_traits: Array.from(new Set(personalityTraits)),
    tone,
    communication_style: communicationStyle,
    brand_values: brandValues,
    positioning,
    differentiators: differentiators ? [differentiators] : [],
    preferred_languages: ["English"],
    preferred_phrases: brain.brand?.preferred_phrases || [],
    forbidden_phrases: brain.brand?.forbidden_phrases || [],
    emoji_preference: deriveEmojiPreference(tone),
    formality: deriveFormality(tone, style),
    content_personality: contentPersonality,
    customer_facing_behavior: `Represents the business in a ${tone.join(" and ")} manner. ${style || "Communicates clearly and professionally."}`,
    brand_promises: [],
    approved_claims: approvedClaims,
    restricted_claims: restrictedClaims,
    source_type: "ai_derived",
    approval_status: "pending",
  };
}

export function identifyMissingPersonaAttributes(
  persona: Omit<BusinessPersona, "id" | "created_at" | "updated_at">
): string[] {
  const missing: string[] = [];

  if (persona.personality_traits.length === 0) missing.push("personality_traits");
  if (persona.tone.length === 0) missing.push("tone");
  if (!persona.communication_style) missing.push("communication_style");
  if (persona.brand_values.length === 0) missing.push("brand_values");
  if (!persona.positioning) missing.push("positioning");
  if (persona.differentiators.length === 0) missing.push("differentiators");
  if (persona.content_personality.length === 0) missing.push("content_personality");
  if (!persona.customer_facing_behavior) missing.push("customer_facing_behavior");

  return missing;
}
