import { Database } from "./database";

export type BusinessService = Database["public"]["Tables"]["business_services"]["Row"];
export type BusinessServiceInsert = Database["public"]["Tables"]["business_services"]["Insert"];
export type BusinessServiceUpdate = Database["public"]["Tables"]["business_services"]["Update"];

export type BusinessFact = Database["public"]["Tables"]["business_facts"]["Row"];
export type BusinessFactInsert = Database["public"]["Tables"]["business_facts"]["Insert"];
export type BusinessFactUpdate = Database["public"]["Tables"]["business_facts"]["Update"];

export type BusinessFaq = Database["public"]["Tables"]["business_faqs"]["Row"];
export type BusinessFaqInsert = Database["public"]["Tables"]["business_faqs"]["Insert"];
export type BusinessFaqUpdate = Database["public"]["Tables"]["business_faqs"]["Update"];

export type BusinessLocation = Database["public"]["Tables"]["business_locations"]["Row"];
export type BusinessLocationInsert = Database["public"]["Tables"]["business_locations"]["Insert"];
export type BusinessLocationUpdate = Database["public"]["Tables"]["business_locations"]["Update"];

export type BusinessOffer = Database["public"]["Tables"]["business_offers"]["Row"];
export type BusinessOfferInsert = Database["public"]["Tables"]["business_offers"]["Insert"];
export type BusinessOfferUpdate = Database["public"]["Tables"]["business_offers"]["Update"];

export type CustomerPersona = Database["public"]["Tables"]["customer_personas"]["Row"];
export type CustomerPersonaInsert = Database["public"]["Tables"]["customer_personas"]["Insert"];
export type CustomerPersonaUpdate = Database["public"]["Tables"]["customer_personas"]["Update"];

export type BusinessDocument = Database["public"]["Tables"]["business_documents"]["Row"];
export type BusinessDocumentInsert = Database["public"]["Tables"]["business_documents"]["Insert"];
export type BusinessDocumentUpdate = Database["public"]["Tables"]["business_documents"]["Update"];

export type BusinessInterview = Database["public"]["Tables"]["business_interviews"]["Row"];
export type BusinessInterviewInsert = Database["public"]["Tables"]["business_interviews"]["Insert"];
export type BusinessInterviewUpdate = Database["public"]["Tables"]["business_interviews"]["Update"];

export type BusinessInterviewMessage = Database["public"]["Tables"]["business_interview_messages"]["Row"];
export type BusinessInterviewMessageInsert = Database["public"]["Tables"]["business_interview_messages"]["Insert"];

export type KnowledgePending = Database["public"]["Tables"]["knowledge_pending"]["Row"];
export type KnowledgePendingInsert = Database["public"]["Tables"]["knowledge_pending"]["Insert"];
export type KnowledgePendingUpdate = Database["public"]["Tables"]["knowledge_pending"]["Update"];

export type SourceType = "owner" | "ai" | "ai_interview" | "website" | "social" | "manual" | "inferred" | "system";
export type ApprovalStatus = "approved" | "pending" | "rejected";
export type InterviewStatus = "not_started" | "in_progress" | "completed" | "abandoned";
export type InterviewStage = "business" | "products_services" | "customers" | "brand" | "policies" | "goals" | "review";

