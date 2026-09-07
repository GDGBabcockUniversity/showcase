import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { resolveUsername } from "@/lib/username-db";

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
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (u) => ({
          data: {
            ...u,
            username: await resolveUsername(
              typeof u.username === "string" ? u.username : undefined,
            ),
          },
        }),
      },
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  // must be last — patches server actions to forward Set-Cookie headers
  plugins: [nextCookies()],
});
