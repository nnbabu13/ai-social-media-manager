import { createClient } from "@/lib/supabase/server";
import { classifySocialContent, classifySocialInteraction, generateObservationSummary } from "./classifier";
import { createServerAuditLog, AuditActions } from "@/lib/audit-server";
import { createServerNotification } from "@/lib/notifications-server";
import type { Observation, Recommendation, Lead, ScanResult } from "@/types/social-intelligence";
import { nanoid } from "nanoid";

const SIGNIFICANCE_THRESHOLD = 1.5;
const MIN_POSTS_FOR_BASELINE = 5;
const QUESTION_TREND_THRESHOLD = 3;

function createSignature(parts: string[]): string {
  return parts.join("::");
}

async function getBusinessBrain(businessId: string) {
  const supabase = await createClient();

  const [businessRes, productsRes, servicesRes, goalsRes, brandRes, strategyRes, factsRes, faqsRes, policiesRes] =
    await Promise.all([
      supabase.from("businesses").select("id, name, category, description, target_customers").eq("id", businessId).single(),
      supabase.from("business_products").select("name").eq("business_id", businessId),
      supabase.from("business_services").select("name").eq("business_id", businessId),
      supabase.from("business_goals").select("goal, is_primary").eq("business_id", businessId),
      supabase.from("brand_profiles").select("tone, style_description, brand_keywords").eq("business_id", businessId).single(),
      supabase.from("social_strategies").select("primary_objective, content_pillars, target_audiences, content_themes, brand_voice_guidelines, posting_frequency").eq("business_id", businessId).eq("strategy_status", "active").single(),
      supabase.from("business_facts").select("title, content, category").eq("business_id", businessId).eq("is_active", true),
      supabase.from("business_faqs").select("question, answer, category").eq("business_id", businessId).eq("is_active", true),
      supabase.from("ai_policies").select("autonomy_level").eq("business_id", businessId).single(),
    ]);

  return {
    business: businessRes.data,
    products: productsRes.data?.map((p) => p.name) || [],
    services: servicesRes.data?.map((s) => s.name) || [],
    goals: goalsRes.data || [],
    brand: brandRes.data,
    strategy: strategyRes.data,
    facts: factsRes.data || [],
    faqs: faqsRes.data || [],
    policies: policiesRes.data,
  };
}

async function getSocialData(businessId: string, days: number) {
  const supabase = await createClient();
  const since = new Date(Date.now() - days * 86400000).toISOString();

  const { data: accounts } = await supabase
    .from("social_accounts")
    .select("id, platform, platform_account_id, account_name, status")
    .eq("business_id", businessId)
    .in("status", ["active", "syncing"]);

  if (!accounts || accounts.length === 0) {
    return { accounts: [], posts: [], comments: [], metrics: [] };
  }

  const accountIds = accounts.map((a) => a.id);

  const [postsRes, commentsRes, metricsRes] = await Promise.all([
    supabase
      .from("social_posts")
      .select("id, social_account_id, platform_post_id, caption, published_at, media_url, permalink")
      .in("social_account_id", accountIds)
      .gte("published_at", since)
      .order("published_at", { ascending: false }),
    supabase
      .from("social_comments")
      .select("id, social_account_id, social_post_id, platform_comment_id, author_name, text, created_at")
      .in("social_account_id", accountIds)
      .gte("created_at", since)
      .order("created_at", { ascending: false }),
    supabase
      .from("social_account_metrics")
      .select("id, social_account_id, metric_date, followers_count, following_count, posts_count")
      .in("social_account_id", accountIds)
      .gte("metric_date", new Date(Date.now() - 60 * 86400000).toISOString().split("T")[0])
      .order("metric_date", { ascending: false }),
  ]);

  return {
    accounts,
    posts: postsRes.data || [],
    comments: commentsRes.data || [],
    metrics: metricsRes.data || [],
  };
}

