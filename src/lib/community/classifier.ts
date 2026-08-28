import type { ConversationClassification, IntentTypeValue, RiskLevelValue, ConversationPriorityValue } from "@/types/community";

const PRICING_KEYWORDS = ["price", "cost", "how much", "rate", "quote", "bulk pricing", "discount", "offer"];
const DELIVERY_KEYWORDS = ["deliver", "shipping", "dispatch", "timeline", "when will", "how long"];
const COMPLAINT_KEYWORDS = ["terrible", "worst", "disappointed", "unhappy", "complaint", "refund", "never again", "awful", "horrible"];
const LEAD_KEYWORDS = ["buy", "order", "purchase", "interested", "want to", "need", "units", "quantity", "wedding", "event", "bulk"];
const PARTNERSHIP_KEYWORDS = ["collaborate", "partnership", "sponsor", "work together", "business opportunity"];
const SPAM_KEYWORDS = ["free money", "click here", "winner", "congratulations", "act now"];
const POSITIVE_KEYWORDS = ["love", "great", "amazing", "awesome", "excellent", "best", "thank you", "fantastic"];
const NEGATIVE_KEYWORDS = ["bad", "poor", "slow", "late", "rude", "not good", "could be better"];

function containsAny(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some(k => lower.includes(k));
}

function detectIntent(text: string): { intent: IntentTypeValue; confidence: number } {
  const lower = text.toLowerCase();

  if (containsAny(text, SPAM_KEYWORDS)) {
    return { intent: "spam", confidence: 0.85 };
  }

  if (containsAny(text, COMPLAINT_KEYWORDS)) {
    return { intent: "complaint", confidence: 0.8 };
  }

  if (containsAny(text, PARTNERSHIP_KEYWORDS)) {
    return { intent: "partnership", confidence: 0.75 };
  }

  if (containsAny(text, LEAD_KEYWORDS)) {
    return { intent: "purchase_intent", confidence: 0.7 };
  }

  if (containsAny(text, PRICING_KEYWORDS)) {
    return { intent: "pricing_question", confidence: 0.8 };
  }

  if (containsAny(text, DELIVERY_KEYWORDS)) {
    return { intent: "delivery_question", confidence: 0.75 };
  }

  if (containsAny(text, POSITIVE_KEYWORDS)) {
    return { intent: "positive_feedback", confidence: 0.7 };
  }

  if (containsAny(text, NEGATIVE_KEYWORDS)) {
    return { intent: "negative_feedback", confidence: 0.65 };
  }

  if (lower.includes("?")) {
    return { intent: "general_question", confidence: 0.6 };
  }

  return { intent: "general_question", confidence: 0.4 };
}

function assessRisk(intent: IntentTypeValue, text: string): RiskLevelValue {
  if (intent === "complaint" || intent === "refund_request") return "high";
  if (intent === "cancellation") return "high";
  if (intent === "partnership" || intent === "collaboration") return "medium";
  if (intent === "pricing_question" || intent === "purchase_intent") return "medium";
  if (intent === "spam") return "low";
  return "low";
}

function assignPriority(intent: IntentTypeValue, riskLevel: RiskLevelValue): ConversationPriorityValue {
  if (riskLevel === "critical") return "urgent";
  if (intent === "complaint" || intent === "refund_request") return "high";
  if (intent === "purchase_intent" || intent === "lead") return "high";
  if (intent === "pricing_question" || intent === "delivery_question") return "medium";
  return "low";
}

export function classifyConversation(text: string): ConversationClassification {
  const { intent, confidence } = detectIntent(text);
  const riskLevel = assessRisk(intent, text);
  const priority = assignPriority(intent, riskLevel);

  const reasonMap: Record<string, string> = {
    pricing_question: "Customer is asking about pricing",
    delivery_question: "Customer is asking about delivery",
    complaint: "Customer expressed dissatisfaction",
    purchase_intent: "Customer shows buying intent",
    lead: "Customer shows interest in products/services",
    partnership: "Partnership or collaboration inquiry",
    positive_feedback: "Customer left positive feedback",
    negative_feedback: "Customer expressed concerns",
    general_question: "General inquiry",
    spam: "Message appears to be spam",
    support_request: "Customer needs support",
    other: "Unclassified message",
  };

  return {
    intent,
    confidence,
    priority,
    riskLevel,
    reason: reasonMap[intent] || "Message analyzed",
  };
}

export function shouldAutoReply(classification: ConversationClassification): boolean {
  if (classification.riskLevel === "high" || classification.riskLevel === "critical") return false;
  if (classification.intent === "complaint") return false;
  if (classification.intent === "refund_request") return false;
  if (classification.intent === "cancellation") return false;
  if (classification.intent === "partnership") return false;
  if (classification.intent === "spam") return false;
  if (classification.confidence < 0.6) return false;
  return true;
}

export function getActionType(intent: IntentTypeValue): string {
  const actionMap: Record<string, string> = {
    pricing_question: "answer_pricing",
    delivery_question: "answer_delivery",
    availability_question: "answer_availability",
    general_question: "answer_faq",
    product_question: "answer_faq",
    service_question: "answer_faq",
    booking_request: "answer_booking",
    complaint: "handle_complaint",
    refund_request: "handle_refund",
    cancellation: "handle_cancellation",
    partnership: "handle_partnership",
    collaboration: "handle_collaboration",
    purchase_intent: "answer_pricing",
    lead: "answer_pricing",
    positive_feedback: "reply_to_comment",
    negative_feedback: "reply_to_comment",
    support_request: "answer_faq",
    spam: "reply_to_comment",
    other: "reply_to_comment",
  };
  return actionMap[intent] || "reply_to_comment";
}
