---
name: stories
description: Break a PRD, epic or feature into a backlog of small, independently shippable user stories at specs/NNN-slug/02-stories.md — vertical slices on a story map with a walking skeleton, "As a / I want / so that" cards, Given/When/Then acceptance criteria pre-tagged as future scenarios, an INVEST scorecard, proven splitting patterns, a build order and an FR → story coverage matrix. Use when someone says "write user stories", "break this epic into stories", "turn this PRD into a backlog", "split this story", "acceptance criteria for X", or before /scenarios.
argument-hint: "[NNN | path to PRD or epic doc | raw epic text | US-n to split]"
---

# /stories — PRD or epic → user stories

> **Role:** business-analyst · **Input:** `specs/NNN-slug/01-prd.md` (or an epic, doc or raw text) · **Output:** `specs/NNN-slug/02-stories.md` (+ optional tracker issues) · **Next:** `/scenarios`

## What this does

A user story is one small thing a specific person can do after we ship it, and why they care: *As Sam, I want to vote in two taps, so that I take part between calls.* This skill cuts a feature into stories that are each **worth shipping on their own** — thin slices through UI, logic and data — never layers like "build the API". Every story gets acceptance criteria in Given/When/Then, which `/scenarios` turns into executable tests, so nothing gets written twice.

**The one test that matters:** *if this story shipped alone, would someone be better off?* If not, it's a task, not a story.

## Before you start

Resolve the input:

| Argument | Do this |
| --- | --- |
| `NNN`, a spec folder, or nothing on a `feat/NNN-slug` branch | Use `specs/NNN-slug/01-prd.md`. |
| A path to a PRD / epic / doc | Read it fully first. If it's outside `specs/`, offer to create a spec folder and capture it as `00-input.md` (recommended). |
| Raw epic text, no PRD | **Quick mode.** Offer `/prd` first (recommended for anything bigger than ~5 stories). If the human declines, capture the text as `00-input.md` and continue: stories become the requirements (`US-n` replaces `FR-n` as the scenario requirement tag). |
| `US-n` | **Split mode.** Re-slice just that story in the existing `02-stories.md` (Steps 5–8). |

- If the PRD is not `Approved`, say so and recommend approving (and grilling) it first. Continue only if the human insists.
- Read `grill-log.md` if present — its decisions override the PRD. Flag conflicts.
- If `02-stories.md` exists, you are **extending**: keep every existing ID and tag; never renumber.
- **Who, what outcome, what scope** must be clear. If the persona, the outcome or the scope boundary is unclear, ask — one question at a time, with a recommended answer. Never invent them.

## Steps

### Step 1 — Load inputs

Read the PRD (personas, goals, `FR-n` / `NFR-n`, high-level `US-n` in section 6, non-goals, scope, open questions, scenario KEY), `grill-log.md`, any existing `02-scenarios/` (to continue tag numbers), and the three references:

- [`references/stories-template.md`](references/stories-template.md) — the file you will write
- [`references/splitting-patterns.md`](references/splitting-patterns.md) — how to cut a big story
- [`references/story-quality.md`](references/story-quality.md) — INVEST scorecard, acceptance-criteria rules, anti-patterns, Definition of Ready

Target quality: [`examples/team-lunch-poll/02-stories.md`](../../../examples/team-lunch-poll/02-stories.md).

### Step 2 — Users, outcome and the backbone

1. Name the personas exactly as the PRD does ("Sam, team member" — never "user").
2. Write the feature's outcome in one sentence: what changes for them when this ships.
3. Lay out the **backbone**: the user's activities in the order they happen (3–7 verbs, e.g. *Get in → Start a poll → Vote → Get the result*). This is the top row of the story map.

### Step 3 — Slice into vertical stories

Work through the PRD's high-level stories (`US-1`, `US-2`…) one by one:

- **Small enough already** (fits in a few days, one persona, one verb, ≤ ~5 acceptance criteria) → keep it as one delivery story with the **same ID** (`US-3`).
- **Too big** → split with a pattern from `splitting-patterns.md`. Children get dotted IDs: `US-2` → `US-2.1`, `US-2.2`. Record each split in the *Splits made* table, with the pattern and the reason.
- **Missing** — a Must/Should FR that no PRD story covers → add a story (next free `US-n`) and tell the human.
- **Quick mode** (no PRD): number stories `US-1`, `US-2`… directly.

Then pick the **walking skeleton**: the thinnest set of stories that touches every backbone activity end to end, so the whole path can be demoed early. One story per activity, simplest version.

### Step 4 — Write each card

Use the card format from the template:

