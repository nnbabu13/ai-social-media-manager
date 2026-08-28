import { createAIProvider } from "@/lib/ai/provider";
import { ContentClassificationSchema, InteractionClassificationSchema } from "@/types/social-intelligence";
import type { ContentClassification, InteractionClassification } from "@/types/social-intelligence";

function extractJSON(text: string): Record<string, unknown> | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

export async function classifySocialContent(params: {
  caption: string;
  businessBrain: {
    products?: string[];
    services?: string[];
    strategy?: { content_pillars?: string[]; primary_objective?: string };
    brand?: { tone?: string };
  };
}): Promise<ContentClassification> {
  const provider = createAIProvider();

  const products = params.businessBrain.products?.join(", ") || "Unknown";
  const services = params.businessBrain.services?.join(", ") || "Unknown";
  const pillars = params.businessBrain.strategy?.content_pillars?.join(", ") || "Not defined";
  const objective = params.businessBrain.strategy?.primary_objective || "Not defined";

  const prompt = `You are a social media content classifier. Classify this social media post.

POST CAPTION:
${params.caption || "(no caption)"}

BUSINESS CONTEXT:
Products: ${products}
Services: ${services}
Strategy pillars: ${pillars}
Primary objective: ${objective}

Classify the post into these categories:
- pillar: Which content pillar does this fit? (education, product, social_proof, conversion, community, entertainment, other)
- objective: What is the post trying to achieve? (awareness, engagement, conversion, retention, other)
- audience: Who is this targeting? (general, existing_customers, potential_customers, specific_segment)
- format: What format is this? (image, video, carousel, story, reel, text, other)
- product: Does this mention a specific product or service? (product name or "none")
- cta: Is there a call to action? (yes description or "none")
- promotional: Is this promotional? (true/false)
- confidence: How confident are you? (0.0-1.0)

Return ONLY valid JSON:
{
  "pillar": "...",
  "objective": "...",
  "audience": "...",
  "format": "...",
  "product": "...",
  "cta": "...",
  "promotional": false,
  "confidence": 0.7
}`;

  try {
    const response = await (provider as any).chatRaw(
      [{ role: "user", content: prompt }],
      { max_tokens: 300, temperature: 0.1 }
    );

    const parsed = extractJSON(response);
    if (!parsed) {
      return {
        pillar: "other",
        objective: "other",
        audience: "general",
        format: "other",
        promotional: false,
        confidence: 0.3,
      };
    }

    const validated = ContentClassificationSchema.safeParse(parsed);
    if (validated.success) {
      return validated.data;
    }

    return {
      pillar: typeof parsed.pillar === "string" ? parsed.pillar : "other",
      objective: typeof parsed.objective === "string" ? parsed.objective : "other",
      audience: typeof parsed.audience === "string" ? parsed.audience : "general",
      format: typeof parsed.format === "string" ? parsed.format : "other",
      product: typeof parsed.product === "string" ? parsed.product : undefined,
      cta: typeof parsed.cta === "string" ? parsed.cta : undefined,
      promotional: Boolean(parsed.promotional),
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
    };
  } catch {
    return {
      pillar: "other",
      objective: "other",
      audience: "general",
      format: "other",
      promotional: false,
      confidence: 0.2,
    };
  }
}

export async function classifySocialInteraction(params: {
  text: string;
  context?: string;
  businessBrain?: {
    products?: string[];
    services?: string[];
    policies?: { autonomy_level?: string };
  };
}): Promise<InteractionClassification> {
  const provider = createAIProvider();

  const prompt = `You are a social media interaction classifier. Classify this customer interaction.

INTERACTION:
${params.text}

${params.context ? `CONTEXT: ${params.context}` : ""}

Classify the interaction:
- classification: What type is this? (positive, neutral, question, purchase_intent, complaint, spam, partnership, support_request, other)
- confidence: How confident are you? (0.0-1.0)
- reason: Brief reason for classification
- priority: How urgent is this? (urgent, high, medium, low, info)

Return ONLY valid JSON:
{
  "classification": "...",
  "confidence": 0.8,
  "reason": "...",
  "priority": "..."
}`;

  try {
    const response = await (provider as any).chatRaw(
      [{ role: "user", content: prompt }],
      { max_tokens: 200, temperature: 0.1 }
    );

    const parsed = extractJSON(response);
    if (!parsed) {
      return {
        classification: "neutral",
        confidence: 0.3,
        priority: "low",
      };
    }

    const validated = InteractionClassificationSchema.safeParse(parsed);
    if (validated.success) {
      return validated.data;
    }

    return {
      classification: ["positive", "neutral", "question", "purchase_intent", "complaint", "spam", "partnership", "support_request", "other"].includes(parsed.classification as string)
        ? (parsed.classification as InteractionClassification["classification"])
        : "neutral",
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
      reason: typeof parsed.reason === "string" ? parsed.reason : undefined,
      priority: ["urgent", "high", "medium", "low", "info"].includes(parsed.priority as string)
        ? (parsed.priority as InteractionClassification["priority"])
        : "low",
    };
  } catch {
    return {
      classification: "neutral",
      confidence: 0.2,
      priority: "low",
    };
  }
}

export async function generateObservationSummary(params: {
  observations: Array<{
    observation_type: string;
    title: string;
    summary: string;
    severity: string;
  }>;
  businessName: string;
}): Promise<{ summary: string; nextMove: string }> {
  if (params.observations.length === 0) {
    return {
      summary: "No significant social activity detected in recent data.",
      nextMove: "Continue posting consistently to build your social presence.",
    };
  }

  const provider = createAIProvider();

  const observationsText = params.observations
    .map((o) => `- [${o.severity}] ${o.title}: ${o.summary}`)
    .join("\n");

  const prompt = `You are a social media analyst for "${params.businessName}".

Recent observations:
${observationsText}

Write a brief "AI Read" summary (2-3 sentences) of what's happening.
Then write a "Next Move" recommendation (1 sentence).

Return ONLY valid JSON:
{
  "summary": "...",
  "nextMove": "..."
}`;

  try {
    const response = await (provider as any).chatRaw(
      [{ role: "user", content: prompt }],
      { max_tokens: 300, temperature: 0.3 }
    );

    const parsed = extractJSON(response);
    if (parsed && typeof parsed.summary === "string" && typeof parsed.nextMove === "string") {
      return { summary: parsed.summary, nextMove: parsed.nextMove };
    }

    return {
      summary: params.observations.map((o) => o.title).join(". ") + ".",
      nextMove: "Review the observations for recommended actions.",
    };
  } catch {
    return {
      summary: params.observations.map((o) => o.title).join(". ") + ".",
      nextMove: "Review the observations for recommended actions.",
    };
  }
}
