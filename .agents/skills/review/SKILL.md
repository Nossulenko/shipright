---
name: review
description: Self-review of the current branch before a pull request — checks the diff against the Shipright review lenses (spec match and scenario coverage, correctness, tests, security, accessibility, performance, readability, docs sync, operability), delegating to the code-reviewer and security-reviewer roles in parallel, and returns ranked findings with file:line. Use when the human asks for a review, before /ship, or when all scenarios of a feature are green.
argument-hint: "[optional: base branch, default main]"
---

# /review — Review your branch before anyone else does

> **Role:** code-reviewer + security-reviewer (delegated in parallel) · **Input:** branch diff vs `main`, spec folder · **Output:** ranked findings, trivial fixes applied with permission · **Next:** `/ship`

## What this does

Looks at everything this branch changed and checks it from nine angles — does it match the spec, is it correct, are the tests honest, is it safe, accessible, fast enough, readable, documented, and easy to roll back. You get a short, ranked list of what to fix, with the exact file and line. Mechanical fixes can be applied for you.

## Before you start

- Base branch is the argument or `main`.
- If there are no changes vs the base (`git diff --stat <base>...HEAD` is empty and the working tree is clean), say so and stop.
- If there are uncommitted changes, include them in the review and mention it.

## Steps

### Step 1 — Collect the facts

```bash
git branch --show-current
git diff --stat main...HEAD
git diff --name-only main...HEAD
git status --porcelain
git log --oneline main..HEAD
```

From the branch name `feat/NNN-slug` find the spec folder. Collect:

- **Claimed scenario tags** — every `[KEY-nn]` in commit subjects on this branch.
- **All scenario tags** in `specs/NNN-slug/02-scenarios/*.feature`.
- Whether `PROGRESS.md` is present (it must be gone before `/ship`).

### Step 2 — Run the gates

```bash
npm run verify
```

A red gate is automatically a **Must fix** finding. Record the failing check and its first error.

### Step 3 — Delegate in parallel

Read [`references/review-lenses.md`](references/review-lenses.md), then delegate **in the same turn**:

- **`code-reviewer`** — give it: spec folder path, claimed tags, all tags, the list of changed files, and the `verify` result. Ask for the output format in its role file.
- **`security-reviewer`** — give it: spec folder path, the list of changed files, and whether the diff touches auth, user data, uploads, payments, secrets, CI or cloud config. Ask for its output format.

If the runtime can't delegate to roles, run the lenses yourself in the main conversation — same checklist, same output.

### Step 4 — Merge and rank

Combine both reports into one table. Remove duplicates (keep the more specific one). Rank:

1. **Must fix** — failing gate, bug, security Critical/High, claimed scenario without a passing test, broken API contract, `.feature` file edited to fit the code.
2. **Should fix** — security Medium, maintainability, missing docs sync, missing edge-case test.
3. **Nit** — style. Keep to a handful.

Add a **coverage line**: scenario tags in the feature vs tags with commits/tests. Unimplemented tags aren't a finding if the human intends a partial PR — ask.

### Step 5 — Offer trivial fixes

List the findings marked *trivial* (rename, missing `aria-label`, unused import, missing `.env.example` entry, leftover `console.log`). Ask *"Apply these N trivial fixes?"* On yes: apply, re-run `npm run verify`, and commit `refactor(<slug>): address review nits`. Non-trivial findings: explain the fix and let the human decide whether you implement it now.

## Output format

```markdown
## 🔍 Review — feat/001-team-lunch-poll (12 files, +480 −35)

**Gates:** ✅ npm run verify
**Scenarios:** 9/9 implemented (@LUNCH-01 … @LUNCH-09)
**Verdict:** Ship after 1 must-fix

| # | Rank | Lens | Location | Finding | Fix | Trivial |
|---|------|------|----------|---------|-----|---------|
| 1 | Must fix | Security | apps/web/src/app/api/polls/[id]/route.ts:24 | Any signed-in user can close any poll. | Check `poll.ownerId === session.user.id`, else 403. Add scenario? | no |
| 2 | Should fix | Docs sync | apps/web/.env.example | `RESEND_API_KEY` used but not documented. | Add with placeholder + comment. | yes |
| 3 | Nit | Readability | apps/web/src/lib/poll.ts:12 | `d` → `deadline`. | Rename. | yes |

### What's good
- …

### For the junior
<the single most important lesson from this review, in 2–3 sentences>
```

## Gate — before moving on

- [ ] `npm run verify` is green
- [ ] No **Must fix** left open (or the human explicitly accepted it, recorded in the PR's Risk section)
- [ ] `PROGRESS.md` is folded into specs/docs and deleted (or flagged for `/ship` to handle)

## Tell the human

> **What I did:** checked your branch from nine angles with two reviewers working in parallel, ran every gate.
> **Why:** catching a missing permission check now costs a minute; catching it in production costs a weekend.
> **What to check:** the Must-fix rows above.
>
> **Next:** fix the must-fixes (I can do it — say "fix 1"), then `/ship`.
