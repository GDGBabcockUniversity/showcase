-- Throwaway test-data seed: 100 users, 40 published projects (this cohort
-- month), and 500 interactions (250 views / 150 clicks / 70 likes / 30
-- comments) spread across just the new projects. Not part of the app —
-- run manually against a dev database, never in production.
--
-- Must run as ONE session (temp tables are session-scoped): psql -f, or a
-- single pg client connection, not a connection-pooled runner that might
-- hand different statements to different physical connections.
--
-- Random picks are done via array-indexing on a plain per-row `random()`
-- expression in a real multi-row SELECT (generate_series), NOT via a scalar
-- subquery like `(SELECT x FROM t ORDER BY random() LIMIT 1)`. An
-- uncorrelated scalar subquery gets planned as an InitPlan — evaluated
-- ONCE and reused for every output row, regardless of containing random()
-- — which silently collapses "random per row" into "one random value for
-- the whole batch." Verified empirically before writing this version.

BEGIN;

-- 1) 100 seed users
CREATE TEMP TABLE seed_users AS
WITH inserted AS (
  INSERT INTO "user" (id, name, email, email_verified, username, department, level, created_at, updated_at)
  SELECT
    gen_random_uuid()::text,
    'Seed User ' || i,
    'seeduser' || i || '@babcock.edu.ng',
    true,
    'seeduser' || i,
    (ARRAY['Computer Science','Software Engineering','Mass Communication','Economics','Public Health','Architecture'])[1 + floor(random() * 6)::int],
    (ARRAY['100','200','300','400','500','600'])[1 + floor(random() * 6)::int],
    now() - (random() * interval '90 days'),
    now()
  FROM generate_series(1, 100) AS i
  RETURNING id
)
SELECT id FROM inserted;

CREATE TEMP TABLE seed_user_arr AS SELECT array_agg(id) AS ids FROM seed_users;

-- 2) 40 seed projects, each owned by a random seed user, published this month
CREATE TEMP TABLE seed_projects AS
WITH idx AS (
  SELECT
    i,
    1 + floor(random() * array_length(a.ids, 1))::int AS u_idx,
    a.ids AS user_ids
  FROM generate_series(1, 40) AS i, seed_user_arr a
),
inserted AS (
  INSERT INTO project (id, user_id, title, summary, type, tags, url, cover, media, draft, department, status, published_at, created_at)
  SELECT
    gen_random_uuid()::text,
    user_ids[u_idx],
    'Seed Project ' || i,
    'Auto-generated test project #' || i || ' for exercising the signal-scoring cohort math.',
    (ARRAY['coursework','gdg-track','personal'])[1 + floor(random() * 3)::int],
    '[]'::jsonb,
    'https://example.com/seed-project-' || i,
    NULL,
    '[]'::jsonb,
    false,
    (ARRAY['Computer Science','Software Engineering','Mass Communication','Economics','Public Health','Architecture'])[1 + floor(random() * 6)::int],
    'PUBLISHED',
    date_trunc('month', now()) + (random() * (now() - date_trunc('month', now()))),
    now() - (random() * interval '10 days')
  FROM idx
  RETURNING id, published_at
)
SELECT id, published_at FROM inserted;

CREATE TEMP TABLE seed_project_arr AS
SELECT array_agg(id) AS ids, array_agg(published_at) AS pubs FROM seed_projects;

-- 3) Views (250)
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
  project_pubs[p_idx] + (random() * GREATEST(now() - project_pubs[p_idx], interval '1 minute'))
FROM idx;

-- 4) Clicks (150)
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
  project_pubs[p_idx] + (random() * GREATEST(now() - project_pubs[p_idx], interval '1 minute'))
FROM idx;

-- 5) Likes (70) — must be distinct per (project, user); over-generate 400
--    candidates, dedupe, then take the first 70.
WITH idx AS (
  SELECT
    1 + floor(random() * array_length(p.ids, 1))::int AS p_idx,
    1 + floor(random() * array_length(u.ids, 1))::int AS u_idx,
    p.ids AS project_ids, p.pubs AS project_pubs, u.ids AS user_ids
  FROM generate_series(1, 400), seed_project_arr p, seed_user_arr u
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
  published_at + (random() * GREATEST(now() - published_at, interval '1 minute'))
FROM deduped;

-- 6) Comments (30) — no uniqueness constraint, multiple per user allowed.
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
  project_pubs[p_idx] + (random() * GREATEST(now() - project_pubs[p_idx], interval '1 minute'))
FROM idx;

DROP TABLE seed_user_arr;
DROP TABLE seed_project_arr;
DROP TABLE seed_users;
DROP TABLE seed_projects;

COMMIT;
