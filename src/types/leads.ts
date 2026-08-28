import { z } from "zod";

export const LeadStatus = z.enum([
  "new", "qualifying", "qualified", "contacted", "follow_up",
  "won", "lost", "ignored", "unqualified"
]);
export type LeadStatusValue = z.infer<typeof LeadStatus>;

export const LeadIntent = z.enum(["low", "medium", "high"]);
export type LeadIntentValue = z.infer<typeof LeadIntent>;

export const LeadStage = z.enum([
  "detected", "qualified", "quotation", "negotiation", "booked", "won", "lost"
]);
export type LeadStageValue = z.infer<typeof LeadStage>;

export const FollowUpType = z.enum(["manual", "ai_suggested", "system"]);
export type FollowUpTypeValue = z.infer<typeof FollowUpType>;

export const FollowUpStatus = z.enum(["pending", "completed", "cancelled", "overdue"]);
export type FollowUpStatusValue = z.infer<typeof FollowUpStatus>;

export const LeadSourceType = z.enum(["comment", "dm", "review", "website", "manual", "other"]);
export type LeadSourceTypeValue = z.infer<typeof LeadSourceType>;

export interface Lead {
  id: string;
  business_id: string;
  social_account_id: string;
  platform_user_id: string;
  name?: string;
  username?: string;
  source_type: LeadSourceTypeValue;
  source_reference?: string;
  source_conversation_id?: string;
  source_message_ids: string[];
  observation_ids: string[];
  intent: LeadIntentValue;
  reason: string;
  status: LeadStatusValue;
  stage?: LeadStageValue;
  confidence: number;
  interested_product_id?: string;
  interested_service_id?: string;
  requirement?: string;
  quantity?: string;
  location?: string;
  estimated_value?: number;
  estimated_value_currency: string;
  assigned_to?: string;
  next_action?: string;
  next_action_at?: string;
  notes?: string;
  tags: string[];
  brain_version?: number;
  first_detected_at: string;
  last_activity_at: string;
  created_at: string;
  updated_at: string;
}

export interface LeadFollowUp {
  id: string;
  lead_id: string;
  type: FollowUpTypeValue;
  due_at: string;
  status: FollowUpStatusValue;
  message_draft?: string;
  created_by?: string;
  completed_by?: string;
  created_at: string;
  completed_at?: string;
}

export interface LeadWithDetails extends Lead {
  social_account?: {
    platform: string;
    username?: string;
  };
  interested_product?: {
    name: string;
  };
  interested_service?: {
    name: string;
  };
  follow_ups?: LeadFollowUp[];
  conversation?: {
    id: string;
    platform: string;
    customer_name?: string;
  };
}

export interface CreateLeadInput {
  businessId: string;
  socialAccountId: string;
  platformUserId: string;
  name?: string;
  username?: string;
  sourceType: LeadSourceTypeValue;
  sourceReference?: string;
  sourceConversationId?: string;
  sourceMessageIds?: string[];
  observationIds?: string[];
  intent: LeadIntentValue;
  reason: string;
  confidence?: number;
  interestedProductId?: string;
  interestedServiceId?: string;
  requirement?: string;
  quantity?: string;
  location?: string;
  estimatedValue?: number;
  stage?: LeadStageValue;
  brainVersion?: number;
}

export interface UpdateLeadInput {
  status?: LeadStatusValue;
  stage?: LeadStageValue;
  intent?: LeadIntentValue;
  requirement?: string;
  quantity?: string;
  location?: string;
  estimatedValue?: number;
  nextAction?: string;
  nextActionAt?: string;
  notes?: string;
  tags?: string[];
  assignedTo?: string;
}

export interface LeadFilters {
  status?: LeadStatusValue;
  intent?: LeadIntentValue;
  platform?: string;
  productId?: string;
  serviceId?: string;
  dateFrom?: string;
  dateTo?: string;
  tags?: string[];
}