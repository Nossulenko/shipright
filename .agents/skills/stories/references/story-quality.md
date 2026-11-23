# Story quality — INVEST, acceptance criteria, anti-patterns

## INVEST scorecard

Score each letter ✅ (clearly yes) · ⚠️ (yes with a caveat — write it down) · ❌ (no — fix before approval).

| Letter | Question to ask | ✅ looks like | ❌ looks like |
| --- | --- | --- | --- |
| **I**ndependent | Can it be built and shipped without waiting for another *unfinished* story? | Carries its own thin slice of UI, logic and data. | "Needs the reporting story first." Two stories that only work together. |
| **N**egotiable | Does it describe the *need*, leaving the *how* to the team? | "I want to find last month's invoices." | "I want a dropdown with a date picker that queries `/api/invoices`." |
| **V**aluable | Does a named persona (or the business) get something they'd notice? | "…so that I stop chasing the data team on Mondays." | "As a developer, I want a database table…" |
| **E**stimable | Does the team understand it well enough to size it? | Open questions answered; rules known. | "Integrate with the partner API" — nobody knows the API. → spike |
| **S**mall | Does it fit comfortably in a sprint — ideally a few days? | `XS`–`M`, ≤ ~5 criteria, one verb. | `L` or bigger, "and" in the *I want*, many rules. → split |
| **T**estable | Can every criterion be checked pass/fail by someone else? | "…then the poll shows 1 vote for Tacos." | "…then it is fast and intuitive." |

**Dependencies are allowed** when they follow the build order (a story may depend on an *earlier, already-built* story). They fail **I** only when two stories must ship together to be useful.

## Sizing

| Size | Rough feel | Rule |
| --- | --- | --- |
| `XS` | Under half a day | Fine — consider merging with a neighbour if it has no value alone. |
| `S` | About a day | Ideal. |
| `M` | Two or three days | Fine. |
| `L` | Most of a week or more | **Split.** An `L` story never reaches approval. |

If sizing starts an argument, the story is too big or too vague — split or clarify, don't average.

## Acceptance criteria rules

1. **Given / When / Then, one line each** in the story card. `/scenarios` expands them into full Gherkin — keep the meaning, don't over-specify here.
2. **Observable behaviour only** — what a user (or an API client) can see or do. No tables, endpoints, components or CSS.
3. **Declarative, in the user's words** — "When Sam votes for Tacos", not "When Sam clicks the second radio button and presses Submit".
4. **One behaviour per criterion** — a single *When*. Two actions → two criteria.
5. **Concrete data** — names, numbers and messages from the PRD: "…then Priya sees *Add at least 2 places*".
6. **Cover what matters, not everything:** happy path + the relevant items from this list —

   | Check | Ask |
   | --- | --- |
   | Invalid | Missing, too long, wrong format? |
   | Empty | Nothing there yet? |
   | Unauthorized | Who must *not* be able to do this? |
   | Limits | Zero, one, max, max + 1? |
   | Duplicates / concurrency | Same action twice? Two people at once? |
   | Time | Deadlines, time zones, expiry? |
   | Failure | A dependency is down — what does the user see? |

7. **Pre-tag every criterion** with its future scenario tag (`@KEY-nn`), unique across the spec folder. `/scenarios` keeps the number.
8. **Non-functional requirements** become criteria on the stories they constrain ("…on a 360 px-wide phone in at most 3 taps"), not stories of their own — unless they have their own visible behaviour (e.g. "votes are private").

### Probabilistic / ML / quality-bar features

Given/When/Then is deterministic; a model is right *most* of the time. Don't write criteria as if every single case must pass. Make them **threshold-based against a fixed, labelled eval set**:

- Name the dataset (e.g. "golden set v1: 500 labelled support tickets, `evals/tickets-v1.jsonl`").
- Name the metric (precision, recall, F1, accuracy, latency p95…).
- Name the threshold.

> `@SUPPORT-04` Given the golden set v1 of 500 labelled tickets, when the classifier runs, then precision ≥ 0.90 and recall ≥ 0.80 for the "refund" label.

Still pass/fail — just measured statistically. Add a criterion for the fallback when confidence is low ("…then the ticket goes to the human queue").

## Definition of Ready

A story is ready to build when:

- [ ] It names a persona and a real outcome
- [ ] Its acceptance criteria are tagged, observable and cover the relevant edges
- [ ] It passes INVEST (or its ⚠️ caveats are accepted)
- [ ] It is `M` or smaller
- [ ] Its dependencies are built or scheduled before it
- [ ] No open question blocks it

## Anti-patterns

| Anti-pattern | Example | Fix |
| --- | --- | --- |
| **Horizontal slice** | "Build the API", "Create the schema" | Slice vertically: one capability through every layer. (ML eval-only slice is the exception.) |
| **Missing or circular "so that"** | "…so that I can export a CSV" | Ask *why* until you hit a real benefit; if there's none, question building it. |
| **"As a user"** | "As a user, I want to log in" | Name the persona: "As Sam, a returning team member…" |
| **System or developer as the persona** | "As the system, I want to cache results" | Find the human who benefits ("…so that the page loads in under 2 s for Sam") or make it a criterion / task. |
| **Solution in the story** | "I want a modal with a dropdown" | State the need; leave the UI to design. |
| **Compound story** | "Create, edit and export reports" | One verb per story → three stories. |
| **Epic in disguise** | "Manage the team's lunches" | Split with a pattern until each child is `M` or smaller. |
| **Untestable criteria** | "Works well", "is fast", "is intuitive" | Rewrite with observable behaviour and numbers. |
| **Criteria as implementation** | "Then a row is inserted in `votes`" | Say what the user sees: "Then the poll shows 1 vote". |
| **Missing edges** | Only the happy path | Walk the checks list above. |
| **Shared criteria** | The same scenario under two stories | Each `@KEY-nn` lives in exactly one story. |

## Quality bar (self-check before showing the human)

- [ ] Every story names a PRD persona, has one verb, and a "so that" that is a real benefit
- [ ] Every story is `M` or smaller and passes INVEST (caveats written down)
- [ ] Every criterion is Given/When/Then, observable, tagged, and unique across the spec
- [ ] Each story has at least one happy-path criterion; Must stories have at least one edge or error criterion
- [ ] Out of scope says where deferred behaviour went
- [ ] The walking skeleton touches every backbone activity
- [ ] Build order gives a reason for every position
- [ ] Coverage: every Must/Should FR → ≥ 1 story; every story → ≥ 1 requirement; every PRD story accounted for
- [ ] No implementation detail anywhere in story text or criteria

## Tips

- One verb per story. A story you can demo in one sentence ("watch me pay with a saved card") is the right size.
- Write the edge-case criteria first sometimes — they expose hidden scope fast.
- If two stories always get demoed together, they may be one story. If one story takes three demos, it's three stories.
- Name personas specifically ("returning shopper", not "user") — it sharpens the slice.

## Grounded in

- Jeff Patton — *User Story Mapping* (2014): backbone, walking skeleton, release slices.
- Mike Cohn — *User Stories Applied* (2004): the story card and acceptance criteria.
- Bill Wake — "INVEST in Good Stories, and SMART Tasks" (2003).
- Richard Lawrence — "Patterns for Splitting User Stories" (2009).
- Dan North — "Introducing BDD" (2006): Given / When / Then.
- Go deeper: [Guide to Product Requirements Documents](https://sidsaladi.substack.com/p/guide-to-product-requirements-documents) (The Product Channel).
