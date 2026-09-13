import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { abuseFlag, interactionLog } from "@/db/schema";

const DAILY_THRESHOLD = 30;

export type AbuseScanRow = { projectId: string; ip: string; day: string; count: number };

export async function scanForAbuse(): Promise<AbuseScanRow[]> {
  const result = await db.execute<{ project_id: string; ip: string; day: string; n: string }>(sql`
    SELECT project_id, ip, to_char(created_at, 'YYYY-MM-DD') AS day, count(*) AS n
    FROM ${interactionLog}
    GROUP BY project_id, ip, day
    HAVING count(*) > ${DAILY_THRESHOLD}
  `);
  return result.rows.map((r) => ({ projectId: r.project_id, ip: r.ip, day: r.day, count: Number(r.n) }));
}

export async function recordAbuseFlags(rows: AbuseScanRow[]): Promise<void> {
  for (const r of rows) {
    await db
      .insert(abuseFlag)
      .values({ id: randomUUID(), projectId: r.projectId, ip: r.ip, day: r.day, count: r.count })
      .onConflictDoUpdate({
        target: [abuseFlag.projectId, abuseFlag.ip, abuseFlag.day],
        set: { count: r.count },
      });
  }
}

export type HourlyBucket = { hour: string; count: number };

export async function hourlyInteractionHistogram(
  projectId: string,
  sinceDays = 7,
): Promise<HourlyBucket[]> {
  const result = await db.execute<{ hour: string; n: string }>(sql`
    SELECT date_trunc('hour', created_at) AS hour, count(*) AS n
    FROM interaction
    WHERE project_id = ${projectId} AND created_at >= now() - interval '1 day' * ${sinceDays}
    GROUP BY 1
    ORDER BY 1
  `);
  return result.rows.map((r) => ({ hour: r.hour, count: Number(r.n) }));
}
