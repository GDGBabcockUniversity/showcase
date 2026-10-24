// Run against a migrated, disposable local database:
// TEST_DATABASE_URL=postgresql://.../showcase_test bun tests/submission.test.mjs
import { strict as assert } from "node:assert";
import { randomUUID } from "node:crypto";
import { mock } from "bun:test";
import postgres from "postgres";

const connectionString = process.env.TEST_DATABASE_URL;
if (!connectionString)
  throw new Error(
    "TEST_DATABASE_URL must point to a disposable local test database.",
  );
const target = new URL(connectionString);
if (
  !["localhost", "127.0.0.1"].includes(target.hostname) ||
  !target.pathname.endsWith("_test")
) {
  throw new Error(
    "Refusing to run mutation tests outside a local *_test database.",
  );
}
process.env.DATABASE_URL = connectionString;
const client = postgres(connectionString, { max: 1 });
const owner = randomUUID();
const collaborator = randomUUID();
let sessionUserId = owner;
mock.module("next/headers", () => ({ headers: async () => new Headers() }));
mock.module("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: async () =>
        sessionUserId ? { user: { id: sessionUserId } } : null,
    },
  },
}));
const { submitProject } = await import("../src/app/submit/actions.ts");
const { db } = await import("../src/db/index.ts");
const { PROJECT_TYPES } = await import("../src/lib/departments.ts");
const initial = { ok: false };
function form(id = randomUUID()) {
  const data = new FormData();
  for (const [key, value] of Object.entries({
    submissionId: id,
    title: "Regression project",
    summary: "A full sentence describing the regression project.",
    type: PROJECT_TYPES[0],
    cover: "https://utfs.io/f/test-cover",
    tags: "ai",
    collaborators: collaborator,
  }))
    data.set(key, value);
  return data;
}
try {
  for (const [id, name] of [
    [owner, "Owner"],
    [collaborator, "Collaborator"],
  ]) {
    await client.unsafe(
      'INSERT INTO "user" (id, name, email) VALUES ($1, $2, $3)',
      [id, name, `${id}@example.com`],
    );
  }
  // Reproduce a write failure after the project row has been inserted.
  const failed = form();
  await client.unsafe(
    `CREATE FUNCTION submission_test_fail() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Injected tag write failure'; END $$`,
  );
  await client.unsafe(
    `CREATE TRIGGER submission_test_fail BEFORE INSERT ON project_tag FOR EACH ROW WHEN (NEW.project_id = '${failed.get("submissionId")}') EXECUTE FUNCTION submission_test_fail()`,
  );
  const result = await submitProject(initial, failed);
  assert.equal(result.ok, false);
  assert.match(result.message, /couldn’t confirm/);
  assert.equal(
    (
      await client.unsafe("SELECT id FROM project WHERE id=$1", [
        failed.get("submissionId"),
      ])
    ).length,
    0,
    "Related write failure must roll back the project",
  );
  await client.unsafe("DROP TRIGGER submission_test_fail ON project_tag");
  const recovered = await submitProject(initial, failed);
  assert.equal(recovered.ok, true);
  assert.deepEqual(recovered.receipt.collaborators, ["Collaborator"]);
  const retries = await Promise.all([
    submitProject(initial, failed),
    submitProject(initial, failed),
  ]);
  assert.deepEqual(retries, [recovered, recovered]);
  assert.equal(
    (
      await client.unsafe("SELECT id FROM project WHERE id=$1", [
        failed.get("submissionId"),
      ])
    ).length,
    1,
  );
  assert.equal(
    (
      await client.unsafe("SELECT id FROM project_tag WHERE project_id=$1", [
        failed.get("submissionId"),
      ])
    ).length,
    1,
  );
  sessionUserId = collaborator;
  assert.equal(
    (await submitProject(initial, failed)).ok,
    false,
    "Another user cannot claim this submission",
  );
  sessionUserId = owner;
  const draft = form();
  draft.set("intent", "draft");
  draft.delete("cover");
  draft.set("summary", "");
  draft.set("type", "");
  const saved = await submitProject(initial, draft);
  assert.equal(saved.draftId, draft.get("submissionId"));
  assert.deepEqual(await submitProject(initial, draft), saved);
  const invalid = form();
  invalid.set("cover", "https://example.com/not-an-upload");
  assert.ok((await submitProject(initial, invalid)).errors.cover);
  sessionUserId = null;
  assert.match(
    (await submitProject(initial, form())).message,
    /session expired/,
  );
  console.log(
    "PASS rollback, retry, concurrent retry, ownership, draft save, upload validation, and expired session",
  );
} finally {
  await client.unsafe(
    "DROP TRIGGER IF EXISTS submission_test_fail ON project_tag",
  );
  await client.unsafe("DROP FUNCTION IF EXISTS submission_test_fail()");
  await client.unsafe('DELETE FROM "user" WHERE id = ANY($1::text[])', [
    [owner, collaborator],
  ]);
  await client.end();
  await db.$client.end();
}
