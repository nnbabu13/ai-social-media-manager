import { redirect } from "next/navigation";
import { requireAuthenticatedUser, requireBusinessMembership } from "@/lib/authorization";
import { getBusinessBrain } from "@/lib/business-brain";
import { BrainControlCenter } from "@/components/business-brain/brain-control-center";

export default async function BusinessBrainPage() {
  const user = await requireAuthenticatedUser();
  const { business } = await requireBusinessMembership(user.id);

  const brain = await getBusinessBrain(business.id);
  if (!brain) redirect("/onboarding");

  if (!brain.readiness) redirect("/onboarding");

  return (
    <BrainControlCenter
      brain={brain}
      readiness={brain.readiness}
    />
  );
}
