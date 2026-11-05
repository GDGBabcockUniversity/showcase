// Cookie + fetch helpers for the GDG auth service. Kept free of db imports so
// the proxy can use them.

export const AUTH_API_URL = process.env.AUTH_API_URL ?? "";
export const ACCESS_COOKIE = process.env.AUTH_COOKIE_NAME ?? "gdg_token";
export const REFRESH_COOKIE = process.env.AUTH_REFRESH_COOKIE_NAME ?? "gdg_refresh_token";
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60;

type CookieSetter = {
  set(name: string, value: string, options: Record<string, unknown>): unknown;
  delete(name: string): unknown;
};

export type GdgUser = { id: string; email: string; full_name?: string; avatar_url?: string | null };
export type GdgTokens = { access_token: string; refresh_token?: string; expires_in?: number };

const cookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge,
});

export function setAuthCookies(store: CookieSetter, tokens: GdgTokens) {
  store.set(ACCESS_COOKIE, tokens.access_token, cookieOptions(Number(tokens.expires_in) || 15 * 60));
  if (tokens.refresh_token) store.set(REFRESH_COOKIE, tokens.refresh_token, cookieOptions(REFRESH_MAX_AGE));
}

export function clearAuthCookies(store: CookieSetter) {
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
}

export async function gdgFetch(path: string, init: RequestInit = {}) {
  return fetch(`${AUTH_API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
}
