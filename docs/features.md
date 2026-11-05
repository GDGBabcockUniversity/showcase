# Features

This document describes what GDG Babcock Showcase does today, feature by feature. It is written from the code as of `main` (`20c0ead`), not from a roadmap. Where the code and the intent diverge, the gap is called out under [Known gaps](#known-gaps).

For the people who use these features and what they need from them, see [user-stories.md](./user-stories.md).

---

## Contents

1. [Roles and access](#1-roles-and-access)
2. [Accounts and authentication](#2-accounts-and-authentication)
3. [Profiles](#3-profiles)
4. [The board (home)](#4-the-board-home)
5. [Project page](#5-project-page)
6. [Project submission](#6-project-submission)
7. [Editing and managing projects](#7-editing-and-managing-projects)
8. [Media uploads](#8-media-uploads)
9. [Community interactions](#9-community-interactions)
10. [Collaboration requests](#10-collaboration-requests)
11. [Search](#11-search)
12. [Archive](#12-archive)
13. [Monthly recognition ("This month")](#13-monthly-recognition-this-month)
14. [Signal scoring](#14-signal-scoring)
15. [Abuse detection](#15-abuse-detection)
16. [Review workspace](#16-review-workspace)
17. [Maker account and analytics](#17-maker-account-and-analytics)
18. [Theming and layout](#18-theming-and-layout)
19. [Reference: limits and vocabularies](#19-reference-limits-and-vocabularies)
20. [Known gaps](#known-gaps)

---

## 1. Roles and access

| Role | How it is assigned | Can do |
| --- | --- | --- |
| **Visitor** (signed out) | None | Browse the board, archive, search, profiles, project pages, and `/signal-model`. Views and clicks still count, keyed by a hashed IP and user agent. |
| **USER** | Default for every new account | Everything a visitor can, plus submit, edit, and delete their own projects; like, comment, bookmark; send and receive collaboration requests; manage their profile and see analytics. |
| **REVIEWER** | Set by hand in the database (`npm run db:studio`) | Everything a USER can, plus the `/review` workspace: change project status, review abuse flags, and dismiss collaboration-request reports. |
| **ADMIN** | Set by hand in the database | Everything a REVIEWER can, plus demoting a project out of the current month's top three. The code also calls this role the "Technical Lead". |

Access is enforced in three places:

- `src/proxy.ts` redirects signed-out requests for `/submit` and `/account` (and their subpages) to `/?authModal=1&redirect=<path>`, which opens the sign-in modal. It also refreshes an expired access token on every request (see [Accounts and authentication](#2-accounts-and-authentication)).
- `requireRole()` in `src/lib/require-role.ts` gates review pages and actions. ADMIN satisfies a REVIEWER check.
- Every server action re-checks the session and, where relevant, ownership. For example, the `where` clause on project updates includes the owner's id, so editing another person's project changes nothing.

There is no self-serve route to become a REVIEWER or ADMIN.

## 2. Accounts and authentication

Accounts are GDG Babcock accounts, issued by the shared GDG auth service (`gdg/auth-v2`), the same way RADAR signs people in.

- **Flow:** the browser signs in with Firebase (`src/lib/firebase-auth.ts`), then `POST /api/auth/session` trades the Firebase ID token for GDG access and refresh tokens at the auth service's `/auth/login`. Both tokens are kept in httpOnly cookies (`gdg_token`, `gdg_refresh_token`), and Firebase's own session is signed out straight away.
- **Methods:** email and password, and Google (Firebase popup). Both need the `NEXT_PUBLIC_FIREBASE_*` config and `AUTH_API_URL`.
- **Session checks:** `auth.api.getSession` (`src/lib/auth.ts`) validates the access token against `/auth/me`, once per request. The access token lasts about 15 minutes; when it lapses, `src/proxy.ts` swaps the refresh token at `/auth/refresh` before the page renders. An invalid refresh token is cleared.
- **Sign-out:** `DELETE /api/auth/session` clears both cookies and revokes the refresh token at `/auth/logout`.
- **Local user row:** the auth service only proves identity. Showcase keeps its own `user` row for username, role, department, level, bio and avatar. On first sign-in the row is matched by (normalised) email, so accounts from before the switch keep their id, projects and role; brand-new users get the GDG user id.
- **Profile sync:** auth-v2 publishes a `user.upsert` event to QStash on each login. `POST /api/worker/auth-user` verifies the QStash signature (`QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY`) and updates that user's name and avatar. The newest edit wins, so a stale or retried event never undoes a later change made on `/account`.
- **Email normalisation:** emails are lowercased and plus-addressing is stripped (`a+1@x` becomes `a@x`), so one mailbox can't back several accounts.
- **Automatic username:** every new account gets a placeholder username (`member-xxxxxx`), with collisions resolved (`resolveUsername`). It can be changed on `/account`.
- **Sign-up fields:** full name, email and password (at least 12 characters). Department and level are set later on `/account`.
- **Auth modal:** sign-in and sign-up open in a modal (`auth-modal.tsx`), laid out like RADAR's: Google first, then the email form. It opens from the nav or by redirect, and after sign-in the user returns to the `redirect` path.
- **Domain restriction (currently off):** `isAllowedDomain` in `src/lib/email.ts` limits accounts to `babcock.edu.ng`, but nothing calls it. See [Known gaps](#known-gaps).

## 3. Profiles

**Public profile:** `/u/[username]`

- Resolves by username, then falls back to the user id (for older accounts with no username).
- Shows the avatar (or a gradient initial), name, `@username`, department and level, bio, member-since date, and how many projects the person has on the board.
- Lists the person's **published** projects only.
- Includes a share link, and Open Graph and Twitter metadata that use the avatar.

**Editing:** the "Your details" section of `/account`

- Fields: name (2–80 characters), username (slugified, at least 3 characters, unique), bio (up to 200 characters), department, and level (validated against fixed lists).
- **Avatar upload:** PNG, JPEG, or WebP up to 2 MB, uploaded straight to object storage.
- Changes go through `auth.api.updateUser`, which writes the local `user` row, so the session reflects them straight away. Name and avatar can also be updated by the GDG profile sync; whichever edit is newer wins.

## 4. The board (home)

**Route:** `/` (`/feed` redirects here and keeps the query string)

- Shows published projects from the last **30 days**, grouped into **This week**, **Last week**, and **Earlier**. Grouping uses `publishedAt`, not `createdAt`.
- Projects are sorted by **signal score** within each group.
- A **Trending** rail shows the top five projects by signal.
- **Filters**, kept in the URL so they can be shared:
  - Category (`?type=`): Course Work, GDG Track, Personal
  - Department (`?dept=`): from the fixed list of departments
  - Topic (`?tag=`): from the topic vocabulary
- On mobile, categories collapse into a disclosure panel.
- Liked and bookmarked states are shown for the signed-in user.
- Shows a count of older projects that fall outside the window, with a pointer to the archive.

## 5. Project page

**Route:** `/project/[id]`

- Header: cover image (or a generated gradient), title, and the "Shipped by" makers (the owner plus contributors), each linking to their profile.
- Media slider for the cover plus up to four extra images or videos.
- Summary, category, department, topics, and the live or demo link. Following the link records a **click**.
- The project's rank out of all published projects.
- Like, bookmark, and share controls.
- **Comments:** threaded one level deep (replies to top-level comments only). Hidden comments and replies to them are not shown.
- **Collaboration panel:** if the project is open to collaboration, it shows the requested skills and a request form (see §10).
- **Related projects:** up to four, from the same department first.
- **View tracking:** a view is recorded after the response is sent (`after()`), so it never slows the page down.
- Open Graph and Twitter cards use the cover image.

## 6. Project submission

**Route:** `/submit` (requires sign-in)

A step-by-step checklist form (`submit-form.tsx`) with:

| Field | Rule |
| --- | --- |
| Title | 2–80 characters |
| Summary | 20–240 characters |
| Type | One of `coursework`, `gdg-track`, `personal` |
| Topics | Up to 3 from the topic vocabulary |
| Project URL | Optional; must be `http` or `https` |
| Cover image | Required to submit; PNG, JPEG, or WebP up to 4 MB |
| Extra media | Up to 4 images (4 MB each) or videos (MP4, WebM, or MOV, 32 MB each) |
| Collaborators | Up to 5 existing accounts, found with a name typeahead |

**Behaviour**

- **Save draft:** only a title is required. The draft is saved to the account, and the user is sent to the editor.
- **Submit:** runs full validation. The project is created with status `PENDING` and stays off the board until a reviewer publishes it. A receipt confirms the title, collaborators, and media count.
- **Safe retries:** each submission carries a client-generated UUID. If the server commits but the response is lost, a retry returns the original result instead of creating a duplicate.
- **Atomic writes:** the project, contributor, and topic rows are written in one transaction.
- **Recovery in the browser:** progress (text, selections, finished upload URLs, collaborators, and the current step) is saved in `localStorage`, separately for each account. A reload restores it. Files that are still uploading can't be restored, so saving waits for uploads to finish. Recovery data is cleared only after a confirmed submit or draft save.
- **Expired session:** the user is told to sign in again, and their progress is kept.
- **Department snapshot:** the submitter's department is copied onto the project at submit time, so ranking and filtering never need to join back to the user.
- **Collaborator lookup:** the typeahead requires sign-in, needs at least 2 characters, returns up to 8 matches, never returns emails, and excludes the current user.

## 7. Editing and managing projects

**Route:** `/project/[id]/edit` (owner only)

- Has the same fields as submission, plus **Open to collaboration** and **Requested skills** (comma-separated, up to 10).
- **Save draft** keeps the project as a draft and off the board. It clears the collaboration settings.
- **Save or resubmit** runs full validation, and the status changes as follows:
  - `CHANGES_REQUESTED` becomes `PENDING` (the project goes back to a reviewer).
  - `PUBLISHED` stays published. Editing a live project doesn't take it off the board.
  - Any other status is unchanged.
- Contributors and topics are replaced as a whole on each save.
- **Delete:** owner only. It removes the project and everything attached to it (interactions, bookmarks, scores, and so on), then redirects to `/account`.

**Project statuses**

| Status | Label | Public? |
| --- | --- | --- |
| `PENDING` | Awaiting review | No |
| `CHANGES_REQUESTED` | Changes requested | No |
| `PUBLISHED` | Published | Yes |
| `REJECTED` | Rejected | No |

Separately, the `draft` flag marks a project that has not yet been submitted. Drafts never appear in the review queue.

## 8. Media uploads

**Route:** `POST /api/uploads`. Files are stored in Neon Object Storage, which is S3-compatible.

- The client asks for presigned PUT URLs, and the browser uploads directly to storage. The app server never receives the file bytes, which keeps 32 MB videos clear of the server-action body limit.
- The route checks the session, the upload kind, the file count, the MIME type, and the size before it signs anything.

| Kind | Types | Max size | Max count |
| --- | --- | --- | --- |
| `avatar` | PNG, JPEG, WebP | 2 MB | 1 |
| `projectCover` | PNG, JPEG, WebP | 4 MB | 1 |
| `projectMedia` | Images and MP4, WebM, MOV | 4 MB for images, 32 MB for videos | 4 |

- Object keys are `<kind>/<userId>/<uuid>.<ext>`, so every file can be traced to its uploader.
- Presigned URLs expire after 15 minutes.
- Server actions accept only URLs on known storage hosts (`isUploadUrl`): Neon, plus the legacy UploadThing hosts for older rows.
- Videos are stored with a `#video` URL fragment, so the renderer knows to show a player instead of an image.

## 9. Community interactions

All signal-bearing writes go through `recordInteraction()` (`src/lib/interactions.ts`), so the anti-gaming rules live in one place.

| Interaction | Who can do it | Rules |
| --- | --- | --- |
| **View** | Anyone | Recorded when the project page renders. Deduplicated to one per person per project in a rolling 24 hours. |
| **Click** | Anyone | Recorded when someone follows the project's link. Same 24-hour dedupe. |
| **Like** | Signed in | A toggle. A unique index allows one like per user per project. |
| **Comment** | Signed in | 2–500 characters. Replies can only target visible top-level comments. |
| **Bookmark** | Signed in | A toggle. Doesn't affect signal; it appears under "Saved" on the account page. |

**Who counts as one person:** signed-in users are identified by their account. Visitors are identified by a SHA-256 hash of the app secret, their IP, and their user agent, so raw IPs never reach the `interaction` table.

**Self-promotion block:** a project's owner and contributors can't add views, clicks, likes, or comments to their own project. The check uses the account, not the IP, because campus networks put many unrelated people behind the same address.

**IP log:** raw IPs go only to `interaction_log`, which is used only for abuse detection (§15).

## 10. Collaboration requests

- An owner marks a published project as **Open to collaboration** and lists the skills they need.
- A signed-in user who isn't the owner can send a request with a message of 10–1,000 characters. They can have only one open request per project.
- The owner sees open requests in the **Maker inbox** on `/account`, with the sender, the project, and the message.
- The owner can **close** a request.
- Either the owner or the sender can **report** a request. Reports appear in the review workspace, where a reviewer can dismiss them.
- Search can filter for projects that are open to collaboration, or by a needed skill (§11).

## 11. Search

**Command palette:** press ⌘K or Ctrl+K anywhere, or click the nav search trigger.

- Uses `GET /api/search?q=` to fetch people and projects together in one request. Queries are capped at 80 characters.

**Search page:** `/search?q=&skill=&open=1`

- **People:** matched by name, with their department and number of projects.
- **Projects:** matched against the title, summary, maker name, and topics. Results are ranked by signal.
- **Needed skill:** filters to projects that are open to collaboration and request a matching skill.
- **Open to collaborators:** a checkbox that narrows the results to open projects.

## 12. Archive

**Route:** `/archive`

- By default, shows the **current month's** published projects, ranked by signal.
- `?month=&year=` picks any past month. The sidebar groups months by year, newest first.
- `?all=1` shows an infinite-scrolling list of everything published before this month, newest first, loaded with cursor-based server actions.
- Each month is a cohort keyed on the project's `publishedAt` date, the same bounds the scoring uses.

## 13. Monthly recognition ("This month")

**Route:** `/this-month`

- A podium for the current month's top three projects, with first place in the middle on desktop and first on mobile. It also shows the full ranking below, with confetti and a GDG-coloured backdrop.
- **Top three rules** (`getTopThreeProjects`):
  1. Only projects with a score in the current cohort month are eligible.
  2. Projects an admin has demoted for this cohort are excluded, and the next-highest moves up.
  3. Ties are broken by signal score, then by the count of first top-level comments, then by the earliest publish date.
- Past months' winners can still be found because scores freeze once a month ends (§14).

## 14. Signal scoring

Explained publicly at `/signal-model`. Implemented in `src/lib/signal-scores.ts`.

Ranking is driven only by community interaction weights. Reviewers make publish decisions but don't score projects, and there is no reviewer rubric.

| Interaction | Weight |
| --- | ---: |
| Click | 40% |
| Like | 25% |
| View | 20% |
| Comment | 15% |

- **Cohorts:** each calendar month is scored as its own cohort. A project belongs to the month it was published in, and only activity from publication to the end of that month counts.
- **Normalisation:** each metric is scaled as `v / (v + benchmark)`. The benchmark is the cohort's 90th percentile, or its median when the cohort has fewer than 10 projects. This gives diminishing returns without a hard cap.
- **Comments:** only a person's first eligible top-level comment on a project counts. Hidden comments don't count.
- **Exclusions:** activity from owners and contributors, and activity from IPs that a reviewer has confirmed as abusive on that day.
- **Materialisation:** scores are stored in `signal_score`, one row per project, and are never computed live. The nightly job updates only the current cohort, so past months stay frozen.
- **Schedule:** `GET /api/cron/signal-scores` runs daily at 12:00 UTC (`vercel.json`) and requires `Authorization: Bearer $CRON_SECRET`. It refreshes scores and then runs the abuse scan.
- **Recomputation:** when a reviewer marks an abuse flag, the scores for that project's cohort are recomputed immediately.

## 15. Abuse detection

- The nightly scan (`src/lib/abuse.ts`) flags any **project, IP, and day** combination with **more than 30 interactions**.
- Flags are upserted into `abuse_flag`, so a reviewer's decision survives the next night's scan.
- A flag never blocks anything automatically; it only prompts a human to look.
- On the review detail page, a reviewer marks each flag as **Abusive** or **Not abusive**. Confirming a flag excludes that IP's interactions for that day from scoring.
- The review page also shows an hourly histogram of interactions over the last 7 days to help spot spikes.

## 16. Review workspace

**Routes:** `/review` and `/review/[id]` (REVIEWER or ADMIN)

**Overview (`/review`)**

- Summary cards: awaiting review, changes requested, open reports.
- **Submissions queue:** non-draft projects with status `PENDING` or `CHANGES_REQUESTED`, oldest first.
- **Reports:** reported collaboration requests, with the reporter, project, and message, plus a dismiss action.
- **Rankings:** the current top three with their signal scores.

**Project review (`/review/[id]`)**

- Preview of the cover, summary, live link, and public project page.
- The submitter, department, and number of contributors.
- Engagement metrics: views, clicks, likes, top-level comments, and saves.
- An hourly activity histogram for the last 7 days.
- Abuse flags with Abusive and Not abusive actions.
- **Decision panel:** Publish project, Request changes, Return to queue, Reject submission. The first time a project is published, its `publishedAt` is set, and that decides its cohort month.
- **Demote from ranking** (ADMIN only): requires a reason of at least 5 characters. It is logged in `ranking_override` with the acting admin and the current cohort month, and the project is removed from this month's top three.

## 17. Maker account and analytics

**Account (`/account`)**

- A header with the avatar (which can be uploaded), name, email, department and level, member-since date, and counts of projects shipped, liked, and saved.
- The editable profile (§3).
- The **Maker inbox** for collaboration requests (§10).
- Tabs for the user's projects, split into **Drafts**, **In review** (not a draft and not published), and **Live**.
- Totals for views, clicks, likes, and comments across live projects.
- **Liked** and **Saved** project lists.

**Analytics (`/account/analytics`)**

- A table for each published project: views, demo clicks, likes, top-level comments, and saves.
- Time ranges: **All time**, **90 days**, **30 days** (`?range=`).
- Counts follow the same deduplication rules as scoring.

## 18. Theming and layout

- Light and dark themes with a toggle, stored for each visitor.
- Responsive layout down to phone width: a mobile menu, collapsible filters, and a single-column podium.
- Loading skeletons for every main route.
- Toast notifications (Sonner) for action feedback.
- GDG brand colours (blue, red, yellow, green) are used for accents and the podium.

## 19. Reference: limits and vocabularies

| Constant | Value | Source |
| --- | --- | --- |
| Title | 2–80 characters | `src/lib/limits.ts` |
| Summary | 20–240 characters | `src/lib/limits.ts` |
| Bio | ≤ 200 characters | `src/lib/limits.ts` |
| Username | 3–30 characters, slugified | `src/lib/username.ts` |
| Collaborators per project | 5 | `src/lib/limits.ts` |
| Extra media per project | 4 | `src/lib/limits.ts` |
| Topics per project | 3 | `src/lib/tags.ts` |
| Requested skills | 10 | `src/app/actions.ts` |
| Comment length | 2–500 characters | `src/app/actions.ts` |
| Collaboration message | 10–1,000 characters | `src/app/community-actions.ts` |
| Board window | 30 days | `src/lib/when.ts` |
| View and click dedupe window | 24 hours | `src/lib/interactions.ts` |
| Abuse threshold | > 30 interactions per project, IP, and day | `src/lib/abuse.ts` |
| Small-cohort threshold | < 10 projects uses the median | `src/lib/signal-scores.ts` |

**Project types:** Course Work, GDG Track, Personal.

**Topics:** AI, Productivity, Social, Education, Health, Fintech, Games, Design, Developer Tools, Sustainability.

**Levels:** 100–600.

**Departments:** the Babcock University departments listed in `src/lib/departments.ts`.

---

## Known gaps

These are places where the schema, README, or comments suggest a capability that the app doesn't fully deliver yet.

| Gap | Detail |
| --- | --- |
| **No UI to hide comments** | The `hidden_comment` table exists, and scoring and display both respect it. However, no action or button creates a hidden-comment row, so moderating a comment currently means a manual database insert. The README lists comment moderation as a reviewer feature. |
| **School email restriction disabled** | `isAllowedDomain` in `src/lib/email.ts` checks for `babcock.edu.ng`, but no sign-in path calls it. |
| **Email verification not enforced** | New accounts are stored with `emailVerified` set, and nothing is gated on it. |
| **Profile sync skips older accounts** | Accounts created before the switch to GDG auth keep their old id, while `user.upsert` events carry the GDG id, so their name and avatar don't sync. They still sign in normally. |
| **Unused auth tables** | The better-auth `session`, `account` and `verification` tables are still in the schema but are no longer used. |
| **No way to accept a collaboration request** | Owners can only close or report a request. Accepting doesn't add the sender as a contributor, so the owner has to add them by editing the project. |
| **No notifications** | Makers aren't notified about status changes, comments, or collaboration requests. They have to check `/account`. |
| **Roles granted by hand** | There is no admin UI to promote or demote users. |
| **Retired features still in the schema** | The `follow`, `showcase_collection`, and `showcase_collection_project` tables are kept for existing rows but aren't exposed in the app. |
| **No reasons attached to decisions** | Request changes and Reject don't record a reason for the maker. |
