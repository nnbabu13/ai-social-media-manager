"use server";

import { createClient } from "@/lib/supabase/server";
import { runSocialScan, getSocialIntelligence, updateObservationStatus, updateRecommendationStatus, updateLeadStatus } from "@/lib/social-intelligence/scanner";

export async function triggerSocialScan(businessId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const result = await runSocialScan(businessId, "manual");
  return result;
}

export async function getIntelligence(businessId: string) {
  return getSocialIntelligence(businessId);
}

export async function dismissObservation(observationId: string, businessId: string) {
  return updateObservationStatus(observationId, "dismissed", businessId);
}

export async function reviewObservation(observationId: string, businessId: string) {
  return updateObservationStatus(observationId, "reviewed", businessId);
}

export async function dismissRecommendation(recommendationId: string, businessId: string) {
  return updateRecommendationStatus(recommendationId, "dismissed", businessId);
}

export async function acceptRecommendation(recommendationId: string, businessId: string) {
  return updateRecommendationStatus(recommendationId, "accepted", businessId);
}

export async function reviewRecommendation(recommendationId: string, businessId: string) {
  return updateRecommendationStatus(recommendationId, "reviewed", businessId);
}

export async function updateLead(leadId: string, status: string, businessId: string) {
  return updateLeadStatus(leadId, status as any, businessId);
}
