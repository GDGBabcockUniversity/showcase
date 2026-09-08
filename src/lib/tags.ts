// Topic vocabulary, distinct from `type` (how a project came about) and the
// maker's own department. Client-safe — the submit and edit forms import it.
export const TAGS = [
  "ai",
  "productivity",
  "social",
  "education",
  "health",
  "fintech",
  "games",
  "design",
  "dev-tools",
  "sustainability",
] as const;

export type Tag = (typeof TAGS)[number];

export const TAG_LABEL: Record<Tag, string> = {
  "ai": "AI",
  "productivity": "Productivity",
  "social": "Social",
  "education": "Education",
  "health": "Health",
  "fintech": "Fintech",
  "games": "Games",
  "design": "Design",
  "dev-tools": "Developer Tools",
  "sustainability": "Sustainability",
};

export const MAX_TAGS = 3;
