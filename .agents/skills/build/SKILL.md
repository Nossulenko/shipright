---
name: build
description: Implements a feature one Gherkin scenario at a time, test-first — binds step definitions, watches the scenario fail for the right reason, writes the minimal code to make it pass, refactors, runs npm run verify, logs progress and commits with the scenario tag. Use when the human asks to build, implement or code a scenario, a tag like @LUNCH-03, or a spec folder whose tech plan is ready.
argument-hint: "[@SCENARIO-TAG | specs/NNN-slug]"
---

# /build — One scenario at a time, test-first

> **Role:** qa-engineer → frontend-engineer / backend-engineer (main conversation orchestrates) · **Input:** `.feature` files, `05-tech-plan.md` · **Output:** code + tests + one commit per scenario · **Next:** `/build` the next tag, then `/review`

## What this does

Turns a Gherkin scenario into working, tested code. For each scenario you first make the test fail (so we know it really checks the behaviour), then write just enough code to make it pass, tidy up, run every quality check, and commit. Then the next scenario. Small, safe steps.

## Before you start

1. **Argument:**
   - `@KEY-nn` → build that one scenario.
   - `specs/NNN-slug` or `NNN` → build every not-yet-implemented scenario in that feature, in **tech-plan task order**, pausing after each for the human.
   - Nothing → use `PROGRESS.md` (resume) or the current branch `feat/NNN-slug`; if neither, ask.
2. **Preconditions** — stop and name the missing step if any fails:
   - `apps/` exists → else `/scaffold`.
   - `specs/NNN-slug/02-scenarios/` has the tag → else `/scenarios`.
   - `specs/NNN-slug/05-tech-plan.md` exists → else `/tech-plan`.
   - `grill-log.md` has a session on the tech plan → if not, recommend `/grill` first; continue only if the human explicitly says skip.
3. **Branch:** must be `feat/NNN-slug`. If on `main`, create it: `git switch -c feat/NNN-slug`. If on another feature branch, ask.
4. **Read:** the PRD requirements the tag references, the scenario (and its Background), the tech-plan task(s) for the tag, the stack profile in `docs/stacks/`, `docs/standards/engineering.md`, `docs/standards/testing.md`.

## Steps (repeat per scenario)

### Step 1 — Restate the scenario

Show the scenario text and, in Teaching mode, a two-line plain-English summary: *"When a member votes twice on the same poll, the second vote replaces the first — so each person counts once."* Name the tech-plan task and the files you expect to touch.

If anything in the scenario, PRD or plan is ambiguous or contradictory, **stop and ask** (one question, with a recommended answer). Never fill gaps silently. If the answer changes the spec, update the spec file first (with a yes), then build.

### Step 2 — Step definitions (Red, part 1)

Search for existing step definitions that already match each Given/When/Then line — reuse them. Write the missing ones following `docs/standards/testing.md` (accessible selectors, `data-testid="<tag-lowercase>-<element>"` only when needed, no sleeps, builders for data). For a scenario with many new steps, delegate to the `qa-engineer` role.

### Step 3 — Observe red (Red, part 2)

Run only this scenario with the stack's BDD runner (exact command in the stack profile), filtering by tag, e.g.:

```bash
cd apps/web && npx bddgen && npx playwright test --grep "@LUNCH-03"
```

Read the failure. It must fail **because the behaviour is missing** (element not found, 404, wrong value). If it fails for a setup reason (undefined step, import error, wrong URL, server not starting), fix the test and run again. Record the failure line — it goes in `PROGRESS.md` and the commit body as evidence.

### Step 4 — Minimal code (Green)

Implement the smallest change that makes the scenario pass, following the tech plan's data model and API contract:

- UI work → delegate to `frontend-engineer` or do it here following that role's rules.
- API / data work → delegate to `backend-engineer` or do it here following that role's rules.
- Independent UI and API work for the same scenario can run in parallel; give each role the tag, spec folder, tech-plan task and the agreed contract.

Add **unit tests** for any business rule with branches (each Examples row with distinct logic deserves one). Run the scenario again → green.

### Step 5 — Refactor

With tests green: clear names, extract small functions, remove duplication, delete dead code. Re-run the scenario after each meaningful change.

### Step 6 — Run every gate

```bash
npm run verify
```

All green, or stop and fix. Never disable a test, lint rule or type check to get green. If something unrelated is broken, tell the human rather than "fixing" it silently.

If the Playwright MCP server is connected and the scenario has UI, open the page, click through the scenario, and take a screenshot for the PR.

### Step 7 — Log progress

Append to `PROGRESS.md` (create it if missing):

```markdown
## <date> — @LUNCH-03 vote replaces previous vote ✅
- Red: `expected "1 vote" but got "2 votes"` (lunch-03-vote-count)
- Changed: apps/web/src/server/votes.ts (upsert on poll_id+member_id), e2e/steps/vote.steps.ts
- Decision: unique index (poll_id, member_id) instead of app-level check — race-safe
- Open question: none
- Next: @LUNCH-04
```

### Step 8 — Commit

Show `git status` and the diff summary. Propose:

```
feat(<slug>): <what the user can now do> [LUNCH-03]

Red: <the failure line from Step 3>
```

Commit after the human says yes (or if they said "commit as you go" earlier in this session). Never push — that's `/ship`.

### Step 9 — Teach, then continue

In Teaching mode, give the *What I did / Why / What to check* note (below). Then show the next unimplemented tag and ask *"Build @KEY-nn next?"*

## When things go wrong

- **Same failure twice after two different fixes** → stop, summarise what you tried, and delegate to the `griller` role or ask the human. Don't thrash.
- **The scenario seems wrong** (contradicts the PRD, impossible as written) → stop. Propose the spec change; edit the `.feature` file only after a yes, and note it in `grill-log.md`.
- **The tech plan is wrong** (contract doesn't work) → propose an update to `05-tech-plan.md` first.

## Gate — before moving on (per scenario)

- [ ] Scenario was seen failing for the right reason (failure line recorded)
- [ ] Scenario passes; new unit tests pass
- [ ] `npm run verify` passes
- [ ] `PROGRESS.md` updated
- [ ] One commit with the scenario tag in the subject

## Tell the human

> ✅ **@LUNCH-03 is green** — *"a second vote replaces the first"*. (3 of 9 scenarios done)
>
> **What I did:** wrote the steps, watched them fail (`expected "1 vote" but got "2 votes"`), changed the vote save to update instead of insert, added a unique database index, ran all checks.
> **Why:** the index makes double-voting impossible even if two clicks arrive at the same moment — app code alone can't promise that.
> **What to check:** run the app, vote twice on a poll, see the count stay at 1. Commit: `feat(lunch-poll): replace a member's previous vote [LUNCH-03]`.
>
> **Next:** `/build @LUNCH-04` — *"voting closes at the deadline"*.

When every scenario in the feature is green: *"All 9 scenarios pass. Next: `/review`, then `/ship`."*
