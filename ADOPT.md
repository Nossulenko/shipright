# Adopting Shipright in an existing repository

> **For agents:** this is a playbook, not a copy script. Read it fully, inspect the target repo, propose a plan, and get the human's approval **before writing anything**.
> **For humans:** you can follow it by hand as a checklist.

Starting a brand-new product? You don't need this file — click **Use this template** on GitHub and run `/start`.

---

## Step 1 — Inspect the target repo (read-only)

Find out, and write down:

| Question | Where to look |
| -------- | ------------- |
| Language(s) and frameworks | `package.json`, `pyproject.toml`, `go.mod`, `*.csproj`, lockfiles |
| Where the apps live | monorepo folders (`apps/`, `packages/`, `services/`) or a single app at the root |
| How tests run today, and whether a BDD runner exists | test configs, CI files |
| Design library in use | `components.json` (shadcn/ui), `@mui/*`, `@mantine/*`, `@chakra-ui/*`, a local design system |
| CI provider and existing workflows | `.github/workflows/`, `azure-pipelines.yml`, `.gitlab-ci.yml` |
| Cloud and how it deploys today | IaC folders, Dockerfiles, deploy workflows |
| Existing agent files | `AGENTS.md`, `CLAUDE.md`, `.claude/`, `.codex/`, `.github/copilot-instructions.md`, `.cursor/` |
| Branch and commit conventions | recent `git log`, `CONTRIBUTING.md` |

## Step 2 — Map Shipright onto it

| Shipright part | Bring it? | Adapt how |
| -------------- | --------- | --------- |
| `AGENTS.md` contract | Always | Fill the Project Profile with the repo's **real** stack. Merge, don't overwrite, any existing `AGENTS.md`/`CLAUDE.md` content. |
| `CLAUDE.md` (`@AGENTS.md`) | Always | If a `CLAUDE.md` exists, add `@AGENTS.md` at its top and move its rules into `AGENTS.md`. |
| `.agents/skills/` + `.claude/skills` symlink | Always | Drop skills that make no sense (e.g. `scaffold` if apps exist; deploy skills for clouds you don't use). Update `AGENTS.md › Skills` to match. |
| `.agents/roles/` + `npm run sync:agents` | Always | Keep all roles unless the team objects; they are cheap. |
| `specs/` pipeline | Always | Existing features need no back-filled specs. New features start with `/new-feature`. |
| `scripts/hooks/` + runtime hook files | Recommended | Merge into existing `.claude/settings.json` rather than replacing it. |
| `.githooks/` | Ask | If the repo uses Husky or lefthook, port the checks there instead. |
| `scripts/verify.mjs` | Ask | If apps are not under `apps/`, adjust the discovery list at the top of the script — or point it at the existing `verify`/`check` command. |
| `.github/workflows/ci.yml` | Ask | Usually merge the `verify` and `pr-hygiene` jobs into the existing workflow. |
| `docs/stacks/`, `docs/standards/` | Recommended | Keep the profile that matches; reconcile standards with any existing ones (theirs win, flag conflicts). |
| Deploy skills | Ask | Keep only the cloud(s) in use. If deploys already exist, the skill should document and use them, not replace them. |

## Step 3 — Ask the human the decisions that matter

Ask one at a time, each with a recommended default:

1. **Design library** — keep the one in use (recommended) or adopt shadcn/ui for new UI?
2. **Spec strictness** — require a PRD + scenarios for every feature (recommended), or only for features larger than a day?
3. **Grill gates** — mandatory after PRD and tech plan (recommended), or optional?
4. **Git hooks** — enable `.githooks/` (recommended unless Husky/lefthook already exists)?
5. **Teaching mode** — on (recommended for teams with juniors) or off?
6. **Clouds** — which deploy skills to keep?

## Step 4 — Present the plan, then apply it

Show a file-by-file plan (add / merge / skip, and why). Only after approval:

1. Copy the files, merging where Step 2 says *merge*.
2. Fill the Project Profile in `AGENTS.md`.
3. Run `npm run sync:agents` and `npm run verify:harness` — both must pass.
4. Run `npm run setup` if git hooks were accepted.
5. Commit on a branch (`chore/adopt-shipright`) and open a PR with the plan in its description.

## Step 5 — First feature

Suggest the human tries the full loop on a small, real feature: `/new-feature` with a one-paragraph idea, then `/next` at each step.
