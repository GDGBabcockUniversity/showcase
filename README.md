# GDG Babcock Showcase

GDG Babcock Showcase is a community board for student-built projects. Students can create profiles, submit projects with images or videos, browse work by category, department, and topic, and support projects through views, clicks, likes, comments, and bookmarks.

Submissions are reviewed before they appear publicly. Published projects are ranked by a transparent **signal score**, calculated nightly from weighted community interactions. The top three projects for each month are preserved on the recognition page.

## What it includes

- Email/password and Google sign-in through Better Auth
- Public project board, search, filters, archive, profiles, and bookmarks
- Project submission with UploadThing-powered cover and media uploads
- Reviewer queue for approving projects, requesting changes, moderating comments, and handling suspicious activity
- Monthly ranking that weights views (20%), clicks (40%), likes (25%), and comments (15%)
- A nightly Vercel cron job that refreshes current-month scores and records abuse flags

## Tech stack

- Next.js 16, React 19, TypeScript, and Tailwind CSS 4
- PostgreSQL with Drizzle ORM and Drizzle Kit migrations
- Better Auth for authentication
- UploadThing for file uploads
- Vercel Cron for scheduled signal scoring

## Prerequisites

- Node.js 20.9 or later
- npm
- A PostgreSQL database
- An [UploadThing](https://uploadthing.com/) app and token for media uploads
- Optional: Google OAuth credentials for Google sign-in

## Local setup

1. Clone the repository and install dependencies.

   ```bash
   git clone https://github.com/GDGBabcockUniversity/showcase.git
   cd showcase
   npm install
   ```

2. Create your local environment file.

   ```bash
   cp .env.example .env.local
   ```

3. Populate `.env.local`.

   ```dotenv
   DATABASE_URL=postgresql://user:password@localhost:5432/showcase
   BETTER_AUTH_SECRET=replace-with-a-random-secret
   BETTER_AUTH_URL=http://localhost:3000
   GOOGLE_CLIENT_ID=
   GOOGLE_CLIENT_SECRET=
   UPLOADTHING_TOKEN=replace-with-your-uploadthing-v7-token
   CRON_SECRET=replace-with-a-random-secret
   ```

   Generate the two secrets with:

   ```bash
   openssl rand -base64 32
   ```

   If you enable Google sign-in, add `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI in Google Cloud Console. `UPLOADTHING_TOKEN` is required for avatar and project-media uploads.

4. Create the database schema from the committed migrations.

   ```bash
   npx drizzle-kit migrate
   ```

5. Start the development server.

   ```bash
   npm run dev
   ```

   Visit [http://localhost:3000](http://localhost:3000).

## Local roles and moderation

New accounts have the `USER` role. To review submissions locally, sign up once and use Drizzle Studio to change that user's `role` to `REVIEWER` or `ADMIN`:

```bash
npm run db:studio
```

The review queue is available at `/review` to reviewers and administrators. Only reviewed, published projects appear on the public board.

## Optional development data

The repository includes development-only PostgreSQL seed scripts. They create realistic users, projects, and interactions so the board and scoring model are easier to evaluate. Never run them against production.

```bash
psql "$DATABASE_URL" -f scripts/seed-test-data.sql
psql "$DATABASE_URL" -f scripts/seed-interactions.sql
```

The first script creates the base data; the second can be rerun to add more interactions. Run each command in a single database session, as the scripts use temporary tables.

## Available commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server. |
| `npm run build` | Create a production build. |
| `npm run start` | Apply migrations, then run the production server. |
| `npm run lint` | Run ESLint. |
| `npm run db:push` | Push the current Drizzle schema directly to a development database. |
| `npm run db:studio` | Open Drizzle Studio. |
| `npm run db:backfill` | Run the signal-score backfill utility. |

Use migrations (`npx drizzle-kit migrate`) for a shared or production database; `db:push` is most useful during local schema iteration.

## Signal scoring

Scores are refreshed nightly. Each month is scored as its own cohort, and activity counts from publication through the end of that calendar month. Counts are normalized within each month’s cohort, then weighted as follows:

| Interaction | Weight |
| --- | ---: |
| Click | 40% |
| Like | 25% |
| View | 20% |
| Comment | 15% |

Only the first eligible top-level comment from a person counts toward that project’s score, and hidden comments do not count. Signed-in owners and contributors cannot add signal to their own project; IP activity is excluded only after a reviewer confirms an abuse flag. Read `/signal-model` for the normalization details and tradeoffs.

## Deployment

The app is configured for Vercel. Add every variable from `.env.example` to the target Vercel environment, use a production `BETTER_AUTH_URL`, and add the corresponding production Google OAuth callback URL:

```text
https://your-domain.com/api/auth/callback/google
```

`vercel.json` schedules `GET /api/cron/signal-scores` daily at 12:00 UTC. Vercel invokes it with `Authorization: Bearer <CRON_SECRET>`; keep `CRON_SECRET` set and private in every deployed environment.

Before deploying, verify the application with:

```bash
npm run lint
npm run build
```
