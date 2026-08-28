"use server";

import { createClient } from "@/lib/supabase/server";
import { buildContentGenerationContext } from "@/lib/content/context-builder";
import { generateContentIdeas, generateContentBrief, generateContentDraft, reviewGeneratedContent } from "@/lib/content/generator";
import { validateContentClaims } from "@/lib/content/claim-validation";
import { checkContentSimilarity, getContentDiversity } from "@/lib/content/duplication";
import { createServerAuditLog } from "@/lib/audit-server";
import type { Platform, ContentObjective, ContentIdea, ContentBrief, ContentDraft } from "@/types/content";

export async function generateIdeas(params: {
  businessId: string;
  platform: Platform;
  objective: ContentObjective;
  pillar: string;
  count: number;
  personaId?: string;
  topic?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const context = await buildContentGenerationContext({
    businessId: params.businessId,
    platform: params.platform,
    objective: params.objective,
    pillar: params.pillar,
    topic: params.topic,
    personaId: params.personaId,
  });

  const ideas = await generateContentIdeas({ context, count: params.count });

  await createServerAuditLog({
    businessId: params.businessId,
    userId: user.id,
    action: "content_idea_generated" as any,
    entityType: "content_item",
    metadata: { platform: params.platform, pillar: params.pillar, count: ideas.length },
  });

  return { ideas, context };
}

export async function createContentFromIdea(params: {
  businessId: string;
  idea: ContentIdea;
  platform: Platform;
  personaId?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const context = await buildContentGenerationContext({
    businessId: params.businessId,
    platform: params.platform,
    objective: params.idea.objective,
    pillar: params.idea.pillar,
    topic: params.idea.topic,
    personaId: params.personaId,
  });

  const brief = await generateContentBrief({ context, idea: params.idea });

  const draft = await generateContentDraft({ context, brief });

  const claimValidation = validateContentClaims(draft, context.businessBrain);

  const review = await reviewGeneratedContent({ content: draft, context });

  const similarity = await checkContentSimilarity({
    businessId: params.businessId,
    topic: params.idea.topic,
    hook: draft.hook,
    pillar: params.idea.pillar,
  });

  const { data: contentItem, error: insertErr } = await supabase
    .from("content_items")
    .insert({
      business_id: params.businessId,
      platform: params.platform,
      type: params.idea.format,
      title: params.idea.title,
      topic: params.idea.topic,
      objective: params.idea.objective,
      pillar: params.idea.pillar,
      persona_name: params.idea.personaName || null,
      status: claimValidation.valid && review.approved ? "draft" : "review",
      caption: draft.caption,
      creative_brief: draft.creativeBrief || null,
      script: draft.script || null,
      hook: draft.hook,
      cta: draft.cta || null,
      hashtags: draft.hashtags || [],
      brain_version: context.brainVersion || null,
      strategy_version: context.strategyVersion || null,
      quality_score: review.score,
      quality_status: review.status,
      validation_result: claimValidation as any,
      review_result: review as any,
      metadata: {
        brief,
        idea: params.idea,
        similarity,
      },
    })
    .select("id")
    .single();

  if (insertErr) throw new Error(`Failed to create content: ${insertErr.message}`);

  // Create initial version
  await supabase.from("content_versions").insert({
    content_item_id: contentItem.id,
    version: 1,
    caption: draft.caption,
    creative_brief: draft.creativeBrief || null,
    script: draft.script || null,
    hook: draft.hook,
    cta: draft.cta || null,
    changes_summary: "Initial AI generation",
    created_by: "ai",
  });

  await createServerAuditLog({
    businessId: params.businessId,
    userId: user.id,
    action: "content_generated" as any,
    entityType: "content_item",
    entityId: contentItem.id,
    metadata: { platform: params.platform, pillar: params.idea.pillar, objective: params.idea.objective },
  });

  return {
    contentId: contentItem.id,
    draft,
    brief,
    review,
    claimValidation,
    similarity,
  };
}

export async function regenerateContent(params: {
  contentId: string;
  businessId: string;
  changeType: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: existing } = await supabase
    .from("content_items")
    .select("*")
    .eq("id", params.contentId)
    .single();

  if (!existing) throw new Error("Content not found");

  const context = await buildContentGenerationContext({
    businessId: params.businessId,
    platform: existing.platform as Platform,
    objective: existing.objective as ContentObjective,
    pillar: existing.pillar,
    topic: existing.topic,
  });

  const idea: ContentIdea = {
    title: existing.title,
    pillar: existing.pillar,
    personaName: existing.persona_name || undefined,
    objective: existing.objective as ContentObjective,
    format: existing.type as any,
    rationale: "",
    topic: existing.topic,
  };

  const brief = await generateContentBrief({ context, idea });
  const draft = await generateContentDraft({ context, brief });
  const review = await reviewGeneratedContent({ content: draft, context });
  const claimValidation = validateContentClaims(draft, context.businessBrain);

  const { data: latestVersion } = await supabase
    .from("content_versions")
    .select("version")
    .eq("content_item_id", params.contentId)
    .order("version", { ascending: false })
    .limit(1)
    .single();

  const nextVersion = (latestVersion?.version || 0) + 1;

  await supabase.from("content_versions").insert({
    content_item_id: params.contentId,
    version: nextVersion,
    caption: draft.caption,
    creative_brief: draft.creativeBrief || null,
    script: draft.script || null,
    hook: draft.hook,
    cta: draft.cta || null,
    changes_summary: `Regenerated: ${params.changeType}`,
    created_by: "ai",
  });

  await supabase
    .from("content_items")
    .update({
      caption: draft.caption,
      creative_brief: draft.creativeBrief || null,
      script: draft.script || null,
      hook: draft.hook,
      cta: draft.cta || null,
      hashtags: draft.hashtags || [],
      quality_score: review.score,
      quality_status: review.status,
      validation_result: claimValidation as any,
      review_result: review as any,
      status: claimValidation.valid && review.approved ? "draft" : "review",
    })
    .eq("id", params.contentId);

  await createServerAuditLog({
    businessId: params.businessId,
    userId: user.id,
    action: "content_regenerated" as any,
    entityType: "content_item",
    entityId: params.contentId,
    metadata: { changeType: params.changeType, version: nextVersion },
  });

  return { draft, review, claimValidation, version: nextVersion };
}

export async function approveContent(contentId: string, businessId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await supabase
    .from("content_items")
    .update({ status: "approved" })
    .eq("id", contentId)
    .eq("business_id", businessId);

  await createServerAuditLog({
    businessId,
    userId: user.id,
    action: "content_approved" as any,
    entityType: "content_item",
    entityId: contentId,
  });
}

export async function rejectContent(contentId: string, businessId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await supabase
    .from("content_items")
    .update({ status: "rejected" })
    .eq("id", contentId)
    .eq("business_id", businessId);

  await createServerAuditLog({
    businessId,
    userId: user.id,
    action: "content_rejected" as any,
    entityType: "content_item",
    entityId: contentId,
  });
}

export async function getContentItems(businessId: string, filters?: {
  status?: string;
  platform?: string;
  pillar?: string;
}) {
  const supabase = await createClient();

  let query = supabase
    .from("content_items")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.platform) query = query.eq("platform", filters.platform);
  if (filters?.pillar) query = query.eq("pillar", filters.pillar);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch content: ${error.message}`);
  return data || [];
}

export async function getContentItem(contentId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("content_items")
    .select("*")
    .eq("id", contentId)
    .single();

  if (error) throw new Error(`Failed to fetch content: ${error.message}`);
  return data;
}

export async function getContentVersions(contentId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("content_versions")
    .select("*")
    .eq("content_item_id", contentId)
    .order("version", { ascending: false });

  if (error) throw new Error(`Failed to fetch versions: ${error.message}`);
  return data || [];
}

export async function editContent(params: {
  contentId: string;
  businessId: string;
  caption?: string;
  hook?: string;
  cta?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const updates: Record<string, unknown> = {};
  if (params.caption !== undefined) updates.caption = params.caption;
  if (params.hook !== undefined) updates.hook = params.hook;
  if (params.cta !== undefined) updates.cta = params.cta;

  await supabase
    .from("content_items")
    .update(updates)
    .eq("id", params.contentId)
    .eq("business_id", params.businessId);

  const { data: latestVersion } = await supabase
    .from("content_versions")
    .select("version")
    .eq("content_item_id", params.contentId)
    .order("version", { ascending: false })
    .limit(1)
    .single();

  const nextVersion = (latestVersion?.version || 0) + 1;

  await supabase.from("content_versions").insert({
    content_item_id: params.contentId,
    version: nextVersion,
    caption: params.caption,
    hook: params.hook,
    cta: params.cta,
    changes_summary: "Owner edit",
    created_by: "owner",
  });

  await createServerAuditLog({
    businessId: params.businessId,
    userId: user.id,
    action: "content_edited" as any,
    entityType: "content_item",
    entityId: params.contentId,
    metadata: { version: nextVersion },
  });
}

export async function getDiversity(businessId: string) {
  return getContentDiversity(businessId);
}
