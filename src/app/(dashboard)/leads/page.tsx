import { requireAuthenticatedUser, requireBusinessMembership } from "@/lib/authorization";
import { LeadsPageClient } from "@/components/leads/leads-page-client";

export default async function LeadsPage() {
  const user = await requireAuthenticatedUser();
  const { business } = await requireBusinessMembership(user.id);

  return <LeadsPageClient businessId={business.id} />;
}
