# Feature Plan: Make Showcase Useful Between Launches

## Overview

Showcase already supports project submission and review, discovery by search and filters, profiles, comments, likes, bookmarks, and monthly rankings. The next features should give students a clear benefit for publishing work and a reason to return after browsing: help makers understand reach, help viewers keep up with people they care about, and help students find collaborators.

## Product Priorities

1. **Give makers useful reach data.** Show project views, demo-link clicks, likes, comments, and saves over time, with clear definitions and a shareable project/profile link.
2. **Create a return loop.** Let students follow makers or projects and receive a manageable digest when something new is published.
3. **Turn discovery into collaboration.** Let project owners mark that they want contributors and name the skills they need; make that searchable.
4. **Build campus moments.** Add curated weekly picks or a demo-day collection after the core discovery and return loops work.

These priorities are an inference from the app's current feature set and its campus project-showcase purpose. Public student portfolios and following are established patterns on platforms such as [Devpost](https://help.devpost.com/article/115-what-is-a-devpost-portfolio-and-how-do-i-use-it).

## Recommended Sequence

### Phase 1: Give project owners a reason to share

- Add a maker dashboard with per-project activity totals and simple time ranges.
- Add a lightweight share control that copies project and profile links.
- Keep score/rank separate from raw activity counts so owners can understand what each number means.

### Phase 2: Give viewers a reason to return

- Allow signed-in users to follow makers and projects.
- Add an activity feed for newly published projects from followed makers.
- Add an opt-in weekly email digest only after the in-app feed proves useful.

### Phase 3: Help students build together

- Let owners mark a project "Looking for collaborators" and list needed skills.
- Add matching filters to project and people search.
- Add a simple collaboration request with owner controls and spam/report handling.

### Phase 4: Create campus showcase moments

- Add a GDG/editor-curated collection or monthly demo-day page.
- Support student nominations and a transparent selection process.
- Avoid making another popularity-only contest; the app already has signal rankings and abuse monitoring.

## Task List

### Phase 1: Maker reach

- [x] Task 1: Add a project analytics view using existing interaction and bookmark data.
- [x] Task 2: Add share controls for project pages and public maker profiles.

### Checkpoint: Maker reach

- [x] Owners can understand project reach without exposing private user identities.
- [x] Share links work for signed-out visitors and include useful previews.

### Phase 2: Return loop

- [x] Task 3: Add follow/unfollow for makers and projects.
- [x] Task 4: Add a followed-project activity feed and notification preferences.
- [ ] Task 5: Add an opt-in weekly digest if follow/feed usage supports it. **Deferred:** no email delivery provider is configured.

### Checkpoint: Return loop

- [x] Following a maker creates a visible reason to revisit the app.
- [x] Users can mute or unfollow without contacting an administrator.

### Phase 3: Collaboration

- [x] Task 6: Add an open-to-collaboration state and requested skills to projects.
- [x] Task 7: Add search filters and a collaboration request flow.

### Phase 4: Campus curation

- [x] Task 8: Add curated showcases or demo-day collections.

### Checkpoint: Complete

- [ ] Measure repeat visits, project shares, follow activity, collaboration requests, and published submissions.
- [ ] Keep or expand features based on actual student use.

## Risks and Mitigations

| Risk                                                   | Impact | Mitigation                                                                                       |
| ------------------------------------------------------ | ------ | ------------------------------------------------------------------------------------------------ |
| Makers optimize for counts instead of quality          | Medium | Explain metrics, rate-limit/dedupe activity, and avoid making raw counts the only ranking input. |
| Notifications become noisy                             | High   | Start with an in-app feed, make email opt-in, and include frequency controls.                    |
| Collaboration requests attract spam                    | Medium | Require sign-in, let owners close requests, and reuse report/moderation tools.                   |
| Too many features launch before campus activity exists | High   | Release one useful loop at a time and track whether students return.                             |

## Open Questions

- Which group should the first release serve best: project makers, students looking for projects, or reviewers/recruiters?
- Is there an approved email sender for digests, or should notifications stay in-app initially?
- Should collaboration requests be open to all signed-in students or verified campus accounts only?

## Additional Work

- [x] Add one-level replies beneath project comments, keep them out of signal scores and top-level comment totals, and group them under their parent.
