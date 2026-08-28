export type ContentStatus =
  | "idea" | "brief" | "draft" | "review" | "approved"
  | "scheduled" | "publishing" | "published" | "failed" | "cancelled" | "archived" | "rejected";

export type ScheduleStatus = "pending" | "confirmed" | "publishing" | "published" | "failed" | "cancelled" | "missed";
export type PublishJobStatus = "queued" | "processing" | "published" | "failed" | "cancelled";

const VALID_TRANSITIONS: Record<ContentStatus, ContentStatus[]> = {
  idea: ["brief", "archived"],
  brief: ["draft", "archived"],
  draft: ["review", "archived"],
  review: ["draft", "approved", "rejected"],
  approved: ["scheduled", "draft", "cancelled", "archived"],
  scheduled: ["publishing", "cancelled", "failed"],
  publishing: ["published", "failed"],
  published: ["archived"],
  failed: ["scheduled", "cancelled", "archived"],
  cancelled: ["archived"],
  archived: [],
  rejected: ["draft", "archived"],
};

export function canTransition(from: ContentStatus, to: ContentStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function getValidTransitions(status: ContentStatus): ContentStatus[] {
  return VALID_TRANSITIONS[status] || [];
}

export function transitionContent(
  currentStatus: ContentStatus,
  targetStatus: ContentStatus
): { valid: boolean; error?: string } {
  if (!canTransition(currentStatus, targetStatus)) {
    return {
      valid: false,
      error: `Cannot transition from "${currentStatus}" to "${targetStatus}". Valid transitions: ${VALID_TRANSITIONS[currentStatus]?.join(", ") || "none"}`,
    };
  }
  return { valid: true };
}
