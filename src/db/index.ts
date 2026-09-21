import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import { Pool } from "pg"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  // Neon is a long way from some networks (TLS+SCRAM alone can take seconds);
  // 2s was too tight and made the first query fail on slow links.
  connectionTimeoutMillis: 15000,
});

export const db = drizzle(pool, { schema });
