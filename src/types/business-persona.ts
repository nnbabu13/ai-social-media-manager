import { z } from "zod";

export const businessPersonaSchema = z.object({
  id: z.string().uuid().optional(),
  business_id: z.string().uuid(),

  personality_traits: z.array(z.string()),
  tone: z.array(z.string()),
  communication_style: z.string(),

  brand_values: z.array(z.string()),
  positioning: z.string(),
  differentiators: z.array(z.string()),

  preferred_languages: z.array(z.string()),
  preferred_phrases: z.array(z.string()),
  forbidden_phrases: z.array(z.string()),

  emoji_preference: z.enum(["none", "minimal", "moderate", "frequent"]),
  formality: z.enum(["casual", "balanced", "professional"]),

  content_personality: z.array(z.string()),
  customer_facing_behavior: z.string(),

  brand_promises: z.array(z.string()),
  approved_claims: z.array(z.string()),
  restricted_claims: z.array(z.string()),

  source_type: z.enum(["owner_confirmed", "ai_derived"]),
  approval_status: z.enum(["approved", "pending"]),
});

export type BusinessPersona = z.infer<typeof businessPersonaSchema>;

export const businessPersonaInputSchema = businessPersonaSchema.omit({
  id: true,
});

export type BusinessPersonaInput = z.infer<typeof businessPersonaInputSchema>;

export const businessPersonaUpdateSchema = businessPersonaSchema.partial().extend({
  id: z.string().uuid(),
});

export type BusinessPersonaUpdate = z.infer<typeof businessPersonaUpdateSchema>;
