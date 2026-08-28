"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  findOrCreateConversation,
  addMessage,
  processInboundMessage,
  getConversations,
  getConversationMessages,
  getPendingApprovals,
  approveResponse,
  rejectResponse,
  takeOverConversation,
  releaseConversation,
} from "@/lib/community/conversation-service";
import { processActionJob, retryActionJob, getActionJobs } from "@/lib/community/action-jobs";

export async function handleInboundMessage(params: {
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
}) {
  const convResult = await findOrCreateConversation(params);

  if (!convResult.conversationId) {
    return { success: false, error: convResult.error || "Failed to find or create conversation" };
  }

  const msgId = await addMessage(convResult.conversationId, {
    direction: "inbound",
    senderType: "customer",
    senderPlatformId: params.customerPlatformId,
    senderName: params.customerName,
    text: params.messageText,
    platformMessageId: params.platformMessageId,
    rawData: params.rawData,
  });

  if (!msgId) {
    return { success: false, error: "Failed to add message" };
  }

  const result = await processInboundMessage(convResult.conversationId, params.messageText);

  revalidatePath("/inbox");

  return {
    success: true,
    conversationId: convResult.conversationId,
    classification: result.classification,
    autoReplied: result.autoReplied,
    responseText: result.responseText,
    escalated: result.escalated,
  };
}

export async function getInboxConversationsAction(
  businessId: string,
  filters?: {
    status?: string;
    priority?: string;
    platform?: string;
    channelType?: string;
  }
) {
  return getConversations(businessId, filters);
}

export async function getConversationDetailAction(conversationId: string) {
  const messages = await getConversationMessages(conversationId);
  const supabase = await createClient();

  const { data: conv } = await supabase
    .from("social_conversations")
    .select(`
      *,
      social_accounts (platform, username),
      conversation_notes (*)
    `)
    .eq("id", conversationId)
    .single();

  return { conversation: conv, messages };
}

export async function getPendingApprovalsAction() {
  return getPendingApprovals("");
}

export async function approveConversationResponseAction(
  approvalId: string,
  editedResponse?: string
) {
  const result = await approveResponse(approvalId, editedResponse);
  if (result.success) {
    revalidatePath("/inbox");
  }
  return result;
}

export async function rejectConversationResponseAction(approvalId: string) {
  const result = await rejectResponse(approvalId);
  if (result.success) {
    revalidatePath("/inbox");
  }
  return result;
}

export async function takeOverAction(conversationId: string) {
  const result = await takeOverConversation(conversationId);
  if (result.success) {
    revalidatePath("/inbox");
  }
  return result;
}

export async function releaseConversationAction(conversationId: string) {
  const result = await releaseConversation(conversationId);
  if (result.success) {
    revalidatePath("/inbox");
  }
  return result;
}

export async function addNoteAction(conversationId: string, note: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("conversation_notes")
    .insert({
      conversation_id: conversationId,
      note,
    });

  if (error) return { success: false, error: "Failed to add note" };

  revalidatePath("/inbox");
  return { success: true };
}

export async function processActionJobAction(jobId: string) {
  const result = await processActionJob(jobId);
  if (result.success) {
    revalidatePath("/inbox");
  }
  return result;
}

export async function retryActionJobAction(jobId: string) {
  const result = await retryActionJob(jobId);
  if (result.success) {
    revalidatePath("/inbox");
  }
  return result;
}

export async function getInboxStatsAction(businessId: string) {
  const supabase = await createClient();

  const { data: conversations } = await supabase
    .from("social_conversations")
    .select("status, priority, intent, ai_handled")
    .eq("business_id", businessId);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const { data: todayConversations } = await supabase
    .from("social_conversations")
    .select("id, status, intent, ai_handled")
    .eq("business_id", businessId)
    .gte("created_at", todayStart.toISOString());

  const all = conversations || [];
  const today = todayConversations || [];

  return {
    total: all.length,
    open: all.filter(c => c.status === "open" || c.status === "new").length,
    needsAttention: all.filter(c => c.status === "escalated" || c.status === "needs_approval").length,
    resolved: all.filter(c => c.status === "resolved").length,
    todayHandled: today.filter(c => c.ai_handled).length,
    todayLeads: today.filter(c => c.intent === "purchase_intent" || c.intent === "lead").length,
    todayComplaints: today.filter(c => c.intent === "complaint").length,
  };
}
