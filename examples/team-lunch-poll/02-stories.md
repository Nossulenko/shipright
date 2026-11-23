# User stories — Team lunch poll

> **Spec:** `examples/team-lunch-poll/` (in a real project: `specs/001-team-lunch-poll/`) · **Status:** Approved (2026-11-18) · **Source:** [`01-prd.md`](01-prd.md)
> **Scenario key:** `LUNCH` · **Stories:** 10 delivery stories from 6 PRD stories · **Walking skeleton:** US-6 → US-1.1 → US-2.1 → US-4.1

## 1. Who and why

- **Personas:** Priya, organiser · Sam, team member · Lena, quiet voice — as in the PRD.
- **Outcome:** the Platform team decides where to eat by 11:45 in a couple of taps each, and everyone, including the quiet voices, gets a say.

## 2. Story map

|                        | 🔐 Get in              | 📝 Start a poll            | 🗳️ Vote                                  | 🏁 Get the result                          |
| ---------------------- | ---------------------- | -------------------------- | ---------------------------------------- | ------------------------------------------ |
| **Walking skeleton**   | US-6 Members only      | US-1.1 Start a poll        | US-2.1 Vote once                         | US-4.1 Close on time, show the winner      |
| **Rest of release**    |                        | US-1.2 Keep polls sensible | US-2.2 Change my vote · US-3 Private votes | US-4.2 Ties and empty polls · US-5 Close early |
| **Could**              |                        | US-1.3 Vegetarian marker   |                                          |                                            |
| **Later** (won't now)  |                        |                            |                                          | Slack notifications (FR-10)                |

Read the first row left to right: sign in, start a poll, vote, see the winner. That is the smallest version worth showing Priya.

## 3. Build order

1. **US-6 Members only** — votes and team visibility are keyed by member; building identity later would mean reworking US-1.1 and US-2.1.
2. **US-1.1 Start a poll** — the first thing anyone does; gives US-2.1 something to vote on.
3. **US-2.1 Vote once** — the core value.
4. **US-3 Private votes** — cheapest to build into the very first vote screen; adding privacy later risks a release that shows names.
5. **US-4.1 Close on time, show the winner** — completes the walking skeleton: *Priya starts a poll, Sam votes, the winner appears at 11:45.* Demo it.
6. **US-1.2 Keep polls sensible** — validation rules; safe to follow the skeleton because only the team uses the app yet.
7. **US-2.2 Change my vote** — Must, but voting works without it.
8. **US-4.2 Ties and empty polls** — completes the Must scope.
9. **US-5 Close early** — Should.
10. **US-1.3 Vegetarian marker** — Could; ship if time allows.

> The [tech plan](05-tech-plan.md) follows this order with two technical exceptions: validation (US-1.2, task T4) sits next to the create form because both share one schema, and "change my vote" (US-2.2) is built with the two-tab case of US-2.1 because both are one database upsert. That's fine — stories are about value, tasks are about code.

## 4. Stories

### US-6 — Only team members can see and vote

`M` · `Must` · **Persona:** Priya · **Requirements:** FR-7

**As** Priya, the organiser,
**I want** only Platform team members to see and vote in our polls,
**so that** the result reflects the team and can't be gamed.

**Acceptance criteria** → `02-scenarios/vote.feature`, `02-scenarios/create-poll.feature`
- `@LUNCH-12` Given a visitor who isn't signed in opens a poll link, when they try to vote, then they're asked to sign in with their company Google account and no vote is counted.
- `@LUNCH-06` Given Dana is signed in but not in the Platform team, when Dana opens the team's poll list, then Dana sees "You're not a member of this team" and no polls.

**INVEST** I ✅ · N ⚠️ · V ✅ · E ✅ · S ✅ · T ✅ — *N:* the sign-in method is fixed by FR-7 ([grill session 1](grill-log.md), Q2) — deliberately not negotiable.
**Depends on:** none · **Ready:** ✅

**Notes / edge cases**
- Membership comes from a seed list for v1 (assumption A4: one team). Sessions last 30 days to keep sign-in friction low (PRD risks).
- The PRD wrote this story as "As the team…"; it is rewritten with a named persona so the value is concrete.

**Out of scope**
- Managing team membership in the UI → Later (PRD scope: "team-management UI" out of v1).

---

### US-1.1 — Start a poll the team can see

`M` · `Must` · **Persona:** Priya · **Requirements:** FR-1, FR-2 · Split from US-1 (happy vs. edge path)

**As** Priya, the organiser,
**I want** to start a poll with a few places and a closing time,
**so that** the team decides by a fixed moment instead of a 40-message thread.

**Acceptance criteria** → `02-scenarios/create-poll.feature`
- `@LUNCH-05` Given the team has no polls from the last 7 days, when Priya opens the poll list, then she sees "No polls yet. Start one and let the team decide." and is offered to start one.
- `@LUNCH-01` Given Priya is a signed-in member, when she creates "Friday lunch" closing at 11:45 with three places, then it is open until 11:45 and every member sees it at the top of their poll list.

**INVEST** I ✅ · N ✅ · V ✅ · E ✅ · S ✅ · T ✅
**Depends on:** US-6 · **Ready:** ✅

**Notes / edge cases**
- The list shows open polls and polls closed in the last 7 days, newest first (FR-2).
- NFR-3 (poll page under 2 s on 4G) is checked by the performance test in the tech plan §7.

**Out of scope**
- Input validation (title length, number of places, closing time) → US-1.2.
- Vegetarian marker → US-1.3.

---

### US-1.2 — Keep polls sensible

`S` · `Must` · **Persona:** Priya · **Requirements:** FR-1 · Split from US-1 (happy vs. edge path → business-rule variations)

**As** Priya, the organiser,
**I want** to be stopped, with a clear message, when a poll can't work,
**so that** every poll the team sees can actually be voted on today.

**Acceptance criteria** → `02-scenarios/create-poll.feature`
- `@LUNCH-02` Given Priya is creating a poll, when the title is empty or longer than 60 characters, then the poll isn't created and she sees "Give your poll a title" or "Keep the title under 60 characters".
- `@LUNCH-03` Given Priya is creating a poll, when it has 1 place or 9 places, then the poll isn't created and she sees "Add at least 2 places" or "A poll can have up to 8 places".
- `@LUNCH-04` Given it is 10:30, when Priya picks 10:00 today or 11:45 tomorrow as the closing time, then the poll isn't created and she sees "Pick a closing time later than now" or "Polls close on the same day they start".

**INVEST** I ✅ · N ✅ · V ✅ · E ✅ · S ✅ · T ✅
**Depends on:** US-1.1 · **Ready:** ✅

**Notes / edge cases**
- "Today" means today in the team's time zone (Europe/Brussels, assumption A2).

**Out of scope**
- Duplicate place names in one poll — not a rule in v1; revisit if it confuses anyone.

---

### US-1.3 — Mark vegetarian-friendly places

`XS` · `Could` · **Persona:** Priya · **Requirements:** FR-9 · Split from US-1 (business-rule variations)

**As** Priya, the organiser,
**I want** to mark places as vegetarian-friendly when I create a poll,
**so that** teammates who don't eat meat can see at a glance which places work for them.

**Acceptance criteria** → `02-scenarios/create-poll.feature`
- `@LUNCH-07` Given Priya is creating a poll, when she marks "Falafel Stop" as vegetarian-friendly, then members see "Falafel Stop" marked and the other places unmarked.

**INVEST** I ✅ · N ✅ · V ✅ · E ✅ · S ✅ · T ✅
**Depends on:** US-1.1 · **Ready:** ✅

**Out of scope**
- Other dietary tags (vegan, halal, gluten-free) → Later, if asked for.

---

### US-2.1 — Vote once

`M` · `Must` · **Persona:** Sam · **Requirements:** FR-3, NFR-2 · Split from US-2 (operations: cast vs. change)

**As** Sam, a team member,
**I want** to vote for a place in a couple of taps,
**so that** I take part even when I'm between calls.

**Acceptance criteria** → `02-scenarios/vote.feature`
- `@LUNCH-08` Given an open poll and Sam is a signed-in member, when Sam votes for "Thai Garden", then Sam sees the vote recorded and the poll shows 1 vote for "Thai Garden".
- `@LUNCH-10` Given Sam voted for "Burger Barn" in one browser tab, when Sam votes for it again in a second tab, then it still counts as 1 vote.

**INVEST** I ✅ · N ✅ · V ✅ · E ✅ · S ✅ · T ✅
**Depends on:** US-6, US-1.1 · **Ready:** ✅

**Notes / edge cases**
- NFR-2: `@LUNCH-08` also runs at a 360 px-wide viewport, and voting must take at most 3 taps from opening the poll link.
- The creator votes like anyone else (PRD open question Q1).

**Out of scope**
- Changing a vote → US-2.2.
- Voting after the closing time → US-4.1.
- Seeing who voted for what → never (NFR-4, US-3).

---

### US-2.2 — Change my vote

`S` · `Must` · **Persona:** Sam · **Requirements:** FR-4 · Split from US-2 (operations: cast vs. change)

**As** Sam, a team member,
**I want** to change my vote while the poll is open,
**so that** I can follow the group when the conversation moves on.

**Acceptance criteria** → `02-scenarios/vote.feature`
- `@LUNCH-09` Given Sam voted for "Thai Garden" and the poll is open, when Sam changes the vote to "Falafel Stop", then "Falafel Stop" shows 1 vote and "Thai Garden" shows 0.

**INVEST** I ✅ · N ✅ · V ✅ · E ✅ · S ✅ · T ✅
**Depends on:** US-2.1 · **Ready:** ✅

**Out of scope**
- Withdrawing a vote without picking another place → not in v1.

---

### US-3 — Private votes

`S` · `Must` · **Persona:** Lena · **Requirements:** NFR-4

**As** Lena, a teammate who avoids conflict,
**I want** my vote to be private,
**so that** I can say what I prefer without being the visible veto.

**Acceptance criteria** → `02-scenarios/vote.feature`
- `@LUNCH-13` Given Sam and Lena have voted, when Priya views the poll, then she sees the number of votes per place but not who voted for what.

**INVEST** I ✅ · N ✅ · V ✅ · E ✅ · S ✅ · T ✅
**Depends on:** US-2.1 · **Ready:** ✅

**Notes / edge cases**
- Applies to everyone, including the poll's creator ([grill session 1](grill-log.md), Q4).
- An NFR kept as its own story because it has its own visible behaviour.

**Out of scope**
- Anonymous voting for people outside the team → never (FR-7).

---

### US-4.1 — Close on time and show the winner

`M` · `Must` · **Persona:** Sam · **Requirements:** FR-5, FR-6 · Split from US-4 (happy vs. edge path)

**As** Sam, a team member,
**I want** the poll to close at its closing time and show the winner,
**so that** we stop discussing and go eat.

**Acceptance criteria** → `02-scenarios/close-poll.feature`, `02-scenarios/vote.feature`
- `@LUNCH-14` Given the poll has 4 votes for "Falafel Stop", 3 for "Burger Barn" and 2 for "Thai Garden", when the clock reaches 11:45, then the poll is closed and members see "Falafel Stop" as the winner with 4 votes and the count for every place.
- `@LUNCH-11` Given the poll closed at 11:45 and it is now 11:46, when Sam tries to vote, then Sam sees "This poll has closed" and the vote isn't counted.

**INVEST** I ✅ · N ✅ · V ✅ · E ✅ · S ✅ · T ✅
**Depends on:** US-2.1 · **Ready:** ✅

**Notes / edge cases**
- "Closed" is worked out from the closing time whenever the poll is read — no scheduler (tech plan § Decisions).

**Out of scope**
- Ties and polls with no votes → US-4.2.
- Closing before the closing time → US-5.

---

### US-4.2 — Ties and empty polls

`S` · `Must` · **Persona:** Sam · **Requirements:** FR-6 · Split from US-4 (happy vs. edge path)

**As** Sam, a team member,
**I want** a tie or an empty poll to be shown honestly,
**so that** nobody thinks a place won when it didn't.

**Acceptance criteria** → `02-scenarios/close-poll.feature`
- `@LUNCH-15` Given a 3–3 tie between "Burger Barn" and "Falafel Stop", when the poll closes, then members see "It's a tie between Burger Barn and Falafel Stop" and no single winner.
- `@LUNCH-16` Given nobody voted, when the poll closes, then members see "No votes were cast" and no winner.

**INVEST** I ✅ · N ✅ · V ✅ · E ✅ · S ✅ · T ✅
**Depends on:** US-4.1 · **Ready:** ✅

**Notes / edge cases**
- No coin flip on a tie in v1; the team decides in person (PRD open question Q2).
- Safe to build right after US-4.1: the release ships both, so a tie is never shown as a single winner to the team.

---

### US-5 — Close a poll early

`S` · `Should` · **Persona:** Priya · **Requirements:** FR-8

**As** Priya, the organiser,
**I want** to close my poll early once everyone has voted,
**so that** we don't wait until 11:45 for nothing.

**Acceptance criteria** → `02-scenarios/close-poll.feature`
- `@LUNCH-17` Given it is 11:20 and Priya created the poll, when she closes it early, then the poll is closed and members see the current leader as the winner.
- `@LUNCH-18` Given Sam didn't create the poll, when Sam tries to close it early, then Sam is told only the poll's creator can close it early and the poll stays open until 11:45.

**INVEST** I ✅ · N ✅ · V ✅ · E ✅ · S ✅ · T ✅
**Depends on:** US-4.1 · **Ready:** ✅

**Out of scope**
- Reopening a closed poll → not in v1.

## 5. Coverage

### Requirements → stories

| Requirement | Priority | Stories | Status |
| ----------- | -------- | ------- | ------ |
| FR-1  | Must   | US-1.1, US-1.2 | ✅ |
| FR-2  | Must   | US-1.1 | ✅ |
| FR-3  | Must   | US-2.1 | ✅ |
| FR-4  | Must   | US-2.2 | ✅ |
| FR-5  | Must   | US-4.1 | ✅ |
| FR-6  | Must   | US-4.1, US-4.2 | ✅ |
| FR-7  | Must   | US-6 | ✅ |
| FR-8  | Should | US-5 | ✅ |
| FR-9  | Could  | US-1.3 | ✅ |
| FR-10 | Won't  | — | Later (story map) |
| NFR-1 | Must   | every UI story — automated accessibility check (tech plan §7) | ✅ |
| NFR-2 | Must   | criterion on US-2.1 | ✅ |
| NFR-3 | Should | note on US-1.1 — performance check (tech plan §7) | ✅ |
| NFR-4 | Must   | US-3 | ✅ |

### PRD stories → delivery stories

| PRD story | Became | How |
| --------- | ------ | --- |
| US-1 | US-1.1, US-1.2, US-1.3 | split — happy vs. edge path, then business-rule variations |
| US-2 | US-2.1, US-2.2 | split — operations (cast vs. change) |
| US-3 | US-3 | kept |
| US-4 | US-4.1, US-4.2 | split — happy vs. edge path |
| US-5 | US-5 | kept |
| US-6 | US-6 | kept; persona named (was "the team") |

## 6. Splits made

| Parent | Children | Pattern | Why this split |
| ------ | -------- | ------- | -------------- |
| US-1 | US-1.1 · US-1.2 · US-1.3 | Happy vs. edge path, then business-rule variations | Creating a valid poll is useful on day one; the validation rules and the optional vegetarian marker each add value on top without blocking it. |
| US-2 | US-2.1 · US-2.2 | Operations (cast vs. change) | Casting a vote is the whole point; changing it is a refinement Sam can live without for a day. |
| US-4 | US-4.1 · US-4.2 | Happy vs. edge path | A clear winner is the common case and finishes the walking skeleton; ties and empty polls are rarer and ship in the same release. |

## 7. Open questions

None open — the PRD's questions Q1–Q3 are answered (see [`01-prd.md`](01-prd.md) § 10).
