import { createClient } from "@/lib/supabase/server";
import { classifyConversation, shouldAutoReply, getActionType } from "./classifier";
import { generateCommunityResponse, reviewCommunityResponse } from "./response-generator";
import type { ConversationClassification, CustomerContext } from "@/types/community";

export interface CreateConversationInput {
  businessId: string;
  socialAccountId: string;
  platform: string;
  platformConversationId?: string;
  channelType: "comment_thread" | "dm" | "review";
  customerPlatformId?: string;
  customerName?: string;
  customerUsername?: string;
  messageText: string;
  platformMessageId?: string;
  rawData?: any;
}

export interface ProcessMessageResult {
  conversationId: string;
  classification: ConversationClassification;
  autoReplied: boolean;
  responseText?: string;
  approvalId?: string;
  escalated: boolean;
}

export async function findOrCreateConversation(input: CreateConversationInput) {
  const supabase = await createClient();

  if (input.platformConversationId) {
    const { data: existing } = await supabase
      .from("social_conversations")
      .select("id, status, human_locked")
      .eq("platform_conversation_id", input.platformConversationId)
      .single();

    if (existing) {
      return { conversationId: existing.id, isNew: false, status: existing.status, humanLocked: existing.human_locked };
    }
  }

  const { data: conv, error } = await supabase
    .from("social_conversations")
    .insert({
      business_id: input.businessId,
      social_account_id: input.socialAccountId,
      platform: input.platform,
      platform_conversation_id: input.platformConversationId,
      channel_type: input.channelType,
      customer_platform_id: input.customerPlatformId,
      customer_name: input.customerName,
      customer_username: input.customerUsername,
      status: "new",
      priority: "medium",
    })
    .select("id")
    .single();

  if (error || !conv) {
    return { conversationId: null, isNew: false, error: "Failed to create conversation" };
  }

  return { conversationId: conv.id, isNew: true, status: "new", humanLocked: false };
}

export async function addMessage(
  conversationId: string,
  params: {
    direction: "inbound" | "outbound";
    senderType: "customer" | "business" | "ai" | "system";
    senderPlatformId?: string;
    senderName?: string;
    text?: string;
    mediaMetadata?: any;
    platformMessageId?: string;
    rawData?: any;
  }
) {
  const supabase = await createClient();

  const { data: msg, error } = await supabase
    .from("social_messages")
    .insert({
      conversation_id: conversationId,
      platform_message_id: params.platformMessageId,
      direction: params.direction,
      sender_type: params.senderType,
      sender_platform_id: params.senderPlatformId,
      sender_name: params.senderName,
      text: params.text,
      media_metadata: params.mediaMetadata,
      raw_data: params.rawData,
    })
    .select("id")
    .single();

  if (error || !msg) return null;

  const now = new Date().toISOString();
  const updateData: any = { last_message_at: now };
  if (params.direction === "inbound") updateData.last_inbound_at = now;
  if (params.direction === "outbound") updateData.last_outbound_at = now;

  await supabase
    .from("social_conversations")
    .update(updateData)
    .eq("id", conversationId);

  return msg.id;
}

