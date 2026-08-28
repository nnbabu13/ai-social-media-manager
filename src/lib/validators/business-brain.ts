import { z } from "zod";

// ============================================================
// Services
// ============================================================
export const serviceSchema = z.object({
  name: z.string().min(1, "Service name is required").max(100),
  description: z.string().max(500).optional(),
  price_text: z.string().max(100).optional(),
  price_visibility: z.enum(["public", "ask_first", "private"]).default("ask_first"),
  url: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
});

export const servicesSchema = z.object({
  services: z.array(serviceSchema).min(1, "Add at least one service"),
});

// ============================================================
// Business Facts
// ============================================================
export const factSchema = z.object({
  category: z.enum([
    "general", "pricing", "delivery", "location", "opening_hours",
    "products", "services", "policies", "customer_service", "brand", "other"
  ]).default("general"),
  title: z.string().min(1, "Title is required").max(200),
  content: z.string().min(1, "Content is required").max(2000),
  priority: z.number().int().min(0).max(10).default(0),
});

export const factsSchema = z.object({
  facts: z.array(factSchema),
});

// ============================================================
// FAQs
// ============================================================
export const faqSchema = z.object({
  question: z.string().min(1, "Question is required").max(500),
  answer: z.string().min(1, "Answer is required").max(2000),
  category: z.enum([
    "general", "pricing", "delivery", "products", "services",
    "policies", "hours", "location", "other"
  ]).default("general"),
  priority: z.number().int().min(0).max(10).default(0),
});

export const faqsSchema = z.object({
  faqs: z.array(faqSchema),
});

// ============================================================
// Locations
// ============================================================
export const locationSchema = z.object({
  name: z.string().min(1, "Location name is required").max(100),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  region: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  postal_code: z.string().max(20).optional(),
  phone: z.string().max(30).optional(),
  opening_hours: z.record(z.string(), z.string()).optional(),
  service_area: z.string().max(500).optional(),
  is_primary: z.boolean().default(false),
});

export const locationsSchema = z.object({
  locations: z.array(locationSchema),
});

// ============================================================
// Offers
// ============================================================
export const offerSchema = z.object({
  name: z.string().min(1, "Offer name is required").max(200),
  description: z.string().min(1, "Description is required").max(2000),
  offer_type: z.enum(["promotion", "discount", "bundle", "seasonal", "loyalty", "other"]).default("promotion"),
  discount_text: z.string().max(200).optional(),
  start_at: z.string().optional(),
  end_at: z.string().optional(),
  terms: z.string().max(1000).optional(),
  url: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
});

export const offersSchema = z.object({
  offers: z.array(offerSchema),
});

// ============================================================
// Customer Personas
// ============================================================
export const personaSchema = z.object({
  name: z.string().min(1, "Persona name is required").max(100),
  description: z.string().max(1000).optional(),
  pain_points: z.string().max(1000).optional(),
  needs: z.string().max(1000).optional(),
  buying_triggers: z.string().max(1000).optional(),
  objections: z.string().max(1000).optional(),
  preferred_channels: z.string().max(500).optional(),
  priority: z.number().int().min(0).max(10).default(0),
});

export const personasSchema = z.object({
  personas: z.array(personaSchema),
});

// ============================================================
// Business Documents
// ============================================================
export const documentSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(500).optional(),
  document_type: z.enum(["manual", "website", "uploaded", "ai_generated"]).default("manual"),
  content: z.string().max(10000).optional(),
  source_url: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
});

// ============================================================
// Brand Knowledge Extension
// ============================================================
export const brandKnowledgeSchema = z.object({
  tagline: z.string().max(200).optional(),
  brand_keywords: z.array(z.string()).optional(),
  preferred_phrases: z.array(z.string()).optional(),
  forbidden_phrases: z.array(z.string()).optional(),
  emoji_preference: z.enum(["none", "minimal", "moderate", "heavy"]).default("moderate"),
  hashtag_preference: z.enum(["none", "minimal", "moderate", "heavy"]).default("moderate"),
  writing_length: z.enum(["short", "medium", "long"]).default("medium"),
  language_preferences: z.array(z.string()).default(["en"]),
});

// ============================================================
// Interview
// ============================================================
export const interviewMessageSchema = z.object({
  role: z.enum(["system", "assistant", "user"]),
  content: z.string().min(1),
  metadata: z.record(z.unknown()).optional(),
});

