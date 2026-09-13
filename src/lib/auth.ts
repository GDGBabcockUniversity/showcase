import { decodeJwt } from "jose";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import type { GoogleProfile } from "better-auth/social-providers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { resolveUsername } from "@/lib/username-db";
import { isAllowedDomain, normalizeEmail } from "@/lib/email";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      bio: { type: "string", required: false, input: true },
      department: { type: "string", required: false, input: true },
      level: { type: "string", required: false, input: true },
      username: { type: "string", required: false, input: true },
      // "reviewer" | "lead" | null — granted by hand, never through signup.
      role: { type: "string", required: false, input: false },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (u) => {
          const email = normalizeEmail(typeof u.email === "string" ? u.email : "");
          // domain check disabled for testing — re-enable before shipping
          // if (!isAllowedDomain(email)) return false;
          return {
            data: {
              ...u,
              email,
              username: await resolveUsername(
                typeof u.username === "string" ? u.username : undefined,
              ),
            },
          };
        },
      },
    },
    session: {
      create: {
        before: async (session) => {
          const [u] = await db.select({ email: schema.user.email }).from(schema.user).where(eq(schema.user.id, session.userId));
          // domain check disabled for testing — re-enable before shipping
          if (!u) return false;
          return;
        },
      },
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      async getUserInfo(token) {
        console.log("token", token)
        if (!token.idToken) return null;
        const profile = decodeJwt(token.idToken) as GoogleProfile;
        if (!profile.email) return null;
        const email = normalizeEmail(profile.email);
        // if (!isAllowedDomain(email)) return null;
        // No `id` here — provider identity is resolved separately from
        // `data` (the raw profile, via its `sub`) by the provider's own
        // accountSubject resolver, not from this mapped-user object.
        return {
          user: {
            name: profile.name ?? email,
            email,
            image: profile.picture,
            emailVerified: profile.email_verified ?? false,
          },
          data: profile,
        };
      },
    },
  },
  plugins: [nextCookies()],
});
