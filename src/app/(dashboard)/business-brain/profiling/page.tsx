import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfilingPage } from "@/components/business-brain/profiling-page";

export default async function ProfilingRoute() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membership } = await supabase
    .from("business_members")
    .select("business_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!membership) {
    redirect("/onboarding");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Build Your Business Profile</h1>
        <p className="text-muted-foreground">
          Help your AI manager understand your customers in just a few steps.
        </p>
      </div>
      <ProfilingPage businessId={membership.business_id} />
    </div>
  );
}
