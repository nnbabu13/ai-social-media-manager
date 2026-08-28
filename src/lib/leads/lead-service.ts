import { createClient } from "@/lib/supabase/server";
import type { Lead, CreateLeadInput, UpdateLeadInput, LeadFilters, LeadWithDetails } from "@/types/leads";

export async function createLead(input: CreateLeadInput): Promise<{ success: boolean; leadId?: string; error?: string; isDuplicate?: boolean }> {
  const supabase = await createClient();

  // Check for existing lead with same platform user and business
  const { data: existing } = await supabase
    .from("social_leads")
    .select("id, status, last_activity_at")
    .eq("business_id", input.businessId)
    .eq("platform_user_id", input.platformUserId)
    .eq("social_account_id", input.socialAccountId)
    .not("status", "in", "('won','lost','ignored','unqualified')")
    .order("last_activity_at", { ascending: false })
    .limit(1)
    .single();

  if (existing) {
    // Update existing lead
    const updateData: any = {
      last_activity_at: new Date().toISOString(),
      intent: input.intent,
      reason: input.reason,
      confidence: input.confidence || 0.5,
    };

    if (input.requirement) updateData.requirement = input.requirement;
    if (input.quantity) updateData.quantity = input.quantity;
    if (input.location) updateData.location = input.location;
    if (input.interestedProductId) updateData.interested_product_id = input.interestedProductId;
    if (input.interestedServiceId) updateData.interested_service_id = input.interestedServiceId;
    if (input.sourceConversationId) updateData.source_conversation_id = input.sourceConversationId;
    if (input.sourceMessageIds) {
      const { data: current } = await supabase
        .from("social_leads")
        .select("source_message_ids")
        .eq("id", existing.id)
        .single();
      const existingIds = current?.source_message_ids || [];
      const newIds = Array.from(new Set([...existingIds, ...input.sourceMessageIds]));
      updateData.source_message_ids = newIds;
    }
    if (input.observationIds) {
      const { data: current } = await supabase
        .from("social_leads")
        .select("observation_ids")
        .eq("id", existing.id)
        .single();
      const existingIds = current?.observation_ids || [];
      const newIds = Array.from(new Set([...existingIds, ...input.observationIds]));
      updateData.observation_ids = newIds;
    }

    const { error } = await supabase
      .from("social_leads")
      .update(updateData)
      .eq("id", existing.id);

    if (error) {
      return { success: false, error: "Failed to update existing lead" };
    }

    return { success: true, leadId: existing.id, isDuplicate: true };
  }

  // Create new lead
  const { data: lead, error } = await supabase
    .from("social_leads")
    .insert({
      business_id: input.businessId,
      social_account_id: input.socialAccountId,
      platform_user_id: input.platformUserId,
      name: input.name,
      username: input.username,
      source_type: input.sourceType,
      source_reference: input.sourceReference,
      source_conversation_id: input.sourceConversationId,
      source_message_ids: input.sourceMessageIds || [],
      observation_ids: input.observationIds || [],
      intent: input.intent,
      reason: input.reason,
      confidence: input.confidence || 0.5,
      status: "new",
      stage: input.stage || "detected",
      interested_product_id: input.interestedProductId,
      interested_service_id: input.interestedServiceId,
      requirement: input.requirement,
      quantity: input.quantity,
      location: input.location,
      estimated_value: input.estimatedValue,
      estimated_value_currency: "INR",
      brain_version: input.brainVersion,
    })
    .select("id")
    .single();

  if (error || !lead) {
    return { success: false, error: "Failed to create lead" };
  }

  return { success: true, leadId: lead.id, isDuplicate: false };
}

export async function updateLead(
  leadId: string,
  input: UpdateLeadInput
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const updateData: any = { last_activity_at: new Date().toISOString() };

  if (input.status) updateData.status = input.status;
  if (input.stage) updateData.stage = input.stage;
  if (input.intent) updateData.intent = input.intent;
  if (input.requirement !== undefined) updateData.requirement = input.requirement;
  if (input.quantity !== undefined) updateData.quantity = input.quantity;
  if (input.location !== undefined) updateData.location = input.location;
  if (input.estimatedValue !== undefined) updateData.estimated_value = input.estimatedValue;
  if (input.nextAction !== undefined) updateData.next_action = input.nextAction;
  if (input.nextActionAt !== undefined) updateData.next_action_at = input.nextActionAt;
  if (input.notes !== undefined) updateData.notes = input.notes;
  if (input.tags !== undefined) updateData.tags = input.tags;
  if (input.assignedTo !== undefined) updateData.assigned_to = input.assignedTo;

  const { error } = await supabase
    .from("social_leads")
    .update(updateData)
    .eq("id", leadId);

  if (error) {
    return { success: false, error: "Failed to update lead" };
  }

  return { success: true };
}

