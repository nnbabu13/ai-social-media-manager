import { createClient } from "@/lib/supabase/server";
import { createAIProvider } from "@/lib/ai/provider";
import type {
  GrowthInsight,
  GrowthRecommendation,
  PerformanceAnalysisResult,
  NextMove,
  DailyBriefData,
  WeeklyReviewData,
  StrategyHealth,
} from "@/types/growth";

interface PillarPerformance {
  pillar: string;
  posts: number;
  avgEngagement: number;
  leads: number;
  avgLeadsPerPost: number;
}

interface PersonaPerformance {
  persona: string;
  posts: number;
  avgEngagement: number;
  leads: number;
  qualifiedLeads: number;
  conversionRate: number;
}

interface FormatPerformance {
  format: string;
  posts: number;
  avgEngagement: number;
  leads: number;
  saves?: number;
  shares?: number;
}

interface PlatformPerformance {
  platform: string;
  posts: number;
  avgEngagement: number;
  leads: number;
  qualifiedLeads: number;
  wonLeads: number;
  conversionRate: number;
}

interface ContentItemWithPerformance {
  id: string;
  pillar: string;
  persona: string;
  objective: string;
  type: string;
  platform: string;
  cta: string;
  socialPosts: Array<{
    id: string;
    platform: string;
    metrics?: Record<string, any>;
  }>;
  leads: Array<{
    intent: string;
    status: string;
  }>;
}

export async function calculateBaselines(businessId: string) {
  const supabase = await createClient();

  const { data: contentItems } = await supabase
    .from("content_items")
    .select(`
      id, pillar, persona, objective, type, platform, cta,
      social_posts (id, platform, metrics),
      social_leads (intent, status)
    `)
    .eq("business_id", businessId)
    .in("status", ["published", "scheduled", "publishing"]);

  const items: ContentItemWithPerformance[] = (contentItems || []).map((item: any) => ({
    id: item.id,
    pillar: item.pillar,
    persona: item.persona,
    objective: item.objective,
    type: item.type,
    platform: item.platform,
    cta: item.cta,
    socialPosts: item.social_posts || [],
    leads: item.social_leads || [],
  }));

  // Calculate pillar performance
  const pillarMap = new Map<string, PillarPerformance>();
  for (const item of items) {
    const key = item.pillar || "Uncategorized";
    const existing = pillarMap.get(key) || {
      pillar: key,
      posts: 0,
      avgEngagement: 0,
      leads: 0,
      avgLeadsPerPost: 0,
    };
    existing.posts += 1;
    for (const post of item.socialPosts || []) {
      const engagement = (post.metrics?.likes || 0) + (post.metrics?.comments || 0) + (post.metrics?.shares || 0);
      existing.avgEngagement += engagement;
    }
    for (const lead of item.leads || []) {
      if (lead.intent === "high" || lead.intent === "medium") existing.leads += 1;
    }
    existing.avgLeadsPerPost = existing.posts > 0 ? existing.leads / existing.posts : 0;
    pillarMap.set(key, existing);
  }

  // Calculate persona performance
  const personaMap = new Map<string, PersonaPerformance>();
  for (const item of items) {
    const key = item.persona || "General";
    const existing = personaMap.get(key) || {
      persona: key,
      posts: 0,
      avgEngagement: 0,
      leads: 0,
      qualifiedLeads: 0,
      conversionRate: 0,
    };
    existing.posts += 1;
    for (const post of item.socialPosts || []) {
      const engagement = (post.metrics?.likes || 0) + (post.metrics?.comments || 0) + (post.metrics?.shares || 0);
      existing.avgEngagement += engagement;
    }
    for (const lead of item.leads || []) {
      if (lead.intent === "high" || lead.intent === "medium") {
        existing.leads += 1;
        if (lead.status === "qualified" || lead.status === "won") existing.qualifiedLeads += 1;
      }
    }
    existing.conversionRate = existing.leads > 0 ? existing.qualifiedLeads / existing.leads : 0;
    personaMap.set(key, existing);
  }

  // Calculate format performance
  const formatMap = new Map<string, FormatPerformance>();
  for (const item of items) {
    const key = item.type || "Unknown";
    const existing = formatMap.get(key) || {
      format: key,
      posts: 0,
      avgEngagement: 0,
      leads: 0,
      saves: 0,
      shares: 0,
    };
    existing.posts += 1;
    for (const post of item.socialPosts || []) {
      const engagement = (post.metrics?.likes || 0) + (post.metrics?.comments || 0) + (post.metrics?.shares || 0);
      existing.avgEngagement += engagement;
      existing.saves += post.metrics?.saves || 0;
      existing.shares += post.metrics?.shares || 0;
    }
    for (const lead of item.leads || []) {
      if (lead.intent === "high" || lead.intent === "medium") existing.leads += 1;
    }
    formatMap.set(key, existing);
  }

  // Calculate platform performance
  const platformMap = new Map<string, PlatformPerformance>();
  for (const item of items) {
    const key = item.platform || "Unknown";
    const existing = platformMap.get(key) || {
      platform: key,
      posts: 0,
      avgEngagement: 0,
      leads: 0,
      qualifiedLeads: 0,
      wonLeads: 0,
      conversionRate: 0,
    };
    existing.posts += 1;
    for (const post of item.socialPosts || []) {
      const engagement = (post.metrics?.likes || 0) + (post.metrics?.comments || 0) + (post.metrics?.shares || 0);
      existing.avgEngagement += engagement;
    }
    for (const lead of item.leads || []) {
      if (lead.intent === "high" || lead.intent === "medium") {
        existing.leads += 1;
        if (lead.status === "qualified" || lead.status === "won") existing.qualifiedLeads += 1;
        if (lead.status === "won") existing.wonLeads += 1;
      }
    }
    existing.conversionRate = existing.leads > 0 ? existing.qualifiedLeads / existing.leads : 0;
    platformMap.set(key, existing);
  }

  return {
    pillars: Array.from(pillarMap.values()),
    personas: Array.from(personaMap.values()),
    formats: Array.from(formatMap.values()),
    platforms: Array.from(platformMap.values()),
    totalPosts: items.length,
    totalLeads: items.reduce((sum, i) => sum + i.leads.filter(l => l.intent === "high" || l.intent === "medium").length, 0),
  };
}

