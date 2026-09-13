export const PROJECT_STATUSES = [
  "PENDING",
  "CHANGES_REQUESTED",
  "PUBLISHED",
  "REJECTED",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  PENDING: "Awaiting review",
  CHANGES_REQUESTED: "Changes requested",
  PUBLISHED: "Published",
  REJECTED: "Rejected",
};
