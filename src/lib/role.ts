export const ROLES = ["USER", "REVIEWER", "ADMIN"] as const;

export type Role = (typeof ROLES)[number];