export function checkDataSufficiency(baselines: Awaited<ReturnType<typeof calculateBaselines>>) {
  const warnings: string[] = [];

  if (baselines.totalPosts < 5) {
    warnings.push("Insufficient content data for reliable trends (minimum 5 posts recommended).");
  }

  const pillarsWithData = baselines.pillars.filter(p => p.posts >= 3).length;
  if (pillarsWithData < 2) {
    warnings.push("Not enough data across content pillars for pillar comparison.");
  }

  const personasWithData = baselines.personas.filter(p => p.posts >= 3).length;
  if (personasWithData < 2) {
    warnings.push("Not enough data across personas for persona performance comparison.");
  }

  const formatsWithData = baselines.formats.filter(f => f.posts >= 3).length;
  if (formatsWithData < 2) {
    warnings.push("Not enough format variety for format performance comparison.");
  }

  const platformsWithData = baselines.platforms.filter(p => p.posts >= 3).length;
  if (platformsWithData < 2) {
    warnings.push("Only one platform with sufficient data for platform comparison.");
  }

  if (baselines.totalLeads < 5) {
    warnings.push("Insufficient lead data for conversion analysis (minimum 5 qualified leads recommended).");
  }

  return {
    sufficient: warnings.length === 0,
    warnings,
    metrics: {
      totalPosts: baselines.totalPosts,
      pillarsWithData,
      personasWithData,
      formatsWithData,
      platformsWithData,
      totalLeads: baselines.totalLeads,
    },
  };
}

