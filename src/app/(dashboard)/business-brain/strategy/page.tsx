import { createClient } from "@/lib/supabase/server";
import { StrategyReview } from "@/components/business-brain/strategy-review";

export default async function StrategyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!business) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Social Strategy</h1>
        <p className="text-muted-foreground">
          Your AI&apos;s content strategy for social media.
        </p>
      </div>

      <StrategyReview businessId={business.id} />
    </div>
  );
}