1. **Story form** — *As [named persona], I want [one capability], so that [real outcome]*. The "so that" must name a benefit, not restate the action ("so that I can export a CSV" ✗).
2. **Acceptance criteria** — one line each, Given / When / Then, observable behaviour only:
   - at least one happy path, plus the edge cases that matter: invalid, empty, unauthorized, limits, duplicates/concurrency, time, failure;
   - **pre-assign each criterion its future scenario tag** (`@LUNCH-08`), continuing from the highest tag already used in `02-scenarios/` — `/scenarios` keeps these numbers, so traceability starts here;
   - `NFR-n` constraints become criteria on the stories they affect (e.g. "…on a 360 px phone in ≤ 3 taps"), not separate stories — unless they describe their own visible behaviour (e.g. "votes are private");
   - probabilistic / ML behaviour gets **threshold** criteria against a named eval set — see `story-quality.md`.
3. **Header line** — size (`XS`/`S`/`M`/`L`), MoSCoW priority (inherited from its FRs), persona, requirements (`FR-n`, `NFR-n`), and "Split from US-n (pattern)" when it applies.
4. **Notes / edge cases**, **Out of scope** (deferred work and where it lives, e.g. "Changing a vote → US-2.2"), **Depends on**.

### Step 5 — INVEST scorecard

Score every story on the six letters (✅ / ⚠️ / ❌) using `story-quality.md`. For each ⚠️ or ❌, apply the fix in the same pass:

| Fails | Usual fix |
| --- | --- |
| **I**ndependent | Re-slice so each story carries its own thin piece of data and UI; or state the dependency and order it. |
| **N**egotiable | Remove implementation detail (screens, tables, libraries) from the story text and criteria. |
| **V**aluable | Name the persona and the benefit — or merge it into the story it serves. |
| **E**stimable | Answer the open question, or add a time-boxed **spike** story (see `splitting-patterns.md`). |
| **S**mall | Split it (Step 6). |
| **T**estable | Rewrite vague criteria ("fast", "intuitive") as observable Given/When/Then with numbers. |

### Step 6 — Split anything still too big

Split when a story is `L`, has more than ~5 criteria, has "and" in its "I want", serves two personas, or the team couldn't agree on a size. Use the decision flow in `splitting-patterns.md`, then re-run Step 5 on the children. A good split leaves the first child valuable on its own; if both halves are useless alone, try another pattern.

### Step 7 — Sequence

1. Fill the **story map**: backbone columns × rows **Walking skeleton** / **Rest of release** (Must + Should) / **Could** / **Later** (Won't this time).
2. Write the **build order**: walking skeleton first, then by dependency, then by value (happy paths before edges, Must before Should). One line of *why* per position — e.g. "US-6 first: votes are keyed by member, so building it later means reworking US-2.1".

### Step 8 — Coverage check

Fill the coverage tables from the template and report:

- every Must/Should `FR-n` covered by ≥ 1 story — list gaps as ⚠️;
- every story traced to ≥ 1 `FR-n` / `NFR-n` (or, in quick mode, standing as its own requirement) — a story with none is scope creep: ask whether to add a requirement or drop it;
- every PRD `US-n` kept, split, or explicitly deferred.

### Step 9 — Self-check

Run the quality bar in `story-quality.md` (§ Quality bar). Fix before showing the human.

### Step 10 — Review with the human

Show the story map, the build order, the split log and any remaining ⚠️ (INVEST or coverage). Ask for *"approve"* or changes. On approval set `Status: Approved` with today's date.

### Step 11 — Export to the tracker (optional, only with a yes)

Ask: *"Want these as issues in <tracker>? (Recommended: yes for team projects, no for solo.)"*

- **GitHub Issues** (Project Profile `Issue tracker`): show the list of titles and labels first and wait for an explicit yes. Then, per story, `gh issue create --title "US-2.1 Vote once" --label story --label "size:M" --body-file <tmp>` with the card as the body and a link to `02-stories.md`. Missing labels → ask before `gh label create`. Write each issue number back into its card (`Issue: #12`). Never create, edit or close issues without that yes.
- **Jira / Azure DevOps / other**: offer `specs/NNN-slug/02-stories.csv` (Summary, Description, Acceptance Criteria, Story Points, Labels, Parent) for the tracker's CSV import.
- **None**: skip.

## Gate — before moving on

- [ ] Human approved `02-stories.md`
- [ ] Every story passes INVEST, or its ⚠️ is written down with a reason the human accepted
- [ ] Walking skeleton identified; build order has a reason per position
- [ ] Every Must/Should FR covered; no untraced stories
- [ ] Every acceptance criterion carries a scenario tag, unique across the spec

## Tell the human

```
🧩 Stories written: specs/NNN-slug/02-stories.md
   <n> stories from <n> PRD stories · <n> splits · walking skeleton: US-a → US-b → US-c → US-d
   sizes: <n> XS · <n> S · <n> M · <n> L · coverage <n>/<n> FRs · <n> acceptance criteria pre-tagged

Next: /scenarios NNN — turns the acceptance criteria into executable Gherkin, keeping the tags.
```

Teaching mode: **What I did** (cut the feature into slices that each work end to end, and wrote how we'll know each one is done) · **Why** (small, complete slices mean you can demo progress every day and stop at any point with something useful) · **What to check** (read the walking skeleton — is that really the smallest version worth showing someone? does every "so that" sound like something your user would actually say?).
