import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { IntelligencePageClient } from "@/components/social-intelligence/intelligence-page-client";

export default async function IntelligencePage() {
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

  const [observationsRes, recommendationsRes, leadsRes, scanJobsRes, accountsRes] = await Promise.all([
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
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("social_scan_jobs")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("social_accounts")
      .select("id, platform, account_name, status")
      .eq("business_id", businessId)
      .in("status", ["active"]),
  ]);

  return (
    <IntelligencePageClient
      businessId={businessId}
      initialObservations={observationsRes.data || []}
      initialRecommendations={recommendationsRes.data || []}
      initialLeads={leadsRes.data || []}
      scanJobs={scanJobsRes.data || []}
      connectedAccounts={accountsRes.data || []}
    />
  );
}
