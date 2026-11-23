---
name: prd
description: Turn raw input (notes, transcripts, emails, Slack threads, a one-line idea, or an existing 00-input.md) into a structured PRD at specs/NNN-slug/01-prd.md with numbered FR/NFR requirements, MoSCoW priorities, non-goals, success metrics and a scenario KEY. Use when the user shares a raw idea, asks for a PRD, requirements or a product spec, or wants to tighten an existing PRD.
argument-hint: "[raw text | path | NNN]"
---

# /prd — Raw input → PRD

> **Role:** product-manager · **Input:** raw text, a file, or `specs/NNN-slug/00-input.md` · **Output:** `specs/NNN-slug/01-prd.md` · **Next:** `/grill prd`, then `/stories`

## What this does

A PRD (Product Requirements Document) is a short document that says *who has what problem, what we'll build, how we'll know it worked, and what we are not doing*. This skill reads your raw input, asks you a handful of questions one at a time, and writes a PRD where every requirement has an ID (`FR-1`, `FR-2`…) so it can be traced to tests later.

## Before you start

- **Argument is a number / folder** → use that spec folder; `00-input.md` must exist.
- **Argument is raw text or a file path** and no folder exists → create the folder and `00-input.md` exactly as `/new-feature` Step 0–1 does (next `NNN`, confirm slug, save input verbatim).
- **No argument** → if exactly one spec folder lacks `01-prd.md`, offer it; otherwise ask for the input.
- `01-prd.md` already exists → ask: *"Revise the existing PRD, or start over? (Recommended: revise.)"* When revising, keep requirement IDs stable — never renumber; mark removed ones `~~FR-4~~ (removed <date>: reason)`.

## Steps

### Step 1 — Locate the input

Resolve the spec folder and read `00-input.md`. Also skim other `specs/*/01-prd.md` for personas and vocabulary to reuse.

### Step 2 — Extract

Read the input and sort every statement into: **problem · user · wish · constraint · solution idea · open question**. Keep this list in your head (or show it briefly in Teaching mode). Raw input is mostly solution ideas — dig for the problem behind each one.

### Step 3 — Ask clarifying questions (one at a time)

Ask only what the input does not answer and that changes the PRD. Usually 3–6 questions. Each one:

```
Q<n>: <question>
Why I'm asking: <one line>
Recommended: <your default> — reply "yes" to accept, or tell me otherwise.
```

Good first questions, in priority order — skip any the input already answers:

1. Who is the primary user, and what do they do today without this?
2. What is the one outcome that would make v1 a success? (→ success metric)
3. What is explicitly *out* for v1? (→ non-goals)
4. Any hard constraints — deadline, platform, compliance, existing system to integrate with?
5. Who must *not* be able to do what? (→ permissions)

If the human says "just write it", stop asking and record the rest as assumptions.

### Step 4 — Draft the PRD

Copy the structure from [`references/prd-template.md`](references/prd-template.md) into `specs/NNN-slug/01-prd.md` and fill every section. Rules:

- **Requirements:** one testable behaviour each. `FR-n` for what the system does, `NFR-n` for qualities (performance, accessibility, security, privacy). Each has MoSCoW: **Must / Should / Could / Won't (this time)**. Aim for ≤ 8 Musts in v1 — more means scope is not cut yet.
- **No implementation:** no frameworks, tables or pixel layouts unless the human required them. Those belong in `/design-prompt` and `/tech-plan`.
- **KEY:** pick a 3–6 letter uppercase code from the feature name (`team-lunch-poll` → `LUNCH`). Check no other spec uses it (`grep -r "Scenario key" specs/`).
- **Assumptions:** every inferred fact gets a row in the Assumptions table *and* is marked `**Assumption A<n>**` where it is used.
- **Open questions:** each with a recommended answer.
- **Evidence:** when a requirement comes straight from the input, you may quote it briefly — it helps reviewers trust the PRD.

Worked example: [`examples/team-lunch-poll/01-prd.md`](../../../examples/team-lunch-poll/01-prd.md).

### Step 5 — Self-check

Before showing the human, check:

- [ ] Every FR is testable — you could write a Given/When/Then for it without inventing anything.
- [ ] Every persona has at least one user story; every user story maps to at least one FR.
- [ ] Non-goals section is non-empty.
- [ ] Success metrics have a number and a timeframe.
- [ ] No contradiction with `00-input.md` that is not explained.

### Step 6 — Review with the human

Present: summary line, KEY, Must-haves, non-goals, the top 3 assumptions most likely to be wrong, open questions. Ask them to read the file and reply *"approve"* or request changes. Iterate until approved, then set the PRD `Status:` to `Approved` and the date.

## Gate — before moving on

- [ ] Human replied "approve" (status line updated)
- [ ] Open questions answered, or parked with an owner
- [ ] KEY chosen and unique
- [ ] Recommended: `/grill prd` run, verdicts recorded in `grill-log.md`

## Tell the human

```
📄 PRD written: specs/NNN-slug/01-prd.md
   KEY: <KEY> · <n> Must · <n> Should · <n> Could · <n> NFRs · <n> open questions

Next: /grill prd  (recommended — 5 minutes, catches rework early)
  or: /stories NNN   (cuts the PRD into user stories, then /scenarios)
```

Teaching mode: **What I did** (turned your notes into numbered requirements) · **Why** (numbers let us prove later that every requirement has a test) · **What to check** (do the non-goals match what you really want to leave out? are the assumptions true?).
