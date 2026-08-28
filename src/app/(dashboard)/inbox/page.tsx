import { requireAuthenticatedUser, requireBusinessMembership } from "@/lib/authorization";
import { InboxPageClient } from "@/components/community/inbox-page-client";

export default async function InboxPage() {
  const user = await requireAuthenticatedUser();
  const { business } = await requireBusinessMembership(user.id);

  return <InboxPageClient businessId={business.id} />;
}
