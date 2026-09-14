-- Adds more interactions (views/clicks/likes/comments) against whatever
-- PUBLISHED projects and users already exist in the database — decoupled
-- from scripts/seed-test-data.sql so you can top up interaction volume
-- without re-seeding users/projects each time. Safe to run repeatedly:
-- likes use ON CONFLICT DO NOTHING against the real unique index, and
-- views/clicks/comments have no such constraint so re-running just adds
-- more history, which is realistic.
--
-- Not part of the app — run manually against a dev database, never in
-- production. Must run as ONE session (temp tables are session-scoped):
-- psql -f, or a single pg client connection, not a connection-pooled runner
-- that might hand different statements to different physical connections.
--
-- Same anti-InitPlan technique as seed-test-data.sql: random picks are
-- array-indexed with a plain per-row `random()` expression inside a real
-- multi-row SELECT, never inside a scalar subquery like
-- `(SELECT x FROM t ORDER BY random() LIMIT 1)` — Postgres can plan an
-- uncorrelated scalar subquery as an InitPlan (evaluated once, reused for
-- every row) even when it contains random(), silently collapsing "random
-- per row" into one value for the whole batch. Verified empirically.

-- To change how much gets added per run, edit the generate_series() counts
-- below directly (250 views / 150 clicks / 70 likes / 30 comments) — plain
-- literals rather than psql \set variables, since this runs the same way
-- the rest of this session's scripts did: through a plain pg client, not
-- the real psql CLI (not installed in this environment).

BEGIN;

CREATE TEMP TABLE seed_user_arr AS SELECT array_agg(id) AS ids FROM "user";

CREATE TEMP TABLE seed_project_arr AS
SELECT array_agg(id) AS ids, array_agg(published_at) AS pubs
FROM project
WHERE status = 'PUBLISHED' AND published_at IS NOT NULL;

-- Views
WITH idx AS (
  SELECT
    1 + floor(random() * array_length(p.ids, 1))::int AS p_idx,
    1 + floor(random() * array_length(u.ids, 1))::int AS u_idx,
    p.ids AS project_ids, p.pubs AS project_pubs, u.ids AS user_ids
  FROM generate_series(1, 250), seed_project_arr p, seed_user_arr u
)
INSERT INTO interaction (id, project_id, user_id, fingerprint, type, body, created_at)
SELECT
  gen_random_uuid()::text,
  project_ids[p_idx],
  user_ids[u_idx],
  'user:' || user_ids[u_idx],
  'view',
  NULL,
  project_pubs[p_idx] + (
    random() * LEAST(
      now() - project_pubs[p_idx],
      (date_trunc('month', project_pubs[p_idx]) + interval '1 month') - project_pubs[p_idx]
    )
  )
FROM idx;

-- Clicks
WITH idx AS (
  SELECT
    1 + floor(random() * array_length(p.ids, 1))::int AS p_idx,
    1 + floor(random() * array_length(u.ids, 1))::int AS u_idx,
    p.ids AS project_ids, p.pubs AS project_pubs, u.ids AS user_ids
  FROM generate_series(1, 150), seed_project_arr p, seed_user_arr u
)
INSERT INTO interaction (id, project_id, user_id, fingerprint, type, body, created_at)
SELECT
  gen_random_uuid()::text,
  project_ids[p_idx],
  user_ids[u_idx],
  'user:' || user_ids[u_idx],
  'click',
  NULL,
  project_pubs[p_idx] + (
    random() * LEAST(
      now() - project_pubs[p_idx],
      (date_trunc('month', project_pubs[p_idx]) + interval '1 month') - project_pubs[p_idx]
    )
  )
FROM idx;

-- Likes — must be distinct per (project, user); over-generate candidates,
-- dedupe within this run, then ON CONFLICT DO NOTHING against rows an
-- earlier run of this script (or the app itself) already created.
WITH idx AS (
  SELECT
    1 + floor(random() * array_length(p.ids, 1))::int AS p_idx,
    1 + floor(random() * array_length(u.ids, 1))::int AS u_idx,
    p.ids AS project_ids, p.pubs AS project_pubs, u.ids AS user_ids
  FROM generate_series(1, 420), seed_project_arr p, seed_user_arr u
),
resolved AS (
  SELECT project_ids[p_idx] AS project_id, user_ids[u_idx] AS user_id, project_pubs[p_idx] AS published_at
  FROM idx
),
deduped AS (
  SELECT DISTINCT ON (project_id, user_id) project_id, user_id, published_at
  FROM resolved
  ORDER BY project_id, user_id
  LIMIT 70
)
INSERT INTO interaction (id, project_id, user_id, fingerprint, type, body, created_at)
SELECT
  gen_random_uuid()::text,
  project_id,
  user_id,
  'user:' || user_id,
  'like',
  NULL,
  published_at + (
    random() * LEAST(
      now() - published_at,
      (date_trunc('month', published_at) + interval '1 month') - published_at
    )
  )
FROM deduped
ON CONFLICT DO NOTHING;

-- Comments — no uniqueness constraint, multiple per user allowed.
WITH idx AS (
  SELECT
    1 + floor(random() * array_length(p.ids, 1))::int AS p_idx,
    1 + floor(random() * array_length(u.ids, 1))::int AS u_idx,
    1 + floor(random() * 5)::int AS c_idx,
    p.ids AS project_ids, p.pubs AS project_pubs, u.ids AS user_ids
  FROM generate_series(1, 30), seed_project_arr p, seed_user_arr u
)
INSERT INTO interaction (id, project_id, user_id, fingerprint, type, body, created_at)
SELECT
  gen_random_uuid()::text,
  project_ids[p_idx],
  user_ids[u_idx],
  'user:' || user_ids[u_idx],
  'comment',
  (ARRAY['Really solid work!', 'This is good.', 'Nice execution on this.', 'Clean UI, good job.', 'Interesting approach.'])[c_idx],
  project_pubs[p_idx] + (
    random() * LEAST(
      now() - project_pubs[p_idx],
      (date_trunc('month', project_pubs[p_idx]) + interval '1 month') - project_pubs[p_idx]
    )
  )
FROM idx;

DROP TABLE seed_user_arr;
DROP TABLE seed_project_arr;

COMMIT;

-- Note: same as seed-test-data.sql — the nightly job only ever scores the
-- CURRENT calendar month's cohort. Interactions added here for projects
-- published in past months will sit unscored until a historical run
-- (runNightlySignalScoring(someDateInThatMonth)) is made for that cohort.