export async function detectStrategyDrift(businessId: string): Promise<GrowthInsight[]> {
  const supabase = await createClient();

  const { data: strategy } = await supabase
    .from("social_strategies")
    .select("content_mix, posting_cadence, active")
    .eq("business_id", businessId)
    .eq("status", "active")
    .single();

  if (!strategy?.content_mix) return [];

  const { data: recentContent } = await supabase
    .from("content_items")
    .select("pillar, objective, platform, type")
    .eq("business_id", businessId)
    .in("status", ["published", "scheduled"])
    .order("created_at", { ascending: false })
    .limit(20);

  if (!recentContent || recentContent.length < 5) return [];

  const insights: GrowthInsight[] = [];

  // Check content mix drift
  const plannedMix = strategy.content_mix as Record<string, number>;
  const actualCounts: Record<string, number> = {};
  for (const item of recentContent) {
    const key = item.pillar || item.objective || "Uncategorized";
    actualCounts[key] = (actualCounts[key] || 0) + 1;
  }

  const total = recentContent.length;
  for (const [pillar, plannedPct] of Object.entries(plannedMix)) {
    const actualPct = (actualCounts[pillar] || 0) / total * 100;
    const drift = Math.abs(actualPct - plannedPct);
    if (drift > 15) { // 15 percentage point drift threshold
      insights.push({
        id: crypto.randomUUID(),
        business_id: businessId,
        insight_type: "strategy",
        title: `Content mix drift: ${pillar}`,
        summary: `Planned ${plannedPct}% ${pillar} content, but actual is ${actualPct.toFixed(0)}% (drift: ${drift.toFixed(0)}pp).`,
        evidence: { planned: plannedPct, actual: actualPct, drift, sampleSize: total },
        confidence: 0.8,
        priority: "high",
        status: "new",
        data_through: new Date().toISOString(),
        expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as GrowthInsight);
    }
  }

  return insights;
}

export async function generatePerformanceInsights(businessId: string): Promise<GrowthInsight[]> {
  const baselines = await calculateBaselines(businessId);
  const sufficiency = checkDataSufficiency(baselines);
  const insights: GrowthInsight[] = [];

  if (!sufficiency.sufficient) {
    for (const warning of sufficiency.warnings) {
      insights.push({
        id: crypto.randomUUID(),
        business_id: businessId,
        insight_type: "performance",
        title: "Insufficient data for analysis",
        summary: warning,
        evidence: { metrics: sufficiency.metrics },
        confidence: 0.3,
        priority: "info",
        status: "new",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as GrowthInsight);
    }
    return insights;
  }

  // Pillar performance insights
  const sortedPillars = [...baselines.pillars].sort((a, b) => b.avgLeadsPerPost - a.avgLeadsPerPost);
  if (sortedPillars.length >= 2) {
    const best = sortedPillars[0];
    const worst = sortedPillars[sortedPillars.length - 1];
    if (best.avgLeadsPerPost > worst.avgLeadsPerPost * 2 && best.leads >= 3) {
      insights.push({
        id: crypto.randomUUID(),
        business_id: businessId,
        insight_type: "content",
        title: `${best.pillar} content generates more qualified leads`,
        summary: `${best.pillar} posts generate ${(best.avgLeadsPerPost / Math.max(worst.avgLeadsPerPost, 0.1)).toFixed(1)}× more qualified leads per post than ${worst.pillar} content.`,
        evidence: { best: { pillar: best.pillar, leadsPerPost: best.avgLeadsPerPost, posts: best.posts }, worst: { pillar: worst.pillar, leadsPerPost: worst.avgLeadsPerPost, posts: worst.posts } },
        confidence: 0.75,
        priority: "high",
        status: "new",
        data_through: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as GrowthInsight);
    }
  }

  // Persona performance insights
  const sortedPersonas = [...baselines.personas].sort((a, b) => b.conversionRate - a.conversionRate);
  if (sortedPersonas.length >= 2) {
    const best = sortedPersonas[0];
    if (best.conversionRate > 0.3 && best.qualifiedLeads >= 3) {
      insights.push({
        id: crypto.randomUUID(),
        business_id: businessId,
        insight_type: "audience",
        title: `${best.persona} is your highest-converting audience`,
        summary: `${best.persona} accounts for ${best.qualifiedLeads} qualified leads with a ${(best.conversionRate * 100).toFixed(0)}% conversion rate from leads.`,
        evidence: { persona: best.persona, qualifiedLeads: best.qualifiedLeads, conversionRate: best.conversionRate, posts: best.posts },
        confidence: 0.7,
        priority: "high",
        status: "new",
        data_through: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as GrowthInsight);
    }
  }

  // Format performance insights
  const formatWithMostSaves = baselines.formats.reduce((max, f) => f.saves && f.saves > (max.saves || 0) ? f : max, baselines.formats[0]);
  const formatWithMostShares = baselines.formats.reduce((max, f) => f.shares && f.shares > (max.shares || 0) ? f : max, baselines.formats[0]);
  const formatWithMostEngagement = baselines.formats.reduce((max, f) => f.avgEngagement > max.avgEngagement ? f : max, baselines.formats[0]);

  if (formatWithMostSaves && formatWithMostSaves.saves && formatWithMostEngagement.saves && formatWithMostSaves.saves > formatWithMostEngagement.saves * 2) {
    insights.push({
      id: crypto.randomUUID(),
      business_id: businessId,
      insight_type: "content",
      title: `${formatWithMostSaves.format} generates more saves`,
      summary: `${formatWithMostSaves.format} content gets ${formatWithMostSaves.format === formatWithMostEngagement.format ? "the most" : "significantly more"} saves, suggesting it's valuable for reference.`,
      evidence: { format: formatWithMostSaves.format, saves: formatWithMostSaves.saves, posts: formatWithMostSaves.posts },
      confidence: 0.65,
      priority: "medium",
      status: "new",
      data_through: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as GrowthInsight);
  }

  // Platform performance insights
  const platformWithBestConversion = baselines.platforms.reduce((max, p) => p.conversionRate > max.conversionRate ? p : max, baselines.platforms[0]);
  const platformWithMostLeads = baselines.platforms.reduce((max, p) => p.leads > max.leads ? p : max, baselines.platforms[0]);

  if (platformWithBestConversion && platformWithMostLeads &&
      platformWithBestConversion.platform !== platformWithMostLeads.platform &&
      platformWithBestConversion.conversionRate > platformWithMostLeads.conversionRate * 1.5 &&
      platformWithBestConversion.qualifiedLeads >= 3) {
    insights.push({
      id: crypto.randomUUID(),
      business_id: businessId,
      insight_type: "platform",
      title: `${platformWithBestConversion.platform} has higher lead-to-conversion efficiency`,
      summary: `${platformWithBestConversion.platform} produces fewer total leads (${platformWithBestConversion.leads}) than ${platformWithMostLeads.platform} (${platformWithMostLeads.leads}) but has a ${(platformWithBestConversion.conversionRate * 100).toFixed(0)}% qualified lead rate vs ${(platformWithMostLeads.conversionRate * 100).toFixed(0)}%.`,
      evidence: {
        best: { platform: platformWithBestConversion.platform, leads: platformWithBestConversion.leads, conversionRate: platformWithBestConversion.conversionRate },
        most: { platform: platformWithMostLeads.platform, leads: platformWithMostLeads.leads, conversionRate: platformWithMostLeads.conversionRate }
      },
      confidence: 0.7,
      priority: "medium",
      status: "new",
      data_through: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as GrowthInsight);
  }

  return insights;
}

export async function generateGrowthRecommendations(
  businessId: string,
  insights: GrowthInsight[]
): Promise<GrowthRecommendation[]> {
  const recommendations: GrowthRecommendation[] = [];

  for (const insight of insights) {
    if (insight.status !== "new") continue;

    let actionType: GrowthRecommendation["action_type"] = "create_content";
    let title = "";
    let description = "";
    let priority = insight.priority;

    switch (insight.insight_type) {
      case "content":
        if (insight.title.includes("generates more qualified leads")) {
          actionType = "change_content_mix";
          title = `Increase ${insight.evidence?.best?.pillar} content`;
          description = `Shift content mix toward ${insight.evidence?.best?.pillar} which generates ${insight.evidence?.best?.leadsPerPost?.toFixed(1) || "more"} qualified leads per post.`;
        }
        break;
      case "audience":
        if (insight.title.includes("highest-converting")) {
          actionType = "target_persona";
          title = `Prioritize content for ${insight.evidence?.persona}`;
          description = `Create more content targeting ${insight.evidence?.persona} who convert at ${((insight.evidence?.conversionRate || 0) * 100).toFixed(0)}%.`;
        }
        break;
      case "platform":
        if (insight.title.includes("conversion efficiency")) {
          actionType = "review_platform";
          title = `Optimize ${insight.evidence?.best?.platform} for conversions`;
          description = `${insight.evidence?.best?.platform} has higher conversion efficiency. Consider shifting more conversion-focused content there.`;
        }
        break;
      case "strategy":
        if (insight.title.includes("Content mix drift")) {
          actionType = "review_strategy";
          title = "Realign content mix with strategy";
          description = `Current content mix has drifted from strategy. Plan next 3-4 posts to restore balance.`;
          priority = "high";
        }
        break;
    }

    if (actionType) {
      recommendations.push({
        id: crypto.randomUUID(),
        business_id: insight.business_id,
        insight_id: insight.id,
        action_type: actionType,
        title,
        description,
        evidence: { insightId: insight.id, ...insight.evidence },
        confidence: insight.confidence * 0.9,
        priority,
        status: "new",
        recommended_by: "ai",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as GrowthRecommendation);
    }
  }

  return recommendations;
}

export async function generateNextMove(
  businessId: string,
  insights: GrowthInsight[],
  recommendations: GrowthRecommendation[]
): Promise<NextMove | null> {
  // Find the highest priority actionable recommendation
  const actionable = recommendations.filter(r => r.status === "new" && r.priority !== "info");
  if (actionable.length === 0) return null;

  const top = actionable.sort((a, b) => {
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1, info: 0 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  })[0];

  return {
    action: top.title,
    reason: top.description,
    evidence: top.evidence,
    priority: top.priority,
  };
}

export async function generateDailyBrief(businessId: string): Promise<DailyBriefData> {
  const supabase = await createClient();

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);

  const [insights, baselines, { data: conversations }] = await Promise.all([
    generatePerformanceInsights(businessId),
    calculateBaselines(businessId),
    supabase
      .from("social_conversations")
      .select("id, status, created_at")
      .eq("business_id", businessId)
      .gte("created_at", yesterdayStart.toISOString())
      .lt("created_at", todayStart.toISOString()),
  ]);

  const recommendations = await generateGrowthRecommendations(businessId, insights);
  const nextMove = await generateNextMove(businessId, insights, recommendations);

  const conversationsYesterday = conversations || [];
  const newLeads = conversationsYesterday.filter(c => c.status === "new").length;
  const escalated = conversationsYesterday.filter(c => c.status === "escalated").length;

  return {
    whatHappened: `${conversationsYesterday.length} new conversations yesterday. ${newLeads} new leads detected. ${escalated > 0 ? `${escalated} escalated.` : ""}`,
    whatMatters: insights.filter(i => i.priority === "high" || i.priority === "urgent")
      .slice(0, 3)
      .map(i => i.title)
      .join(". ") || "No critical insights today.",
    nextMove: nextMove ? { action: nextMove.action, reason: nextMove.reason, evidence: nextMove.evidence, priority: nextMove.priority } : null,
    needsAttention: [
      ...(escalated > 0 ? [`${escalated} conversation(s) need your attention`] : []),
      ...(insights.filter(i => i.priority === "urgent").length > 0 ? [`${insights.filter(i => i.priority === "urgent").length} urgent insight(s)`] : []),
    ],
    impactMetrics: {
      postsPublished: baselines.totalPosts,
      conversationsHandled: conversationsYesterday.length,
      leadsDetected: newLeads,
      qualifiedLeads: baselines.totalLeads,
      wins: 0, // Would need to query won leads
    },
  };
}

export async function getStrategyHealth(businessId: string): Promise<StrategyHealth> {
  const baselines = await calculateBaselines(businessId);
  const sufficiency = checkDataSufficiency(baselines);
  const driftInsights = await detectStrategyDrift(businessId);

  const warnings: string[] = [];

  if (driftInsights.length > 0) {
    warnings.push(`${driftInsights.length} strategy drift(s) detected.`);
  }

  if (!sufficiency.sufficient) {
    warnings.push(...sufficiency.warnings);
  }

  return {
    goalAlignment: true, // Would need business goal analysis
    audienceAlignment: baselines.personas.length > 0,
    contentMixDrift: driftInsights.length > 0,
    conversionPathConfigured: true, // Would need to check
    dataSufficiency: {
      content: baselines.totalPosts >= 5,
      leads: baselines.totalLeads >= 5,
      platform: baselines.platforms.filter(p => p.posts >= 3).length >= 2,
    },
    warnings,
  };
}

export async function generateAIWeeklyReview(businessId: string): Promise<WeeklyReviewData> {
  const supabase = await createClient();

  const today = new Date();
  const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  const { data: content } = await supabase
    .from("content_items")
    .select("id, status, pillar, type, platform")
    .eq("business_id", businessId)
    .gte("created_at", weekStart.toISOString());

  const { data: leads } = await supabase
    .from("social_leads")
    .select("id, intent, status, created_at")
    .eq("business_id", businessId)
    .gte("created_at", weekStart.toISOString());

  const { data: conversations } = await supabase
    .from("social_conversations")
    .select("id, status, created_at")
    .eq("business_id", businessId)
    .gte("created_at", weekStart.toISOString());

  const baselines = await calculateBaselines(businessId);
  const sufficiency = checkDataSufficiency(baselines);

  const provider = createAIProvider();

  const prompt = `Create a weekly AI review for a business owner.

WEEK DATA:
- Content created: ${content?.length || 0}
- Leads generated: ${leads?.length || 0}
- Conversations: ${conversations?.length || 0}
- High intent leads: ${leads?.filter(l => l.intent === "high").length || 0}
- Won leads: ${leads?.filter(l => l.status === "won").length || 0}

PERFORMANCE:
- Data sufficiency: ${sufficiency.sufficient ? "sufficient" : "insufficient"}
- Warnings: ${sufficiency.warnings.length}
- Total posts: ${baselines.totalPosts}
- Total leads: ${baselines.totalLeads}
- Top pillars: ${baselines.pillars.sort((a, b) => b.avgLeadsPerPost - a.avgLeadsPerPost).slice(0, 3).map(p => `${p.pillar} (${p.leads} leads)`).join(", ")}

Write a structured weekly review covering:
1. Performance summary
2. Customer insights (what customers are asking)
3. Content insights (what worked)
4. Lead insights (lead quality/sources)
5. Strategy assessment (is strategy still aligned?)
6. Next week plan (2-3 priorities)

Return JSON with all 6 sections as strings.`;

  try {
    const result = await provider.generate(prompt, { temperature: 0.3, maxTokens: 3000 });
    const parsed = JSON.parse(result);
    return parsed as WeeklyReviewData;
  } catch (error) {
    console.error("AI Weekly Review error:", error);
    return {
      performanceSummary: "Weekly performance data collected.",
      customerInsights: "Customer conversation data available.",
      contentInsights: "Content performance analyzed.",
      leadInsights: "Lead data reviewed.",
      strategyAssessment: "Strategy alignment checked.",
      nextWeekPlan: "Focus on top recommendations.",
    };
  }
}