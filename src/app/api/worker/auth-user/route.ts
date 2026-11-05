import { and, eq, lte } from "drizzle-orm";
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { db } from "@/db";
import { user } from "@/db/schema";

function parse(body: unknown) {
  const u = (body as { type?: unknown; user?: Record<string, unknown> } | null)
    ?.user;
  if ((body as { type?: unknown })?.type !== "user.upsert" || !u) return null;
  const { id, full_name, profile_picture, updated_at } = u;
  const updatedAt = new Date(String(updated_at));
  if (typeof id !== "string" || !id) return null;
  if (
    typeof full_name !== "string" ||
    !full_name.trim() ||
    full_name.length > 255
  )
    return null;
  if (
    profile_picture != null &&
    (typeof profile_picture !== "string" || !URL.canParse(profile_picture))
  )
    return null;
  if (Number.isNaN(updatedAt.getTime())) return null;
  return {
    id,
    name: full_name.trim(),
    image: (profile_picture as string | null) ?? null,
    updatedAt,
  };
}

async function handleUserEvent(request: Request) {
  const event = parse(await request.json().catch(() => null));
  if (!event)
    return Response.json({ error: "Invalid user event" }, { status: 400 });

  await db
    .update(user)
    .set({ name: event.name, image: event.image, updatedAt: event.updatedAt })
    .where(and(eq(user.id, event.id), lte(user.updatedAt, event.updatedAt)));

  return Response.json({ ok: true });
}

export async function POST(request: Request) {
  const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;
  if (!currentSigningKey || !nextSigningKey)
    return Response.json({ error: "User events unavailable" }, { status: 503 });
  return verifySignatureAppRouter(handleUserEvent, {
    currentSigningKey,
    nextSigningKey,
  })(request);
}
