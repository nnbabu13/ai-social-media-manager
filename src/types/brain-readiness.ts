import type { BusinessBrainContext } from "@/types/business-brain";

export type BrainDomainStatus =
  | "complete"
  | "partial"
  | "missing"
  | "not_applicable"
  | "none"
  | "future"
  | "optional";

export type BrainDomain =
  | "identity"
  | "offerings"
  | "audience"
  | "customer_needs"
  | "customer_questions"
  | "customer_journey"
  | "brand"
  | "positioning"
  | "conversion"
  | "policies"
  | "ai_rules"
  | "content_strategy"
  | "goals";

export type OptionalDomain =
  | "offers"
  | "competitors"
  | "seasonality"
  | "additional_personas"
  | "additional_products"
  | "additional_services"
  | "website"
  | "historical_social_data"
  | "advanced_metrics";

export type FutureDomain =
  | "social_presence"
  | "social_history"
  | "audience_behavior"
  | "content_performance"
  | "social_conversations";

export interface DomainReadiness {
  domain: BrainDomain | OptionalDomain | FutureDomain;
  status: BrainDomainStatus;
  evidence: string[];
  missing: string[];
  confidence: "high" | "medium" | "low";
}

export interface BrainReadiness {
  score: number;
  status: "ready" | "needs_attention";
  domains: DomainReadiness[];
  required_missing: DomainReadiness[];
  optional_missing: DomainReadiness[];
  future_domains: DomainReadiness[];
}

export const REQUIRED_DOMAINS: BrainDomain[] = [
  "identity",
  "offerings",
  "audience",
  "customer_needs",
  "customer_questions",
  "customer_journey",
  "brand",
  "positioning",
  "conversion",
  "policies",
  "ai_rules",
  "content_strategy",
  "goals",
];

export const OPTIONAL_DOMAINS: OptionalDomain[] = [
  "offers",
  "competitors",
  "seasonality",
  "additional_personas",
  "additional_products",
  "additional_services",
  "website",
  "historical_social_data",
  "advanced_metrics",
];

export const FUTURE_DOMAINS: FutureDomain[] = [
  "social_presence",
  "social_history",
  "audience_behavior",
  "content_performance",
  "social_conversations",
];
