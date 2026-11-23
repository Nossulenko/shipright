---
name: next
description: Answers "where am I and what do I do next?" Reads specs/, git branch and status, and PROGRESS.md, works out which pipeline stage each feature is at, prints a status board, and recommends the single next command. Use when the human asks what's next, where they are, what to do, or seems unsure how to continue.
argument-hint: "[optional: spec folder or NNN]"
---

# /next — Where am I, and what's next?

> **Role:** mentor (main conversation) · **Input:** `specs/`, git, `PROGRESS.md`, Project Profile · **Output:** a status board + one recommended command · **Next:** whatever it recommends

## What this does

Looks at what exists in the repo and tells the human, in plain words, where each feature stands in the Shipright pipeline and the **one** command to run next. It never changes files.

## Before you start

- This skill is read-only. Don't create, edit or commit anything.
- Ignore `examples/` — it's a worked example, not the human's work.

## Steps

### Step 1 — Check the Project Profile

Read the Project Profile in `AGENTS.md`. If Product name or Frontend/Backend is `not set`, the answer is simply: **run `/start`**. Say why in one sentence and stop.

### Step 2 — Check the app exists

If `apps/` is missing or empty, the app hasn't been scaffolded. Unless every feature is still before stage 05, the next step is `/scaffold`. (A feature can go through 00–03 before scaffolding — that's fine and normal.)

### Step 3 — Gather git state

```bash
git branch --show-current
git status --porcelain
git log --oneline -15
```

Note: current branch, uncommitted changes (count), whether we're on `main`.

### Step 4 — Read PROGRESS.md

If `PROGRESS.md` exists, a feature is mid-build. Read its last entries: last finished scenario, open questions, what's next. This takes priority — the human is probably resuming work.

### Step 5 — Work out each feature's stage

For each folder `specs/NNN-slug/` (sorted by NNN), check which files exist:

| Stage | Done when                                                                 |
| ----- | ------------------------------------------------------------------------- |
| 00    | `00-input.md` exists                                                      |
| 01    | `01-prd.md` exists                                                        |
| PRD grilled | `grill-log.md` has a session whose target is `01-prd.md`            |
| 02 stories | `02-stories.md` exists                                              |
| 02    | `02-scenarios/` has at least one `.feature` file                          |
| 03    | `03-design-prompt.md` exists                                              |
| 04    | `04-design/` contains anything besides a README/.gitkeep                  |
| 05    | `05-tech-plan.md` exists                                                  |
| Plan grilled | `grill-log.md` has a session whose target is `05-tech-plan.md`     |
| 06    | scenario tags implemented — see below                                     |
| 08    | a merged PR or commits on `main` reference the spec                       |

**Implemented scenarios:** collect every scenario tag (`@KEY-nn`) from the `.feature` files. A tag counts as implemented when it appears in a commit message (`git log --oneline --all | grep -c "KEY-nn"`) **or** in step/test code under `apps/` (`grep -rl "KEY-nn" apps/`). Report `implemented / total`.

To check for an open PR (if `gh` is available and authenticated):

```bash
gh pr list --head "$(git branch --show-current)" --json number,title,state,url
```

### Step 6 — Pick THE next command

Choose the earliest incomplete step for the feature the human is working on (current branch `feat/NNN-slug`, or `PROGRESS.md`, or the argument, or the lowest-numbered unfinished feature):

| Situation                                        | Next command                                     |
| ------------------------------------------------ | ------------------------------------------------ |
| No specs yet                                     | `/new-feature` (paste your idea)                 |
| 00 only                                          | `/prd specs/NNN-slug`                            |
| 01, not grilled                                  | `/grill specs/NNN-slug/01-prd.md`                |
| PRD grilled, no stories                          | `/stories specs/NNN-slug`                        |
| Stories, no scenarios                            | `/scenarios specs/NNN-slug`                      |
| 02, no design prompt (feature has UI)            | `/design-prompt specs/NNN-slug`                  |
| 03, no export                                    | "Paste `03-design-prompt.md` into Claude Design, export, drop the files in `04-design/`, then `/import-design specs/NNN-slug`" |
| No app scaffolded and stage ≥ 04                 | `/scaffold`                                      |
| 04 (or no UI), no tech plan                      | `/tech-plan specs/NNN-slug`                      |
| 05, not grilled                                  | `/grill specs/NNN-slug/05-tech-plan.md`          |
| Plan grilled, scenarios left                     | `/build @KEY-nn` (the first unimplemented tag in tech-plan task order) |
| All scenarios implemented, no PR                 | `/review` then `/ship`                           |
| PR open                                          | "Get it reviewed and merged" (link the PR)       |
| Merged, never deployed (`docs/deploy/` empty)    | `/deploy`                                        |
| On `main` with uncommitted changes               | Warn first: create a branch before anything else |

Skip the design stages (03–04) for features with no UI (API-only stack, or the PRD says no UI).

## Output format

```markdown
## 🧭 Where you are — <Product name>

Branch: `feat/001-team-lunch-poll` · 3 uncommitted changes

| Feature | 00 | 01 | 🔥 | 02 | 03 | 04 | 05 | 🔥 | Build | Shipped |
|---------|----|----|----|----|----|----|----|----|-------|---------|
| 001 team-lunch-poll | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⬜ | 0/9 | ⬜ |

**Next:** `/grill specs/001-team-lunch-poll/05-tech-plan.md`
**Why:** the tech plan decides your data model and API — grilling it now is far cheaper than changing it after you've built 9 scenarios.
```

Use ✅ done, ⬜ not yet, ➖ skipped (not applicable). Keep the "Why" to one or two sentences.

## Gate — before moving on

- [ ] The human sees one clear next command and why

## Tell the human

Print the board and the next command. Offer: *"Want me to run it now?"* — but don't run it unless they say yes.
