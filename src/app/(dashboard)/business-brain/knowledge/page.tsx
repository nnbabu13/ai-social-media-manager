import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAuthenticatedUser, requireBusinessMembership } from "@/lib/authorization";
import { getBusinessBrain } from "@/lib/business-brain";
import { KnowledgeSection } from "@/components/business-brain/knowledge-section";

export default async function KnowledgePage() {
  const user = await requireAuthenticatedUser();
  const { business } = await requireBusinessMembership(user.id);

  const brain = await getBusinessBrain(business.id);
  if (!brain) redirect("/onboarding");

  return <KnowledgeSection businessId={business.id} />;
}
