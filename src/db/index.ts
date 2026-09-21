import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import { Pool } from "pg"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  // Neon is a long way from some networks (TLS+SCRAM alone can take seconds);
  // 15s keeps connection setup reliable even on cold starts or slower links.
  connectionTimeoutMillis: 15000,
});

export const db = drizzle(pool, { schema });
