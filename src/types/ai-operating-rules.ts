import { z } from "zod";

export const AI_ACTION_TYPES = [
  "create_content",
  "edit_content",
  "schedule_content",
  "publish_content",
  "read_comments",
  "reply_to_comment",
  "hide_comment",
  "delete_comment",
  "read_dm",
  "draft_dm_reply",
  "send_dm_reply",
  "read_review",
  "draft_review_reply",
  "send_review_reply",
  "detect_lead",
  "create_lead",
  "qualify_lead",
  "send_lead_followup",
  "answer_faq",
  "answer_pricing",
  "answer_delivery",
  "answer_availability",
  "answer_booking",
  "handle_complaint",
  "handle_refund",
  "handle_cancellation",
  "mention_offer",
  "create_promotion",
  "offer_discount",
  "negotiate_price",
  "handle_partnership",
  "handle_collaboration",
  "respond_to_media_request",
] as const;

export type AIActionType = (typeof AI_ACTION_TYPES)[number];

export const ACTION_MODES = ["auto", "approval", "human_only", "disabled"] as const;
export type ActionMode = (typeof ACTION_MODES)[number];

export const RISK_LEVELS = ["low", "medium", "high", "critical"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const AUTONOMY_PROFILES = ["assistant", "manager", "autopilot"] as const;
export type AutonomyProfile = (typeof AUTONOMY_PROFILES)[number];

export const ACTION_CATEGORIES = {
  content: {
    label: "Content",
    actions: ["create_content", "edit_content", "schedule_content", "publish_content"] as const,
  },
  comments: {
    label: "Comments",
    actions: ["read_comments", "reply_to_comment", "hide_comment", "delete_comment"] as const,
  },
  direct_messages: {
    label: "Direct Messages",
    actions: ["read_dm", "draft_dm_reply", "send_dm_reply"] as const,
  },
  reviews: {
    label: "Reviews",
    actions: ["read_review", "draft_review_reply", "send_review_reply"] as const,
  },
  leads: {
    label: "Leads",
    actions: ["detect_lead", "create_lead", "qualify_lead", "send_lead_followup"] as const,
  },
  customer_service: {
    label: "Customer Service",
    actions: [
      "answer_faq",
      "answer_pricing",
      "answer_delivery",
      "answer_availability",
      "answer_booking",
      "handle_complaint",
      "handle_refund",
      "handle_cancellation",
    ] as const,
  },
  promotions: {
    label: "Promotions",
    actions: ["mention_offer", "create_promotion", "offer_discount", "negotiate_price"] as const,
  },
  partnerships: {
    label: "Partnerships",
    actions: ["handle_partnership", "handle_collaboration", "respond_to_media_request"] as const,
  },
} as const;

export const ACTION_LABELS: Record<AIActionType, string> = {
  create_content: "Creating posts",
  edit_content: "Editing posts",
  schedule_content: "Scheduling posts",
  publish_content: "Publishing posts",
  read_comments: "Reading comments",
  reply_to_comment: "Replying to comments",
  hide_comment: "Hiding comments",
  delete_comment: "Deleting comments",
  read_dm: "Reading DMs",
  draft_dm_reply: "Drafting DM replies",
  send_dm_reply: "Sending DM replies",
  read_review: "Reading reviews",
  draft_review_reply: "Drafting review replies",
  send_review_reply: "Sending review replies",
  detect_lead: "Identifying leads",
  create_lead: "Creating lead records",
  qualify_lead: "Qualifying leads",
  send_lead_followup: "Following up with leads",
  answer_faq: "Answering common questions",
  answer_pricing: "Answering pricing questions",
  answer_delivery: "Answering delivery questions",
  answer_availability: "Answering availability questions",
  answer_booking: "Handling booking requests",
  handle_complaint: "Handling complaints",
  handle_refund: "Handling refund requests",
  handle_cancellation: "Handling cancellations",
  mention_offer: "Mentioning offers",
  create_promotion: "Creating promotions",
  offer_discount: "Offering discounts",
  negotiate_price: "Negotiating prices",
  handle_partnership: "Handling partnership requests",
  handle_collaboration: "Handling collaboration requests",
  respond_to_media_request: "Responding to media requests",
};

export const MODE_LABELS: Record<ActionMode, string> = {
  auto: "Auto",
  approval: "Ask me first",
  human_only: "Human only",
  disabled: "Disabled",
};

export const RISK_LABELS: Record<RiskLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const PROFILE_LABELS: Record<AutonomyProfile, string> = {
  assistant: "Assistant",
  manager: "Manager",
  autopilot: "Autopilot",
};

export const PROFILE_DESCRIPTIONS: Record<AutonomyProfile, string> = {
  assistant: "AI prepares work. Nothing publishes or sends without your approval.",
  manager: "AI handles safe routine tasks automatically. Sensitive actions require approval.",
  autopilot: "AI handles approved categories automatically. Critical actions remain restricted.",
};

export const aiOperatingRuleSchema = z.object({
  id: z.string().uuid().optional(),
  business_id: z.string().uuid(),
  action_type: z.enum(AI_ACTION_TYPES),
  mode: z.enum(ACTION_MODES),
  risk_level: z.enum(RISK_LEVELS),
  enabled: z.boolean().default(true),
  conditions: z.array(z.object({
    type: z.string(),
    value: z.string(),
  })).optional(),
  escalation_reason: z.string().optional(),
  source_type: z.enum(["owner_confirmed", "ai_derived", "system_default"]),
});

export type AIOperatingRule = z.infer<typeof aiOperatingRuleSchema>;

export const customAIRuleSchema = z.object({
  id: z.string().uuid().optional(),
  business_id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  trigger: z.string(),
  action: z.string(),
  priority: z.number().min(1).max(100),
  mode: z.enum(ACTION_MODES),
  enabled: z.boolean().default(true),
  source_type: z.enum(["owner_confirmed", "ai_derived"]),
});

export type CustomAIRule = z.infer<typeof customAIRuleSchema>;

export const aiEscalationRuleSchema = z.object({
  id: z.string().uuid().optional(),
  business_id: z.string().uuid(),
  trigger_type: z.enum(["keyword", "intent", "sentiment", "risk", "topic", "confidence", "policy"]),
  condition: z.string(),
  action: z.enum(["notify_owner", "require_approval", "block_action"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  enabled: z.boolean().default(true),
});

export type AIEscalationRule = z.infer<typeof aiEscalationRuleSchema>;

export const autonomyConfigSchema = z.object({
  id: z.string().uuid().optional(),
  business_id: z.string().uuid(),
  profile: z.enum(AUTONOMY_PROFILES),
  minimum_confidence_for_auto: z.number().min(0).max(1).default(0.9),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type AutonomyConfig = z.infer<typeof autonomyConfigSchema>;

export interface ActionPolicyDecision {
  action_type: AIActionType;
  mode: ActionMode;
  risk_level: RiskLevel;
  reason: string;
  requiredEscalation: boolean;
  source: string;
}

export interface PolicyResolverInput {
  business_id: string;
  action_type: AIActionType;
  context?: {
    confidence?: number;
    keywords?: string[];
    sentiment?: string;
    topic?: string;
  };
}
