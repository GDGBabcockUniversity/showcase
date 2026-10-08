# Feature Plan: Make Showcase Useful Between Launches

## Overview

Showcase already supports project submission and review, discovery by search and filters, profiles, comments, likes, bookmarks, monthly rankings, and collaboration requests. The next features should give students a clear benefit for publishing work and help students find collaborators.

## Product Priorities

1. **Give makers useful reach data.** Show project views, demo-link clicks, likes, comments, and saves over time, with clear definitions and a shareable project/profile link.
2. **Turn discovery into collaboration.** Let project owners mark that they want contributors and name the skills they need; make that searchable.

These priorities are an inference from the app's current feature set and its campus project-showcase purpose.

## Recommended Sequence

### Phase 1: Give project owners a reason to share

- Add a maker dashboard with per-project activity totals and simple time ranges.
- Add a lightweight share control that copies project and profile links.
- Keep score/rank separate from raw activity counts so owners can understand what each number means.

### Phase 2: Help students build together

- Let owners mark a project "Looking for collaborators" and list needed skills.
- Add matching filters to project and people search.
- Add a simple collaboration request with owner controls and spam/report handling.

## Task List

### Phase 1: Maker reach

- [x] Task 1: Add a project analytics view using existing interaction and bookmark data.
- [x] Task 2: Add share controls for project pages and public maker profiles.

### Checkpoint: Maker reach

- [x] Owners can understand project reach without exposing private user identities.
- [x] Share links work for signed-out visitors and include useful previews.

### Phase 2: Collaboration

- [x] Task 6: Add an open-to-collaboration state and requested skills to projects.
- [x] Task 7: Add search filters and a collaboration request flow.

### Checkpoint: Complete

- [ ] Measure project shares, collaboration requests, and published submissions.
- [ ] Keep or expand features based on actual student use.

## Risks and Mitigations

| Risk                                                   | Impact | Mitigation                                                                                       |
| ------------------------------------------------------ | ------ | ------------------------------------------------------------------------------------------------ |
| Makers optimize for counts instead of quality          | Medium | Explain metrics, rate-limit/dedupe activity, and avoid making raw counts the only ranking input. |
| Collaboration requests attract spam                    | Medium | Require sign-in, let owners close requests, and reuse report/moderation tools.                   |
| Too many features launch before campus activity exists | High   | Release one useful loop at a time and track whether students return.                             |

## Open Questions

- Which group should the first release serve best: project makers, students looking for projects, or reviewers/recruiters?
- Should collaboration requests be open to all signed-in students or verified campus accounts only?

## Additional Work

- [x] Add one-level replies beneath project comments, keep them out of signal scores and top-level comment totals, and group them under their parent.