// ============================================================
// Knowledge Extraction
// ============================================================
export const extractedFactSchema = z.object({
  category: z.string(),
  title: z.string(),
  content: z.string(),
  confidence: z.number().min(0).max(1),
});

export const extractedProductSchema = z.object({
  name: z.string(),
  description: z.string(),
  confidence: z.number().min(0).max(1),
});

export const extractedServiceSchema = z.object({
  name: z.string(),
  description: z.string(),
  confidence: z.number().min(0).max(1),
});

export const extractedFaqSchema = z.object({
  question: z.string(),
  answer: z.string(),
  confidence: z.number().min(0).max(1),
});

export const extractedLocationSchema = z.object({
  name: z.string(),
  city: z.string(),
  service_area: z.string(),
  confidence: z.number().min(0).max(1),
});

export const extractedPersonaSchema = z.object({
  name: z.string(),
  description: z.string(),
  pain_points: z.string(),
  needs: z.string(),
  confidence: z.number().min(0).max(1),
});

export const businessKnowledgeExtractionSchema = z.object({
  businessFacts: z.array(extractedFactSchema),
  products: z.array(extractedProductSchema),
  services: z.array(extractedServiceSchema),
  faqs: z.array(extractedFaqSchema),
  locations: z.array(extractedLocationSchema),
  customerPersonas: z.array(extractedPersonaSchema),
  brandObservations: z.array(z.object({
    observation: z.string(),
    confidence: z.number().min(0).max(1),
  })),
  policies: z.array(z.object({
    description: z.string(),
    confidence: z.number().min(0).max(1),
  })),
});

// ============================================================
// Website Scan
// ============================================================
export const websiteScanResultSchema = z.object({
  businessFacts: z.array(extractedFactSchema),
  products: z.array(extractedProductSchema),
  services: z.array(extractedServiceSchema),
  faqs: z.array(extractedFaqSchema),
  locations: z.array(extractedLocationSchema),
  brandObservations: z.array(z.object({
    observation: z.string(),
    confidence: z.number().min(0).max(1),
  })),
  conflicts: z.array(z.object({
    type: z.string(),
    description: z.string(),
    websiteValue: z.string(),
    existingValue: z.string(),
  })),
});

// ============================================================
// Search
// ============================================================
export const knowledgeSearchSchema = z.object({
  query: z.string().min(1, "Search query is required").max(200),
  types: z.array(z.enum(["products", "services", "faqs", "facts", "offers", "locations", "personas", "documents"])).optional(),
});

export type ServiceInput = z.infer<typeof serviceSchema>;
export type ServicesInput = z.infer<typeof servicesSchema>;
export type FactInput = z.infer<typeof factSchema>;
export type FactsInput = z.infer<typeof factsSchema>;
export type FaqInput = z.infer<typeof faqSchema>;
export type FaqsInput = z.infer<typeof faqsSchema>;
export type LocationInput = z.infer<typeof locationSchema>;
export type LocationsInput = z.infer<typeof locationsSchema>;
export type OfferInput = z.infer<typeof offerSchema>;
export type OffersInput = z.infer<typeof offersSchema>;
export type PersonaInput = z.infer<typeof personaSchema>;
export type PersonasInput = z.infer<typeof personasSchema>;
export type DocumentInput = z.infer<typeof documentSchema>;
export type BrandKnowledgeInput = z.infer<typeof brandKnowledgeSchema>;
export type InterviewMessageInput = z.infer<typeof interviewMessageSchema>;
export type BusinessKnowledgeExtractionInput = z.infer<typeof businessKnowledgeExtractionSchema>;
export type WebsiteScanResultInput = z.infer<typeof websiteScanResultSchema>;
export type KnowledgeSearchInput = z.infer<typeof knowledgeSearchSchema>;

// ============================================================
// Interview Question (structured AI output)
// ============================================================
export const interviewQuestionSchema = z.object({
  question: z.string().min(1, "Question is required"),
  stage: z.enum(["business", "products_services", "customers", "brand", "policies", "goals", "review"]),
  is_complete: z.boolean().default(false),
  expects_text: z.boolean().default(true),
  suggested_answers: z.array(z.string()).default([]),
});

export type InterviewQuestionOutput = z.infer<typeof interviewQuestionSchema>;
