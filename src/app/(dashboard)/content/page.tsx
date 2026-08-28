import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ContentPageClient } from "@/components/content/content-page-client";

export default async function ContentPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: memberships } = await supabase
    .from("business_members")
    .select("business_id")
    .eq("user_id", user.id);

  if (!memberships || memberships.length === 0) {
    redirect("/onboarding");
  }

  const businessId = memberships[0].business_id;

  const [contentRes, observationsRes, strategyRes] = await Promise.all([
    supabase
      .from("content_items")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("social_observations")
      .select("id, title, summary, observation_type, severity")
      .eq("business_id", businessId)
      .in("status", ["new", "reviewed"])
      .in("observation_type", ["customer_question", "content_opportunity", "strategy_drift", "engagement_spike", "faq_gap"])
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("social_strategies")
      .select("primary_objective, content_pillars, target_audiences")
      .eq("business_id", businessId)
      .eq("strategy_status", "active")
      .single(),
  ]);

  return (
    <ContentPageClient
      businessId={businessId}
      initialContent={contentRes.data || []}
      socialObservations={observationsRes.data || []}
      strategy={strategyRes.data}
    />
  );
}