async function getHistoricalData(businessId: string, days: number) {
  const supabase = await createClient();
  const since = new Date(Date.now() - days * 86400000).toISOString();

  const { data: accounts } = await supabase
    .from("social_accounts")
    .select("id")
    .eq("business_id", businessId)
    .in("status", ["active"]);

  if (!accounts || accounts.length === 0) return { posts: [], comments: [] };

  const accountIds = accounts.map((a) => a.id);

  const [postsRes, commentsRes] = await Promise.all([
    supabase
      .from("social_posts")
      .select("id, social_account_id, caption, published_at")
      .in("social_account_id", accountIds)
      .gte("published_at", since)
      .order("published_at", { ascending: false }),
    supabase
      .from("social_comments")
      .select("id, social_account_id, text, created_at")
      .in("social_account_id", accountIds)
      .gte("created_at", since),
  ]);

  return {
    posts: postsRes.data || [],
    comments: commentsRes.data || [],
  };
}

function calculateEngagementBaseline(posts: Array<{ published_at: string | null }>) {
  if (posts.length < MIN_POSTS_FOR_BASELINE) return null;
  return posts.length;
}

function detectPostingGap(posts: Array<{ published_at: string | null }>): number | null {
  if (posts.length === 0) return null;
  const sorted = [...posts].sort(
    (a, b) => new Date(b.published_at || 0).getTime() - new Date(a.published_at || 0).getTime()
  );
  const lastPost = sorted[0];
  if (!lastPost.published_at) return null;
  const daysSince = (Date.now() - new Date(lastPost.published_at).getTime()) / 86400000;
  return daysSince > 7 ? daysSince : null;
}

