---
name: scenarios
description: Convert an approved PRD into Gherkin .feature files at specs/NNN-slug/02-scenarios/, with a unique @KEY-nn tag and @FR-n requirement tag on every scenario, edge and error cases from a coverage checklist, and an FR → scenario coverage matrix written back into the PRD. Use when the user asks for Gherkin, BDD scenarios, acceptance criteria, feature files, or test cases from a PRD, or wants existing feature files reviewed for gaps.
argument-hint: "[NNN | path to PRD]"
---

# /scenarios — PRD → Gherkin

> **Role:** business-analyst · **Input:** `specs/NNN-slug/01-prd.md` · **Output:** `specs/NNN-slug/02-scenarios/*.feature` + coverage matrix in the PRD · **Next:** `/design-prompt` (UI features) or `/tech-plan` (backend-only)

## What this does

Gherkin is a plain-English format for describing behaviour as examples: **Given** some starting situation, **When** someone does something, **Then** this should happen. These files are written in business language, so a stakeholder can read them — and they're also executable: in `/build` each one becomes an automated acceptance test. If a behaviour isn't in a scenario, it won't be built.

## Before you start

- Resolve the spec folder (argument, current branch `feat/NNN-slug`, or the most recent folder with a PRD but no scenarios). Ask if ambiguous.
- `01-prd.md` must exist. If its status is not `Approved`, say so and recommend approving (and grilling) it first; continue only if the human insists.
- Read `grill-log.md` if present: decisions made there override PRD text. Flag any conflict.
- If `02-scenarios/` already has files, you are **extending**: keep every existing tag number; new scenarios continue from the highest `@KEY-nn`.

## Steps

### Step 1 — Load the inputs

Read the PRD (requirements, personas, scenario KEY, non-goals) and [`references/gherkin-style-guide.md`](references/gherkin-style-guide.md). Look at [`examples/team-lunch-poll/02-scenarios/`](../../../examples/team-lunch-poll/02-scenarios/) for the target quality.

### Step 2 — Group into capabilities

Group the FRs into capabilities a user would recognise — one `.feature` file each, kebab-case: `create-poll.feature`, `vote.feature`. Usually 2–6 files. Show the grouping to the human in one line each before writing.

### Step 3 — Write the happy paths

For each Must and Should FR, write the main success scenario. Use the personas' names from the PRD as actors and realistic data.

### Step 4 — Attack each happy path (coverage checklist)

For every happy path, walk the checklist and add a scenario for each item that matters to this feature:

| Check | Ask yourself | Tag |
| --- | --- | --- |
| Validation | What if input is missing, too long, the wrong format? | `@error` |
| Permissions | Who must *not* be able to do this? | `@error` |
| Empty state | What does the user see when there's nothing yet? | `@edge` |
| Limits | Zero, one, max, max + 1? | `@edge` |
| Duplicates & concurrency | Same action twice? Two users at once? | `@edge` |
| Time | Deadlines, time zones, expiry, "after it closed"? | `@edge` |
| Dependency failure | What does the user see if a service is down? | `@error` |

Skip checks that genuinely don't apply — but you should be able to say why.

### Step 5 — Tag every scenario

```gherkin
@LUNCH-04 @FR-3 @error
Scenario: A member cannot vote after the poll has closed
```

- `@<KEY>-<nn>` — unique, two digits, sequential across the whole `02-scenarios/` folder. Never reuse or renumber.
- `@FR-n` / `@NFR-n` — at least one; several if the scenario proves several.
- `@happy` / `@edge` / `@error` — exactly one.
- `@wip` — only for deliberately unfinished scenarios.

Put `# OPEN QUESTION: …` comments at the top of a feature file for anything the PRD doesn't answer. Never guess.

### Step 6 — Build the coverage matrix

Fill the table in section 12 of the PRD (**Scenario key & traceability**) — this is the one edit you make to the PRD:

```markdown
| Requirement | Scenarios |
| --- | --- |
| FR-1 | @LUNCH-01, @LUNCH-02 |
| FR-2 | ⚠️ none |
```

Report every Must/Should FR with no scenario, and every scenario with no FR (scope creep — ask whether to add an FR or drop the scenario).

### Step 7 — Self-check

- [ ] Every scenario has exactly one `When` (an `And` under it must be part of the same action)
- [ ] No UI coupling: no selectors, button colours, URLs, "click"
- [ ] `Then` asserts something a user can observe
- [ ] Tags unique; every scenario has `@KEY-nn`, `@FR-n` and a type tag
- [ ] `npm run verify:harness` passes (it lints `.feature` tags)

### Step 8 — Review with the human

Show: files, scenario counts (happy / edge / error), the coverage matrix, open questions. Ask for *"approve"* or changes.

## Gate — before moving on

- [ ] Human approved the scenarios
- [ ] Every Must/Should FR has ≥ 1 scenario; every Must FR has ≥ 1 `@error` or `@edge` scenario
- [ ] Coverage matrix filled in the PRD
- [ ] Open questions answered or parked with an owner

## Tell the human

```
🥒 Scenarios written: specs/NNN-slug/02-scenarios/
   <n> files · <n> scenarios (<n> happy · <n> edge · <n> error) · coverage <n>/<n> FRs

Next: /design-prompt NNN   (or /tech-plan NNN if there's no UI)
```

Teaching mode: **What I did** (wrote each requirement as concrete examples, then tried to break each one) · **Why** (these become your acceptance tests — when they all pass, the feature is done) · **What to check** (read one file aloud — does it describe what you actually want? is any important "what if" missing?).
