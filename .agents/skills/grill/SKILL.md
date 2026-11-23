---
name: grill
description: Interactive grilling session that stress-tests a decision until it holds — walks the decision tree one question at a time, each with a recommended answer, and gives every decision a verdict (defended / accepted risk / revise). Targets a PRD, tech plan, ADR, feature files, PR, dependency or cloud choice, or a free-text decision. Use when the user says "grill me", "grill this", "poke holes", "challenge this", "is this a good idea", or before locking a PRD, tech plan, data model, new dependency or cloud choice. Logs to grill-log.md.
argument-hint: "[prd | tech-plan | scenarios | path | \"decision text\"] [gentle|standard|brutal]"
---

# /grill — Stress-test a decision until it holds 🔥

> **Role:** griller · **Input:** a target (PRD, tech plan, file, PR or decision) · **Output:** a session appended to `specs/NNN-slug/grill-log.md` (+ ADR proposals) · **Next:** fix any ❌, then the next pipeline stage

## What this does

Grilling is a friendly interrogation of a plan. I ask you one hard question at a time — the kind a senior engineer or a sceptical customer would ask — and I always suggest an answer, so you're never stuck. Each decision ends with a verdict: ✅ defended, ⚠️ accepted risk, or ❌ revise. The whole session is written down so the reasoning isn't lost.

## Before you start

Parse the arguments:

| Target argument | Resolves to |
| --- | --- |
| `prd` | `01-prd.md` of the current spec folder |
| `scenarios` | `02-scenarios/*.feature` |
| `design` | `03-design-prompt.md` (and `04-design/` if present) |
| `tech-plan` | `05-tech-plan.md` |
| a file path | that file (ADR, doc, code) |
| `pr` or a PR number | the branch diff (`git diff main...HEAD`) or `gh pr diff <n>` |
| quoted text | a free-text decision, e.g. `"use Firebase instead of Postgres"` |
| nothing | ask: *"What should I grill? (Recommended: the most recent spec file you changed.)"* |

**Current spec folder** = the one named in the argument, else the one matching the current branch `feat/NNN-slug`, else the most recently modified `specs/NNN-*`. If ambiguous, ask.

**Intensity** (second argument): `gentle` · `standard` (default) · `brutal`. Recommend `gentle` if `grill-log.md` has no previous sessions — it's their first time.

## Steps

### Step 1 — Read before you ask

Read the target, the rest of its spec folder, every previous session in `grill-log.md`, the Project Profile in `AGENTS.md`, `docs/architecture/README.md`, and any code the target touches. Load [`references/question-bank.md`](references/question-bank.md) for the stage-specific questions.

**Never ask what the spec, code or an earlier session already answers** — cite it instead. Do not re-open a decision an earlier session settled unless there is new evidence.

### Step 2 — Get a fresh-eyes question list (optional but recommended)

For `standard` and `brutal` on a PRD, tech plan or PR: delegate to the **`griller` role** through the runtime's subagent mechanism (Claude Code: the `griller` agent; Codex: the `griller` role with `fork_turns: "none"`; Copilot: the `griller` custom agent) with the target path and intensity. It returns a ranked critique with fresh context — it hasn't seen this conversation's reasoning, so it isn't biased by it.

If no subagent mechanism is available, build the list yourself from the question bank. Never load `.agents/roles/griller.md` as a substitute for delegating — use it only to adopt the griller's behaviour in this conversation.

### Step 3 — Map the decision tree and announce it

List the decisions you'll grill, root-first (decisions others depend on come first), and the question budget: gentle ≤ 5 · standard ≤ 10 · brutal unlimited.

```
🔥 Grilling: specs/001-team-lunch-poll/01-prd.md (standard)
Decisions I'll test:
  1. Who the user is (everyone in the office vs. one team)
  2. Polls close at a fixed deadline
  3. One vote per person
  4. No sign-in for v1
Up to 10 questions. Say "stop" any time, "skip" to move on, "why" for more context.
```

### Step 4 — Ask one question at a time

Format — every question, no exceptions:

```
Q3 [Security] What stops someone voting twice by opening the poll in a private window?
Why this matters: without sign-in, "one vote per person" can't be enforced — results could be gamed.
My recommended answer: require sign-in with the company Google account (FR-7) and enforce one vote per user in the database.
Evidence: 01-prd.md FR-4 says "one vote per person"; non-goals say "no login in v1".
```

Then **wait for the answer.** After the answer:

- If it's solid → give the verdict and move on.
- If it's hand-wavy → push back **once**: *"How would we know if that's true?"* / *"What happens if it isn't?"* Then verdict.
- If they don't know → offer to accept your recommendation, or record it as ⚠️ accepted risk with an open question.

Verdicts:

- ✅ **Defended** — reasoning holds; note the evidence.
- ⚠️ **Accepted risk** — known weakness the human chooses to live with; record the risk and the *trigger* that would make us revisit it.
- ❌ **Revise** — the decision doesn't hold; record exactly what must change and in which file.

In `gentle` mode, add one extra sentence of teaching to each *Why this matters*, and frame ❌ as "here's what we learned".

### Step 5 — Close the session

Summarise in a table, then ask whether to apply the ❌ revisions now:

```
| # | Decision | Verdict | Follow-up |
| 1 | One team, not whole office | ✅ | — |
| 3 | No sign-in for v1 | ❌ | Add FR-7 Google sign-in; drop non-goal |
```

- **Apply revisions** only with the human's yes, editing the target file (PRD/plan) — never `00-input.md`.
- **Architecture-level outcomes** (database, auth, hosting, data ownership, a major dependency) → propose an ADR from [`docs/decisions/0000-template.md`](../../../docs/decisions/0000-template.md) with status `Proposed`, and link it from the log.

### Step 6 — Write the log

Append the session to `specs/NNN-slug/grill-log.md` using [`references/grill-log-template.md`](references/grill-log-template.md). Create the file with its header if it doesn't exist. Append only — never rewrite earlier sessions.

The session header **must** name the target file exactly like this — `/next` and `/build` parse it to know which stages were grilled:

```
## Session 2 — 2026-11-23 — target: 05-tech-plan.md (standard)
```

Use the spec file name (`01-prd.md`, `02-scenarios`, `03-design-prompt.md`, `05-tech-plan.md`), a repo-relative path for files outside the spec folder, or `target: decision` for free-text decisions. For targets outside a spec folder (e.g. an ADR or a dependency choice), append to the grill log of the related spec, or ask where to log it.

## Gate — before moving on

- [ ] Every decision on the tree has a verdict (or the human said stop — note what was not covered)
- [ ] ❌ items either fixed in the target file or listed as follow-ups with an owner
- [ ] Session appended to `grill-log.md`
- [ ] ADRs proposed for architecture-level decisions

## Tell the human

```
🔥 Grill done: <target> (<intensity>) — ✅ <n> · ⚠️ <n> · ❌ <n>
Logged in specs/NNN-slug/grill-log.md
<If ❌ remain:> Fix these before moving on: …
Next: <next pipeline command>
```

Teaching mode: **What I did** (questioned each decision from ten angles) · **Why** (a question now costs minutes; the same discovery after launch costs days) · **What to check** (do the ⚠️ risks feel acceptable to you? if not, flip them to ❌).

See a realistic session in [`examples/team-lunch-poll/grill-log.md`](../../../examples/team-lunch-poll/grill-log.md).
