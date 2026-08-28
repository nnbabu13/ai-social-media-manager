import type {
  AIActionType,
  ActionMode,
  RiskLevel,
  AIOperatingRule,
  CustomAIRule,
  AIEscalationRule,
  AutonomyConfig,
  ActionPolicyDecision,
  PolicyResolverInput,
} from "@/types/ai-operating-rules";

const DEFAULT_RISK_LEVELS: Record<AIActionType, RiskLevel> = {
  create_content: "medium",
  edit_content: "medium",
  schedule_content: "medium",
  publish_content: "high",
  read_comments: "low",
  reply_to_comment: "medium",
  hide_comment: "medium",
  delete_comment: "high",
  read_dm: "low",
  draft_dm_reply: "low",
  send_dm_reply: "high",
  read_review: "low",
  draft_review_reply: "low",
  send_review_reply: "high",
  detect_lead: "low",
  create_lead: "low",
  qualify_lead: "low",
  send_lead_followup: "medium",
  answer_faq: "low",
  answer_pricing: "high",
  answer_delivery: "medium",
  answer_availability: "low",
  answer_booking: "medium",
  handle_complaint: "high",
  handle_refund: "critical",
  handle_cancellation: "high",
  mention_offer: "medium",
  create_promotion: "high",
  offer_discount: "critical",
  negotiate_price: "critical",
  handle_partnership: "critical",
  handle_collaboration: "high",
  respond_to_media_request: "high",
};

const DEFAULT_MODES: Record<AIActionType, ActionMode> = {
  create_content: "approval",
  edit_content: "approval",
  schedule_content: "approval",
  publish_content: "approval",
  read_comments: "auto",
  reply_to_comment: "approval",
  hide_comment: "auto",
  delete_comment: "approval",
  read_dm: "auto",
  draft_dm_reply: "auto",
  send_dm_reply: "approval",
  read_review: "auto",
  draft_review_reply: "approval",
  send_review_reply: "approval",
  detect_lead: "auto",
  create_lead: "auto",
  qualify_lead: "auto",
  send_lead_followup: "approval",
  answer_faq: "auto",
  answer_pricing: "approval",
  answer_delivery: "approval",
  answer_availability: "auto",
  answer_booking: "approval",
  handle_complaint: "human_only",
  handle_refund: "human_only",
  handle_cancellation: "approval",
  mention_offer: "approval",
  create_promotion: "approval",
  offer_discount: "human_only",
  negotiate_price: "human_only",
  handle_partnership: "human_only",
  handle_collaboration: "human_only",
  respond_to_media_request: "human_only",
};

const PROFILE_OVERRIDES: Record<AIActionType, ActionMode> = {
  create_content: "approval",
  edit_content: "approval",
  schedule_content: "auto",
  publish_content: "approval",
  read_comments: "auto",
  reply_to_comment: "auto",
  hide_comment: "auto",
  delete_comment: "approval",
  read_dm: "auto",
  draft_dm_reply: "auto",
  send_dm_reply: "auto",
  read_review: "auto",
  draft_review_reply: "auto",
  send_review_reply: "approval",
  detect_lead: "auto",
  create_lead: "auto",
  qualify_lead: "auto",
  send_lead_followup: "auto",
  answer_faq: "auto",
  answer_pricing: "approval",
  answer_delivery: "auto",
  answer_availability: "auto",
  answer_booking: "auto",
  handle_complaint: "human_only",
  handle_refund: "human_only",
  handle_cancellation: "human_only",
  mention_offer: "auto",
  create_promotion: "approval",
  offer_discount: "human_only",
  negotiate_price: "human_only",
  handle_partnership: "human_only",
  handle_collaboration: "human_only",
  respond_to_media_request: "human_only",
};

const CRITICAL_ACTIONS: AIActionType[] = [
  "handle_refund",
  "offer_discount",
  "negotiate_price",
  "handle_partnership",
];

export function getDefaultRiskLevel(actionType: AIActionType): RiskLevel {
  return DEFAULT_RISK_LEVELS[actionType];
}

export function getDefaultMode(actionType: AIActionType): ActionMode {
  return DEFAULT_MODES[actionType];
}

export function getProfileMode(actionType: AIActionType, profile: AIActionType extends infer T ? string : never): ActionMode {
  if (profile === "autopilot") {
    return PROFILE_OVERRIDES[actionType] || DEFAULT_MODES[actionType];
  }
  return DEFAULT_MODES[actionType];
}

function isCriticalAction(actionType: AIActionType): boolean {
  return CRITICAL_ACTIONS.includes(actionType);
}

function checkBusinessBrainRestrictions(
  actionType: AIActionType,
  businessRules: string[]
): ActionMode | null {
  const actionLower = actionType.toLowerCase();

  for (const rule of businessRules) {
    const ruleLower = rule.toLowerCase();
    if (ruleLower.includes("never") && ruleLower.includes(actionLower.replace(/_/g, " "))) {
      return "human_only";
    }
    if (ruleLower.includes("always") && ruleLower.includes("approval") && ruleLower.includes(actionLower.replace(/_/g, " "))) {
      return "approval";
    }
  }

  return null;
}

