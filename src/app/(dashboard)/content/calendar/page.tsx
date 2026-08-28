import { requireAuthenticatedUser, requireBusinessMembership } from "@/lib/authorization";
import { CalendarPageClient } from "@/components/content/calendar-page-client";

export default async function CalendarPage() {
  const user = await requireAuthenticatedUser();
  const { business } = await requireBusinessMembership(user.id);

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return (
    <CalendarPageClient
      businessId={business.id}
      initialStartDate={startOfWeek.toISOString()}
      initialEndDate={endOfWeek.toISOString()}
      monthStart={startOfMonth.toISOString()}
      monthEnd={endOfMonth.toISOString()}
    />
  );
}