export interface BusinessBrainContext {
  business: {
    id: string;
    name: string;
    slug: string;
    category: string | null;
    description: string | null;
    website_url: string | null;
    country: string | null;
    region: string | null;
    city: string | null;
    target_customers: string | null;
  };
  products: Array<{ name: string; description: string | null; price: number | null; price_visibility: string }>;
  services: Array<{ name: string; description: string | null; price_text: string | null }>;
  goals: Array<{ goal: string; is_primary: boolean }>;
  brand: {
    tone: string | null;
    style_description: string | null;
    avoid_words: string | null;
    tagline: string | null;
    brand_keywords: string[];
    preferred_phrases: string[];
    forbidden_phrases: string[];
  } | null;
  policies: {
    autonomy_level: string;
    require_approval_discount: boolean;
    require_approval_refund: boolean;
    require_approval_complaint: boolean;
    require_approval_pricing: boolean;
    require_approval_legal: boolean;
    require_approval_medical: boolean;
    require_approval_partnership: boolean;
    require_approval_promises: boolean;
  } | null;
  facts: Array<{ category: string; title: string; content: string }>;
  faqs: Array<{ question: string; answer: string; category: string }>;
  locations: Array<{ name: string; city: string | null; service_area: string | null }>;
  offers: Array<{ name: string; description: string; discount_text: string | null; end_at: string | null }>;
  personas: Array<{ name: string; description: string | null; pain_points: string | null; needs: string | null }>;
  documents: Array<{ title: string; content: string | null; document_type: string }>;
  business_persona?: {
    personality_traits: string[];
    tone: string[];
    communication_style: string;
    brand_values: string[];
    positioning: string;
    differentiators: string[];
    content_personality: string[];
    approved_claims: string[];
    restricted_claims: string[];
  } | null;
  customer_personas?: Array<{
    id: string;
    name: string;
    description: string | null;
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
    priority: string;
    confidence: number;
    source_type: string;
  }>;
  strategy?: {
    primary_objective: { objective: string; description: string };
    content_pillars: Array<{ name: string; purpose: string; recommended_percentage: number }>;
    content_mix: Array<{ category: string; percentage: number }>;
    posting_cadence: { posts_per_week: number };
    conversion_strategy: { primary_action: string; journey: Array<{ step: string }> };
    cta_strategy: Array<{ type: string; percentage: number }>;
    platform_strategy: Array<{ platform: string; priority: string }>;
  } | null;
  operations?: {
    autonomy_profile: string;
    operating_rules: Array<{
      action_type: string;
      mode: string;
      risk_level: string;
      enabled: boolean;
    }>;
  } | null;
  readiness?: import("@/types/brain-readiness").BrainReadiness;
  brain_version?: number;
}

export interface BrainCompletenessResult {
  percentage: number;
  sections: {
    business: { score: number; max: number; missing: string[] };
    products: { score: number; max: number; missing: string[] };
    customers: { score: number; max: number; missing: string[] };
    goals: { score: number; max: number; missing: string[] };
    brand: { score: number; max: number; missing: string[] };
    faqs: { score: number; max: number; missing: string[] };
    facts: { score: number; max: number; missing: string[] };
    locations: { score: number; max: number; missing: string[] };
    offers: { score: number; max: number; missing: string[] };
    interview: { score: number; max: number; missing: string[] };
  };
}

export interface KnowledgeHealthWarning {
  type: "missing" | "conflict" | "expired" | "weak";
  severity: "info" | "warning" | "error";
  section: string;
  message: string;
  entity_id?: string;
}

export interface InterviewContext {
  businessName: string;
  category: string | null;
  currentStage: InterviewStage;
  previousAnswers: Record<string, string>;
  extractedKnowledge: Record<string, unknown>;
}

export interface BusinessKnowledgeExtraction {
  businessFacts: Array<{ category: string; title: string; content: string; confidence: number }>;
  products: Array<{ name: string; description: string; confidence: number }>;
  services: Array<{ name: string; description: string; confidence: number }>;
  faqs: Array<{ question: string; answer: string; confidence: number }>;
  locations: Array<{ name: string; city: string; service_area: string; confidence: number }>;
  customerPersonas: Array<{ name: string; description: string; pain_points: string; needs: string; confidence: number }>;
  brandObservations: Array<{ observation: string; confidence: number }>;
  policies: Array<{ description: string; confidence: number }>;
}

export interface InterviewQuestion {
  question: string;
  stage: InterviewStage;
  is_complete: boolean;
  expects_text: boolean;
  suggested_answers: string[];
}
