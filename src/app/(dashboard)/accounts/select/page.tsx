import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SelectAccountClient } from "@/components/social/select-account-client";

export default async function SelectAccountPage({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const businessId = searchParams.business_id;
  const provider = searchParams.provider;

  if (!businessId || !provider) {
    redirect("/accounts");
  }

  // This page is accessed after OAuth callback with multiple pages
  // The token should be passed via a temporary session or state
  // For now, redirect back to accounts if no token is available
  redirect("/accounts");
}
