import { createAIProvider } from "@/lib/ai/provider";
import type { ContentGenerationContext, ContentIdea, ContentBrief, ContentDraft, ContentReview } from "@/types/content";
import { ContentIdeaSchema, ContentBriefSchema, ContentDraftSchema, ContentReviewSchema } from "@/types/content";

function extractJSON(text: string): Record<string, unknown> | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

function extractJSONArray(text: string): unknown[] | null {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

function buildBrainContext(brain: ContentGenerationContext["businessBrain"]): string {
  return `
Business: ${brain.name}
Category: ${brain.category}
${brain.description ? `Description: ${brain.description}` : ""}
Products: ${brain.products.join(", ") || "None listed"}
Services: ${brain.services.join(", ") || "None listed"}
Goals: ${brain.goals.map((g) => `${g.goal}${g.is_primary ? " (primary)" : ""}`).join(", ")}
${brain.brand ? `Brand tone: ${brain.brand.tone || "Not specified"}` : ""}
${brain.brand?.styleDescription ? `Style: ${brain.brand.styleDescription}` : ""}
${brain.brand?.brandKeywords?.length ? `Keywords: ${brain.brand.brandKeywords.join(", ")}` : ""}
${brain.brand?.forbiddenPhrases?.length ? `FORBIDDEN phrases: ${brain.brand.forbiddenPhrases.join(", ")}` : ""}
${brain.brand?.emojiPreference ? `Emoji style: ${brain.brand.emojiPreference}` : ""}
Facts: ${brain.facts.map((f) => `${f.title}: ${f.content}`).join("; ") || "None"}
FAQs: ${brain.faqs.map((f) => `Q: ${f.question} A: ${f.answer}`).join("; ") || "None"}
`.trim();
}

function buildStrategyContext(strategy: ContentGenerationContext["strategy"]): string {
  return `
Strategy objective: ${strategy.primaryObjective || "Not specified"}
Content pillars: ${strategy.contentPillars?.join(", ") || "Not specified"}
Target audiences: ${strategy.targetAudiences?.join(", ") || "Not specified"}
Brand voice: ${strategy.brandVoiceGuidelines || "Not specified"}
Posting frequency: ${strategy.postingFrequency || "Not specified"}
`.trim();
}

export async function generateContentIdeas(params: {
  context: ContentGenerationContext;
  count: number;
}): Promise<ContentIdea[]> {
  const provider = createAIProvider();
  const { context, count } = params;

  const prompt = `You are a social media content strategist for a small business.

BUSINESS:
${buildBrainContext(context.businessBrain)}

STRATEGY:
${buildStrategyContext(context.strategy)}

${context.targetPersona ? `TARGET PERSONA:\nName: ${context.targetPersona.name}\nDescription: ${context.targetPersona.description || "N/A"}\nPain points: ${context.targetPersona.painPoints || "N/A"}\nNeeds: ${context.targetPersona.needs || "N/A"}` : ""}

${context.socialInsights?.length ? `SOCIAL INTELLIGENCE:\n${context.socialInsights.map((s) => `- ${s.title}: ${s.summary}`).join("\n")}` : ""}

Generate ${count} specific content ideas for ${context.platform}.
Each idea must target the ${context.objective} objective and fit the ${context.pillar} pillar.

Return a JSON array of ideas:
[
  {
    "title": "compelling title for the content",
    "pillar": "${context.pillar}",
    "personaName": "${context.targetPersona?.name || "General audience"}",
    "objective": "${context.objective}",
    "format": "appropriate format (image_post, carousel, reel_script, etc.)",
    "rationale": "why this idea works for this business",
    "topic": "specific topic"
  }
]

Rules:
- Ideas must be specific to THIS business, not generic
- Use only facts from the Business Brain
- Be creative but grounded
- Avoid repetitive ideas
- Match the platform's strengths
- Consider the target persona's needs`;

  try {
    const response = await (provider as any).chatRaw(
      [{ role: "user", content: prompt }],
      { max_tokens: 1500, temperature: 0.7 }
    );

    const parsed = extractJSONArray(response);
    if (!parsed || !Array.isArray(parsed)) {
      return generateFallbackIdeas(context, count);
    }

    const ideas: ContentIdea[] = [];
    for (const item of parsed) {
      const validated = ContentIdeaSchema.safeParse(item);
      if (validated.success) {
        ideas.push(validated.data);
      }
    }

    return ideas.length > 0 ? ideas : generateFallbackIdeas(context, count);
  } catch {
    return generateFallbackIdeas(context, count);
  }
}

function generateFallbackIdeas(context: ContentGenerationContext, count: number): ContentIdea[] {
  const ideas: ContentIdea[] = [];
  const products = context.businessBrain.products;
  const persona = context.targetPersona?.name || "your audience";

  if (products.length > 0) {
    ideas.push({
      title: `How ${products[0]} can help ${persona}`,
      pillar: context.pillar,
      personaName: context.targetPersona?.name,
      objective: context.objective,
      format: context.platform === "instagram" ? "reel_script" : "image_post",
      rationale: `Highlights your core product for the target audience`,
      topic: `Benefits of ${products[0]}`,
    });
  }

  ideas.push({
    title: `3 things ${persona} should know about ${context.businessBrain.category}`,
    pillar: "Education",
    personaName: context.targetPersona?.name,
    objective: "education",
    format: "carousel",
    rationale: `Educational content builds trust with ${persona}`,
    topic: `Industry insights for ${context.businessBrain.category}`,
  });

  ideas.push({
    title: `Behind the scenes at ${context.businessBrain.name}`,
    pillar: "Community",
    personaName: context.targetPersona?.name,
    objective: "engagement",
    format: context.platform === "instagram" ? "reel_script" : "image_post",
    rationale: `Humanizes the brand and builds connection`,
    topic: `Day in the life at ${context.businessBrain.name}`,
  });

  return ideas.slice(0, count);
}

export async function generateContentBrief(params: {
  context: ContentGenerationContext;
  idea: ContentIdea;
}): Promise<ContentBrief> {
  const provider = createAIProvider();
  const { context, idea } = params;

  const prompt = `You are a content strategist creating a detailed content brief.

BUSINESS:
${buildBrainContext(context.businessBrain)}

STRATEGY:
${buildStrategyContext(context.strategy)}

${context.targetPersona ? `TARGET PERSONA:\nName: ${context.targetPersona.name}\nDescription: ${context.targetPersona.description || "N/A"}\nPain points: ${context.targetPersona.painPoints || "N/A"}\nNeeds: ${context.targetPersona.needs || "N/A"}` : ""}

CONTENT IDEA:
Title: ${idea.title}
Topic: ${idea.topic}
Objective: ${idea.objective}
Pillar: ${idea.pillar}
Platform: ${context.platform}

Create a detailed content brief with:
- objective: the primary goal
- pillar: the content pillar
- topic: specific topic
- keyMessage: the single most important message
- format: content format
- cta: recommended call to action
- supportingFacts: array of Business Brain facts to use
- restrictions: array of things to avoid

Return JSON:
{
  "objective": "${idea.objective}",
  "pillar": "${idea.pillar}",
  "topic": "${idea.topic}",
  "keyMessage": "the core message",
  "format": "${idea.format}",
  "cta": "recommended CTA",
  "supportingFacts": ["fact 1", "fact 2"],
  "restrictions": ["restriction 1"]
}`;

  try {
    const response = await (provider as any).chatRaw(
      [{ role: "user", content: prompt }],
      { max_tokens: 800, temperature: 0.3 }
    );

    const parsed = extractJSON(response);
    if (!parsed) {
      return generateFallbackBrief(context, idea);
    }

    const validated = ContentBriefSchema.safeParse({
      ...parsed,
      personaId: context.targetPersona?.name,
      personaName: context.targetPersona?.name,
      platform: context.platform,
    });

    if (validated.success) return validated.data;
    return generateFallbackBrief(context, idea);
  } catch {
    return generateFallbackBrief(context, idea);
  }
}

function generateFallbackBrief(context: ContentGenerationContext, idea: ContentIdea): ContentBrief {
  const facts = context.businessBrain.facts.slice(0, 3).map((f) => `${f.title}: ${f.content}`);
  return {
    objective: idea.objective,
    pillar: idea.pillar,
    topic: idea.topic,
    keyMessage: idea.title,
    format: idea.format,
    cta: context.cta || "Learn more",
    supportingFacts: facts,
    restrictions: context.businessBrain.brand?.forbiddenPhrases || [],
    platform: context.platform,
    personaId: context.targetPersona?.name,
    personaName: context.targetPersona?.name,
  };
}

export async function generateContentDraft(params: {
  context: ContentGenerationContext;
  brief: ContentBrief;
}): Promise<ContentDraft> {
  const provider = createAIProvider();
  const { context, brief } = params;

  const platformGuidance: Record<string, string> = {
    instagram: "Instagram posts need a strong opening hook, visual-first approach, concise caption, optional hashtags, and clear CTA.",
    facebook: "Facebook posts should be conversational, community-friendly, and slightly more context where useful.",
    linkedin: "LinkedIn posts should be professional, insight-driven, business relevance, avoid generic promotional language.",
    tiktok: "TikTok scripts should be punchy, visual, trend-aware, and authentic.",
    youtube: "YouTube scripts should be informative, engaging, and well-structured.",
    x: "X/Twitter posts should be concise, impactful, and conversational.",
  };

  const personaContext = context.targetPersona
    ? `\nTARGET PERSONA: ${context.targetPersona.name}\nNeeds: ${context.targetPersona.needs || "N/A"}\nPain points: ${context.targetPersona.painPoints || "N/A"}`
    : "";

  const emojiGuidance = context.businessBrain.brand?.emojiPreference
    ? `\nEmoji preference: ${context.businessBrain.brand.emojiPreference}`
    : "";

  const prompt = `You are an expert social media content creator.

BUSINESS: ${context.businessBrain.name}
Category: ${context.businessBrain.category}
${context.businessBrain.brand?.tone ? `Brand tone: ${context.businessBrain.brand.tone}` : ""}
${context.businessBrain.brand?.styleDescription ? `Style: ${context.businessBrain.brand.styleDescription}` : ""}
${context.businessBrain.brand?.brandKeywords?.length ? `Keywords to use: ${context.businessBrain.brand.brandKeywords.join(", ")}` : ""}
${context.businessBrain.brand?.forbiddenPhrases?.length ? `FORBIDDEN phrases: ${context.businessBrain.brand.forbiddenPhrases.join(", ")}` : ""}
${emojiGuidance}

CONTENT BRIEF:
Objective: ${brief.objective}
Pillar: ${brief.pillar}
Topic: ${brief.topic}
Key message: ${brief.keyMessage}
Format: ${brief.format}
Platform: ${brief.platform}
CTA: ${brief.cta || "Not specified"}
Supporting facts: ${brief.supportingFacts.join("; ")}
Restrictions: ${brief.restrictions.join("; ")}
${personaContext}

PLATFORM GUIDANCE: ${platformGuidance[context.platform] || ""}

Generate a complete social media post.

Return JSON:
{
  "hook": "compelling opening line (first thing people see)",
  "caption": "full post caption with hook as first line",
  "script": "if reel/video, the script; otherwise null",
  "cta": "clear call to action",
  "hashtags": ["relevant", "hashtags"],
  "creativeBrief": "description of visual/image to create"
}

Rules:
- Use ONLY the facts provided above
- Never invent prices, certifications, or claims
- Match the brand tone exactly
- Target the specified persona
- Make the hook compelling and specific
- Keep the caption appropriate for the platform
- CTA should match the conversion strategy`;

  try {
    const response = await (provider as any).chatRaw(
      [{ role: "user", content: prompt }],
      { max_tokens: 1200, temperature: 0.7 }
    );

    const parsed = extractJSON(response);
    if (!parsed) {
      return generateFallbackDraft(context, brief);
    }

    const validated = ContentDraftSchema.safeParse(parsed);
    if (validated.success) return validated.data;

    return {
      hook: typeof parsed.hook === "string" ? parsed.hook : brief.keyMessage,
      caption: typeof parsed.caption === "string" ? parsed.caption : "",
      script: typeof parsed.script === "string" ? parsed.script : undefined,
      cta: typeof parsed.cta === "string" ? parsed.cta : brief.cta,
      hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : [],
      creativeBrief: typeof parsed.creativeBrief === "string" ? parsed.creativeBrief : undefined,
    };
  } catch {
    return generateFallbackDraft(context, brief);
  }
}

function generateFallbackDraft(context: ContentGenerationContext, brief: ContentBrief): ContentDraft {
  const brand = context.businessBrain.brand;
  const tone = brand?.tone || "professional";
  const facts = brief.supportingFacts.length > 0 ? brief.supportingFacts[0] : "";

  return {
    hook: `${context.businessBrain.name} — ${brief.topic}`,
    caption: `${brief.topic}\n\n${facts}\n\n${brief.cta || "Learn more"}`,
    cta: brief.cta || "Learn more",
    hashtags: [],
  };
}

export async function reviewGeneratedContent(params: {
  content: ContentDraft;
  context: ContentGenerationContext;
}): Promise<ContentReview> {
  const provider = createAIProvider();
  const { content, context } = params;

  const prompt = `You are a content quality reviewer for social media posts.

BUSINESS: ${context.businessBrain.name}
Brand tone: ${context.businessBrain.brand?.tone || "Not specified"}
FORBIDDEN phrases: ${context.businessBrain.brand?.forbiddenPhrases?.join(", ") || "None"}

CONTENT TO REVIEW:
Hook: ${content.hook}
Caption: ${content.caption}
CTA: ${content.cta || "None"}
Hashtags: ${content.hashtags?.join(", ") || "None"}

Review for:
1. Business relevance
2. Brand alignment
3. Persona alignment
4. Strategy alignment
5. Specificity (not generic)
6. Claim safety (no unsupported claims)
7. CTA alignment
8. Originality

Return JSON:
{
  "approved": true/false,
  "score": 0.0-1.0,
  "status": "ready"/"needs_improvement"/"blocked",
  "issues": ["issue 1"],
  "warnings": ["warning 1"],
  "suggestions": ["suggestion 1"]
}`;

  try {
    const response = await (provider as any).chatRaw(
      [{ role: "user", content: prompt }],
      { max_tokens: 500, temperature: 0.2 }
    );

    const parsed = extractJSON(response);
    if (!parsed) {
      return {
        approved: true,
        score: 0.7,
        status: "ready",
        issues: [],
        warnings: ["AI review unavailable — manual review recommended"],
        suggestions: [],
      };
    }

    const validated = ContentReviewSchema.safeParse(parsed);
    if (validated.success) return validated.data;

    return {
      approved: true,
      score: 0.7,
      status: "ready",
      issues: [],
      warnings: [],
      suggestions: [],
    };
  } catch {
    return {
      approved: true,
      score: 0.7,
      status: "ready",
      issues: [],
      warnings: ["AI review unavailable — manual review recommended"],
      suggestions: [],
    };
  }
}
