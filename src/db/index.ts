import { drizzle } from "drizzle-orm/postgres-js";
import net from "node:net";
import postgres from "postgres";
import * as schema from "./schema";

// Neon's DNS returns unroutable IPv6 addresses plus IPv4 ones ~260-280ms away,
// and postgres.js connects with net.Socket#connect(port, host), so Node races
// them. The 250ms default per-attempt budget cancels the IPv4 handshakes
// mid-flight. Measured without this: 9 of 23 connections failed; with it, 0.
if (net.getDefaultAutoSelectFamilyAttemptTimeout() < 2000) {
  net.setDefaultAutoSelectFamilyAttemptTimeout(2000);
}

const client = postgres(process.env.DATABASE_URL!, {
  max: 10,
  idle_timeout: 30,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });

// drizzle's postgres-js driver replaces postgres.js' date serializers with
// identity functions, because its typed columns already hand over strings. A
// raw `sql` template has no column to map through, so an interpolated JS Date
// stays a Date and postgres.js then tries to write it to the socket as a
// string — "The \"string\" argument must be of type string... Received an
// instance of Date". node-postgres serialized Dates itself, so this only
// surfaced after the driver swap. Restore postgres.js' own behaviour for
// Dates and nothing else: drizzle's pre-stringified values pass straight
// through, so the typed path is untouched.
//
// Must run after drizzle(), which mutates these options when it constructs.
for (const oid of [1184, 1114, 1082]) {
  client.options.serializers[oid] = (value: unknown) =>
    value instanceof Date ? value.toISOString() : value;
}
