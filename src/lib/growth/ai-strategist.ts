import { createClient } from "@/lib/supabase/server";
import { createAIProvider } from "@/lib/ai/provider";
import type {
  PerformanceAnalysisResult,
  GrowthInsight,
  GrowthRecommendation,
  NextMove,
  DailyBriefData,
  WeeklyReviewData,
  StrategyHealth,
} from "@/types/growth";
import {
  calculateBaselines,
  checkDataSufficiency,
  detectStrategyDrift,
  generatePerformanceInsights,
  generateGrowthRecommendations,
  generateNextMove,
  generateDailyBrief,
  generateAIWeeklyReview,
  getStrategyHealth,
} from "./performance-analyzer";

export { getStrategyHealth, generateAIWeeklyReview } from "./performance-analyzer";
export type {
  PerformanceAnalysisResult,
  GrowthInsight,
  GrowthRecommendation,
  NextMove,
  DailyBriefData,
  WeeklyReviewData,
  StrategyHealth,
} from "@/types/growth";

export async function analyzePerformance(businessId: string): Promise<PerformanceAnalysisResult> {
  const [baselines, driftInsights, performanceInsights] = await Promise.all([
    calculateBaselines(businessId),
    detectStrategyDrift(businessId),
    generatePerformanceInsights(businessId),
  ]);

  const sufficiency = checkDataSufficiency(baselines);
  const allInsights = [...driftInsights, ...performanceInsights];
  const recommendations = await generateGrowthRecommendations(businessId, allInsights);
  const nextMove = await generateNextMove(businessId, allInsights, recommendations);

  return {
    observations: allInsights.filter(i => i.insight_type === "performance" || i.insight_type === "content" || i.insight_type === "strategy"),
    opportunities: allInsights.filter(i => i.insight_type === "opportunity" || i.insight_type === "content" || i.insight_type === "audience" || i.insight_type === "platform"),
    risks: allInsights.filter(i => i.insight_type === "risk" || i.insight_type === "strategy"),
    recommendations,
    nextMove,
    confidence: sufficiency.sufficient ? "high" : sufficiency.warnings.length > 2 ? "low" : "medium",
  };
}

export async function generateAIGrowthInsights(businessId: string): Promise<GrowthInsight[]> {
  const supabase = await createClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("name, category, description")
    .eq("id", businessId)
    .single();

  const { data: strategy } = await supabase
    .from("social_strategies")
    .select("primary_goal, content_mix, target_audience, key_messages, conversion_strategy")
    .eq("business_id", businessId)
    .eq("status", "active")
    .single();

  const { data: brandProfile } = await supabase
    .from("brand_profiles")
    .select("tone, voice_attributes, values")
    .eq("business_id", businessId)
    .single();

  const { data: personas } = await supabase
    .from("customer_personas")
    .select("name, description, pain_points, needs, priority")
    .eq("business_id", businessId)
    .eq("is_active", true);

  const { data: leads } = await supabase
    .from("social_leads")
    .select("intent, status, stage, requirement, quantity, location, interested_product_id")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: observations } = await supabase
    .from("social_observations")
    .select("observation_type, title, summary, severity, confidence")
    .eq("business_id", businessId)
    .eq("status", "new")
    .order("created_at", { ascending: false })
    .limit(20);

  const baselines = await calculateBaselines(businessId);

  const provider = createAIProvider();

  const prompt = `You are an AI Growth Strategist for a social media business. Analyze the following data and generate actionable growth insights.

BUSINESS CONTEXT:
- Name: ${business?.name}
- Category: ${business?.category}
- Description: ${business?.description}

STRATEGY:
- Primary Goal: ${strategy?.primary_goal}
- Content Mix: ${JSON.stringify(strategy?.content_mix)}
- Target Audience: ${JSON.stringify(strategy?.target_audience)}
- Key Messages: ${strategy?.key_messages}
- Conversion Strategy: ${strategy?.conversion_strategy}

BRAND:
- Tone: ${brandProfile?.tone}
- Voice: ${JSON.stringify(brandProfile?.voice_attributes)}
- Values: ${brandProfile?.values}

CUSTOMER PERSONAS:
${JSON.stringify(personas)}

RECENT LEADS (last 50):
${JSON.stringify(leads)}

SOCIAL INTELLIGENCE OBSERVATIONS:
${JSON.stringify(observations)}

PERFORMANCE BASELINES:
${JSON.stringify(baselines)}

INSTRUCTIONS:
1. Analyze the data for patterns, opportunities, and risks
2. Focus on what drives business goals (${strategy?.primary_goal})
3. Distinguish OBSERVED FACTS from INTERPRETATIONS
4. Do NOT claim causation without evidence
5. Mention when data is insufficient
6. Prioritize actionable insights
7. Return structured JSON only

Return JSON with this schema:
{
  "insights": [
    {
      "insight_type": "performance|content|audience|lead|conversion|strategy|platform|opportunity|risk",
      "title": "Brief title",
      "summary": "2-3 sentence summary with evidence",
      "evidence": {},
      "confidence": 0.0-1.0,
      "priority": "urgent|high|medium|low|info"
    }
  ]
}`;

  try {
    const result = await provider.generate(prompt, { temperature: 0.3, maxTokens: 4000 });
    const parsed = JSON.parse(result);
    return parsed.insights || [];
  } catch (error) {
    console.error("AI Growth Insights error:", error);
    return [];
  }
}

