import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { AccountDetailClient } from "@/components/social/account-detail-client";

export default async function AccountDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: account } = await supabase
    .from("social_accounts")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!account) notFound();

  const { data: posts, count: postsCount } = await supabase
    .from("social_posts")
    .select("*", { count: "exact" })
    .eq("social_account_id", params.id)
    .order("published_at", { ascending: false })
    .limit(50);

  const { data: metrics } = await supabase
    .from("social_account_metrics")
    .select("*")
    .eq("social_account_id", params.id)
    .order("metric_date", { ascending: false })
    .limit(30);

  const { data: syncJobs } = await supabase
    .from("social_sync_jobs")
    .select("*")
    .eq("social_account_id", params.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const commentsData: Record<string, { data: any[]; total: number }> = {};
  if (posts && posts.length > 0) {
    for (const post of posts.slice(0, 5)) {
      const { data: comments, count } = await supabase
        .from("social_comments")
        .select("*", { count: "exact" })
        .eq("social_post_id", post.id)
        .order("created_at", { ascending: true })
        .limit(10);

      commentsData[post.id] = { data: comments || [], total: count || 0 };
    }
  }

  return (
    <AccountDetailClient
      account={account}
      initialPosts={posts || []}
      postsCount={postsCount || 0}
      initialMetrics={metrics || []}
      syncJobs={syncJobs || []}
      commentsData={commentsData}
    />
  );
}
