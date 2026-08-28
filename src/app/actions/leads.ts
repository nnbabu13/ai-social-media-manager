"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  createLead,
  updateLead,
  getLeads,
  getLeadById,
  getLeadStats,
  getFollowUpsDue,
  createFollowUp,
  completeFollowUp,
  cancelFollowUp,
  addLeadNote,
  getMissingQualificationInfo,
} from "@/lib/leads/lead-service";
import type { CreateLeadInput, UpdateLeadInput, LeadFilters } from "@/types/leads";

export async function createLeadAction(input: CreateLeadInput) {
  const result = await createLead(input);
  if (result.success) {
    revalidatePath("/leads");
  }
  return result;
}

export async function updateLeadAction(leadId: string, input: UpdateLeadInput) {
  const result = await updateLead(leadId, input);
  if (result.success) {
    revalidatePath("/leads");
    revalidatePath(`/leads/${leadId}`);
  }
  return result;
}

export async function getLeadsAction(filters?: LeadFilters) {
  return getLeads("", filters);
}

export async function getLeadDetailAction(leadId: string) {
  return getLeadById(leadId);
}

export async function getLeadStatsAction() {
  return getLeadStats("");
}

export async function getFollowUpsDueAction() {
  return getFollowUpsDue("");
}

export async function createFollowUpAction(
  leadId: string,
  type: "manual" | "ai_suggested" | "system",
  dueAt: string,
  messageDraft?: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const result = await createFollowUp(leadId, type, new Date(dueAt), messageDraft, user?.id);
  if (result.success) {
    revalidatePath("/leads");
    revalidatePath(`/leads/${leadId}`);
  }
  return result;
}

export async function completeFollowUpAction(followUpId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const result = await completeFollowUp(followUpId, user?.id || "");
  if (result.success) {
    revalidatePath("/leads");
  }
  return result;
}

export async function cancelFollowUpAction(followUpId: string) {
  const result = await cancelFollowUp(followUpId);
  if (result.success) {
    revalidatePath("/leads");
  }
  return result;
}

export async function addLeadNoteAction(leadId: string, note: string) {
  const result = await addLeadNote(leadId, note);
  if (result.success) {
    revalidatePath("/leads");
    revalidatePath(`/leads/${leadId}`);
  }
  return result;
}

export async function getMissingQualificationAction(leadId: string) {
  const lead = await getLeadById(leadId);
  if (!lead) return [];
  return getMissingQualificationInfo(lead);
}