export async function generateAIStrategicRecommendations(
  businessId: string,
  insights: GrowthInsight[]
): Promise<GrowthRecommendation[]> {
  if (insights.length === 0) return [];

  const supabase = await createClient();

  const { data: strategy } = await supabase
    .from("social_strategies")
    .select("primary_goal, content_mix, target_audience, conversion_strategy")
    .eq("business_id", businessId)
    .eq("status", "active")
    .single();

  const provider = createAIProvider();

  const prompt = `You are an AI Growth Strategist. Based on the insights below, generate specific, actionable recommendations.

BUSINESS GOAL: ${strategy?.primary_goal}
CURRENT CONTENT MIX: ${JSON.stringify(strategy?.content_mix)}
CONVERSION STRATEGY: ${strategy?.conversion_strategy}

INSIGHTS:
${insights.map(i => `- [${i.priority}] ${i.title}: ${i.summary} (confidence: ${i.confidence})`).join("\n")}

Generate 3-5 specific recommendations. Each must:
1. Have a clear action type
2. Reference specific evidence from insights
3. Respect the business goal
4. Not change strategy automatically - require owner approval
5. Be implementable through existing system capabilities

Return JSON:
{
  "recommendations": [
    {
      "action_type": "create_content|change_content_mix|target_persona|change_format|review_platform|review_strategy|improve_conversion|follow_up_leads|investigate_drop|test_new_topic|adjust_cadence|optimize_cadence",
      "title": "Specific action",
      "description": "Why and how",
      "evidence": {},
      "confidence": 0.0-1.0,
      "priority": "urgent|high|medium|low|info"
    }
  ]
}`;

  try {
    const result = await provider.generate(prompt, { temperature: 0.3, maxTokens: 3000 });
    const parsed = JSON.parse(result);
    return parsed.recommendations || [];
  } catch (error) {
    console.error("AI Strategic Recommendations error:", error);
    return [];
  }
}

export async function generateAINextMove(
  businessId: string,
  analysis: PerformanceAnalysisResult
): Promise<NextMove | null> {
  const provider = createAIProvider();

  const prompt = `Based on the performance analysis, recommend ONE primary next action for the business owner.

ANALYSIS:
Observations: ${analysis.observations.map(o => o.title).join(", ")}
Opportunities: ${analysis.opportunities.map(o => o.title).join(", ")}
Risks: ${analysis.risks.map(r => r.title).join(", ")}
Recommendations: ${analysis.recommendations.map(r => `${r.title} (${r.priority})`).join("; ")}

The recommendation should be:
- ONE clear action
- Directly tied to evidence
- Achievable through the content system
- Aligned with business goals

Return JSON:
{
  "action": "Specific action to take",
  "reason": "Why this action based on evidence",
  "evidence": {},
  "priority": "urgent|high|medium|low|info"
}

If no clear action exists, return { "action": null }`;

  try {
    const result = await provider.generate(prompt, { temperature: 0.2, maxTokens: 1500 });
    const parsed = JSON.parse(result);
    if (!parsed.action) return null;
    return parsed as NextMove;
  } catch (error) {
    console.error("AI Next Move error:", error);
    return null;
  }
}

