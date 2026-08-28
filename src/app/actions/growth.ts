"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  analyzePerformance,
  generateAIGrowthInsights,
  generateAIStrategicRecommendations,
  generateAINextMove,
  generateAIDailyBrief,
  generateAIWeeklyReview,
  storeInsights,
  storeRecommendations,
  storeDailyBrief,
  storeWeeklyReview,
  getStrategyHealth,
  type PerformanceAnalysisResult,
  type GrowthInsight,
  type GrowthRecommendation,
  type NextMove,
  type DailyBriefData,
  type WeeklyReviewData,
} from "@/lib/growth/ai-strategist";

export async function getPerformanceAnalysisAction(): Promise<PerformanceAnalysisResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("business_id")
    .eq("user_id", user.id)
    .single();

  if (!profile?.business_id) throw new Error("No business");

  return analyzePerformance(profile.business_id);
}

export async function getGrowthInsightsAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("business_id")
    .eq("user_id", user.id)
    .single();

  if (!profile?.business_id) return [];

  const insights = await generateAIGrowthInsights(profile.business_id);
  if (insights.length > 0) {
    await storeInsights(profile.business_id, insights);
  }
  return insights;
}

export async function getGrowthRecommendationsAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("business_id")
    .eq("user_id", user.id)
    .single();

  if (!profile?.business_id) return [];

  const insights = await generateAIGrowthInsights(profile.business_id);
  const recommendations = await generateAIStrategicRecommendations(profile.business_id, insights);
  if (recommendations.length > 0) {
    await storeRecommendations(profile.business_id, recommendations);
  }
  return recommendations;
}

export async function getNextMoveAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("business_id")
    .eq("user_id", user.id)
    .single();

  if (!profile?.business_id) return null;

  const analysis = await analyzePerformance(profile.business_id);
  return generateAINextMove(profile.business_id, analysis);
}

export async function getDailyBriefAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("business_id")
    .eq("user_id", user.id)
    .single();

  if (!profile?.business_id) return null;

  const brief = await generateAIDailyBrief(profile.business_id);
  await storeDailyBrief(profile.business_id, brief);
  return brief;
}

export async function getWeeklyReviewAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("business_id")
    .eq("user_id", user.id)
    .single();

  if (!profile?.business_id) return null;

  const review = await generateAIWeeklyReview(profile.business_id);
  await storeWeeklyReview(profile.business_id, review);
  return review;
}

export async function getStrategyHealthAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("business_id")
    .eq("user_id", user.id)
    .single();

  if (!profile?.business_id) return null;

  return getStrategyHealth(profile.business_id);
}

export async function approveRecommendationAction(recommendationId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("business_id")
    .eq("user_id", user.id)
    .single();

  if (!profile?.business_id) return { success: false, error: "No business" };

  const { error } = await supabase
    .from("growth_recommendations")
    .update({
      status: "approved",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", recommendationId)
    .eq("business_id", profile.business_id);

  if (error) return { success: false, error: "Failed to approve" };

  revalidatePath("/analytics");
  return { success: true };
}

export async function rejectRecommendationAction(recommendationId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("business_id")
    .eq("user_id", user.id)
    .single();

  if (!profile?.business_id) return { success: false, error: "No business" };

  const { error } = await supabase
    .from("growth_recommendations")
    .update({
      status: "rejected",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", recommendationId)
    .eq("business_id", profile.business_id);

  if (error) return { success: false, error: "Failed to reject" };

  revalidatePath("/analytics");
  return { success: true };
}

export async function createStrategyChangeRequestAction(
  recommendationId: string,
  proposedChanges: Record<string, any>
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("business_id")
    .eq("user_id", user.id)
    .single();

  if (!profile?.business_id) return { success: false, error: "No business" };

  const { data: rec } = await supabase
    .from("growth_recommendations")
    .select("*")
    .eq("id", recommendationId)
    .eq("business_id", profile.business_id)
    .single();

  if (!rec) return { success: false, error: "Recommendation not found" };

  const { data: strategy } = await supabase
    .from("social_strategies")
    .select("version")
    .eq("business_id", profile.business_id)
    .eq("status", "active")
    .single();

  const { error } = await supabase
    .from("strategy_change_requests")
    .insert({
      business_id: profile.business_id,
      recommendation_id: recommendationId,
      proposed_changes: proposedChanges,
      rationale: rec.description,
      evidence: rec.evidence,
      requested_by: "ai",
      previous_strategy_version: strategy?.version || 1,
    });

  if (error) return { success: false, error: "Failed to create request" };

  await supabase
    .from("growth_recommendations")
    .update({ status: "implemented" })
    .eq("id", recommendationId);

  revalidatePath("/analytics");
  return { success: true };
}