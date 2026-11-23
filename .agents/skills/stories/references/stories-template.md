# `02-stories.md` template

Copy everything below the line into `specs/NNN-slug/02-stories.md` and fill it in. Keep the section order — `/next`, `/scenarios` and `/tech-plan` read it. A filled-in example: [`examples/team-lunch-poll/02-stories.md`](../../../../examples/team-lunch-poll/02-stories.md).

---

````markdown
# User stories — <Feature name>

> **Spec:** `specs/NNN-slug/` · **Status:** Draft | Approved (YYYY-MM-DD) · **Source:** [`01-prd.md`](01-prd.md) (or `00-input.md` in quick mode)
> **Scenario key:** `<KEY>` · **Stories:** <n> delivery stories from <n> PRD stories · **Walking skeleton:** US-a → US-b → US-c

## 1. Who and why

- **Personas:** <Name, role> · <Name, role> — exactly as in the PRD.
- **Outcome:** <one sentence: what changes for them when this ships>.

## 2. Story map

The backbone (top row) is what the user does, in order. Each row below is a release slice; read a row left to right and you get a version of the product that works end to end.

|                        | <Activity 1> | <Activity 2> | <Activity 3> | <Activity 4> |
| ---------------------- | ------------ | ------------ | ------------ | ------------ |
| **Walking skeleton**   | US-a <title> | US-b <title> | US-c <title> | US-d <title> |
| **Rest of release**    |              | US-e <title> | US-f · US-g  | US-h         |
| **Could**              |              | US-i         |              |              |
| **Later** (won't now)  |              |              |              | <FR-n idea>  |

## 3. Build order

1. **US-a <title>** — <why first: thinnest end-to-end slice / everything depends on it>
2. **US-b <title>** — <why next>
3. …

## 4. Stories

### US-a — <Short title, verb first>

`<XS|S|M|L>` · `<Must|Should|Could>` · **Persona:** <Name> · **Requirements:** FR-n, NFR-n · <Split from US-n (<pattern>)>

**As** <named persona>,
**I want** <one capability>,
**so that** <real outcome — a benefit, not the action again>.

**Acceptance criteria** → `02-scenarios/<capability>.feature`
- `@<KEY>-nn` Given <context>, when <action>, then <observable result>.
- `@<KEY>-nn` Given <edge context>, when <action>, then <result>.
- `@<KEY>-nn` Given <error or limit context>, when <action>, then <result>.

**INVEST** I ✅ · N ✅ · V ✅ · E ✅ · S ✅ · T ✅  <!-- any ⚠️ or ❌ gets a one-line reason -->
**Depends on:** <US-x | none> · **Ready:** ✅ <!-- or ⚠️ waiting on Q-n -->

**Notes / edge cases**
- <assumptions, business-rule details, data examples, links to open questions>

**Out of scope**
- <deferred behaviour> → <US-y | Later | never (non-goal)>

<!-- Issue: #nn   ← added by the optional tracker export -->

---

### US-b — …

## 5. Coverage

### Requirements → stories

| Requirement | Priority | Stories | Status |
| ----------- | -------- | ------- | ------ |
| FR-1        | Must     | US-a, US-e | ✅ |
| FR-2        | Should   | —       | ⚠️ not covered — <why / action> |
| NFR-1       | Must     | criteria on US-a, US-c | ✅ |

### PRD stories → delivery stories

| PRD story | Became | How |
| --------- | ------ | --- |
| US-1      | US-1.1, US-1.2, US-1.3 | split — <pattern> |
| US-3      | US-3   | kept as one story |

## 6. Splits made

| Parent | Children | Pattern | Why this split |
| ------ | -------- | ------- | -------------- |
| US-1   | US-1.1 · US-1.2 · US-1.3 | Happy vs. edge path, then business-rule variations | <the first child ships value alone because…> |

## 7. Open questions

| ID  | Question | Recommended answer | Blocks | Owner | Status |
| --- | -------- | ------------------ | ------ | ----- | ------ |
| Q-1 | …        | …                  | US-x   | …     | Open   |
````
