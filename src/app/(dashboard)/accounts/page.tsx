import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AccountsPageClient } from "@/components/social/accounts-page-client";

export default async function AccountsPage() {
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

  const { data: accounts } = await supabase
    .from("social_accounts")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: true });

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name")
    .eq("id", businessId)
    .single();

  return (
    <AccountsPageClient
      businessId={businessId}
      businessName={business?.name || ""}
      initialAccounts={accounts || []}
    />
  );
}
