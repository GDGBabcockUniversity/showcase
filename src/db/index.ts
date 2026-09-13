import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import { Pool } from "pg"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  // Neon's pooler can take 2s+ to hand back a connection (cold start after
  // idle) — 2000ms was timing out on otherwise-healthy connections.
  connectionTimeoutMillis: 10000,
});

export const db = drizzle(pool, { schema });
