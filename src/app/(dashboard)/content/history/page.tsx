import { requireAuthenticatedUser, requireBusinessMembership } from "@/lib/authorization";
import { PublishingHistoryClient } from "@/components/content/publishing-history-client";

export default async function PublishingHistoryPage() {
  const user = await requireAuthenticatedUser();
  const { business } = await requireBusinessMembership(user.id);

  return <PublishingHistoryClient businessId={business.id} />;
}