export async function getLeads(
  businessId: string,
  filters?: LeadFilters
): Promise<LeadWithDetails[]> {
  const supabase = await createClient();

  let query = supabase
    .from("social_leads")
    .select(`
      *,
      social_accounts (platform, username),
      business_products (name),
      business_services (name)
    `)
    .eq("business_id", businessId)
    .order("last_activity_at", { ascending: false });

  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.intent) query = query.eq("intent", filters.intent);
  if (filters?.platform) query = query.eq("social_accounts.platform", filters.platform);
  if (filters?.productId) query = query.eq("interested_product_id", filters.productId);
  if (filters?.serviceId) query = query.eq("interested_service_id", filters.serviceId);
  if (filters?.dateFrom) query = query.gte("first_detected_at", filters.dateFrom);
  if (filters?.dateTo) query = query.lte("first_detected_at", filters.dateTo);
  if (filters?.tags && filters.tags.length > 0) {
    query = query.contains("tags", filters.tags);
  }

  const { data, error } = await query.limit(100);

  if (error) return [];

  return (data || []).map((lead: any) => ({
    ...lead,
    social_account: lead.social_accounts,
    interested_product: lead.business_products,
    interested_service: lead.business_services,
    social_accounts: undefined,
    business_products: undefined,
    business_services: undefined,
  }));
}

export async function getLeadById(leadId: string): Promise<LeadWithDetails | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("social_leads")
    .select(`
      *,
      social_accounts (platform, username),
      business_products (name),
      business_services (name),
      lead_follow_ups (*)
    `)
    .eq("id", leadId)
    .single();

  if (error || !data) return null;

  const lead = data as any;
  return {
    ...lead,
    social_account: lead.social_accounts,
    interested_product: lead.business_products,
    interested_service: lead.business_services,
    follow_ups: lead.lead_follow_ups || [],
    social_accounts: undefined,
    business_products: undefined,
    business_services: undefined,
    lead_follow_ups: undefined,
  };
}

export async function getLeadStats(businessId: string) {
  const supabase = await createClient();

  const { data: leads } = await supabase
    .from("social_leads")
    .select("status, intent, estimated_value, created_at, stage")
    .eq("business_id", businessId);

  const all = leads || [];
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const todayLeads = all.filter(l => new Date(l.created_at) >= todayStart);

  return {
    total: all.length,
    new: all.filter(l => l.status === "new").length,
    qualifying: all.filter(l => l.status === "qualifying").length,
    qualified: all.filter(l => l.status === "qualified").length,
    followUp: all.filter(l => l.status === "follow_up").length,
    won: all.filter(l => l.status === "won").length,
    lost: all.filter(l => l.status === "lost").length,
    highIntent: all.filter(l => l.intent === "high").length,
    mediumIntent: all.filter(l => l.intent === "medium").length,
    todayNew: todayLeads.length,
    todayHighIntent: todayLeads.filter(l => l.intent === "high").length,
    pipelineValue: all
      .filter(l => l.estimated_value && ["qualified", "quotation", "negotiation"].includes(l.status))
      .reduce((sum, l) => sum + (l.estimated_value || 0), 0),
  };
}

export async function getFollowUpsDue(businessId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("lead_follow_ups")
    .select(`
      *,
      social_leads (
        id, name, username, intent, status, stage,
        social_accounts (platform, username)
      )
    `)
    .eq("status", "pending")
    .lte("due_at", new Date().toISOString())
    .order("due_at", { ascending: true });

  if (error) return [];

  return data || [];
}

export async function createFollowUp(
  leadId: string,
  type: "manual" | "ai_suggested" | "system",
  dueAt: Date,
  messageDraft?: string,
  createdBy?: string
): Promise<{ success: boolean; followUpId?: string; error?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("lead_follow_ups")
    .insert({
      lead_id: leadId,
      type,
      due_at: dueAt.toISOString(),
      message_draft: messageDraft,
      created_by: createdBy,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { success: false, error: "Failed to create follow-up" };
  }

  // Update lead status if needed
  await supabase
    .from("social_leads")
    .update({
      status: "follow_up",
      next_action: messageDraft ? "Follow up" : "Follow up",
      next_action_at: dueAt.toISOString(),
      last_activity_at: new Date().toISOString(),
    })
    .eq("id", leadId);

  return { success: true, followUpId: data.id };
}

export async function completeFollowUp(
  followUpId: string,
  completedBy: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("lead_follow_ups")
    .update({
      status: "completed",
      completed_by: completedBy,
      completed_at: new Date().toISOString(),
    })
    .eq("id", followUpId);

  if (error) return { success: false, error: "Failed to complete follow-up" };

  return { success: true };
}

export async function cancelFollowUp(followUpId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("lead_follow_ups")
    .update({ status: "cancelled" })
    .eq("id", followUpId);

  if (error) return { success: false, error: "Failed to cancel follow-up" };

  return { success: true };
}

export async function addLeadNote(
  leadId: string,
  note: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("social_leads")
    .select("notes")
    .eq("id", leadId)
    .single();

  const newNotes = existing?.notes
    ? `${existing.notes}\n\n${new Date().toLocaleString()}: ${note}`
    : `${new Date().toLocaleString()}: ${note}`;

  const { error } = await supabase
    .from("social_leads")
    .update({ notes: newNotes, last_activity_at: new Date().toISOString() })
    .eq("id", leadId);

  if (error) return { success: false, error: "Failed to add note" };

  return { success: true };
}

export async function getMissingQualificationInfo(lead: LeadWithDetails): Promise<string[]> {
  const missing: string[] = [];

  if (!lead.requirement) missing.push("Specific requirement / use case");
  if (!lead.quantity) missing.push("Quantity needed");
  if (!lead.location && lead.intent === "high") missing.push("Delivery / service location");
  if (!lead.estimated_value && lead.stage && ["quotation", "negotiation"].includes(lead.stage)) {
    missing.push("Estimated value / budget");
  }

  // Business-specific qualification could be added here based on business type
  return missing;
}