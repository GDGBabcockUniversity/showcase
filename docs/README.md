# Documentation

Product documentation for GDG Babcock Showcase. For setup, environment variables, and deployment, see the [root README](../README.md).

| Document | What it covers |
| --- | --- |
| [features.md](./features.md) | What each feature does: behaviour, rules, routes, limits, and known gaps. |
| [user-stories.md](./user-stories.md) | Personas and user stories, grouped by epic, with acceptance criteria and status. |

## At a glance

GDG Babcock Showcase is a community board where Babcock students publish what they've built. The core loop:

1. A **maker** submits a project (cover, summary, link, media, collaborators).
2. A **reviewer** publishes it, requests changes, or rejects it.
3. The **community** views, clicks, likes, comments on, and bookmarks published projects.
4. A **nightly job** turns that activity into a weighted **signal score** for each monthly cohort and flags suspicious bursts.
5. The month's **top three** are recognised on `/this-month` and preserved in `/archive`.

## Keeping these docs current

- When a feature changes, update its section in `features.md` and the status of the matching story in `user-stories.md`.
- When a backlog story ships, change 📋 to ✅ and remove the matching row from **Known gaps**.
- Limits in `features.md` §19 should match `src/lib/limits.ts`, `src/lib/tags.ts`, and `src/lib/signal-scores.ts`.
