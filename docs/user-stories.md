# User stories

User stories for GDG Babcock Showcase, grouped by epic. Each story has an ID, a status, and acceptance criteria that can be checked against the running app. [features.md](./features.md) has the full behaviour, limits, and routes behind each one.

**Status key**

- ✅ **Done:** shipped and behaving as described.
- 🟡 **Partial:** works, but part of the story is missing (see the notes on that story).
- 📋 **Backlog:** not built yet; usually comes from the [Known gaps](./features.md#known-gaps).

---

## Personas

| Persona | Who they are | What they care about |
| --- | --- | --- |
| **Visitor** | Anyone who isn't signed in: a prospective student, recruiter, lecturer, or classmate | Finding interesting work quickly, without making an account. |
| **Maker** | A Babcock student with an account who builds and submits projects | Getting work seen, credited, and recognised; finding collaborators. |
| **Community member** | A signed-in student who engages with other people's work | Supporting projects they like, saving them, and joining good ones. |
| **Contributor** | A student named as a collaborator on someone else's project | Being credited on the project and on their own profile. |
| **Reviewer** | A GDG organiser with the `REVIEWER` role | Keeping the board high quality and the rankings fair, quickly. |
| **Admin / Technical Lead** | A GDG lead with the `ADMIN` role | Having the final say on monthly recognition when rankings are gamed. |
| **System** | The nightly cron job | Keeping scores and abuse flags current without anyone stepping in. |

---

## Epic 1: Accounts and identity

### US-1.1 Sign up with email ✅
**As a** student, **I want to** create an account with my email and a password **so that** I can submit projects and take part.

- [ ] The sign-up form asks for full name, email, and password (at least 12 characters); department and level are set later on `/account`.
- [ ] The account is a GDG Babcock account, so the same login works on RADAR.
- [ ] Emails are lowercased and stripped of `+tags` before they're saved; a second account for the same mailbox is rejected.
- [ ] A unique username is generated automatically.
- [ ] After sign-up, I'm signed in and returned to the page I came from.

### US-1.2 Sign in with Google ✅
**As a** student, **I want to** sign in with my Google account **so that** I don't have to manage another password.

- [ ] "Continue with Google" is the first option in the auth modal.
- [ ] My name and email come from my GDG account, and later changes to my GDG name or avatar sync to Showcase.
- [ ] I'm returned to the page I was trying to reach.

### US-1.3 Prompted to sign in for protected pages ✅
**As a** visitor, **I want to** be asked to sign in when I open `/submit` or `/account` **so that** I can continue right where I meant to go.

- [ ] Visiting a protected route while signed out opens the auth modal on the home page.
- [ ] After I sign in, I land on the route I originally asked for.

### US-1.4 Restrict sign-up to Babcock emails 📋
**As a** GDG organiser, **I want** only `@babcock.edu.ng` addresses to be able to register **so that** the board stays a campus community.

- [ ] Email sign-up with another domain is rejected with a clear message.
- [ ] Google sign-in with another domain is rejected.
- [ ] Existing sessions for accounts outside the domain stop working.

> `isAllowedDomain` exists in `src/lib/email.ts` but nothing calls it.

### US-1.5 Verify my email 📋
**As an** organiser, **I want** new accounts to verify their email before submitting **so that** throwaway accounts can't flood the queue or inflate signal.

---

## Epic 2: Profiles

### US-2.1 Public profile ✅
**As a** visitor, **I want to** open a student's profile **so that** I can see who they are and everything they've shipped.

- [ ] `/u/<username>` shows the name, handle, avatar, department, level, bio, and member-since date.
- [ ] Only the person's published projects are listed, and the count matches the list.
- [ ] Older accounts without a username still resolve by id.
- [ ] Sharing the link shows a rich preview with the avatar.

### US-2.2 Edit my profile ✅
**As a** maker, **I want to** edit my name, username, bio, department, and level **so that** my profile represents me accurately.

- [ ] A username I type is slugified, must be at least 3 characters, and must not be taken by someone else.
- [ ] A bio over 200 characters is rejected.
- [ ] Department and level must come from the fixed lists.
- [ ] Changes show up immediately, including in the nav.

### US-2.3 Upload an avatar ✅
**As a** maker, **I want to** upload a profile photo **so that** people recognise me.

- [ ] PNG, JPEG, or WebP up to 2 MB is accepted; anything else is rejected with a reason.
- [ ] The new photo replaces the old one across the app.

---

## Epic 3: Discovering projects

### US-3.1 Browse the board ✅
**As a** visitor, **I want to** see what students have shipped recently, best first **so that** I can find the most interesting work without digging.

- [ ] The home page shows published projects from the last 30 days.
- [ ] Projects are grouped into This week, Last week, and Earlier by publish date.
- [ ] Within each group, projects are ordered by signal score.
- [ ] A trending rail shows the five highest-signal projects.

### US-3.2 Filter the board ✅
**As a** visitor, **I want to** filter by category, department, or topic **so that** I see only work relevant to me.

- [ ] Category, department, and topic filters can be combined.
- [ ] Filters are kept in the URL, so a filtered view can be bookmarked or shared.
- [ ] Invalid filter values are ignored rather than breaking the page.
- [ ] On mobile, categories collapse into a panel that shows how many filters are active.

### US-3.3 View a project ✅
**As a** visitor, **I want to** open a project and see its media, makers, and link **so that** I understand what it is and can try it.

- [ ] The page shows the cover, media slider (images and videos), title, summary, type, department, topics, and rank.
- [ ] Every maker (the owner and contributors) is listed and links to their profile.
- [ ] The project link opens the live demo or repository.
- [ ] Related projects from the same department are suggested.
- [ ] Unpublished projects aren't publicly reachable.

### US-3.4 Search projects and people ✅
**As a** visitor, **I want to** search by keyword **so that** I can find a project or person I've heard about.

- [ ] ⌘K or Ctrl+K opens a search palette from any page.
- [ ] Results include people (by name) and projects (by title, summary, maker, or topic).
- [ ] The full `/search` page shows the same results, with projects ranked by signal.

### US-3.5 Browse the archive ✅
**As a** visitor, **I want to** browse projects from past months **so that** older work isn't lost once it falls off the board.

- [ ] `/archive` opens on the current month.
- [ ] A sidebar lists every month that has published work, grouped by year.
- [ ] Choosing a month shows its projects ranked by signal.
- [ ] "Browse everything" loads all earlier projects with infinite scroll.

### US-3.6 See this month's winners ✅
**As a** visitor, **I want to** see the current month's top three projects **so that** I know what the community rates most highly.

- [ ] `/this-month` shows a podium with 1st, 2nd, and 3rd place.
- [ ] Ties are broken by first comments, then by the earliest publish date.
- [ ] Projects an admin has demoted don't appear, and the next project moves up.
- [ ] If no project has a score yet, an empty state explains why.

### US-3.7 Understand how ranking works ✅
**As a** maker, **I want to** read how the signal score is calculated **so that** I trust the rankings and know what helps.

- [ ] `/signal-model` explains the four weights, monthly cohorts, normalisation, and exclusions.
- [ ] The weights shown match the ones the scoring code uses.

---

## Epic 4: Submitting projects

### US-4.1 Submit a project ✅
**As a** maker, **I want to** submit my project with a cover, summary, and link **so that** it can be reviewed and published.

- [ ] Title (2–80 characters), summary (20–240 characters), type, and cover are required.
- [ ] Up to 3 topics and an optional http or https URL are accepted.
- [ ] Invalid fields are highlighted with a specific message.
- [ ] On success, I see a receipt and the project's status is "Awaiting review".
- [ ] The project doesn't appear publicly until a reviewer publishes it.

### US-4.2 Add extra media ✅
**As a** maker, **I want to** add screenshots or a short demo video **so that** people can see the project without leaving the page.

- [ ] Up to 4 extra files are allowed.
- [ ] Images can be up to 4 MB; MP4, WebM, or MOV videos can be up to 32 MB.
- [ ] Files upload directly to storage with progress shown, and submitting waits until uploads finish.
- [ ] Videos play inline on the project page.

### US-4.3 Credit collaborators ✅
**As a** maker, **I want to** add teammates to my project **so that** they're credited too.

- [ ] I can search accounts by name (at least 2 characters) and pick up to 5 people.
- [ ] Emails are never shown in the picker.
- [ ] I can't add myself.

### US-4.4 Save a draft ✅
**As a** maker, **I want to** save an unfinished submission **so that** I can come back to it later.

- [ ] Saving a draft only needs a title.
- [ ] The draft shows under Drafts on my account and isn't sent for review.
- [ ] Saving takes me to the editor for that draft.

### US-4.5 Never lose my progress ✅
**As a** maker on unreliable campus Wi-Fi, **I want** my in-progress submission to survive a reload or a dropped connection **so that** I don't have to start over.

- [ ] Reloading `/submit` restores my text, selections, finished uploads, collaborators, and current step.
- [ ] Saved progress belongs to my account; another account on the same browser doesn't see it.
- [ ] If my session expires, I'm told to sign in again and my progress is kept.
- [ ] Retrying after a lost response never creates a duplicate project.
- [ ] Saved progress is cleared only after a confirmed submission or draft save.

---

## Epic 5: Managing my projects

### US-5.1 Edit a project ✅
**As a** maker, **I want to** update my project after submitting it **so that** I can fix mistakes or add new work.

- [ ] Only the owner can open the editor or save changes.
- [ ] Editing a published project keeps it published.
- [ ] The same validation as submission applies.

### US-5.2 Resubmit after changes are requested ✅
**As a** maker, **I want to** address a reviewer's feedback and resubmit **so that** my project can still be published.

- [ ] Saving a project with status "Changes requested" moves it back to "Awaiting review".
- [ ] A confirmation tells me it's back with a reviewer.

### US-5.3 Know why changes were requested 📋
**As a** maker, **I want to** see the reviewer's reason when changes are requested or a project is rejected **so that** I know what to fix.

- [ ] Reviewers must or can enter a note when requesting changes or rejecting.
- [ ] The note appears on the project in my account and in the editor.

### US-5.4 Delete a project ✅
**As a** maker, **I want to** delete a project **so that** I can remove work I no longer want public.

- [ ] Only the owner can delete.
- [ ] Deleting removes the project and its interactions, bookmarks, and scores.
- [ ] I'm returned to my account page afterwards.

### US-5.5 Track my projects by stage ✅
**As a** maker, **I want to** see my projects grouped into drafts, in review, and live **so that** I know what needs my attention.

- [ ] `/account` lists Drafts, In review, and Live separately.
- [ ] Each project shows its current status label.

### US-5.6 See my project analytics ✅
**As a** maker, **I want to** see views, clicks, likes, comments, and saves for each project **so that** I know what's working.

- [ ] `/account/analytics` lists every published project with those five metrics.
- [ ] I can switch between All time, 90 days, and 30 days.
- [ ] Totals across live projects also appear on `/account`.

### US-5.7 Be notified of activity 📋
**As a** maker, **I want to** be notified when my project is reviewed, commented on, or receives a collaboration request **so that** I don't have to keep checking.

---

## Epic 6: Engaging with projects

### US-6.1 Like a project ✅
**As a** community member, **I want to** like projects **so that** I can show support and help good work rank higher.

- [ ] Liking requires sign-in; signed-out users are prompted to sign in.
- [ ] Clicking again removes the like.
- [ ] I can like a project only once.
- [ ] I can't like a project I own or contributed to.

### US-6.2 Comment on a project ✅
**As a** community member, **I want to** comment on and reply to comments on a project **so that** I can give feedback or ask questions.

- [ ] Comments must be 2–500 characters.
- [ ] I can reply to a top-level comment, but not to a reply.
- [ ] I can't comment on my own project.
- [ ] Only my first top-level comment on a project counts toward its score.

### US-6.3 Bookmark a project ✅
**As a** community member, **I want to** save projects **so that** I can find them again later.

- [ ] Bookmarking is a toggle and needs sign-in.
- [ ] Saved projects appear under Saved on my account.
- [ ] Bookmarks don't affect the signal score.

### US-6.4 Share a project or profile ✅
**As a** community member, **I want to** copy a link to a project or profile **so that** I can share it elsewhere.

- [ ] A share control copies the URL.
- [ ] Shared links show a preview card with the cover image or avatar.

### US-6.5 Fair counting of views and clicks ✅
**As a** maker, **I want** views and clicks to count people, not page refreshes **so that** rankings reflect real interest.

- [ ] Repeat views or clicks from the same person within 24 hours count once.
- [ ] Signed-out visitors are identified by a hashed IP and user agent; raw IPs are never stored on interactions.
- [ ] Owners' and contributors' own activity is never counted.

---

## Epic 7: Collaboration

### US-7.1 Open my project to collaborators ✅
**As a** maker, **I want to** mark my project as open to collaboration and list the skills I need **so that** the right people can find me.

- [ ] The editor has an "Open to collaboration" toggle and a requested-skills field (up to 10).
- [ ] Open projects show the skills and a request form on their page.

### US-7.2 Find projects that need my skills ✅
**As a** community member, **I want to** search for open projects that need a skill I have **so that** I can join something worthwhile.

- [ ] `/search` has a "Needed skill" field and an "Open to collaborators" checkbox.
- [ ] Results only include published projects that are open to collaboration.

### US-7.3 Request to join a project ✅
**As a** community member, **I want to** send the maker a short message asking to collaborate **so that** they know who I am and why I'm interested.

- [ ] The message must be 10–1,000 characters.
- [ ] I can have only one open request per project.
- [ ] I can't request to join my own project.
- [ ] Requests are rejected if the project isn't published or no longer open.

### US-7.4 Manage incoming requests 🟡
**As a** maker, **I want to** review and act on collaboration requests **so that** I can grow my team.

- [x] Open requests appear in the Maker inbox on `/account`, with the sender and message.
- [x] I can close a request.
- [ ] I can accept a request, which adds the sender as a contributor automatically.

> Accepting isn't built yet. Today, the maker adds the person manually in the editor.

### US-7.5 Report an inappropriate request ✅
**As a** maker or sender, **I want to** report a collaboration request **so that** reviewers can deal with harassment or spam.

- [ ] Either the owner or the sender can report a request.
- [ ] Reported requests appear under Reports in the review workspace.

---

## Epic 8: Review and moderation

### US-8.1 Work through the review queue ✅
**As a** reviewer, **I want** a queue of submissions waiting for a decision **so that** nothing sits unreviewed.

- [ ] `/review` is only reachable by REVIEWER and ADMIN accounts; everyone else is redirected.
- [ ] The queue lists submitted (not draft) projects that are pending or have changes requested, oldest first.
- [ ] Summary cards show counts for awaiting review, changes requested, and open reports.

### US-8.2 Decide on a submission ✅
**As a** reviewer, **I want to** publish, request changes on, return, or reject a submission **so that** only good work reaches the board.

- [ ] The review page shows the cover, summary, link, submitter, department, and contributors.
- [ ] Publishing makes the project public and sets its publish date the first time.
- [ ] The publish date decides which monthly cohort the project competes in.
- [ ] Invalid status values are rejected.

### US-8.3 Investigate suspicious activity ✅
**As a** reviewer, **I want to** see a project's engagement and abuse flags **so that** I can spot gaming before it affects rankings.

- [ ] The review page shows views, clicks, likes, comments, saves, and an hourly histogram for the last 7 days.
- [ ] Every abuse flag lists its IP, day, count, and status.
- [ ] I can mark a flag as Abusive or Not abusive.
- [ ] Marking a flag recomputes that month's scores straight away.
- [ ] My decision survives the next nightly scan.

### US-8.4 Resolve reported collaboration requests ✅
**As a** reviewer, **I want to** see and dismiss reported collaboration requests **so that** the community stays respectful.

- [ ] Reports show the project, message, and reporter.
- [ ] Dismissing removes the report from the list.

### US-8.5 Hide an inappropriate comment 📋
**As a** reviewer, **I want to** hide a comment **so that** abusive content disappears and stops counting toward the score.

- [ ] A Hide action is available on comments for reviewers.
- [ ] Hidden comments and their replies disappear from the project page.
- [ ] Hidden comments stop counting toward signal.
- [ ] The record of who hid it and when is kept.

> The `hidden_comment` table and the read-side filtering already exist; only the action and the UI are missing.

### US-8.6 Demote a project from the monthly ranking ✅
**As an** admin, **I want to** remove a project from this month's top three, with a reason **so that** gamed or ineligible work isn't recognised.

- [ ] Only ADMIN accounts see and can use Demote.
- [ ] A reason of at least 5 characters is required.
- [ ] The override is logged with who demoted it, when, and for which month.
- [ ] The next-highest project moves up into the top three.

### US-8.7 Manage roles in the app 📋
**As an** admin, **I want to** promote users to reviewer or admin from the app **so that** I don't need direct database access.

---

## Epic 9: Scoring (system)

### US-9.1 Nightly score refresh ✅
**As the** system, **I want to** recompute signal scores every night **so that** rankings stay current without slowing down page loads.

- [ ] The cron endpoint runs daily at 12:00 UTC and rejects requests without the correct bearer secret.
- [ ] Only the current month's cohort is recomputed; past months stay frozen.
- [ ] Scores use the weights clicks 40%, likes 25%, views 20%, comments 15%, normalised within the cohort.
- [ ] Owner and contributor activity, hidden comments, and confirmed-abusive IP activity are excluded.

### US-9.2 Nightly abuse scan ✅
**As the** system, **I want to** flag unusual bursts of activity from a single IP **so that** reviewers can investigate.

- [ ] Any project, IP, and day with more than 30 interactions is flagged.
- [ ] Re-running the scan updates counts without undoing reviewer decisions.
- [ ] Flags never block activity automatically.

---

## Epic 10: Experience

### US-10.1 Light and dark mode ✅
**As a** visitor, **I want to** switch between light and dark themes **so that** the site is comfortable to read.

### US-10.2 Works on my phone ✅
**As a** visitor on mobile, **I want** every page to work at phone width **so that** I can browse and submit from my phone.

- [ ] Navigation collapses into a mobile menu.
- [ ] Filters collapse, and the podium stacks with 1st place first.
- [ ] Tables (analytics) scroll horizontally rather than breaking the layout.

### US-10.3 Fast perceived loading ✅
**As a** visitor, **I want** immediate feedback while pages load **so that** the app feels responsive.

- [ ] Every main route shows a loading skeleton.
- [ ] View tracking happens after the response is sent.
