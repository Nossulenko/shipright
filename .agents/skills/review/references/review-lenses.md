# Review lenses

The nine lenses `/review` and the `code-reviewer` role apply, in order. Each lens has the questions to ask and the red flags that make a finding. Only report what you can point to with a file and line.

---

## 1. Spec match & scenario coverage

**Ask:** Does the branch do what the scenarios say — no more, no less?

- Every scenario tag claimed in a commit subject has step definitions and passes.
- No behaviour was built that no scenario or PRD requirement asks for (scope creep).
- `.feature` files were **not** edited to match the code. If a scenario changed, there's a matching entry in `grill-log.md` or the PRD explaining why.
- UI matches the design export in `04-design/` where one exists (layout, states, copy).

**Red flags:** tag in commit but no test references it · new endpoint with no scenario · scenario text changed in the same commit as the code that "satisfies" it.

## 2. Correctness

**Ask:** What input or timing breaks this?

- Null / undefined / empty list / zero / negative / very long strings.
- Off-by-one in loops, pagination, date ranges ("until Friday" — inclusive?).
- Dates and time zones: store UTC, compare as dates not strings, render in the user's zone.
- Async: every promise awaited; errors caught where they can be handled; no fire-and-forget writes.
- Concurrency: two users doing the same thing at once (double submit, double vote). Database constraints beat app-level checks.
- Correct HTTP status codes and error shapes per the tech plan.

## 3. Tests

**Ask:** Would these tests fail if the feature broke?

- Assertions check what the user sees or the API returns — not private functions or mocks' call counts.
- Edge cases in the scenario's Examples tables are covered.
- Evidence of observed red (commit body or `PROGRESS.md`).
- No `sleep` / `waitForTimeout`, no `.only`, no `.skip` / `xit` / `@skip` without a linked reason.
- Test data via builders; no reliance on other tests' leftovers; no real personal data.

## 4. Security (basics — deep review is the security-reviewer's job)

- Authorization on every data read/write: *this* user may access *this* record.
- Input validated with a schema at the boundary.
- No secrets in code, tests, fixtures, logs, Dockerfiles, CI files.
- No SQL/shell built by string concatenation; no `dangerouslySetInnerHTML` / `eval` with user data.
- New dependencies are justified, maintained and not typosquats.

## 5. Accessibility

- Inputs have visible labels; icon-only buttons have `aria-label`.
- Keyboard: everything reachable with Tab, visible focus, Escape closes dialogs.
- Semantic elements: `button` for actions, `a` for navigation, headings in order.
- Contrast meets WCAG 2.2 AA; meaning not conveyed by colour alone.
- Async results announced (toast / `aria-live`).

## 6. Performance

- N+1 queries (a query inside a loop over records).
- Lists without pagination or limits.
- Heavy libraries pulled into client bundles for small jobs.
- Expensive work in render paths or on every request that could be cached or precomputed.
- Missing database index for a new frequent lookup (check the tech plan's data model).

## 7. Readability

- Names say what things are/do (`deadlineAt`, not `d`; `closePoll`, not `handle`).
- Functions do one thing; files have one reason to change.
- No dead code, commented-out blocks, leftover `console.log` / `print`.
- Matches surrounding style and the stack profile's conventions.
- Comments explain *why*, not *what*.

## 8. Docs sync

- Spec still true: if behaviour diverged, the PRD / `.feature` / tech plan was updated first.
- `docs/architecture/README.md` updated if apps, data flow or key choices changed.
- New ADR in `docs/decisions/` for consequential decisions.
- `.env.example` lists every new environment variable with a placeholder.
- `PROGRESS.md` is not part of the PR.

## 9. Operability & rollback

- Errors are logged with enough context to debug — without secrets or personal data.
- `/health` still answers without hitting dependencies.
- Migrations are forward-only and safe to deploy before the code (add column nullable → backfill → enforce later).
- The PR's rollback plan is real: "revert the commit" only works if the migration is backward compatible.
- Feature flags or config for risky changes when the blast radius is large.
