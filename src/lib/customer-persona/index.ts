import type { BusinessBrainContext } from "@/types/business-brain";

export interface CustomerPersonaInput {
  name: string;
  description: string;
  segments: string[];
  needs: string[];
  pain_points: string[];
  buying_triggers: string[];
  objections: string[];
  decision_factors: string[];
  desired_outcomes: string[];
  content_interests: string[];
  preferred_channels: string[];
  conversion_action: string;
  priority: "primary" | "secondary" | "occasional";
  confidence: number;
  source_type: "owner_confirmed" | "ai_derived";
  approval_status: "approved" | "pending";
}

function detectDuplicatePersonas(personas: CustomerPersonaInput[]): CustomerPersonaInput[] {
  const unique: CustomerPersonaInput[] = [];

  for (const persona of personas) {
    const isDuplicate = unique.some(existing => {
      const nameSimilarity = calculateSimilarity(existing.name.toLowerCase(), persona.name.toLowerCase());
      const needsSimilarity = calculateArraySimilarity(existing.needs, persona.needs);
      const segmentsSimilarity = calculateArraySimilarity(existing.segments, persona.segments);

      return nameSimilarity > 0.7 || (needsSimilarity > 0.7 && segmentsSimilarity > 0.7);
    });

    if (!isDuplicate) {
      unique.push(persona);
    }
  }

  return unique;
}

function calculateSimilarity(a: string, b: string): number {
  const wordsA = a.split(/\s+/);
  const wordsB = b.split(/\s+/);
  const intersection = wordsA.filter(w => wordsB.includes(w));
  const union = Array.from(new Set([...wordsA, ...wordsB]));
  return intersection.length / union.length;
}

function calculateArraySimilarity(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 1;
  if (a.length === 0 || b.length === 0) return 0;
  const intersection = a.filter(x => b.includes(x));
  const union = Array.from(new Set([...a, ...b]));
  return intersection.length / union.length;
}

function derivePriority(
  index: number,
  totalPersonas: number,
  goals: BusinessBrainContext["goals"]
): "primary" | "secondary" | "occasional" {
  if (totalPersonas === 1) return "primary";
  if (index === 0) return "primary";
  if (index === 1) return "secondary";
  return "occasional";
}

function deriveConversionAction(
  goals: BusinessBrainContext["goals"],
  services: BusinessBrainContext["services"]
): string {
  if (goals.length > 0) {
    const primaryGoal = goals.find(g => g.is_primary) || goals[0];
    return primaryGoal.goal;
  }

  if (services.length > 0) {
    return "Book a service";
  }

  return "Contact the business";
}

export function generateCustomerPersonasFromBrain(
  brain: BusinessBrainContext
): CustomerPersonaInput[] {
  const personas: CustomerPersonaInput[] = [];

  const targetCustomers = brain.business.target_customers;
  const segments = targetCustomers
    ? targetCustomers.split(/[,;]+/).map(s => s.trim()).filter(Boolean)
    : [];

  if (segments.length === 0 && brain.personas.length === 0) {
    return [];
  }

  if (segments.length > 0) {
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const needs = brain.personas.length > 0
        ? brain.personas.filter(p => p.needs).map(p => p.needs!).filter(Boolean)
        : [];
      const painPoints = brain.personas.length > 0
        ? brain.personas.filter(p => p.pain_points).map(p => p.pain_points!).filter(Boolean)
        : [];

      personas.push({
        name: segment,
        description: `Customers in the ${segment.toLowerCase()} segment`,
        segments: [segment],
        needs: needs.length > 0 ? needs : ["General products/services"],
        pain_points: painPoints.length > 0 ? painPoints : [],
        buying_triggers: [],
        objections: [],
        decision_factors: [],
        desired_outcomes: [],
        content_interests: [],
        preferred_channels: [],
        conversion_action: deriveConversionAction(brain.goals, brain.services),
        priority: derivePriority(i, segments.length, brain.goals),
        confidence: 0.7,
        source_type: "ai_derived",
        approval_status: "pending",
      });
    }
  } else if (brain.personas.length > 0) {
    for (let i = 0; i < brain.personas.length; i++) {
      const p = brain.personas[i];
      personas.push({
        name: p.name,
        description: p.description || `Customer persona: ${p.name}`,
        segments: [p.name],
        needs: p.needs ? p.needs.split(/[;,]+/).map(s => s.trim()).filter(Boolean) : [],
        pain_points: p.pain_points ? p.pain_points.split(/[;,]+/).map(s => s.trim()).filter(Boolean) : [],
        buying_triggers: [],
        objections: [],
        decision_factors: [],
        desired_outcomes: [],
        content_interests: [],
        preferred_channels: [],
        conversion_action: deriveConversionAction(brain.goals, brain.services),
        priority: derivePriority(i, brain.personas.length, brain.goals),
        confidence: 0.7,
        source_type: "ai_derived",
        approval_status: "pending",
      });
    }
  }

  return detectDuplicatePersonas(personas);
}

export function identifyMissingPersonaFields(
  persona: CustomerPersonaInput
): string[] {
  const missing: string[] = [];

  if (!persona.description) missing.push("description");
  if (persona.needs.length === 0) missing.push("needs");
  if (persona.pain_points.length === 0) missing.push("pain_points");
  if (persona.buying_triggers.length === 0) missing.push("buying_triggers");
  if (persona.content_interests.length === 0) missing.push("content_interests");
  if (!persona.conversion_action) missing.push("conversion_action");

  return missing;
}
