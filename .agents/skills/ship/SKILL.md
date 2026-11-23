---
name: ship
description: User-invoked only. Ships the current feature branch — checks the branch, folds and deletes PROGRESS.md, runs npm run verify, summarises the review, commits, pushes (after a yes) and opens a pull request from the PR template with the spec link, scenario tags, test evidence, risk and rollback plan.
argument-hint: "[optional: base branch, default main]"
disable-model-invocation: true
---

# /ship — Open a pull request the right way

> **Role:** devops-engineer (main conversation) · **Input:** feature branch, spec folder, review results · **Output:** pushed branch + pull request · **Next:** get it reviewed and merged, then `/deploy`

## What this does

Packages the work on this branch into a pull request a teammate can review in minutes: all checks green, working notes cleaned up, a clear description linking the spec and the scenarios it covers, proof that tests pass, and a plan for undoing it if something goes wrong. Nothing is pushed until the human says yes.

## Before you start

- `gh` must be installed and authenticated (`gh auth status`). If not, suggest `! gh auth login` and stop.
- A remote must exist (`git remote -v`). If not, explain how to create the GitHub repo (`gh repo create`) and stop until they choose.
- Base branch = argument or `main`.

## Steps

### Step 1 — Branch check

```bash
git branch --show-current
git status --porcelain
git fetch origin
git log --oneline origin/main..HEAD
```

- On `main` (or `master`) → **stop.** *"You're on main. Let's move these changes to a branch first:"* `git switch -c feat/NNN-slug`. Never ship from main.
- No commits ahead of the base and a clean tree → nothing to ship; stop.
- Branch behind `origin/main` → offer to update: `git rebase origin/main` (explain it) or `git merge origin/main`. Resolve conflicts with the human; re-run tests after.

Identify the spec folder from `feat/NNN-slug`. If the branch isn't a feature branch (`fix/`, `chore/`), the spec link is optional.

### Step 2 — Fold and delete PROGRESS.md

If `PROGRESS.md` exists:

1. Read it. Anything durable — decisions, discovered constraints, changed behaviour — goes where it belongs: the PRD or `.feature` (only with a yes), `05-tech-plan.md`, `docs/architecture/README.md`, a new ADR in `docs/decisions/`, or `grill-log.md`.
2. Show the human what you moved where.
3. Delete `PROGRESS.md` (`git rm PROGRESS.md` if tracked). The pre-push hook rejects it anyway.

### Step 3 — Verify

```bash
npm run verify
```

Must be green. If red: show the first error, fix it (or ask), re-run. Never ship red, never use `--no-verify`.

### Step 4 — Review summary

If `/review` already ran on this branch in this session and nothing changed since, reuse its result. Otherwise run the `/review` skill now. Any open **Must fix** → stop and ask whether to fix first (recommended) or explicitly accept the risk (recorded in the PR).

Collect for the PR body:

- scenario tags covered (from commit subjects) vs total in the feature,
- `npm run verify` result (the summary lines),
- screenshots taken during `/build` (paths), if any,
- open Should-fix items the human chose to defer.

### Step 5 — Commit remaining changes

If the tree is dirty, show `git status` and the proposed commit message (Conventional Commits, scenario tag if applicable). Commit after a yes.

### Step 6 — Push (ask first)

Show exactly what will happen:

> I'll push `feat/001-team-lunch-poll` (7 commits) to `origin`. OK?

On yes:

```bash
git push -u origin HEAD
```

**Never force-push** (`--force`, `-f`, `--force-with-lease`) as part of `/ship`. If the push is rejected because the remote moved, fetch, rebase or merge, re-verify, and ask again.

### Step 7 — Open the pull request

Read [`.github/pull_request_template.md`](../../../.github/pull_request_template.md) and fill **every** section with real content. Title: `feat(<slug>): <user-facing summary>`. Write the body to a temp file in the scratchpad (or use a heredoc) and run:

```bash
gh pr create --base main --head "$(git branch --show-current)" \
  --title "feat(lunch-poll): create polls and vote on lunch options" \
  --body-file <path-to-filled-body.md>
```

Body must include:

- **Spec:** link to `specs/NNN-slug/` and the PRD.
- **Scenarios:** checklist of every tag in the feature, ticked if covered by this PR.
- **Test evidence:** the `npm run verify` summary, screenshots, observed-red evidence (from commit bodies).
- **Risk:** Low / Medium / High with one sentence why; any accepted review findings.
- **Rollback:** concrete steps — *"Revert this PR. The migration only adds a nullable column, so the old code keeps working."* If the migration is not backward compatible, say so and how to roll it back.

If the tracker is GitHub Issues and an issue exists for the feature, add `Closes #N`.

Print the PR URL.

## Gate — before moving on

- [ ] Not on `main`; branch up to date with `origin/main`
- [ ] `PROGRESS.md` folded into specs/docs and deleted
- [ ] `npm run verify` green
- [ ] No open Must-fix (or explicitly accepted in the PR)
- [ ] PR body has spec link, scenario checklist, test evidence, risk, rollback

## Tell the human

> 🚀 **Pull request opened:** <url>
>
> **What I did:** cleaned up the working notes, ran every check, pushed `feat/001-team-lunch-poll`, and opened a PR covering 9/9 scenarios.
> **Why:** a PR with the spec, test proof and a rollback plan gets reviewed fast and merged with confidence.
> **What to check:** read the PR description once — you'll be the one answering reviewer questions.
>
> **Next:** ask a teammate to review. Once it's merged, run `/deploy`.
