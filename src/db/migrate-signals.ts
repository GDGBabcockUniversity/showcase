import { sql } from "drizzle-orm";
import { db } from "./index";

async function main() {
  console.log("Backfilling project.status / publishedAt / department...");
  await db.execute(sql`
    UPDATE project
    SET
      status = CASE
        WHEN draft THEN 'PENDING'
        WHEN release_at <= now() THEN 'PUBLISHED'
        ELSE 'PENDING'
      END,
      published_at = CASE
        WHEN NOT draft AND release_at <= now() THEN release_at
      END
  `);
  await db.execute(sql`
    UPDATE project
    SET department = COALESCE(u.department, 'Unfiled')
    FROM "user" u
    WHERE u.id = project.user_id AND project.department IS NULL
  `);

  console.log("Backfilling project_contributor from project.collaborators...");
  await db.execute(sql`
    INSERT INTO project_contributor (id, project_id, user_id, created_at)
    SELECT gen_random_uuid()::text, p.id, c.collaborator_id, p.created_at
    FROM project p, jsonb_array_elements_text(p.collaborators) AS c(collaborator_id)
    WHERE c.collaborator_id <> p.user_id
    ON CONFLICT (project_id, user_id) DO NOTHING
  `);

  console.log("Backfilling interaction from view/click/like/comment...");
  await db.execute(sql`
    INSERT INTO interaction (id, project_id, user_id, fingerprint, type, body, created_at)
    SELECT gen_random_uuid()::text, project_id, user_id, actor_key, 'view', NULL, created_at FROM view
    UNION ALL
    SELECT gen_random_uuid()::text, project_id, user_id, actor_key, 'click', NULL, created_at FROM click
    UNION ALL
    SELECT gen_random_uuid()::text, project_id, user_id, 'user:' || user_id, 'like', NULL, created_at FROM "like"
    UNION ALL
    SELECT gen_random_uuid()::text, project_id, user_id, 'user:' || user_id, 'comment', body, created_at FROM comment
  `);

  console.log("Verifying row-count parity...");
  const checks = [
    { label: "view -> interaction(view)", old: sql`SELECT count(*) FROM view`, type: "view" },
    { label: "click -> interaction(click)", old: sql`SELECT count(*) FROM click`, type: "click" },
    { label: "like -> interaction(like)", old: sql`SELECT count(*) FROM "like"`, type: "like" },
    { label: "comment -> interaction(comment)", old: sql`SELECT count(*) FROM comment`, type: "comment" },
  ];
  let mismatch = false;
  for (const c of checks) {
    const [{ count: oldCount }] = (await db.execute<{ count: string }>(c.old)).rows;
    const [{ count: newCount }] = (
      await db.execute<{ count: string }>(sql`SELECT count(*) FROM interaction WHERE type = ${c.type}`)
    ).rows;
    const ok = oldCount === newCount;
    if (!ok) mismatch = true;
    console.log(`  ${ok ? "OK" : "MISMATCH"}  ${c.label}: ${oldCount} -> ${newCount}`);
  }

  if (mismatch) {
    console.error("Row counts don't match — do NOT run 0002_signal_scoring_cleanup.sql yet.");
    process.exitCode = 1;
    return;
  }
  console.log("All counts match. Safe to apply drizzle/0002_signal_scoring_cleanup.sql.");
}

main().then(() => process.exit(process.exitCode ?? 0));
