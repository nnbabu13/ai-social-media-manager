import { createClient } from "@/lib/supabase/server";

export async function checkContentSimilarity(params: {
  businessId: string;
  topic: string;
  hook: string;
  pillar: string;
}): Promise<{ isDuplicate: boolean; similarItems: Array<{ id: string; title: string; topic: string }> }> {
  const supabase = await createClient();

  const { data: recentItems } = await supabase
    .from("content_items")
    .select("id, title, topic, hook, pillar")
    .eq("business_id", params.businessId)
    .in("status", ["draft", "review", "approved"])
    .order("created_at", { ascending: false })
    .limit(20);

  if (!recentItems || recentItems.length === 0) {
    return { isDuplicate: false, similarItems: [] };
  }

  const similarItems: Array<{ id: string; title: string; topic: string }> = [];
  const topicLower = params.topic.toLowerCase();
  const hookLower = params.hook.toLowerCase();

  for (const item of recentItems) {
    const itemTopicLower = item.topic?.toLowerCase() || "";
    const itemHookLower = item.hook?.toLowerCase() || "";
    const itemTitleLower = item.title?.toLowerCase() || "";

    let similarity = 0;

    if (itemTopicLower === topicLower) similarity += 0.5;
    else if (itemTopicLower.includes(topicLower) || topicLower.includes(itemTopicLower)) similarity += 0.3;

    if (itemHookLower === hookLower) similarity += 0.3;
    else if (itemHookLower.includes(hookLower) || hookLower.includes(itemHookLower)) similarity += 0.15;

    if (item.pillar === params.pillar) similarity += 0.1;

    if (itemTitleLower === params.topic.toLowerCase()) similarity += 0.1;

    if (similarity >= 0.6) {
      similarItems.push({
        id: item.id,
        title: item.title,
        topic: item.topic,
      });
    }
  }

  return {
    isDuplicate: similarItems.length > 0,
    similarItems,
  };
}

export async function getContentDiversity(businessId: string): Promise<{
  recentPillars: string[];
  recentObjectives: string[];
  recentFormats: string[];
  recentPlatforms: string[];
}> {
  const supabase = await createClient();

  const { data: recentItems } = await supabase
    .from("content_items")
    .select("pillar, objective, type, platform")
    .eq("business_id", businessId)
    .in("status", ["draft", "review", "approved"])
    .order("created_at", { ascending: false })
    .limit(10);

  if (!recentItems || recentItems.length === 0) {
    return { recentPillars: [], recentObjectives: [], recentFormats: [], recentPlatforms: [] };
  }

  return {
    recentPillars: Array.from(new Set(recentItems.map((i) => i.pillar).filter(Boolean))),
    recentObjectives: Array.from(new Set(recentItems.map((i) => i.objective).filter(Boolean))),
    recentFormats: Array.from(new Set(recentItems.map((i) => i.type).filter(Boolean))),
    recentPlatforms: Array.from(new Set(recentItems.map((i) => i.platform).filter(Boolean))),
  };
}
