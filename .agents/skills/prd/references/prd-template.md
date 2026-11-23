# PRD — <Feature name>

> **Spec:** `specs/NNN-slug/` · **Status:** Draft | Approved (<YYYY-MM-DD>) · **Owner:** <human's name or role>
> **Scenario key:** `<KEY>` · **Source:** `00-input.md` (link it: `[00-input.md](00-input.md)`)

<!--
How to use this template
- Fill every section. If a section truly does not apply, write "None — <why>" instead of deleting it.
- Keep requirement IDs stable forever. Removed requirements are struck through, never renumbered.
- No implementation details (frameworks, tables, layouts) unless the human explicitly required them.
-->

## 1. Summary

<One or two sentences: what we are building, for whom, and the outcome. A stranger should understand it.>

## 2. Problem

<What hurts today, for whom, how often, and what it costs them. Quote the raw input where it helps.>

**Evidence:** <where this problem shows up — the raw input, a metric, a support ticket. "None yet" is an honest answer and becomes a risk.>

## 3. Users & personas

| Persona | Who they are | Goal | Frustration today |
| --- | --- | --- | --- |
| <Name — e.g. "Sam, team member"> | <one line> | <what they want to achieve> | <what gets in the way> |

## 4. Goals & non-goals

**Goals**

- G1 — <outcome, not feature>
- G2 — …

**Non-goals (v1)** — things we are deliberately *not* doing, so nobody builds them by accident:

- <non-goal> — <why not now>

## 5. Success metrics

| Metric | Target | Timeframe | How we measure |
| --- | --- | --- | --- |
| <e.g. polls created per team per week> | <≥ 3> | <4 weeks after launch> | <count in database> |

## 6. User stories

<High-level needs, one per line. `/stories` later cuts each into delivery-sized stories in `02-stories.md`, keeping the number: US-2 → US-2.1, US-2.2.>

- **US-1** — As <persona>, I want <capability> so that <benefit>. → FR-1, FR-2
- **US-2** — …

## 7. Requirements

### Functional

| ID | Requirement (one testable behaviour) | Priority | Story |
| --- | --- | --- | --- |
| FR-1 | <The system lets a member … > | Must | US-1 |
| FR-2 | … | Should | US-1 |

### Non-functional

| ID | Requirement | Priority |
| --- | --- | --- |
| NFR-1 | <e.g. Pages meet WCAG 2.2 AA> | Must |
| NFR-2 | <e.g. Main page loads in < 2 s on 4G> | Should |

Priorities: **Must** (v1 fails without it) · **Should** (important, can slip) · **Could** (nice to have) · **Won't** (agreed out of scope this time).

## 8. Scope

| In v1 | Out of v1 | Later (maybe) |
| --- | --- | --- |
| <capability> | <capability> | <capability> |

## 9. Assumptions

Things we believe but have not confirmed. Each one is a risk until confirmed.

| ID | Assumption | Confirmed? | If wrong… |
| --- | --- | --- | --- |
| A1 | <e.g. Everyone on the team already has a company Google account> | No | <we need another sign-in method> |

## 10. Open questions

| ID | Question | Recommended answer | Owner | Status |
| --- | --- | --- | --- | --- |
| Q1 | <question> | <your recommendation> | <who decides> | Open / Answered: … |

## 11. Risks

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| <risk> | Low / Med / High | Low / Med / High | <what we do about it> |

## 12. Scenario key & traceability

- **Scenario key:** `<KEY>` — every scenario in `02-scenarios/` is tagged `@<KEY>-nn` plus the `@FR-n` it proves.
- **Coverage matrix:** filled in by `/scenarios`.

| Requirement | Scenarios |
| --- | --- |
| FR-1 | _to be filled by /scenarios_ |
