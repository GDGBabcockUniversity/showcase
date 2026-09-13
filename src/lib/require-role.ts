import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export type Role = "reviewer" | "lead";

export async function requireRole(role: Role) {
  const session = await auth.api.getSession({ headers: await headers() });
  const sessionRole = session?.user.role;
  const allowed = role === "reviewer" ? sessionRole === "reviewer" || sessionRole === "lead" : sessionRole === "lead";
  if (!session || !allowed) redirect("/");
  return session;
}
