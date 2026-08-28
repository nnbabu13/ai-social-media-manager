import { z } from "zod";

export const InsightType = z.enum([
  "performance", "content", "audience", "lead", "conversion",
  "strategy", "platform", "opportunity", "risk"
]);
export type InsightTypeValue = z.infer<typeof InsightType>;

export const InsightPriority = z.enum(["urgent", "high", "medium", "low", "info"]);
export type InsightPriorityValue = z.infer<typeof InsightPriority>;

export const InsightStatus = z.enum(["new", "reviewed", "accepted", "rejected", "implemented", "expired"]);
export type InsightStatusValue = z.infer<typeof InsightStatus>;

export const RecommendationActionType = z.enum([
  "create_content", "change_content_mix", "target_persona", "change_format",
  "review_platform", "review_strategy", "improve_conversion", "follow_up_leads",
  "investigate_drop", "test_new_topic", "adjust_cadence", "optimize_cadence"
]);
export type RecommendationActionTypeValue = z.infer<typeof RecommendationActionType>;

export const RecommendationStatus = z.enum(["new", "reviewed", "accepted", "rejected", "implemented", "expired"]);
export type RecommendationStatusValue = z.infer<typeof RecommendationStatus>;

export const ExperimentStatus = z.enum(["planned", "running", "completed", "cancelled"]);
export type ExperimentStatusValue = z.infer<typeof ExperimentStatus>;

export const StrategyChangeStatus = z.enum(["pending", "approved", "rejected", "draft"]);
export type StrategyChangeStatusValue = z.infer<typeof StrategyChangeStatus>;

export const AttributionType = z.enum(["direct", "influenced", "assisted"]);
export type AttributionTypeValue = z.infer<typeof AttributionType>;

export interface GrowthInsight {
  id: string;
  business_id: string;
  insight_type: InsightTypeValue;
  title: string;
  summary: string;
  evidence: Record<string, any>;
  confidence: number;
  priority: InsightPriorityValue;
  status: InsightStatusValue;
  data_through?: string;
  expires_at?: string;
  brain_version?: number;
  strategy_version?: number;
  created_at: string;
  updated_at: string;
}

export interface GrowthRecommendation {
  id: string;
  business_id: string;
  insight_id?: string;
  action_type: RecommendationActionTypeValue;
  title: string;
  description: string;
  evidence: Record<string, any>;
  confidence: number;
  priority: InsightPriorityValue;
  status: RecommendationStatusValue;
  recommended_by: string;
  reviewed_by?: string;
  reviewed_at?: string;
  implementation_notes?: string;
  brain_version?: number;
  strategy_version?: number;
  created_at: string;
  updated_at: string;
}

export interface GrowthExperiment {
  id: string;
  business_id: string;
  name: string;
  hypothesis: string;
  variable: string;
  control_description: string;
  variant_description: string;
  metric: string;
  start_date: string;
  end_date?: string;
  status: ExperimentStatusValue;
  result?: Record<string, any>;
  conclusion?: string;
  brain_version?: number;
  strategy_version?: number;
  created_at: string;
  updated_at: string;
}

export interface StrategyChangeRequest {
  id: string;
  business_id: string;
  recommendation_id?: string;
  proposed_changes: Record<string, any>;
  rationale: string;
  evidence: Record<string, any>;
  requested_by: string;
  status: StrategyChangeStatusValue;
  reviewed_by?: string;
  reviewed_at?: string;
  previous_strategy_version?: number;
  new_strategy_version?: number;
  created_at: string;
  updated_at: string;
}

export interface DailyAIBrief {
  id: string;
  business_id: string;
  brief_date: string;
  what_happened?: string;
  what_matters?: string;
  next_move?: string;
  needs_attention?: Record<string, any>;
  impact_metrics?: Record<string, any>;
  brain_version?: number;
  strategy_version?: number;
  created_at: string;
}

export interface WeeklyAIReview {
  id: string;
  business_id: string;
  week_start: string;
  week_end: string;
  performance_summary?: string;
  customer_insights?: string;
  content_insights?: string;
  lead_insights?: string;
  strategy_assessment?: string;
  next_week_plan?: string;
  brain_version?: number;
  strategy_version?: number;
  created_at: string;
}

export interface ContentAttribution {
  id: string;
  business_id: string;
  content_item_id: string;
  social_post_id?: string;
  conversation_id?: string;
  lead_id?: string;
  attribution_type: AttributionTypeValue;
  confidence: number;
  created_at: string;
}

export interface ContentPerformanceSnapshot {
  id: string;
  business_id: string;
  social_post_id: string;
  content_item_id?: string;
  snapshot_date: string;
  metrics: Record<string, any>;
  data_source: string;
  created_at: string;
}

export interface PerformanceAnalysisResult {
  observations: GrowthInsight[];
  opportunities: GrowthInsight[];
  risks: GrowthInsight[];
  recommendations: GrowthRecommendation[];
  nextMove: {
    action: string;
    reason: string;
    evidence: Record<string, any>;
  } | null;
  confidence: "high" | "medium" | "low";
}

export interface NextMove {
  action: string;
  reason: string;
  evidence: Record<string, any>;
  priority: InsightPriorityValue;
}

export interface DailyBriefData {
  whatHappened: string;
  whatMatters: string;
  nextMove: NextMove | null;
  needsAttention: string[];
  impactMetrics: {
    postsPublished?: number;
    conversationsHandled?: number;
    leadsDetected?: number;
    qualifiedLeads?: number;
    wins?: number;
  };
}

export interface WeeklyReviewData {
  performanceSummary: string;
  customerInsights: string;
  contentInsights: string;
  leadInsights: string;
  strategyAssessment: string;
  nextWeekPlan: string;
}

export interface StrategyHealth {
  goalAlignment: boolean;
  audienceAlignment: boolean;
  contentMixDrift: boolean;
  conversionPathConfigured: boolean;
  dataSufficiency: {
    content: boolean;
    leads: boolean;
    platform: boolean;
  };
  warnings: string[];
}