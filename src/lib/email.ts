const ALLOWED_DOMAINS = ["babcock.edu.ng"];

// Strips Gmail-style plus-addressing (winner+1@domain -> winner@domain) and
// lowercases, so uniqueness is enforced on the normalized form rather than
// whatever variant a student happened to type — otherwise one mailbox could
// back multiple "verified" accounts.
export function normalizeEmail(raw: string): string {
  const trimmed = raw.trim().toLowerCase();
  const at = trimmed.indexOf("@");
  if (at === -1) return trimmed;
  const local = trimmed.slice(0, at).split("+")[0];
  const domain = trimmed.slice(at + 1);
  return `${local}@${domain}`;
}

export function isAllowedDomain(email: string): boolean {
  const domain = email.split("@")[1] ?? "";
  return ALLOWED_DOMAINS.includes(domain);
}
