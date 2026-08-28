import { z } from "zod";

// ========== Observation Types ==========
export const ObservationTypeSchema = z.enum([
  "performance_change", "content_pattern", "audience_signal", "customer_question",
  "potential_lead", "complaint", "sentiment_change", "engagement_spike",
  "engagement_drop", "content_opportunity", "competitor_signal", "posting_gap",
  "conversion_signal", "account_health", "strategy_drift", "faq_gap",
  "sensitive_topic", "spam"
]);

export const SeveritySchema = z.enum(["urgent", "high", "medium", "low", "info"]);
export const ObservationStatusSchema = z.enum(["new", "reviewed", "dismissed", "expired"]);

// ========== Recommendation Types ==========
export const ActionTypeSchema = z.enum([
  "create_content", "follow_up_content", "respond_to_customer", "review_lead",
  "investigate_issue", "change_content_mix", "increase_topic_frequency",
  "decrease_topic_frequency", "review_strategy", "connect_account", "other"
]);

export const RecommendationStatusSchema = z.enum([
  "new", "reviewed", "dismissed", "accepted", "completed", "expired"
]);

// ========== Lead Types ==========
export const LeadIntentSchema = z.enum(["high", "medium", "low"]);
export const LeadStatusSchema = z.enum(["new", "reviewing", "qualified", "contacted", "converted", "ignored"]);
export const SourceTypeSchema = z.enum(["comment", "dm", "mention"]);

// ========== Interaction Types ==========
export const InteractionTypeSchema = z.enum([
  "positive", "neutral", "question", "purchase_intent", "complaint",
  "spam", "partnership", "support_request", "other"
]);

// ========== Content Classification Schema ==========
export const ContentClassificationSchema = z.object({
  pillar: z.string().optional(),
  objective: z.string().optional(),
  audience: z.string().optional(),
  format: z.string().optional(),
  product: z.string().optional(),
  cta: z.string().optional(),
  promotional: z.boolean().default(false),
  confidence: z.number().min(0).max(1).default(0.5),
});

export type ContentClassification = z.infer<typeof ContentClassificationSchema>;

// ========== Interaction Classification Schema ==========
export const InteractionClassificationSchema = z.object({
  classification: InteractionTypeSchema,
  confidence: z.number().min(0).max(1).default(0.5),
  reason: z.string().optional(),
  priority: SeveritySchema.default("low"),
});

export type InteractionClassification = z.infer<typeof InteractionClassificationSchema>;

// ========== Observation Schema ==========
export const ObservationSchema = z.object({
  id: z.string().uuid().optional(),
  business_id: z.string().uuid(),
  social_account_id: z.string().uuid().nullable().optional(),
  observation_type: ObservationTypeSchema,
  severity: SeveritySchema.default("info"),
  title: z.string().min(1),
  summary: z.string().min(1),
  evidence: z.record(z.unknown()).default({}),
  source_ids: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1).default(0.5),
  status: ObservationStatusSchema.default("new"),
  signature: z.string().nullable().optional(),
  expires_at: z.string().nullable().optional(),
  created_at: z.string().optional(),
});

export type Observation = z.infer<typeof ObservationSchema>;

// ========== Recommendation Schema ==========
export const RecommendationSchema = z.object({
  id: z.string().uuid().optional(),
  business_id: z.string().uuid(),
  observation_id: z.string().uuid().nullable().optional(),
  title: z.string().min(1),
  description: z.string().min(1),
  action_type: ActionTypeSchema,
  priority: SeveritySchema.default("medium"),
  confidence: z.number().min(0).max(1).default(0.5),
  reason: z.string().min(1),
  status: RecommendationStatusSchema.default("new"),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Recommendation = z.infer<typeof RecommendationSchema>;

// ========== Lead Schema ==========
export const LeadSchema = z.object({
  id: z.string().uuid().optional(),
  business_id: z.string().uuid(),
  social_account_id: z.string().uuid(),
  platform_user_id: z.string().min(1),
  name: z.string().nullable().optional(),
  username: z.string().nullable().optional(),
  source_type: SourceTypeSchema,
  source_reference: z.string().nullable().optional(),
  intent: LeadIntentSchema,
  reason: z.string().min(1),
  status: LeadStatusSchema.default("new"),
  confidence: z.number().min(0).max(1).default(0.5),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Lead = z.infer<typeof LeadSchema>;

// ========== Scan Result Schema ==========
export const ScanResultSchema = z.object({
  observations: z.array(ObservationSchema),
  recommendations: z.array(RecommendationSchema),
  leads: z.array(LeadSchema),
  summary: z.string(),
  nextMove: z.string().optional(),
});

export type ScanResult = z.infer<typeof ScanResultSchema>;
