# PRD — Team lunch poll

> **Spec:** `examples/team-lunch-poll/` (in a real project: `specs/001-team-lunch-poll/`) · **Status:** Approved (2026-11-17) · **Owner:** Priya (Platform team lead)
> **Scenario key:** `LUNCH` · **Source:** [`00-input.md`](00-input.md) · **Grilled:** [session 1](grill-log.md)

## 1. Summary

A tiny web app where a team member starts a lunch poll with a few places and a closing time, teammates vote from their phones, and everyone sees the winner the moment it closes — replacing the daily 40-message Slack scramble.

## 2. Problem

Every working day the Platform team (~9 people) decides where to eat in a Slack thread. It takes 15–20 minutes and around 40 messages, the decision lands around 11:55, and nobody knows when emoji voting is "done" because reactions keep changing. Quieter teammates rarely get a say: one said she doesn't want to be "the one who vetoes".

**Evidence:** Slack thread of Thursday 2026-11-12 (11:41 → 12:04, decision at 11:53, a teammate who missed the vote and one who disagreed afterwards); Priya's notes: "this happens EVERY day".

## 3. Users & personas

| Persona | Who they are | Goal | Frustration today |
| --- | --- | --- | --- |
| **Priya, organiser** | Team lead who usually kicks off lunch | Get a decision by 11:45 without herding people | Has to count emoji and make the call herself |
| **Sam, team member** | Any of the ~9 engineers, often in calls | Vote in seconds, from a phone | Misses the thread or the decision while in a call |
| **Lena, quiet voice** | Teammate who avoids conflict | Have a say without being visible as "the veto" | Public emoji votes feel exposed, so she stays silent |

## 4. Goals & non-goals

**Goals**

- G1 — The team has a lunch decision by the agreed closing time, every day.
- G2 — Everyone can vote privately in under 30 seconds.
- G3 — The result is unambiguous and visible to all once the poll closes.

**Non-goals (v1)**

- Slack integration (notifications, slash commands) — security approval for Slack apps takes months.
- Suggesting new places during a poll — unclear need; creator adds options.
- Managing team membership in the app — v1 members are added by an admin script.
- Multiple teams in the UI — the data model supports teams, but v1 ships for Platform only.
- Restaurant data (menus, maps, ratings) — options are free text.

## 5. Success metrics

| Metric | Target | Timeframe | How we measure |
| --- | --- | --- | --- |
| Days with a decision by closing time | ≥ 4 of 5 working days | First 4 weeks | Polls with ≥ 1 vote closed by `closes_at` |
| Participation | ≥ 70% of team members vote per poll | First 4 weeks | Distinct voters ÷ team size |
| Slack lunch messages | Down ≥ 75% | After 4 weeks | Priya's eyeball count of `#platform-team` 11:30–12:00 |

## 6. User stories

High-level needs. Cut into 10 delivery stories in [`02-stories.md`](02-stories.md).

- **US-1** — As Priya, I want to start a poll with a few places and a closing time so that the team decides by a fixed moment. → FR-1, FR-9
- **US-2** — As Sam, I want to see today's poll and vote in a couple of taps so that I can take part between calls. → FR-2, FR-3, FR-4
- **US-3** — As Lena, I want my vote to be private so that I can say what I prefer without being the visible veto. → NFR-4
- **US-4** — As anyone on the team, I want to see the winner as soon as the poll closes so that we can just go. → FR-5, FR-6
- **US-5** — As Priya, I want to close a poll early when everyone has voted so that we don't wait for nothing. → FR-8
- **US-6** — As the team, we want only our members to vote so that results can't be gamed. → FR-7

## 7. Requirements

### Functional

