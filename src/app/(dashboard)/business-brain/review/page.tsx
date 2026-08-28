import { redirect } from "next/navigation";
import { requireAuthenticatedUser, requireBusinessMembership } from "@/lib/authorization";
import { ReviewPage } from "@/components/business-brain/review-page";

export default async function ReviewRoute() {
  const user = await requireAuthenticatedUser();
  const { business } = await requireBusinessMembership(user.id);

  return <ReviewPage businessId={business.id} />;
}
