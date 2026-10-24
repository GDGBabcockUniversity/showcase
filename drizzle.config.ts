import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// drizzle-kit runs outside Next, so it never picks up .env.local by itself and
// DATABASE_URL would be undefined for db:push/migrate/studio. dotenv does not
// override variables that are already set, so on Vercel the platform's own
// DATABASE_URL still wins and these two calls are no-ops.
config({ path: ".env.local" });
config({ path: ".env" });

export default defineConfig({
  schema: "./src/db/schema.ts",
  // `out` is documented as defaulting to ./drizzle, but leaving it off makes
  // drizzle-kit's config validation fall through to its AWS Data API branch,
  // which reads the connection string as `secretArn` and fails with
  // "Please provide required params for AWS Data API driver".
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
