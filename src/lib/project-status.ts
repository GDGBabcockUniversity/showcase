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

// Decisions that send a project back to its maker must say why; the note is
// shown to the maker on /account.
export const NOTE_REQUIRED: readonly ProjectStatus[] = ["CHANGES_REQUESTED", "REJECTED"];
export const NOTE_MIN = 10;
export const NOTE_MAX = 1000;
