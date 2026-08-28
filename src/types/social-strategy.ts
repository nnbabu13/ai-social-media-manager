import { z } from "zod";

export const strategyObjectiveSchema = z.object({
  objective: z.string(),
  description: z.string(),
  priority: z.enum(["primary", "secondary"]),
});

export type StrategyObjective = z.infer<typeof strategyObjectiveSchema>;

export const contentPillarSchema = z.object({
  id: z.string().uuid().optional(),
  business_id: z.string().uuid(),
  strategy_id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  purpose: z.enum([
    "education",
    "awareness",
    "engagement",
    "trust",
    "lead_generation",
    "sales",
    "community",
    "retention",
  ]),
  target_personas: z.array(z.string()),
  priority: z.enum(["primary", "secondary"]),
  recommended_percentage: z.number().min(0).max(100),
  example_topics: z.array(z.string()),
  enabled: z.boolean().default(true),
  source_type: z.enum(["owner_confirmed", "ai_derived"]),
  approval_status: z.enum(["approved", "pending"]),
});

export type ContentPillar = z.infer<typeof contentPillarSchema>;

export const contentMixItemSchema = z.object({
  category: z.string(),
  percentage: z.number().min(0).max(100),
  description: z.string(),
});

export type ContentMixItem = z.infer<typeof contentMixItemSchema>;

export const contentFormatSchema = z.object({
  format: z.string(),
  priority: z.enum(["high", "medium", "low"]),
  platforms: z.array(z.string()),
});

export type ContentFormat = z.infer<typeof contentFormatSchema>;

export const postingCadenceSchema = z.object({
  posts_per_week: z.number().min(1).max(14),
  distribution: z.array(
    z.object({
      day: z.string(),
      preferred_formats: z.array(z.string()),
    })
  ),
  flexibility: z.enum(["fixed", "adaptive", "ai_decides"]),
});

export type PostingCadence = z.infer<typeof postingCadenceSchema>;

export const platformStrategySchema = z.object({
  platform: z.enum(["instagram", "facebook", "linkedin", "tiktok", "youtube", "x"]),
  enabled: z.boolean(),
  priority: z.enum(["primary", "secondary"]),
  objectives: z.array(z.string()),
  preferred_formats: z.array(z.string()),
  posting_frequency: z.number().optional(),
});

export type PlatformStrategy = z.infer<typeof platformStrategySchema>;

export const conversionStepSchema = z.object({
  step: z.string(),
  description: z.string(),
  platform: z.string().optional(),
});

export type ConversionStep = z.infer<typeof conversionStepSchema>;

export const conversionStrategySchema = z.object({
  primary_action: z.enum([
    "whatsapp",
    "dm",
    "call",
    "website",
    "booking",
    "quote",
    "store_visit",
    "purchase",
    "other",
  ]),
  secondary_actions: z.array(z.string()),
  journey: z.array(conversionStepSchema),
  preferred_cta_style: z.enum(["direct", "soft", "educational", "mixed"]),
});

export type ConversionStrategy = z.infer<typeof conversionStrategySchema>;

export const ctaStrategySchema = z.object({
  type: z.enum(["soft", "engagement", "conversion", "direct_sales"]),
  percentage: z.number().min(0).max(100),
  examples: z.array(z.string()),
});

export type CTAStrategy = z.infer<typeof ctaStrategySchema>;

export const seasonalPeriodSchema = z.object({
  season: z.string(),
  event: z.string().optional(),
  start_month: z.number().min(1).max(12),
  end_month: z.number().min(1).max(12),
  priority: z.enum(["high", "medium", "low"]),
  recommended_pillars: z.array(z.string()),
  offer_opportunities: z.array(z.string()),
});

export type SeasonalPeriod = z.infer<typeof seasonalPeriodSchema>;

export const contentRulesSchema = z.object({
  always_emphasize: z.array(z.string()),
  avoid: z.array(z.string()),
  tone_guidelines: z.string().optional(),
});

export type ContentRules = z.infer<typeof contentRulesSchema>;

export const socialStrategySchema = z.object({
  id: z.string().uuid().optional(),
  business_id: z.string().uuid(),

  primary_objective: strategyObjectiveSchema,
  secondary_objectives: z.array(strategyObjectiveSchema),

  target_personas: z.array(
    z.object({
      persona_id: z.string(),
      name: z.string(),
      priority: z.enum(["primary", "secondary"]),
    })
  ),

  content_pillars: z.array(contentPillarSchema),
  content_mix: z.array(contentMixItemSchema),
  preferred_formats: z.array(contentFormatSchema),
  posting_cadence: postingCadenceSchema,

  platform_strategy: z.array(platformStrategySchema),
  conversion_strategy: conversionStrategySchema,
  cta_strategy: z.array(ctaStrategySchema),

  seasonal_strategy: z.array(seasonalPeriodSchema).optional(),
  content_rules: contentRulesSchema,

  strategy_status: z.enum(["draft", "review", "approved", "active"]),
  source_type: z.enum(["owner_confirmed", "ai_derived"]),

  explanation: z.string().optional(),
});

export type SocialStrategy = z.infer<typeof socialStrategySchema>;

export const socialStrategyInputSchema = socialStrategySchema.omit({
  id: true,
});

export type SocialStrategyInput = z.infer<typeof socialStrategyInputSchema>;

export const socialStrategyUpdateSchema = socialStrategySchema.partial().extend({
  id: z.string().uuid(),
});

export type SocialStrategyUpdate = z.infer<typeof socialStrategyUpdateSchema>;
