import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { Role } from "@/lib/role";

// Only the two gate-able roles — USER is everyone's default, never something
// a route requires.
export async function requireRole(role: Extract<Role, "REVIEWER" | "ADMIN">) {
  const session = await auth.api.getSession({ headers: await headers() });
  const sessionRole = session?.user.role;
  const allowed = role === "REVIEWER" ? sessionRole === "REVIEWER" || sessionRole === "ADMIN" : sessionRole === "ADMIN";
  if (!session || !allowed) redirect("/");
  return session;
}
