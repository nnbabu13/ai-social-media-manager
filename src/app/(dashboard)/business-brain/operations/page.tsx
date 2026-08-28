import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AISettingsPage } from "@/components/business-brain/ai-settings-page";

export default async function OperationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: businesses } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .limit(1);

  if (!businesses || businesses.length === 0) {
    redirect("/onboarding");
  }

  const businessId = businesses[0].id;

  const [operatingRulesRes, customRulesRes, escalationRulesRes, autonomyConfigRes] = await Promise.all([
    supabase.from("ai_operating_rules").select("*").eq("business_id", businessId),
    supabase.from("custom_ai_rules").select("*").eq("business_id", businessId),
    supabase.from("ai_escalation_rules").select("*").eq("business_id", businessId),
    supabase.from("autonomy_configs").select("*").eq("business_id", businessId).single(),
  ]);

  return (
    <AISettingsPage
      businessId={businessId}
      initialOperatingRules={operatingRulesRes.data || []}
      initialCustomRules={customRulesRes.data || []}
      initialEscalationRules={escalationRulesRes.data || []}
      initialAutonomyConfig={autonomyConfigRes.data || null}
    />
  );
}
