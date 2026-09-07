// Client-safe on purpose: the sign-up modal imports these, so nothing here may
// reach for the database. The lookups live in src/lib/username-db.ts.
export const USERNAME_MIN = 3;
export const USERNAME_MAX = 30;

// Handles live in URLs, so: lowercase, ascii, no runs of separators.
export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, USERNAME_MAX);
}