export async function processInboundMessage(
  conversationId: string,
  messageText: string
): Promise<ProcessMessageResult> {
  const supabase = await createClient();

  const { data: conv } = await supabase
    .from("social_conversations")
    .select("*")
    .eq("id", conversationId)
    .single();

  if (!conv) {
    return {
      conversationId,
      classification: classifyConversation(messageText),
      autoReplied: false,
      escalated: true,
    };
  }

  if (conv.human_locked) {
    return {
      conversationId,
      classification: classifyConversation(messageText),
      autoReplied: false,
      escalated: false,
    };
  }

  const classification = classifyConversation(messageText);

  await supabase
    .from("social_conversations")
    .update({
      intent: classification.intent,
      intent_confidence: classification.confidence,
      risk_level: classification.riskLevel,
      priority: classification.priority,
      status: classification.riskLevel === "high" || classification.riskLevel === "critical"
        ? "escalated"
        : "open",
    })
    .eq("id", conversationId);

  if (!shouldAutoReply(classification)) {
    if (classification.riskLevel === "high" || classification.riskLevel === "critical") {
      return {
        conversationId,
        classification,
        autoReplied: false,
        escalated: true,
      };
    }

    const { data: approval } = await supabase
      .from("community_approvals")
      .insert({
        conversation_id: conversationId,
        action_type: getActionType(classification.intent),
        draft_response: "",
        reason: classification.reason,
        risk_level: classification.riskLevel,
        confidence: classification.confidence,
        status: "pending",
      })
      .select("id")
      .single();

    await supabase
      .from("social_conversations")
      .update({ status: "needs_approval" })
      .eq("id", conversationId);

    return {
      conversationId,
      classification,
      autoReplied: false,
      approvalId: approval?.id,
      escalated: false,
    };
  }

  const { data: messages } = await supabase
    .from("social_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(20);

  const { data: brainData } = await supabase
    .from("business_facts")
    .select("*")
    .eq("business_id", conv.business_id);

  const { data: faqData } = await supabase
    .from("business_faqs")
    .select("*")
    .eq("business_id", conv.business_id);

  const response = await generateCommunityResponse({
    businessBrain: {
      facts: brainData || [],
      faqs: faqData || [],
      business: { name: "" },
      products: [],
    },
    conversation: conv,
    messages: messages || [],
    classification,
    platform: conv.platform,
  });

  if (response.blocked) {
    await supabase
      .from("social_conversations")
      .update({ status: "needs_approval" })
      .eq("id", conversationId);

    return {
      conversationId,
      classification,
      autoReplied: false,
      escalated: true,
    };
  }

  const review = reviewCommunityResponse(response.text, {}, {
    businessBrain: {},
    conversation: conv,
    messages: messages || [],
    classification,
    platform: conv.platform,
  });

  if (!review.valid) {
    await supabase
      .from("social_conversations")
      .update({ status: "needs_approval" })
      .eq("id", conversationId);

    return {
      conversationId,
      classification,
      autoReplied: false,
      escalated: false,
    };
  }

  return {
    conversationId,
    classification,
    autoReplied: true,
    responseText: response.text,
    escalated: false,
  };
}

export async function getConversations(
  businessId: string,
  filters?: {
    status?: string;
    priority?: string;
    platform?: string;
    channelType?: string;
  }
) {
  const supabase = await createClient();

  let query = supabase
    .from("social_conversations")
    .select(`
      *,
      social_accounts (platform, username),
      social_messages (id)
    `)
    .eq("business_id", businessId)
    .order("last_message_at", { ascending: false });

  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.priority) query = query.eq("priority", filters.priority);
  if (filters?.platform) query = query.eq("platform", filters.platform);
  if (filters?.channelType) query = query.eq("channel_type", filters.channelType);

  const { data, error } = await query.limit(100);

  if (error) return [];

  return (data || []).map((conv: any) => ({
    ...conv,
    messageCount: conv.social_messages?.length || 0,
    social_messages: undefined,
  }));
}

export async function getConversationMessages(conversationId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("social_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) return [];

  return data || [];
}

export async function getPendingApprovals(businessId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("community_approvals")
    .select(`
      *,
      social_conversations (
        id, platform, customer_name, customer_username, channel_type,
        social_accounts (platform, username)
      )
    `)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) return [];

  return data || [];
}

export async function approveResponse(
  approvalId: string,
  editedResponse?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { data: approval, error: fetchErr } = await supabase
    .from("community_approvals")
    .select("*")
    .eq("id", approvalId)
    .single();

  if (fetchErr || !approval) {
    return { success: false, error: "Approval not found" };
  }

  const responseText = editedResponse || approval.draft_response;

  const { error: updateErr } = await supabase
    .from("community_approvals")
    .update({
      status: editedResponse ? "edited" : "approved",
      edited_response: editedResponse || null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", approvalId);

  if (updateErr) {
    return { success: false, error: "Failed to update approval" };
  }

  await supabase
    .from("community_action_jobs")
    .insert({
      conversation_id: approval.conversation_id,
      message_id: approval.message_id,
      approval_id: approval.id,
      action_type: approval.action_type,
      status: "queued",
      response_text: responseText,
      idempotency_key: `comm_${approvalId}_${Date.now()}`,
    });

  return { success: true };
}

export async function rejectResponse(approvalId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("community_approvals")
    .update({
      status: "rejected",
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", approvalId);

  if (error) return { success: false, error: "Failed to reject" };

  return { success: true };
}

export async function takeOverConversation(
  conversationId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("social_conversations")
    .update({
      human_locked: true,
      status: "escalated",
    })
    .eq("id", conversationId);

  if (error) return { success: false, error: "Failed to take over" };

  return { success: true };
}

export async function releaseConversation(
  conversationId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("social_conversations")
    .update({
      human_locked: false,
      status: "open",
    })
    .eq("id", conversationId);

  if (error) return { success: false, error: "Failed to release" };

  return { success: true };
}