export async function generateAIDailyBrief(businessId: string): Promise<DailyBriefData> {
  const brief = await generateDailyBrief(businessId);
  const provider = createAIProvider();

  const prompt = `Create a concise daily AI brief for a business owner. Use this data:

WHAT HAPPENED: ${brief.whatHappened}
WHAT MATTERS: ${brief.whatMatters}
NEXT MOVE: ${brief.nextMove?.action || "None"}
NEEDS ATTENTION: ${brief.needsAttention.join(", ")}
IMPACT METRICS: ${JSON.stringify(brief.impactMetrics)}

Format as a natural, professional brief. Keep it concise. Don't invent data not provided.

Return JSON:
{
  "whatHappened": "Natural language summary",
  "whatMatters": "Key insight for the day",
  "nextMove": { "action": "...", "reason": "...", "evidence": {}, "priority": "high" } | null,
  "needsAttention": ["item1", "item2"],
  "impactMetrics": { "postsPublished": 0, "conversationsHandled": 0, "leadsDetected": 0, "qualifiedLeads": 0, "wins": 0 }
}`;

  try {
    const result = await provider.generate(prompt, { temperature: 0.3, maxTokens: 2000 });
    const parsed = JSON.parse(result);
    return { ...brief, ...parsed };
  } catch {
    return brief;
  }
}

export async function storeInsights(businessId: string, insights: GrowthInsight[]) {
  const supabase = await createClient();

  for (const insight of insights) {
    await supabase
      .from("growth_insights")
      .upsert({
        id: insight.id,
        business_id: businessId,
        insight_type: insight.insight_type,
        title: insight.title,
        summary: insight.summary,
        evidence: insight.evidence,
        confidence: insight.confidence,
        priority: insight.priority,
        status: insight.status,
        data_through: insight.data_through,
        expires_at: insight.expires_at,
        brain_version: insight.brain_version,
        strategy_version: insight.strategy_version,
      }, { onConflict: "id" });
  }
}

export async function storeRecommendations(businessId: string, recommendations: GrowthRecommendation[]) {
  const supabase = await createClient();

  for (const rec of recommendations) {
    await supabase
      .from("growth_recommendations")
      .upsert({
        id: rec.id,
        business_id: businessId,
        insight_id: rec.insight_id,
        action_type: rec.action_type,
        title: rec.title,
        description: rec.description,
        evidence: rec.evidence,
        confidence: rec.confidence,
        priority: rec.priority,
        status: rec.status,
        recommended_by: rec.recommended_by,
        brain_version: rec.brain_version,
        strategy_version: rec.strategy_version,
      }, { onConflict: "id" });
  }
}

export async function storeDailyBrief(businessId: string, brief: DailyBriefData) {
  const supabase = await createClient();

  const today = new Date().toISOString().split("T")[0];

  await supabase
    .from("daily_ai_briefs")
    .upsert({
      business_id: businessId,
      brief_date: today,
      what_happened: brief.whatHappened,
      what_matters: brief.whatMatters,
      next_move: brief.nextMove ? brief.nextMove.action : null,
      needs_attention: brief.needsAttention,
      impact_metrics: brief.impactMetrics,
      brain_version: brief.nextMove?.evidence?.brainVersion,
      strategy_version: brief.nextMove?.evidence?.strategyVersion,
    }, { onConflict: "business_id,brief_date" });
}

export async function storeWeeklyReview(businessId: string, review: WeeklyReviewData) {
  const supabase = await createClient();

  const today = new Date();
  const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  await supabase
    .from("weekly_ai_reviews")
    .upsert({
      business_id: businessId,
      week_start: weekStart.toISOString().split("T")[0],
      week_end: today.toISOString().split("T")[0],
      performance_summary: review.performanceSummary,
      customer_insights: review.customerInsights,
      content_insights: review.contentInsights,
      lead_insights: review.leadInsights,
      strategy_assessment: review.strategyAssessment,
      next_week_plan: review.nextWeekPlan,
    }, { onConflict: "business_id,week_start" });
}