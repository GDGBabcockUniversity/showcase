// One-time backfill for the department/tag relational-table migration. Run
// after `drizzle/0003_department_tag_tables.sql` (creates department, tag,
// project_tag — additive only) and BEFORE `drizzle/0004_department_tag_constraints.sql`
// (adds the FK constraints and drops project.tags, which this script reads
// from).
//
//   bunx tsx src/db/migrate-departments-tags.ts
//
// Safe to re-run: every insert is ON CONFLICT DO NOTHING.
import { sql } from "drizzle-orm";
import { db } from "./index";
import { DEPARTMENTS } from "@/lib/departments";
import { TAGS, TAG_LABEL } from "@/lib/tags";

async function main() {
  console.log("Seeding department table...");
  for (const name of DEPARTMENTS) {
    await db.execute(sql`INSERT INTO department (id) VALUES (${name}) ON CONFLICT DO NOTHING`);
  }

  console.log("Seeding tag table...");
  for (const id of TAGS) {
    await db.execute(sql`INSERT INTO tag (id, name) VALUES (${id}, ${TAG_LABEL[id]}) ON CONFLICT DO NOTHING`);
  }

  console.log("Backfilling project_tag from project.tags...");
  await db.execute(sql`
    INSERT INTO project_tag (id, project_id, tag_id)
    SELECT gen_random_uuid()::text, p.id, t.tag_id
    FROM project p, jsonb_array_elements_text(p.tags) AS t(tag_id)
    ON CONFLICT DO NOTHING
  `);

  console.log("Verifying row-count parity...");
  const [{ n: jsonbCount }] = (
    await db.execute<{ n: string }>(sql`
      SELECT count(*) AS n FROM (SELECT jsonb_array_elements_text(tags) FROM project) x
    `)
  ).rows;
  const [{ n: joinCount }] = (await db.execute<{ n: string }>(sql`SELECT count(*) AS n FROM project_tag`)).rows;
  const ok = jsonbCount === joinCount;
  console.log(`  ${ok ? "OK" : "MISMATCH"}  project.tags elements: ${jsonbCount} -> project_tag rows: ${joinCount}`);

  if (!ok) {
    console.error("Row counts don't match — do NOT run 0004_department_tag_constraints.sql yet.");
    process.exitCode = 1;
    return;
  }
  console.log("All counts match. Safe to apply drizzle/0004_department_tag_constraints.sql.");
}

main().then(() => process.exit(process.exitCode ?? 0));
