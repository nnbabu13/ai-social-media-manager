import { requireAuthenticatedUser, requireBusinessMembership } from "@/lib/authorization";
import { LeadDetailClient } from "@/components/leads/lead-detail-client";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuthenticatedUser();
  const { business } = await requireBusinessMembership(user.id);

  const resolvedParams = await params;
  return <LeadDetailClient businessId={business.id} leadId={resolvedParams.id} />;
}