| ID | Requirement (one testable behaviour) | Priority | Story |
| --- | --- | --- | --- |
| FR-1 | A member can create a poll with a title (1–60 characters), 2–8 options, and a closing time later the same day. | Must | US-1 |
| FR-2 | A member sees their team's open polls and polls closed in the last 7 days, newest first. | Must | US-2 |
| FR-3 | A member can vote for exactly one option in an open poll. | Must | US-2 |
| FR-4 | A member can change their vote while the poll is open. | Must | US-2 |
| FR-5 | A poll stops accepting votes at its closing time. | Must | US-4 |
| FR-6 | A closed poll shows the winning option and the vote count per option; a tie is shown as a tie between the top options. | Must | US-4 |
| FR-7 | Members sign in with their company Google account; only members of a team can see and vote in that team's polls. *(Added after [grill session 1](grill-log.md), Q2.)* | Must | US-6 |
| FR-8 | The poll's creator can close it before its closing time. | Should | US-5 |
| FR-9 | The creator can mark any option as "vegetarian-friendly". | Could | US-1 |
| FR-10 | Slack notification when a poll opens and closes. | Won't (this time) | — |

### Non-functional

| ID | Requirement | Priority |
| --- | --- | --- |
| NFR-1 | All screens meet WCAG 2.2 AA. | Must |
| NFR-2 | Voting works on a 360 px-wide phone in ≤ 3 taps from opening the poll link. | Must |
| NFR-3 | The poll page loads in under 2 seconds on a 4G connection. | Should |
| NFR-4 | Other members never see who voted for what — only counts. *(Added after [grill session 1](grill-log.md), Q4.)* | Must |

## 8. Scope

| In v1 | Out of v1 | Later (maybe) |
| --- | --- | --- |
| Create poll, vote, change vote, auto-close, results, close early, veggie marker, Google sign-in, one team | Slack integration, suggesting places, team-management UI, restaurant data | Multiple teams in the UI, Slack notifications, "suggest a place", recurring daily poll |

## 9. Assumptions

| ID | Assumption | Confirmed? | If wrong… |
| --- | --- | --- | --- |
| A1 | Every team member has a company Google Workspace account. | Yes — Priya, 2026-11-17 | We'd need another sign-in method. |
| A2 | All members work in one time zone (Europe/Brussels). | Partly — one member is sometimes in Lisbon | Closing time could confuse remote members; see grill session 2, Q4. |
| A3 | ~9 members, at most a few polls a day. | Yes | Fine at 100× — no scaling work needed. |
| A4 | Only one team (Platform) uses it in v1. | Yes | Teams already exist in the data model; UI work needed to switch teams. |

## 10. Open questions

| ID | Question | Recommended answer | Owner | Status |
| --- | --- | --- | --- | --- |
| Q1 | Can a poll creator vote in their own poll? | Yes, like anyone else. | Priya | Answered: yes |
| Q2 | What happens on a tie? | Show "It's a tie" with the tied options; the team decides in person. No coin flip in v1. | Priya | Answered: as recommended |
| Q3 | Should members suggest places during a poll? | Not in v1 — revisit if creators complain about missing options. | Priya | Answered: later |

## 11. Risks

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Team keeps using Slack out of habit | Med | High | Priya posts the poll link in Slack for the first two weeks; measure participation. |
| Sign-in adds friction ("no login please") | Med | Med | Google one-tap with the company account; session lasts 30 days. |
| Closing time confuses a remote member | Low | Low | Show the time with its time zone; accepted risk (grill session 2, Q4). |

## 12. Scenario key & traceability

- **Scenario key:** `LUNCH` — every scenario in [`02-scenarios/`](02-scenarios/) is tagged `@LUNCH-nn` plus the `@FR-n` / `@NFR-n` it proves.

| Requirement | Scenarios |
| --- | --- |
| FR-1 | @LUNCH-01, @LUNCH-02, @LUNCH-03, @LUNCH-04 |
| FR-2 | @LUNCH-01, @LUNCH-05 |
| FR-3 | @LUNCH-08, @LUNCH-10 |
| FR-4 | @LUNCH-09 |
| FR-5 | @LUNCH-11, @LUNCH-14 |
| FR-6 | @LUNCH-14, @LUNCH-15, @LUNCH-16 |
| FR-7 | @LUNCH-06, @LUNCH-12 |
| FR-8 | @LUNCH-17, @LUNCH-18 |
| FR-9 | @LUNCH-07 |
| FR-10 | — (Won't this time) |
| NFR-1 | automated accessibility check on every screen (tech plan §7) |
| NFR-2 | @LUNCH-08 run at mobile viewport (tech plan §7) |
| NFR-3 | performance check in tech plan §7 |
| NFR-4 | @LUNCH-13 |
