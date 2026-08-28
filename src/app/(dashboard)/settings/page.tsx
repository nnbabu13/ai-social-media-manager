import { requireAuthenticatedUser } from "@/lib/authorization";
import { SettingsForm } from "@/components/settings/settings-form";

export default async function SettingsPage() {
  const user = await requireAuthenticatedUser();

  return <SettingsForm user={user} />;
}
