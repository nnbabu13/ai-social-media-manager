import { requireAuthenticatedUser, requireBusinessMembership } from "@/lib/authorization";
import { AnalyticsClient } from "@/components/growth/analytics-client";

export default async function AnalyticsPage() {
  const user = await requireAuthenticatedUser();
  const { business } = await requireBusinessMembership(user.id);

  return <AnalyticsClient businessId={business.id} />;
}
