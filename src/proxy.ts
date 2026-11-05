import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE, gdgFetch, setAuthCookies, AUTH_API_URL } from "@/lib/gdg-auth";

const GATED = ["/submit", "/account"];

// The GDG access token lives ~15 minutes. When it has lapsed but the refresh
// token hasn't, swap it here so every page, action and route sees a session.
async function refreshTokens(request: NextRequest) {
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!refresh || !AUTH_API_URL) return null;
  try {
    const res = await gdgFetch("/auth/refresh", { method: "POST", body: JSON.stringify({ refresh_token: refresh }) });
    if (!res.ok) return res.status === 401 || res.status === 403 ? "invalid" : null;
    const tokens = (await res.json())?.tokens;
    return typeof tokens?.access_token === "string" ? tokens : "invalid";
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  let response: NextResponse | null = null;

  if (!request.cookies.has(ACCESS_COOKIE)) {
    const tokens = await refreshTokens(request);
    if (tokens === "invalid") {
      response = NextResponse.next();
      response.cookies.delete(REFRESH_COOKIE);
    } else if (tokens) {
      // Forward the new token to this request too, not just the next one.
      request.cookies.set(ACCESS_COOKIE, tokens.access_token);
      response = NextResponse.next({ request: { headers: request.headers } });
      setAuthCookies(response.cookies, tokens);
    }
  }

  const gated = GATED.some((p) => request.nextUrl.pathname === p || request.nextUrl.pathname.startsWith(`${p}/`));
  if (gated && !request.cookies.has(ACCESS_COOKIE)) {
    const url = new URL("/", request.url);
    url.searchParams.set("authModal", "1");
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return response ?? NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)"],
};
