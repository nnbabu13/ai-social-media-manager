import { z } from "zod";

// ========== Platform Types ==========
export const PlatformSchema = z.enum(["instagram", "facebook", "linkedin", "tiktok", "youtube", "x"]);
export type Platform = z.infer<typeof PlatformSchema>;

// ========== Content Types ==========
export const ContentTypeSchema = z.enum([
  "image_post", "carousel", "reel_script", "text_post", "educational",
  "testimonial", "product_post", "faq_post", "promotional", "community",
  "behind_the_scenes", "customer_story"
]);
export type ContentType = z.infer<typeof ContentTypeSchema>;

// ========== Content Objective ==========
export const ContentObjectiveSchema = z.enum([
  "education", "awareness", "engagement", "trust", "lead_generation",
  "sales", "community", "retention"
]);
export type ContentObjective = z.infer<typeof ContentObjectiveSchema>;

// ========== Content Status ==========
export const ContentStatusSchema = z.enum(["idea", "brief", "draft", "review", "approved", "rejected", "archived"]);
export type ContentStatus = z.infer<typeof ContentStatusSchema>;

// ========== Quality Status ==========
export const QualityStatusSchema = z.enum(["ready", "needs_improvement", "blocked"]);
export type QualityStatus = z.infer<typeof QualityStatusSchema>;

// ========== Content Brief Schema ==========
export const ContentBriefSchema = z.object({
  objective: ContentObjectiveSchema,
  personaId: z.string().optional(),
  personaName: z.string().optional(),
  pillar: z.string(),
  topic: z.string(),
  keyMessage: z.string(),
  format: ContentTypeSchema,
  cta: z.string().optional(),
  supportingFacts: z.array(z.string()).default([]),
  restrictions: z.array(z.string()).default([]),
  platform: PlatformSchema,
});

export type ContentBrief = z.infer<typeof ContentBriefSchema>;

// ========== Content Idea Schema ==========
export const ContentIdeaSchema = z.object({
  title: z.string(),
  pillar: z.string(),
  personaName: z.string().optional(),
  objective: ContentObjectiveSchema,
  format: ContentTypeSchema,
  rationale: z.string(),
  topic: z.string(),
});

export type ContentIdea = z.infer<typeof ContentIdeaSchema>;

// ========== Content Draft Schema ==========
export const ContentDraftSchema = z.object({
  hook: z.string(),
  caption: z.string(),
  script: z.string().optional(),
  cta: z.string().optional(),
  hashtags: z.array(z.string()).default([]),
  creativeBrief: z.string().optional(),
});

export type ContentDraft = z.infer<typeof ContentDraftSchema>;

// ========== Claim Validation Schema ==========
export const ClaimValidationSchema = z.object({
  valid: z.boolean(),
  unsupportedClaims: z.array(z.string()),
  warnings: z.array(z.string()),
});

export type ClaimValidation = z.infer<typeof ClaimValidationSchema>;

// ========== Content Review Schema ==========
export const ContentReviewSchema = z.object({
  approved: z.boolean(),
  score: z.number().min(0).max(1),
  status: QualityStatusSchema,
  issues: z.array(z.string()),
  warnings: z.array(z.string()),
  suggestions: z.array(z.string()),
});

export type ContentReview = z.infer<typeof ContentReviewSchema>;

// ========== Content Generation Context ==========
export const ContentGenerationContextSchema = z.object({
  businessBrain: z.object({
    name: z.string(),
    category: z.string(),
    description: z.string().optional(),
    products: z.array(z.string()),
    services: z.array(z.string()),
    facts: z.array(z.object({ title: z.string(), content: z.string(), category: z.string() })),
    faqs: z.array(z.object({ question: z.string(), answer: z.string() })),
    goals: z.array(z.object({ goal: z.string(), is_primary: z.boolean() })),
    brand: z.object({
      tone: z.string().optional(),
      styleDescription: z.string().optional(),
      brandKeywords: z.array(z.string()).optional(),
      forbiddenPhrases: z.array(z.string()).optional(),
      emojiPreference: z.string().optional(),
    }).optional(),
    persona: z.object({
      personalityTraits: z.array(z.string()).optional(),
      communicationStyle: z.string().optional(),
      tone: z.string().optional(),
    }).optional(),
    language: z.string().optional(),
  }),
  strategy: z.object({
    primaryObjective: z.string().optional(),
    contentPillars: z.array(z.string()).optional(),
    targetAudiences: z.array(z.string()).optional(),
    contentThemes: z.array(z.string()).optional(),
    brandVoiceGuidelines: z.string().optional(),
    postingFrequency: z.string().optional(),
  }),
  targetPersona: z.object({
    name: z.string(),
    description: z.string().optional(),
    painPoints: z.string().optional(),
    needs: z.string().optional(),
  }).optional(),
  socialInsights: z.array(z.object({
    title: z.string(),
    summary: z.string(),
    observation_type: z.string(),
  })).optional(),
  platform: PlatformSchema,
  objective: ContentObjectiveSchema,
  pillar: z.string(),
  topic: z.string().optional(),
  cta: z.string().optional(),
  brainVersion: z.number().optional(),
  strategyVersion: z.number().optional(),
});

export type ContentGenerationContext = z.infer<typeof ContentGenerationContextSchema>;

// ========== Platform Capabilities ==========
export const PLATFORM_CAPABILITIES: Record<Platform, string[]> = {
  instagram: ["image_post", "carousel", "reel_script", "text_post", "educational", "testimonial", "product_post", "faq_post", "promotional", "community", "behind_the_scenes", "customer_story"],
  facebook: ["image_post", "carousel", "text_post", "educational", "testimonial", "product_post", "faq_post", "promotional", "community", "behind_the_scenes", "customer_story"],
  linkedin: ["text_post", "educational", "product_post", "community"],
  tiktok: ["reel_script", "educational", "behind_the_scenes", "community"],
  youtube: ["reel_script", "educational", "behind_the_scenes"],
  x: ["text_post", "educational", "community"],
};

// ========== Content Pillars ==========
export const DEFAULT_CONTENT_PILLARS = [
  "Education",
  "Product",
  "Social Proof",
  "Community",
  "Promotion",
];
