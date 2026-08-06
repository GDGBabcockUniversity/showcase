import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

// Stable identity for whoever is interacting, so views and clicks count people
// rather than page loads. Signed-in visitors are keyed by account; everyone else
// falls back to their IP + user agent.
//
// ponytail: IP + UA is a coarse fingerprint — shared NATs collapse into one
// visitor and a new browser reads as a new one. Good enough for a campus board;
// swap in a signed visitor cookie if the numbers ever need to be defensible.
export async function actorKey(): Promise<{ key: string; userId: string | null }> {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });

  if (session) return { key: `user:${session.user.id}`, userId: session.user.id };

  const ip = h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "unknown";
  const ua = h.get("user-agent") ?? "unknown";
  // Hashed with the app secret so raw IPs never land in the database.
  const digest = createHash("sha256")
    .update(`${process.env.BETTER_AUTH_SECRET ?? ""}:${ip}:${ua}`)
    .digest("hex");

  return { key: `anon:${digest}`, userId: null };
}
