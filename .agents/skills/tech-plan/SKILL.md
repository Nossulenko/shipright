---
name: tech-plan
description: Turn approved scenarios (and the design export, if any) into a technical plan at specs/NNN-slug/05-tech-plan.md — architecture sketch in Mermaid, data model, API contracts, non-functionals, risks, and an ordered list of thin vertical-slice tasks each mapped to scenario tags, files and tests. Proposes ADRs for consequential choices and updates docs/architecture/README.md. Use when the user asks how to build a feature, wants a technical design, data model, API design or task breakdown, or before /build.
argument-hint: "[NNN]"
---

# /tech-plan — Scenarios → buildable plan

> **Role:** architect · **Input:** `01-prd.md`, `02-scenarios/`, `04-design/` (if any), Project Profile, `docs/architecture/` · **Output:** `specs/NNN-slug/05-tech-plan.md`, ADRs in `docs/decisions/`, `docs/architecture/README.md` updates · **Next:** `/grill tech-plan`, then `/build`

## What this does

The tech plan answers *how* we'll build what the scenarios describe: which pieces of the system change, what data we store, what the API looks like, and — most usefully for you — an ordered list of small tasks. Each task makes one or a few scenarios pass end to end, so you always have something working.

## Before you start

- Resolve the spec folder. `02-scenarios/` must have feature files; if the feature has UI, `04-design/` ideally has an export (if not, ask: *"Plan now and adjust after design, or wait? (Recommended: plan now if the design is mostly settled.)"*).
- The Project Profile must have Frontend, Backend, Database and Cloud set. If any say `not set`, stop and suggest `/start` — don't guess a stack.
- Read the stack profile in `docs/stacks/` that matches the Project Profile, plus `docs/standards/engineering.md` and `docs/standards/security.md`.
- If `05-tech-plan.md` exists, revise it rather than starting over; keep task IDs stable.

## Steps

### Step 1 — Read the current state

Read `docs/architecture/README.md`, any ADRs it cites, and the existing code the feature will touch (`apps/`). List what already exists that you can reuse (tables, components, auth, utilities).

### Step 2 — Sketch the architecture

One Mermaid diagram of the pieces this feature touches and the main request flow. Keep it to what changes or is used — not the whole universe.

### Step 3 — Model the data

For each entity: fields, types, keys, constraints, indexes, and **which scenario needs each field**. A field with no scenario doesn't exist yet. Note migrations needed for existing tables.

### Step 4 — Define the contracts

For every API route, server action or event: method/path (or function name), input schema, output schema, error cases with status codes, and the authorisation rule. Each error case should map to an `@error` scenario — if one doesn't, either add the scenario (ask) or drop the error case.

### Step 5 — Slice the work

Write an ordered task list. Rules:

- **T0 is a walking skeleton** if the app or this area doesn't exist yet: the thinnest path that runs end to end (page → server → database → page) and passes `npm run verify`.
- Every later task is a **vertical slice** (UI + logic + data + test) that makes specific scenarios pass. No "build all the tables" or "do the whole UI" tasks.
- Each task lists: **ID**, **scenario tags**, **what changes**, **files**, **test that proves it** (the scenario + any unit tests), **size** S/M/L. Split any L.
- Order by dependency, then by value (happy paths before edges).

### Step 6 — Non-functionals, risks, rollout

- **Security:** authentication, authorisation (checked on the server), input validation, secrets, personal data.
- **Performance:** budgets from NFRs; obvious N+1 or unbounded queries.
- **Observability:** health check, structured logs, error tracking, what to alert on.
- **Accessibility:** from NFRs and design.
- **Risks:** with likelihood, impact, mitigation.
- **Rollout:** feature flag? migration order? rollback steps?

### Step 7 — Decisions and current state

- Any expensive-to-reverse choice (database, auth provider, hosting model, new major dependency, data-ownership boundary) → write an ADR from [`docs/decisions/0000-template.md`](../../../docs/decisions/0000-template.md), status **Proposed**, and link it from the plan. Only the human accepts an ADR.
- If the system shape changes, update `docs/architecture/README.md` in the same change.

Fill [`references/tech-plan-template.md`](references/tech-plan-template.md) into `specs/NNN-slug/05-tech-plan.md`. Worked example: [`examples/team-lunch-poll/05-tech-plan.md`](../../../examples/team-lunch-poll/05-tech-plan.md).

### Step 8 — Self-check

- [ ] Every scenario tag appears in at least one task
- [ ] Every task (except T0/setup) has scenario tags and a named test
- [ ] Every API error case maps to an `@error` scenario
- [ ] Nothing outside the Project Profile stack without an ADR
- [ ] A junior could start T0/T1 without asking a question

### Step 9 — Recommend the grill

List the three decisions you're least sure of and recommend `/grill tech-plan` before building.

## Gate — before moving on

- [ ] Human approved the plan
- [ ] `/grill tech-plan` run (or skip recorded in `grill-log.md`); ❌ verdicts fixed
- [ ] ADRs proposed for consequential choices; human accepted or rejected each
- [ ] `docs/architecture/README.md` updated if the system shape changed

## Tell the human

```
🧱 Tech plan ready: specs/NNN-slug/05-tech-plan.md
   <n> tasks (T0–T<n>) · <n> entities · <n> endpoints · <n> ADRs proposed
   First up: T1 — <title> [<KEY>-01]

Least certain about: 1) … 2) … 3) …
Next: /grill tech-plan   then   /build NNN
```

Teaching mode: **What I did** (designed the data and API, then cut the work into small end-to-end slices) · **Why** (small slices mean you always have working software and find integration problems on day one, not at the end) · **What to check** (does T1 feel small enough to finish in a sitting? do you understand every technology named?).
