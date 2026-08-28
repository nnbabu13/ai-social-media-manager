import { z } from "zod";

export const profilingOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string().optional(),
});

export const profilingQuestionSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  stage: z.enum([
    "customer_segments",
    "customer_needs",
    "buying_triggers",
    "pain_points",
    "differentiators",
    "conversion_actions",
    "content_interests",
    "communication_preferences",
  ]),
  selection_mode: z.enum(["single", "multiple"]),
  options: z.array(profilingOptionSchema),
  allow_other: z.boolean(),
  allow_none: z.boolean(),
  required: z.boolean(),
});

export const profilingScreenSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  questions: z.array(profilingQuestionSchema),
});

export const profilingAnswerSchema = z.object({
  question_id: z.string(),
  selected_option_ids: z.array(z.string()),
  custom_text: z.string().optional(),
});

export const generatedPersonaSchema = z.object({
  name: z.string(),
  description: z.string(),
  segments: z.array(z.string()),
  needs: z.array(z.string()),
  pain_points: z.array(z.string()),
  buying_triggers: z.array(z.string()),
  objections: z.array(z.string()),
  content_interests: z.array(z.string()),
  preferred_channels: z.array(z.string()),
  priority: z.enum(["primary", "secondary", "occasional"]),
  confidence: z.number().min(0).max(1),
  source: z.enum(["owner_confirmed", "ai_derived"]),
});

export const personaReviewSchema = z.object({
  personas: z.array(generatedPersonaSchema),
  derived_insights: z.array(z.string()),
});

export type ProfilingOptionOutput = z.infer<typeof profilingOptionSchema>;
export type ProfilingQuestionOutput = z.infer<typeof profilingQuestionSchema>;
export type ProfilingScreenOutput = z.infer<typeof profilingScreenSchema>;
export type ProfilingAnswerOutput = z.infer<typeof profilingAnswerSchema>;
export type GeneratedPersonaOutput = z.infer<typeof generatedPersonaSchema>;
export type PersonaReviewOutput = z.infer<typeof personaReviewSchema>;
