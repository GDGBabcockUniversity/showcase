# Feature Plan Tasks

## Additional request: Nested comments

- [x] Add one-level replies to project comments.
- [x] Validate replies point to a visible top-level comment on the same project.
- [x] Keep replies grouped under their parent and hide replies to moderated comments.
- [x] Exclude replies from signal-score comments and the project page's top-level comment count.
- [x] Remove QR code controls; sharing continues to copy public links.

## Phase 1: Maker reach

### Task 1: Project analytics

**Description:** Give project owners a private view of views, demo-link clicks, likes, comments, and bookmarks for their projects. Reuse current interaction data and make metric definitions clear.

**Acceptance criteria:**

- [x] Only the owner and authorized reviewers can see per-project analytics.
- [x] Totals match the project's existing counters and bookmark data.
- [x] Owners can view all-time, 90-day, and 30-day activity totals.
- [x] The page has a useful empty state; loading is provided by the route transition.

**Verification:** Add focused query/authorization coverage and manually compare a seeded project's totals with its records.

**Dependencies:** None.

**Files likely touched:** project query functions, account/project pages, analytics components, tests.

**Estimated scope:** Medium.

### Task 2: Share project and profile pages

**Description:** Make it easy to copy a public link for project pages and profiles.

**Acceptance criteria:**

- [x] Project and profile pages expose a one-click copy-link action.
- [x] Shared project/profile links include title and description, plus an image preview when the page has an image.

**Verification:** Copy a page link and inspect a shared page preview.

**Dependencies:** None.

**Files likely touched:** project/profile pages, share component, metadata.

**Estimated scope:** Small to medium.

## Phase 2: Collaboration

### Task 6: Open-to-collaboration projects

**Description:** Let project owners advertise that they are looking for contributors and specify needed skills.

**Acceptance criteria:**

- [x] Owners can enable/disable the status and update requested skills.
- [x] Closed projects stop appearing in collaboration discovery.
- [x] Existing projects default to closed.

**Verification:** Add schema/action coverage and manually check owner and non-owner views.

**Dependencies:** None.

**Files likely touched:** schema/migration, project edit flow, project card/detail UI, tests.

**Estimated scope:** Medium.

### Task 7: Collaboration discovery and requests

**Description:** Help students find open projects by skill and contact owners with a moderated collaboration request.

**Acceptance criteria:**

- [x] Search can filter projects by requested skills and open status.
- [x] Requests are available only to signed-in users and can be closed by owners.
- [x] Project owners can report abusive requests.
- [x] Reviewers can review and dismiss reports; repeat open requests from the same sender/project are blocked.

**Verification:** Add visibility/authorization coverage and manually test owner response controls.

**Dependencies:** Task 6.

**Files likely touched:** request schema/actions, search queries, project UI, moderation UI, tests.

**Estimated scope:** Large; split schema/actions from discovery UI during implementation.
