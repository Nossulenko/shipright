# Grill log — Team lunch poll

> Every `/grill` session for this spec, newest at the bottom. Append only.
> Verdicts: ✅ defended · ⚠️ accepted risk · ❌ revise

---

## Session 1 — 2026-11-17 — target: 01-prd.md (gentle)

**Target:** [`01-prd.md`](01-prd.md) (draft, before approval)
**Fresh-eyes critique:** built from question bank (gentle mode, first grill)
**Decisions on the tree:** 5 · **Questions asked:** 5

### Q1 [Users] Is this for the whole office, or just the Platform team?
- **Why this matters:** "Other teams asked" could quietly turn a 9-person tool into a multi-team product with team switching, admin screens and permissions — weeks of extra work. Picking one team keeps v1 small; it also tells us who to measure success with.
- **Recommended:** Platform team only for v1, but store polls under a team so adding teams later is a UI change, not a rewrite.
- **Answer:** Agreed — Platform only. Priya will tell other teams "after a month if it works".
- **Verdict:** ✅ Defended — non-goal "Multiple teams in the UI" added; assumption A4.

### Q2 [Security] Your notes say "no login please". Without sign-in, what stops someone voting twice, or someone outside the team voting?
- **Why this matters:** "One vote per person" (FR-3) can't be enforced if we don't know who the person is. Anyone with the link — or a private browser window — could vote again, and the result stops meaning anything. That breaks G3 (unambiguous result).
- **Recommended:** Sign in with the company Google account everyone already has (one tap, no new password), and restrict polls to team members.
- **Answer:** Priya hadn't thought of private windows. A Google account is fine — "it's not *another* account". Confirmed everyone has one (A1).
- **Verdict:** ❌ Revise → **applied:** added FR-7 (Google sign-in, team members only), removed the "no login" non-goal, added risk "sign-in adds friction".

### Q3 [Problem] Is the real problem that deciding is *slow*, or that quiet people don't get a say?
- **Why this matters:** They lead to different products. Speed means deadlines and auto-close; fairness means private voting. If we only solve one, the team may keep using Slack.
- **Recommended:** Both are in the evidence — measure both: decision by closing time *and* participation rate.
- **Answer:** Both. Lena specifically said she avoids being "the one who vetoes".
- **Verdict:** ✅ Defended — success metrics now include participation ≥ 70%; persona "Lena, quiet voice" added.

### Q4 [Data] Should other people see *who* voted for what?
- **Why this matters:** Emoji reactions in Slack are public — that's exactly why Lena stays quiet. If the app shows names next to votes, we rebuild the same problem with nicer buttons.
- **Recommended:** Show counts only; never show which member voted for which option, not even to the creator.
- **Answer:** Yes, counts only.
- **Verdict:** ❌ Revise → **applied:** added NFR-4 (votes private, counts only) and US-3.

### Q5 [Scope] Slack notifications would help adoption. Why not in v1?
- **Why this matters:** If nobody remembers to open the app, participation drops and the team drifts back to the Slack thread — the main risk to G1.
- **Recommended:** Leave it out (security approval for Slack apps takes months), and have Priya post the poll link manually for the first two weeks.
- **Answer:** Agreed. Priya will post links.
- **Verdict:** ⚠️ Accepted risk — revisit if participation is below 50% after two weeks. Recorded as FR-10 *Won't (this time)* and in risks.

### Summary

| # | Decision | Verdict | Follow-up | Owner |
| --- | --- | --- | --- | --- |
| 1 | Platform team only for v1 | ✅ | — | — |
| 2 | No sign-in | ❌ | FR-7 added, non-goal removed | Applied |
| 3 | Problem = speed + fairness | ✅ | Participation metric added | Applied |
| 4 | Vote visibility | ❌ | NFR-4 added | Applied |
| 5 | No Slack integration in v1 | ⚠️ | Revisit if participation < 50% after 2 weeks | Priya |

**Applied in this session:** `01-prd.md` — FR-7, NFR-4, US-3, US-6, persona Lena, participation metric, risks updated; "no login" non-goal removed.
**ADRs proposed:** none (product-level decisions; recorded in the PRD).
**Not covered:** tie handling — parked as open question Q2 in the PRD and answered there.

---

## Session 2 — 2026-11-20 — target: 05-tech-plan.md (standard)

**Target:** [`05-tech-plan.md`](05-tech-plan.md) (draft)
**Fresh-eyes critique:** griller role delegated (fresh context), then walked through interactively
**Decisions on the tree:** 8 · **Questions asked:** 7

### Q1 [Alternatives] Why build anything? Slack has polls, and there are lunch-poll apps.
- **Why this matters:** The cheapest code is code you don't write. If an existing tool covers the Musts, building is a hobby, not a product decision.
- **Recommended:** Build only if an off-the-shelf option fails a Must. Check: deadline auto-close (FR-5), private votes (NFR-4), no Slack-app approval.
- **Answer:** Slack's built-in emoji polls fail FR-5 and NFR-4; third-party Slack poll apps need the months-long security approval; standalone poll sites aren't restricted to company accounts (FR-7).
- **Verdict:** ✅ Defended — evidence is in the PRD non-goals and risks.

