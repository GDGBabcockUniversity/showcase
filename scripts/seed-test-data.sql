-- Throwaway test-data seed: 100 users (realistic names), 40 published
-- projects (realistic names, published_at spread across 2024-01-01 through
-- today so cohort months actually vary), and 500 interactions (250 views /
-- 150 clicks / 70 likes / 30 comments) spread across the new projects, each
-- kept within its own project's [published_at, end of that month) window so
-- a historical nightly run (see the note at the bottom) would actually
-- count them.
--
-- Not part of the app — run manually against a dev database, never in
-- production. Must run as ONE session (temp tables are session-scoped):
-- psql -f, or a single pg client connection, not a connection-pooled runner
-- that might hand different statements to different physical connections.
--
-- Random picks are done via array-indexing on a plain per-row `random()`
-- expression computed in a real multi-row SELECT (generate_series), never
-- inside a scalar subquery like `(SELECT x FROM t ORDER BY random() LIMIT 1)`
-- — an uncorrelated scalar subquery gets planned as an InitPlan (evaluated
-- ONCE and reused for every output row, regardless of containing random()),
-- which silently collapses "random per row" into "one random value for the
-- whole batch." Verified empirically before writing this version.

BEGIN;

-- 1) 100 users with realistic names — 10 first names x 10 last names,
-- deterministically paired so every combination is unique (no randomness
-- needed for uniqueness here).
CREATE TEMP TABLE seed_names AS
SELECT
  i,
  (ARRAY['Amara','Tobi','Chioma','Femi','Ngozi','Kunle','Ifeoma','Segun','Adaeze','Emeka'])[1 + ((i - 1) % 10)] AS first_name,
  (ARRAY['Okafor','Adeyemi','Okonkwo','Balogun','Nwosu','Afolabi','Eze','Abiodun','Chukwu','Ogunleye'])[1 + ((i - 1) / 10)] AS last_name
FROM generate_series(1, 100) AS i;

CREATE TEMP TABLE seed_users AS
WITH inserted AS (
  INSERT INTO "user" (id, name, email, email_verified, username, department, level, created_at, updated_at)
  SELECT
    gen_random_uuid()::text,
    first_name || ' ' || last_name,
    lower(first_name) || '.' || lower(last_name) || i || '@babcock.edu.ng',
    true,
    lower(first_name) || lower(last_name) || i,
    (ARRAY['Computer Science','Software Engineering','Mass Communication','Economics','Public Health','Architecture'])[1 + floor(random() * 6)::int],
    (ARRAY['100','200','300','400','500','600'])[1 + floor(random() * 6)::int],
    now() - (random() * interval '90 days'),
    now()
  FROM seed_names
  RETURNING id
)
SELECT id FROM inserted;

CREATE TEMP TABLE seed_user_arr AS SELECT array_agg(id) AS ids FROM seed_users;

-- 2) 40 projects with realistic product-style names, each owned by a random
-- seed user, published at a random point between 2024-01-01 and today —
-- spread across real calendar months/years rather than clustered in one.
CREATE TEMP TABLE seed_project_names AS
SELECT i, name FROM unnest(ARRAY[
  'CampusCart','StudyBuddy','EventHive','NoteNest','QuickQueue','MealMate','RideShare Campus',
  'LostAndFound','ClassConnect','BudgetBuddy','HealthTrack','LibroLink','ParkEasy','TutorMatch',
  'SkillSwap','CampusPulse','GradeGuard','FitCircle','VoiceVote','TimetablePro','AlumniConnect',
  'ScholarStream','CampusMarket','StudyRoomFinder','PeerReviewHub','AttendanceAI','CafeteriaMenu',
  'DormMate','InternshipHub','ResearchRadar','ClubCentral','ExamPrep','CampusNews','SafeWalk',
  'BikeShare','LaundryAlert','PrintQueue','MentorMatch','CodeCollab','DesignJam'
]) WITH ORDINALITY AS t(name, i);

CREATE TEMP TABLE seed_projects AS
WITH idx AS (
  SELECT
    n.i,
    n.name,
    1 + floor(random() * array_length(a.ids, 1))::int AS u_idx,
    a.ids AS user_ids,
    -- Random instant between 2024-01-01 and now, never in the future.
    timestamp '2024-01-01' + (random() * (now() - timestamp '2024-01-01')) AS published_at
  FROM seed_project_names n, seed_user_arr a
),
inserted AS (
  INSERT INTO project (id, user_id, title, summary, type, url, cover, media, draft, department, status, published_at, created_at)
  SELECT
    gen_random_uuid()::text,
    user_ids[u_idx],
    name,
    'A student-built ' || lower(name) || ' project for the GDG Babcock board.',
    (ARRAY['coursework','gdg-track','personal'])[1 + floor(random() * 3)::int],
    'https://example.com/' || lower(replace(name, ' ', '-')),
    NULL,
    '[]'::jsonb,
    false,
    (ARRAY['Computer Science','Software Engineering','Mass Communication','Economics','Public Health','Architecture'])[1 + floor(random() * 6)::int],
    'PUBLISHED',
    published_at,
    published_at - (random() * interval '10 days')
  FROM idx
  RETURNING id, published_at
)
SELECT id, published_at FROM inserted;

CREATE TEMP TABLE seed_project_arr AS
SELECT array_agg(id) AS ids, array_agg(published_at) AS pubs FROM seed_projects;

-- Upper bound per interaction: end of the project's own publish month, or
-- now if that month hasn't ended yet — keeps every seeded interaction
-- inside the window a nightly run for that specific cohort would query.
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
  project_pubs[p_idx] + (
    random() * LEAST(
      now() - project_pubs[p_idx],
      (date_trunc('month', project_pubs[p_idx]) + interval '1 month') - project_pubs[p_idx]
    )
  )
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
  project_pubs[p_idx] + (
    random() * LEAST(
      now() - project_pubs[p_idx],
      (date_trunc('month', project_pubs[p_idx]) + interval '1 month') - project_pubs[p_idx]
    )
  )
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
  published_at + (
    random() * LEAST(
      now() - published_at,
      (date_trunc('month', published_at) + interval '1 month') - published_at
    )
  )
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
  project_pubs[p_idx] + (
    random() * LEAST(
      now() - project_pubs[p_idx],
      (date_trunc('month', project_pubs[p_idx]) + interval '1 month') - project_pubs[p_idx]
    )
  )
FROM idx;

DROP TABLE seed_user_arr;
DROP TABLE seed_project_arr;
DROP TABLE seed_users;
DROP TABLE seed_projects;
DROP TABLE seed_names;
DROP TABLE seed_project_names;

COMMIT;

-- Note: the nightly job (runNightlySignalScoring) only ever scores the
-- CURRENT calendar month's cohort when it runs — it has no "catch up on old
-- months" mode. Projects seeded here with a 2024/2025 published_at will
-- never get a signal_score from a normal nightly run. To backfill scores
-- for those historical cohorts, call runNightlySignalScoring(someDateInThatMonth)
-- once per distinct cohort month present in this seed data.