function findRepeatedQuestions(comments: Array<{ text: string | null }>): Array<{ question: string; count: number }> {
  const questionPatterns = [
    /deliver/i, /price|cost|how much/i, /order/i, /minimum/i,
    /location|where/i, /timing|hours|open/i, /available/i,
    /bulk|wholesale/i, /custom/i, /refund/i,
  ];

  const buckets: Record<string, number> = {};

  for (const comment of comments) {
    if (!comment.text) continue;
    for (const pattern of questionPatterns) {
      if (pattern.test(comment.text)) {
        const key = pattern.source;
        buckets[key] = (buckets[key] || 0) + 1;
      }
    }
  }

  return Object.entries(buckets)
    .filter(([, count]) => count >= QUESTION_TREND_THRESHOLD)
    .map(([pattern, count]) => ({
      question: pattern,
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

function detectLeadSignals(comments: Array<{ text: string | null; author_name: string | null; id: string; social_account_id: string }>): Array<{
  text: string;
  author_name: string | null;
  comment_id: string;
  social_account_id: string;
  intent: "high" | "medium" | "low";
  reason: string;
}> {
  const leads: Array<{
    text: string;
    author_name: string | null;
    comment_id: string;
    social_account_id: string;
    intent: "high" | "medium" | "low";
    reason: string;
  }> = [];

  const highIntentPatterns = [
    { pattern: /how much.*\d+/i, reason: "Asking for pricing with specific quantity" },
    { pattern: /can you deliver/i, reason: "Asking about delivery availability" },
    { pattern: /how do (i|we) order/i, reason: "Asking how to place an order" },
    { pattern: /can someone call/i, reason: "Requesting a call back" },
    { pattern: /interested in buying/i, reason: "Expressing purchase interest" },
    { pattern: /whatsapp|phone|contact/i, reason: "Requesting contact information" },
  ];

  const mediumIntentPatterns = [
    { pattern: /price|cost|how much/i, reason: "Asking about pricing" },
    { pattern: /available|in stock/i, reason: "Asking about availability" },
    { pattern: /bulk|wholesale/i, reason: "Interested in bulk purchase" },
    { pattern: /custom|personaliz/i, reason: "Interested in customization" },
  ];

  for (const comment of comments) {
    if (!comment.text) continue;

    for (const { pattern, reason } of highIntentPatterns) {
      if (pattern.test(comment.text)) {
        leads.push({
          text: comment.text,
          author_name: comment.author_name,
          comment_id: comment.id,
          social_account_id: comment.social_account_id,
          intent: "high",
          reason,
        });
        break;
      }
    }

    for (const { pattern, reason } of mediumIntentPatterns) {
      if (pattern.test(comment.text)) {
        const existing = leads.find((l) => l.comment_id === comment.id);
        if (!existing) {
          leads.push({
            text: comment.text,
            author_name: comment.author_name,
            comment_id: comment.id,
            social_account_id: comment.social_account_id,
            intent: "medium",
            reason,
          });
        }
        break;
      }
    }
  }

  return leads;
}

function detectComplaints(comments: Array<{ text: string | null; author_name: string | null; id: string; social_account_id: string }>): Array<{
  text: string;
  author_name: string | null;
  comment_id: string;
  social_account_id: string;
}> {
  const complaintPatterns = [
    /terrible|worst|awful|hate/i,
    /nobody.*replied|no response|ignored/i,
    /late|delayed|never arrived/i,
    /refund|money back/i,
    /disappoint|unsatisfied|unhappy/i,
    /complaint|problem|issue/i,
  ];

  return comments
    .filter((c): c is typeof c & { text: string } => c.text !== null && complaintPatterns.some((p) => p.test(c.text!)))
    .map((c) => ({
      text: c.text,
      author_name: c.author_name,
      comment_id: c.id,
      social_account_id: c.social_account_id,
    }));
}

function detectSpam(comments: Array<{ text: string | null }>): number {
  const spamPatterns = [
    /follow me/i,
    /check (my|out my) (profile|page|link)/i,
    /dm for/i,
    /click here/i,
    /free money/i,
    /earn \$\d+/i,
    /www\..+\.com/i,
  ];

  return comments.filter((c) => c.text !== null && spamPatterns.some((p) => p.test(c.text!))).length;
}

async function analyzeContentMix(
  posts: Array<{ caption: string | null }>,
  brain: ReturnType<typeof getBusinessBrain> extends Promise<infer T> ? T : never
): Promise<{ observations: Observation[]; recommendations: Recommendation[] }> {
  const observations: Observation[] = [];
  const recommendations: Recommendation[] = [];

  if (posts.length < MIN_POSTS_FOR_BASELINE) {
    return { observations, recommendations };
  }

  const classifications = await Promise.all(
    posts.slice(0, 30).map((post) =>
      classifySocialContent({
        caption: post.caption || "",
        businessBrain: {
          products: brain.products,
          services: brain.services,
          strategy: brain.strategy
            ? {
                content_pillars: brain.strategy.content_pillars as string[] | undefined,
                primary_objective: brain.strategy.primary_objective,
              }
            : undefined,
          brand: brain.brand ? { tone: brain.brand.tone } : undefined,
        },
      })
    )
  );

  const pillarCounts: Record<string, number> = {};
  let promotionalCount = 0;

  for (const c of classifications) {
    const pillar = c.pillar || "other";
    pillarCounts[pillar] = (pillarCounts[pillar] || 0) + 1;
    if (c.promotional) promotionalCount++;
  }

  const total = classifications.length;
  const promoRatio = promotionalCount / total;

  if (brain.strategy?.content_pillars && Array.isArray(brain.strategy.content_pillars)) {
    const strategyPillars = brain.strategy.content_pillars as string[];
    const hasEducation = strategyPillars.some((p) => p.toLowerCase().includes("education"));
    const actualEducation = (pillarCounts["education"] || 0) / total;

    if (hasEducation && actualEducation < 0.1 && total >= MIN_POSTS_FOR_BASELINE) {
      const sig = createSignature(["strategy_drift", "education_gap", brain.business?.id || ""]);
      observations.push({
        business_id: brain.business?.id || "",
        observation_type: "strategy_drift",
        severity: "medium",
        title: "Content strategy drift detected",
        summary: `Your strategy includes educational content but only ${Math.round(actualEducation * 100)}% of recent posts are educational.`,
        evidence: { pillar_counts: pillarCounts, total_posts: total },
        source_ids: [],
        confidence: 0.7,
        status: "new",
        signature: sig,
      });

      recommendations.push({
        business_id: brain.business?.id || "",
        observation_id: null,
        title: "Increase educational content",
        description: "Create educational content to align with your strategy. Consider sharing tips, how-tos, or industry insights.",
        action_type: "increase_topic_frequency",
        priority: "medium",
        confidence: 0.7,
        reason: "Educational content is underrepresented in your recent posts.",
        status: "new",
      });
    }
  }

  if (promoRatio > 0.6 && total >= MIN_POSTS_FOR_BASELINE) {
    const sig = createSignature(["strategy_drift", "high_promotion", brain.business?.id || ""]);
    observations.push({
      business_id: brain.business?.id || "",
      observation_type: "strategy_drift",
      severity: "medium",
      title: "Promotional content may be too high",
      summary: `${Math.round(promoRatio * 100)}% of your recent posts are promotional. This may reduce audience engagement over time.`,
      evidence: { promotional_ratio: promoRatio, total_posts: total },
      source_ids: [],
      confidence: 0.65,
      status: "new",
      signature: sig,
    });
  }

  return { observations, recommendations };
}

async function analyzePerformance(
  currentPosts: Array<{ id: string; caption: string | null; published_at: string | null; social_account_id: string }>,
  historicalPosts: Array<{ id: string; caption: string | null; published_at: string | null }>,
  brain: ReturnType<typeof getBusinessBrain> extends Promise<infer T> ? T : never
): Promise<{ observations: Observation[]; recommendations: Recommendation[] }> {
  const observations: Observation[] = [];
  const recommendations: Recommendation[] = [];

  if (currentPosts.length < 3 || historicalPosts.length < MIN_POSTS_FOR_BASELINE) {
    return { observations, recommendations };
  }

  const currentRate = currentPosts.length / 7;
  const historicalRate = historicalPosts.length / 30;

  if (currentRate > historicalRate * SIGNIFICANCE_THRESHOLD && historicalRate > 0) {
    const sig = createSignature(["engagement_spike", brain.business?.id || ""]);
    observations.push({
      business_id: brain.business?.id || "",
      observation_type: "engagement_spike",
      severity: "low",
      title: "Posting frequency increase",
      summary: `Your recent posting rate (${currentRate.toFixed(1)}/day) is higher than your 30-day average (${historicalRate.toFixed(1)}/day).`,
      evidence: { current_rate: currentRate, historical_rate: historicalRate },
      source_ids: [],
      confidence: 0.6,
      status: "new",
      signature: sig,
    });
  }

  return { observations, recommendations };
}

function detectSensitiveTopics(
  comments: Array<{ text: string | null; author_name: string | null; id: string; social_account_id: string }>
): Array<{ observation: Observation; recommendation: Recommendation }> {
  const results: Array<{ observation: Observation; recommendation: Recommendation }> = [];

  const sensitivePatterns = [
    { pattern: /refund|money back/i, topic: "refund_request", severity: "high" as const },
    { pattern: /lawyer|legal|sue|court/i, topic: "legal_threat", severity: "urgent" as const },
    { pattern: /injur|hurt|sick|allerg/i, topic: "safety_issue", severity: "urgent" as const },
    { pattern: /discount|cheaper|negotiate/i, topic: "price_negotiation", severity: "low" as const },
    { pattern: /partner|collab|business.*proposal/i, topic: "partnership", severity: "medium" as const },
  ];

  for (const comment of comments) {
    if (!comment.text) continue;

    for (const { pattern, topic, severity } of sensitivePatterns) {
      if (pattern.test(comment.text)) {
        const sig = createSignature(["sensitive_topic", topic, comment.id]);
        results.push({
          observation: {
            business_id: "",
            observation_type: "sensitive_topic",
            severity,
            title: `Sensitive topic detected: ${topic.replace(/_/g, " ")}`,
            summary: `A customer interaction mentions ${topic.replace(/_/g, " ")}. This may require human review.`,
            evidence: { comment_text: comment.text, topic },
            source_ids: [comment.id],
            confidence: 0.8,
            status: "new",
            signature: sig,
          },
          recommendation: {
            business_id: "",
            observation_id: null,
            title: `Review ${topic.replace(/_/g, " ")} interaction`,
            description: `A customer has mentioned ${topic.replace(/_/g, " ")}. Review this interaction and respond appropriately.`,
            action_type: "review_lead",
            priority: severity,
            confidence: 0.8,
            reason: `Customer interaction involves ${topic.replace(/_/g, " ")}.`,
            status: "new",
          },
        });
        break;
      }
    }
  }

  return results;
}

function detectPostingGaps(
  posts: Array<{ published_at: string | null }>,
  businessId: string
): Observation | null {
  const gapDays = detectPostingGap(posts);
  if (!gapDays) return null;

  const sig = createSignature(["posting_gap", businessId]);

  return {
    business_id: businessId,
    observation_type: "posting_gap",
    severity: "medium",
    title: `No posts in ${Math.round(gapDays)} days`,
    summary: `Your last post was ${Math.round(gapDays)} days ago. Consistent posting helps maintain audience engagement.`,
    evidence: { days_since_last_post: gapDays },
    source_ids: [],
    confidence: 0.95,
    status: "new",
    signature: sig,
    expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
  };
}

function detectFaqGaps(
  customerQuestions: Array<{ question: string; count: number }>,
  brainFaqs: Array<{ question: string }>,
  businessId: string
): Array<{ observation: Observation; recommendation: Recommendation }> {
  const results: Array<{ observation: Observation; recommendation: Recommendation }> = [];

  const faqKeywords = brainFaqs.map((f) => f.question.toLowerCase());

  for (const { question, count } of customerQuestions) {
    const isCovered = faqKeywords.some((fq) => fq.includes(question) || question.includes(fq.split(" ")[0]));
    if (!isCovered && count >= QUESTION_TREND_THRESHOLD) {
      const sig = createSignature(["faq_gap", question, businessId]);
      results.push({
        observation: {
          business_id: businessId,
          observation_type: "faq_gap",
          severity: "medium",
          title: `FAQ gap: ${question.replace(/_/g, " ")}`,
          summary: `Customers frequently ask about ${question.replace(/_/g, " ")} (${count} times), but this is not covered in your Business Brain FAQs.`,
          evidence: { question_pattern: question, count },
          source_ids: [],
          confidence: 0.75,
          status: "new",
          signature: sig,
        },
        recommendation: {
          business_id: businessId,
          observation_id: null,
          title: `Add ${question.replace(/_/g, " ")} to FAQs`,
          description: `Create an approved answer for "${question.replace(/_/g, " ")}" questions to help your AI manager respond consistently.`,
          action_type: "create_content",
          priority: "medium",
          confidence: 0.75,
          reason: `${count} customers asked about ${question.replace(/_/g, " ")} recently.`,
          status: "new",
        },
      });
    }
  }

  return results;
}

export async function runSocialScan(businessId: string, scanType: "manual" | "scheduled" = "manual"): Promise<ScanResult> {
  const supabase = await createClient();

  const { data: job, error: jobErr } = await supabase
    .from("social_scan_jobs")
    .insert({
      business_id: businessId,
      scan_type: scanType,
      status: "processing",
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (jobErr || !job) throw new Error(`Failed to create scan job: ${jobErr?.message}`);

  const jobId = job.id;

  try {
    const [brain, socialData, historicalData] = await Promise.all([
      getBusinessBrain(businessId),
      getSocialData(businessId, 7),
      getHistoricalData(businessId, 30),
    ]);

    const allObservations: Observation[] = [];
    const allRecommendations: Recommendation[] = [];
    const allLeads: Lead[] = [];

    // 1. Posting gaps
    const gapObs = detectPostingGaps(socialData.posts, businessId);
    if (gapObs) allObservations.push(gapObs);

    // 2. Content mix analysis
    const contentAnalysis = await analyzeContentMix(socialData.posts, brain);
    allObservations.push(...contentAnalysis.observations);
    allRecommendations.push(...contentAnalysis.recommendations);

    // 3. Performance analysis
    const perfAnalysis = await analyzePerformance(socialData.posts, historicalData.posts, brain);
    allObservations.push(...perfAnalysis.observations);
    allRecommendations.push(...perfAnalysis.recommendations);

    // 4. Lead detection
    const leadSignals = detectLeadSignals(socialData.comments);
    for (const signal of leadSignals) {
      const sig = createSignature(["lead", signal.comment_id]);
      const existingLead = await supabase
        .from("social_leads")
        .select("id")
        .eq("business_id", businessId)
        .eq("platform_user_id", signal.comment_id)
        .single();

      if (!existingLead.data) {
        allLeads.push({
          business_id: businessId,
          social_account_id: signal.social_account_id,
          platform_user_id: signal.comment_id,
          name: signal.author_name,
          username: signal.author_name,
          source_type: "comment",
          source_reference: signal.comment_id,
          intent: signal.intent,
          reason: signal.reason,
          status: "new",
          confidence: signal.intent === "high" ? 0.8 : 0.6,
        });
      }
    }

    // 5. Complaint detection
    const complaints = detectComplaints(socialData.comments);
    for (const complaint of complaints) {
      const sig = createSignature(["complaint", complaint.comment_id]);
      const existing = await supabase
        .from("social_observations")
        .select("id")
        .eq("business_id", businessId)
        .eq("signature", sig)
        .single();

      if (!existing.data) {
        allObservations.push({
          business_id: businessId,
          social_account_id: complaint.social_account_id,
          observation_type: "complaint",
          severity: "high",
          title: "Potential customer complaint",
          summary: `A customer expressed dissatisfaction: "${complaint.text.slice(0, 150)}"`,
          evidence: { comment_text: complaint.text },
          source_ids: [complaint.comment_id],
          confidence: 0.8,
          status: "new",
          signature: sig,
        });

        allRecommendations.push({
          business_id: businessId,
          observation_id: null,
          title: "Review customer complaint",
          description: `A customer has expressed dissatisfaction. Review and respond appropriately.`,
          action_type: "respond_to_customer",
          priority: "high",
          confidence: 0.8,
          reason: "Customer complaint detected in social comments.",
          status: "new",
        });
      }
    }

    // 6. Spam detection
    const spamCount = detectSpam(socialData.comments);
    if (spamCount > 5) {
      const sig = createSignature(["spam_trend", businessId]);
      allObservations.push({
        business_id: businessId,
        observation_type: "spam",
        severity: "low",
        title: `${spamCount} spam comments detected`,
        summary: `We detected ${spamCount} potential spam comments. These are not hidden or deleted.`,
        evidence: { spam_count: spamCount },
        source_ids: [],
        confidence: 0.7,
        status: "new",
        signature: sig,
      });
    }

    // 7. Customer question trends
    const questionTrends = findRepeatedQuestions(socialData.comments);
    for (const trend of questionTrends) {
      const sig = createSignature(["customer_question", trend.question, businessId]);
      const existing = await supabase
        .from("social_observations")
        .select("id")
        .eq("business_id", businessId)
        .eq("signature", sig)
        .single();

      if (!existing.data) {
        allObservations.push({
          business_id: businessId,
          observation_type: "customer_question",
          severity: "medium",
          title: `Customer trend: ${trend.question.replace(/_/g, " ")} questions`,
          summary: `${trend.count} customers asked about ${trend.question.replace(/_/g, " ")} in the past week.`,
          evidence: { question_pattern: trend.question, count: trend.count },
          source_ids: [],
          confidence: 0.75,
          status: "new",
          signature: sig,
        });
      }
    }

    // 8. FAQ gaps
    const faqGaps = detectFaqGaps(questionTrends, brain.faqs, businessId);
    for (const gap of faqGaps) {
      const existing = await supabase
        .from("social_observations")
        .select("id")
        .eq("business_id", businessId)
        .eq("signature", gap.observation.signature)
        .single();

      if (!existing.data) {
        allObservations.push(gap.observation);
        allRecommendations.push(gap.recommendation);
      }
    }

    // 9. Sensitive topics
    const sensitiveResults = detectSensitiveTopics(socialData.comments);
    for (const result of sensitiveResults) {
      const existing = await supabase
        .from("social_observations")
        .select("id")
        .eq("business_id", businessId)
        .eq("signature", result.observation.signature)
        .single();

      if (!existing.data) {
        result.observation.business_id = businessId;
        result.recommendation.business_id = businessId;
        allObservations.push(result.observation);
        allRecommendations.push(result.recommendation);
      }
    }

    // Store observations
    for (const obs of allObservations) {
      await supabase.from("social_observations").upsert(
        {
          business_id: obs.business_id,
          social_account_id: obs.social_account_id || null,
          observation_type: obs.observation_type,
          severity: obs.severity,
          title: obs.title,
          summary: obs.summary,
          evidence: obs.evidence || {},
          source_ids: obs.source_ids || [],
          confidence: obs.confidence || 0.5,
          status: "new",
          signature: obs.signature || null,
          expires_at: obs.expires_at || null,
        },
        { onConflict: "business_id,signature", ignoreDuplicates: true }
      );
    }

    // Store recommendations
    for (const rec of allRecommendations) {
      await supabase.from("social_recommendations").insert({
        business_id: rec.business_id,
        observation_id: rec.observation_id || null,
        title: rec.title,
        description: rec.description,
        action_type: rec.action_type,
        priority: rec.priority,
        confidence: rec.confidence || 0.5,
        reason: rec.reason,
        status: "new",
      });
    }

    // Store leads
    for (const lead of allLeads) {
      await supabase.from("social_leads").upsert(
        {
          business_id: lead.business_id,
          social_account_id: lead.social_account_id,
          platform_user_id: lead.platform_user_id,
          name: lead.name || null,
          username: lead.username || null,
          source_type: lead.source_type,
          source_reference: lead.source_reference || null,
          intent: lead.intent,
          reason: lead.reason,
          status: "new",
          confidence: lead.confidence || 0.5,
        },
        { onConflict: "business_id,platform_user_id", ignoreDuplicates: true }
      );
    }

    // Generate summary
    const urgentObs = allObservations.filter((o) => o.severity === "urgent" || o.severity === "high");
    const { summary, nextMove } = await generateObservationSummary({
      observations: allObservations.slice(0, 10),
      businessName: brain.business?.name || "Your business",
    });

    // Send notifications for urgent items
    if (urgentObs.length > 0) {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        for (const obs of urgentObs.slice(0, 3)) {
          await createServerNotification({
            businessId,
            userId: userData.user.id,
            type: obs.observation_type === "complaint" ? "customer_complaint" : "ai_action_requires_approval",
            title: obs.title,
            message: obs.summary,
            severity: obs.severity === "urgent" ? "error" : "warning",
            metadata: { observation_type: obs.observation_type },
          });
        }
      }
    }

    // Update scan job
    await supabase
      .from("social_scan_jobs")
      .update({
        status: "completed",
        observations_created: allObservations.length,
        recommendations_created: allRecommendations.length,
        leads_created: allLeads.length,
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    await createServerAuditLog({
      businessId,
      action: "social_scan_completed" as any,
      entityType: "social_scan_job",
      entityId: jobId,
      metadata: {
        observations: allObservations.length,
        recommendations: allRecommendations.length,
        leads: allLeads.length,
      },
    });

    return {
      observations: allObservations,
      recommendations: allRecommendations,
      leads: allLeads,
      summary,
      nextMove,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";

    await supabase
      .from("social_scan_jobs")
      .update({
        status: "failed",
        error: msg,
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    throw error;
  }
}

export async function getSocialIntelligence(businessId: string) {
  const supabase = await createClient();

  const [obsRes, recsRes, leadsRes, scanJobsRes] = await Promise.all([
    supabase
      .from("social_observations")
      .select("*")
      .eq("business_id", businessId)
      .in("status", ["new", "reviewed"])
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("social_recommendations")
      .select("*")
      .eq("business_id", businessId)
      .in("status", ["new", "reviewed"])
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("social_leads")
      .select("*")
      .eq("business_id", businessId)
      .in("status", ["new", "reviewing"])
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("social_scan_jobs")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  return {
    observations: obsRes.data || [],
    recommendations: recsRes.data || [],
    leads: leadsRes.data || [],
    scanJobs: scanJobsRes.data || [],
  };
}

export async function updateObservationStatus(
  observationId: string,
  status: "reviewed" | "dismissed",
  businessId: string
) {
  const supabase = await createClient();
  await supabase
    .from("social_observations")
    .update({ status })
    .eq("id", observationId)
    .eq("business_id", businessId);
}

export async function updateRecommendationStatus(
  recommendationId: string,
  status: "reviewed" | "dismissed" | "accepted",
  businessId: string
) {
  const supabase = await createClient();
  await supabase
    .from("social_recommendations")
    .update({ status })
    .eq("id", recommendationId)
    .eq("business_id", businessId);
}

export async function updateLeadStatus(
  leadId: string,
  status: "reviewing" | "qualified" | "contacted" | "converted" | "ignored",
  businessId: string
) {
  const supabase = await createClient();
  await supabase
    .from("social_leads")
    .update({ status })
    .eq("id", leadId)
    .eq("business_id", businessId);
}
