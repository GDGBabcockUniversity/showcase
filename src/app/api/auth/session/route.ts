import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth, upsertLocalUser } from "@/lib/auth";
import {
  ACCESS_COOKIE,
  AUTH_API_URL,
  REFRESH_COOKIE,
  clearAuthCookies,
  gdgFetch,
  setAuthCookies,
} from "@/lib/gdg-auth";

// Compare against the host the browser hit; nextUrl.origin can be the internal host behind Vercel's proxy.
const sameOrigin = (req: NextRequest) => {
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
};

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  return NextResponse.json(session);
}

// Trades a Firebase ID token for GDG platform tokens (httpOnly cookies).
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  if (!AUTH_API_URL) return NextResponse.json({ error: "Auth is not configured" }, { status: 503 });
  const body = await req.json().catch(() => null);
  const firebaseToken = body?.firebase_token;
  if (typeof firebaseToken !== "string" || !firebaseToken.trim())
    return NextResponse.json({ error: "Firebase token is required" }, { status: 400 });

  try {
    const res = await gdgFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ firebase_token: firebaseToken }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok)
      return NextResponse.json({ error: data.error || "Authentication failed" }, { status: res.status });
    const tokens = data?.tokens;
    if (typeof tokens?.access_token !== "string" || typeof data?.user?.id !== "string" || typeof data.user.email !== "string")
      return NextResponse.json({ error: "Unexpected auth response" }, { status: 502 });

    const local = await upsertLocalUser(data.user);
    setAuthCookies(await cookies(), tokens);
    return NextResponse.json({ user: local });
  } catch {
    return NextResponse.json({ error: "Authentication service unavailable" }, { status: 503 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const store = await cookies();
  const access = store.get(ACCESS_COOKIE)?.value;
  const refresh = store.get(REFRESH_COOKIE)?.value;
  clearAuthCookies(store);
  // Best effort: the local cookies are already gone either way.
  if (access && AUTH_API_URL)
    await gdgFetch("/auth/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${access}` },
      body: JSON.stringify({ refresh_token: refresh }),
    }).catch(() => {});
  return NextResponse.json({ ok: true });
}
