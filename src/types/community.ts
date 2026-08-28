import { z } from "zod";

export const ChannelType = z.enum(["comment_thread", "dm", "review"]);
export type ChannelTypeValue = z.infer<typeof ChannelType>;

export const ConversationStatus = z.enum([
  "new", "open", "needs_approval", "escalated", "waiting_customer",
  "waiting_business", "resolved", "archived"
]);
export type ConversationStatusValue = z.infer<typeof ConversationStatus>;

export const ConversationPriority = z.enum(["urgent", "high", "medium", "low"]);
export type ConversationPriorityValue = z.infer<typeof ConversationPriority>;

export const MessageDirection = z.enum(["inbound", "outbound"]);
export type MessageDirectionValue = z.infer<typeof MessageDirection>;

export const SenderType = z.enum(["customer", "business", "ai", "system"]);
export type SenderTypeValue = z.infer<typeof SenderType>;

export const ApprovalStatus = z.enum(["pending", "approved", "rejected", "edited", "expired"]);
export type ApprovalStatusValue = z.infer<typeof ApprovalStatus>;

export const JobStatus = z.enum(["queued", "processing", "sent", "failed", "cancelled"]);
export type JobStatusValue = z.infer<typeof JobStatus>;

export const IntentType = z.enum([
  "general_question", "product_question", "service_question",
  "pricing_question", "availability_question", "delivery_question",
  "booking_request", "purchase_intent", "lead", "complaint",
  "refund_request", "cancellation", "partnership", "collaboration",
  "positive_feedback", "negative_feedback", "spam", "support_request", "other"
]);
export type IntentTypeValue = z.infer<typeof IntentType>;

export const RiskLevel = z.enum(["low", "medium", "high", "critical"]);
export type RiskLevelValue = z.infer<typeof RiskLevel>;

export interface ConversationClassification {
  intent: IntentTypeValue;
  confidence: number;
  priority: ConversationPriorityValue;
  riskLevel: RiskLevelValue;
  reason: string;
}

export interface CustomerContext {
  interestedProduct?: string;
  quantity?: string;
  location?: string;
  preferredContact?: string;
  statedRequirement?: string;
}

export interface ConversationSummary {
  id: string;
  businessId: string;
  platform: string;
  channelType: ChannelTypeValue;
  customerName?: string;
  customerUsername?: string;
  status: ConversationStatusValue;
  priority: ConversationPriorityValue;
  intent?: string;
  riskLevel: string;
  summary?: string;
  aiHandled: boolean;
  humanLocked: boolean;
  unreadCount: number;
  lastMessageAt?: string;
  lastInboundAt?: string;
  messageCount: number;
  socialAccount: {
    platform: string;
    username?: string;
  };
}

export interface MessageItem {
  id: string;
  conversationId: string;
  direction: MessageDirectionValue;
  senderType: SenderTypeValue;
  senderName?: string;
  text?: string;
  mediaMetadata?: any;
  aiClassified: boolean;
  aiIntent?: string;
  aiConfidence?: number;
  createdAt: string;
}

export interface ApprovalItem {
  id: string;
  conversationId: string;
  actionType: string;
  draftResponse: string;
  reason?: string;
  riskLevel: string;
  confidence?: number;
  status: ApprovalStatusValue;
  editedResponse?: string;
  createdAt: string;
}