### Q2 [Operability] What closes the poll at 11:45 — a scheduled job, or something else?
- **Why this matters:** Scheduled jobs are a classic silent failure: if the job doesn't fire, the poll stays "open" and nobody notices until lunch is ruined. They're also extra infrastructure for a junior to run.
- **Recommended:** Don't close anything. Derive "open" from `closes_at` and the current time on every read and every vote.
- **Answer:** The draft already derives it — the developer asked whether any scenario needs something to *happen* at 11:45. None does: FR-10 (Slack ping) is Won't.
- **Verdict:** ✅ Defended — propose ADR "derive poll status" so a future Slack-notification feature knows why there's no scheduler.

### Q3 [Data] Sam opens the poll in two tabs and taps "Burger Barn" in both. What stops a double vote?
- **Why this matters:** Checking "has this person voted?" in code and then inserting is a race: two requests can both pass the check. That breaks @LUNCH-10 and the meaning of the result.
- **Recommended:** Let the database enforce it — primary key `(poll_id, user_id)` on `votes`, and make `castVote` an upsert.
- **Answer:** Agreed; it was already the composite key — upsert added explicitly to §4.
- **Verdict:** ✅ Defended.

### Q4 [Failure in 3 months] Jonas works from Lisbon some weeks — one hour behind Brussels. What does "closes at 11:45" mean to him?
- **Why this matters:** Time zones are one of the most common sources of real bugs. Jonas could think he has an extra hour and miss the vote.
- **Recommended:** Store the team's time zone, show every time with its zone ("11:45 CET"), and keep all comparisons in UTC.
- **Answer:** Show the zone label; don't convert to each member's local time in v1.
- **Verdict:** ⚠️ Accepted risk — revisit when a team has members regularly in more than one time zone. Design prompt already shows "Closes 11:45 CET".

### Q5 [Cost] Cloud SQL runs all day for a poll that's used for 20 minutes. What does that cost, and who notices if it grows?
- **Why this matters:** Juniors' first cloud surprise is usually a bill. An always-on database is the biggest line item for a small app.
- **Recommended:** Smallest Cloud SQL instance, Cloud Run scaled to zero, and a budget alert set *before* the first deploy. Check the current price in the GCP pricing calculator rather than trusting a number from memory.
- **Answer:** Fine for now — company GCP project has credits. Budget alert will be set by `/deploy`.
- **Verdict:** ⚠️ Accepted risk — revisit if the monthly bill exceeds the budget alert threshold.

### Q6 [Security] The plan restricts sign-in with Google's `hd` (hosted domain) parameter. Is that enough?
- **Why this matters:** `hd` only tells Google's sign-in screen which accounts to *suggest*. Someone can edit the request and sign in with a personal Gmail. If the server trusts it, an outsider gets in.
- **Recommended:** Keep `hd` as a UI hint, and *also* reject any email outside the company domain in the Auth.js `signIn` callback on the server — plus the team-membership check.
- **Answer:** Didn't know that. Agreed.
- **Verdict:** ❌ Revise → **applied:** §7 Security and task T1 now include the server-side domain check with unit tests.

### Q7 [Testability] Scenarios say "it is 11:00" and "the time reaches 11:45". How does a test control the server's clock?
- **Why this matters:** Without a controllable clock, the closing-time scenarios either can't be automated or become slow and flaky (waiting for real time to pass).
- **Recommended:** A tiny `lib/clock.ts` that returns real time in production and a test-provided time when `NODE_ENV=test`; Playwright's `page.clock` for the browser side.
- **Answer:** Not in the draft. Agreed.
- **Verdict:** ❌ Revise → **applied:** `lib/clock.ts` added to components, T0, §7 Testability, and the "override leaks into production" risk.

### Summary

| # | Decision | Verdict | Follow-up | Owner |
| --- | --- | --- | --- | --- |
| 1 | Build instead of buy | ✅ | — | — |
| 2 | Derive status, no scheduler | ✅ | Propose ADR `0003-derive-poll-status` | Architect |
| 3 | DB-enforced one vote per member | ✅ | — | — |
| 4 | Team time zone, labelled | ⚠️ | Revisit with multi-zone teams | Priya |
| 5 | Cloud SQL smallest instance | ⚠️ | Budget alert before first deploy | `/deploy` |
| 6 | Domain restriction via `hd` only | ❌ | Server-side check in T1 | Applied |
| 7 | No test clock | ❌ | `lib/clock.ts` in T0 | Applied |

**Applied in this session:** `05-tech-plan.md` — §3 clock component, §4 upsert note, §6 T0 and T1, §7 Security and Testability, §9 risk.
**ADRs proposed:** `0003-derive-poll-status`, `0004-authjs-google` (would live in `docs/decisions/` in a real project).
**Not covered:** auth-library choice was raised by the griller report (Auth.js vs managed auth) and judged low-risk — two-way door, data stays in our DB.