function checkCustomRules(
  actionType: AIActionType,
  customRules: CustomAIRule[]
): ActionMode | null {
  const normalizedActionType = actionType.replace(/_/g, " ").toLowerCase();
  const relevantRules = customRules
    .filter(rule => rule.enabled && (
      rule.action.toLowerCase().replace(/_/g, " ") === normalizedActionType ||
      rule.action.toLowerCase() === normalizedActionType
    ))
    .sort((a, b) => a.priority - b.priority);

  if (relevantRules.length > 0) {
    return relevantRules[0].mode;
  }

  return null;
}

function checkEscalationRules(
  context: PolicyResolverInput["context"],
  escalationRules: AIEscalationRule[]
): { required: boolean; reason?: string } {
  if (!context) return { required: false };

  for (const rule of escalationRules) {
    if (!rule.enabled) continue;

    switch (rule.trigger_type) {
      case "keyword":
        if (context.keywords?.some(k => rule.condition.toLowerCase().includes(k.toLowerCase()))) {
          return { required: true, reason: rule.condition };
        }
        break;
      case "sentiment":
        if (context.sentiment && context.sentiment === rule.condition) {
          return { required: true, reason: `Sentiment: ${rule.condition}` };
        }
        break;
      case "confidence":
        if (context.confidence !== undefined && context.confidence < parseFloat(rule.condition)) {
          return { required: true, reason: `Low confidence: ${context.confidence}` };
        }
        break;
    }
  }

  return { required: false };
}

export function resolveAIActionPolicy({
  business_id,
  action_type,
  context,
  operatingRules,
  customRules,
  escalationRules,
  autonomyConfig,
  businessBrainRules = [],
}: PolicyResolverInput & {
  operatingRules: AIOperatingRule[];
  customRules: CustomAIRule[];
  escalationRules: AIEscalationRule[];
  autonomyConfig: AutonomyConfig | null;
  businessBrainRules?: string[];
}): ActionPolicyDecision {
  const riskLevel = DEFAULT_RISK_LEVELS[action_type];
  const source = "system_default";

  if (isCriticalAction(action_type)) {
    return {
      action_type,
      mode: "human_only",
      risk_level: riskLevel,
      reason: "Critical action requires human oversight",
      requiredEscalation: true,
      source: "critical_safety",
    };
  }

  const businessRestriction = checkBusinessBrainRestrictions(action_type, businessBrainRules);
  if (businessRestriction) {
    return {
      action_type,
      mode: businessRestriction,
      risk_level: riskLevel,
      reason: "Business-specific restriction",
      requiredEscalation: businessRestriction === "human_only",
      source: "business_rule",
    };
  }

  const customRuleMode = checkCustomRules(action_type, customRules);
  if (customRuleMode) {
    return {
      action_type,
      mode: customRuleMode,
      risk_level: riskLevel,
      reason: "Custom business rule applies",
      requiredEscalation: customRuleMode === "human_only",
      source: "custom_rule",
    };
  }

  const operatingRule = operatingRules.find(r => r.action_type === action_type && r.enabled);
  if (operatingRule) {
    return {
      action_type,
      mode: operatingRule.mode,
      risk_level: operatingRule.risk_level,
      reason: operatingRule.escalation_reason || "Configured operating rule",
      requiredEscalation: operatingRule.mode === "human_only",
      source: "operating_rule",
    };
  }

  const escalation = checkEscalationRules(context, escalationRules);
  if (escalation.required) {
    return {
      action_type,
      mode: "approval",
      risk_level: riskLevel,
      reason: escalation.reason || "Escalation rule triggered",
      requiredEscalation: true,
      source: "escalation",
    };
  }

  if (context?.confidence !== undefined && autonomyConfig) {
    const threshold = Number(autonomyConfig.minimum_confidence_for_auto);
    if (context.confidence < threshold && DEFAULT_MODES[action_type] === "auto") {
      return {
        action_type,
        mode: "approval",
        risk_level: riskLevel,
        reason: `Confidence ${(context.confidence * 100).toFixed(0)}% below threshold ${(threshold * 100).toFixed(0)}%`,
        requiredEscalation: false,
        source: "confidence_threshold",
      };
    }
  }

  return {
    action_type,
    mode: DEFAULT_MODES[action_type],
    risk_level: riskLevel,
    reason: "Default system policy",
    requiredEscalation: false,
    source,
  };
}

export function detectRuleConflicts(rules: AIOperatingRule[]): Array<{ action: AIActionType; message: string }> {
  const conflicts: Array<{ action: AIActionType; message: string }> = [];

  const actionGroups = rules.reduce((acc, rule) => {
    if (!acc[rule.action_type]) acc[rule.action_type] = [];
    acc[rule.action_type].push(rule);
    return acc;
  }, {} as Record<AIActionType, AIOperatingRule[]>);

  for (const [action, actionRules] of Object.entries(actionGroups)) {
    if (actionRules.length > 1) {
      const modes = Array.from(new Set(actionRules.map(r => r.mode)));
      if (modes.length > 1) {
        conflicts.push({
          action: action as AIActionType,
          message: `Conflicting modes for ${action}: ${modes.join(", ")}`,
        });
      }
    }
  }

  return conflicts;
}
