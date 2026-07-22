export const DEPARTMENTS = [
  "Computer Science",
  "Software Engineering",
  "Mass Communication",
  "Economics",
  "Public Health",
  "Architecture",
] as const;

export const PROJECT_TYPES = ["coursework", "gdg-track", "personal"] as const;

export type ProjectType = (typeof PROJECT_TYPES)[number];

export const TYPE_LABEL: Record<ProjectType, string> = {
  "coursework": "Course Work",
  "gdg-track": "GDG Track",
  "personal": "Personal",
};
