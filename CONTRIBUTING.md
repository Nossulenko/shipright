# Contributing to Shipright

This file covers two things: how **your product** is built inside Shipright (branches, commits, PRs), and how to **extend the harness** (adding skills, roles and stack profiles).

---

## Part 1 — Building your product

### Branches

| Kind      | Pattern                 | Example                       |
| --------- | ----------------------- | ----------------------------- |
| Feature   | `feat/NNN-slug`         | `feat/001-team-lunch-poll`    |
| Bug fix   | `fix/short-description` | `fix/vote-count-off-by-one`   |
| Chore     | `chore/short-description` | `chore/bump-next`           |

Never commit directly to `main`. The pre-commit hook stops you if you try.

### Commits — Conventional Commits + scenario tag

```
<type>(<scope>): <what changed, imperative, lower case> [<SCENARIO-TAG>]

feat(lunch-poll): let a member vote once per poll [LUNCH-03]
fix(lunch-poll): count votes after the deadline as rejected [LUNCH-07]
test(lunch-poll): add step definitions for poll creation [LUNCH-01]
docs(lunch-poll): record the vote-storage decision in ADR-0002
chore: upgrade playwright to 1.50
```

Types: `feat`, `fix`, `test`, `refactor`, `docs`, `chore`, `ci`, `build`, `perf`.

### Pull requests

`/ship` opens PRs for you using [`.github/pull_request_template.md`](.github/pull_request_template.md). A PR must:

- link the spec folder and list the scenario tags it covers,
- show test evidence (`npm run verify` output, screenshots for UI),
- state risk and a rollback plan,
- contain no `PROGRESS.md`.

---

## Part 2 — Extending the harness

### Adding a skill

A skill is a folder in `.agents/skills/<name>/` with a `SKILL.md`. Claude Code sees it through the `.claude/skills` symlink, Codex and Copilot read `.agents/skills/` directly.

```
.agents/skills/<name>/
  SKILL.md                 required — frontmatter + instructions
  references/              optional — templates, checklists, long examples
  agents/openai.yaml       required only for user-invoked-only skills (Codex policy)
```

**Frontmatter**

```yaml
---
name: prd                                # must equal the folder name, kebab-case
description: Turn raw input … into a PRD. Use when … # what + when; this is how the model decides to use it
argument-hint: "[raw text or path]"      # optional, shown in Claude Code
disable-model-invocation: true           # only for user-invoked-only skills (ship, deploy*, start)
---
```

For a user-invoked-only skill, also start the description with `User-invoked only.` and add `agents/openai.yaml`:

```yaml
interface:
  display_name: "Deploy"
  short_description: "Deploy to the cloud in the Project Profile"
  default_prompt: "Use $deploy with the arguments and repository context I provide."
policy:
  allow_implicit_invocation: false
```

**Body structure** — every skill follows the same shape so juniors always know where to look:

```markdown
# /<name> — <one-line purpose>

> **Role:** <role> · **Input:** <what it reads> · **Output:** <what it writes> · **Next:** `/<next-skill>`

## What this does
Two or three plain-language sentences a junior can follow.

## Before you start
Preconditions (files that must exist, Project Profile values that must be set) and what to do if they are missing.

## Steps
### Step 1 — <verb phrase>
…numbered, concrete, with exact commands and file paths…

## Gate — before moving on
- [ ] checklist the human confirms

## Tell the human
The shape of the closing message: what was created, what to check, the next command.
In Teaching mode, include "What I did / Why / What to check".
```

Keep `SKILL.md` under ~300 lines. Move long templates and examples to `references/` and link them.

### Adding a role

A role is one Markdown file in `.agents/roles/<name>.md`. Adapters for the three runtimes are generated from it.

```yaml
---
name: griller                           # kebab-case, equals file name
description: >-                         # when to delegate to this role — written for the orchestrating agent
  Adversarial reviewer …
claude-model: opus                      # opus | sonnet | haiku | inherit
claude-tools: Read, Grep, Glob, WebSearch, WebFetch   # omit to allow all tools
copilot-tools: [read, search, web]      # Copilot tool aliases: read, edit, search, execute, web, agent, todo
codex-sandbox: read-only                # read-only | workspace-write
---

# Griller

You are … (the body: mission, how you work, output format, what you never do)
```

Then run:

```bash
npm run sync:agents      # regenerates .claude/agents, .codex/agents, .github/agents, .codex/config.toml roles
npm run verify:harness   # checks everything is consistent
```

Read-only roles (reviewers, griller, mentor) must not list edit or shell tools.

### Adding a stack profile

Copy an existing file in `docs/stacks/`, keep the same section headings (Overview · When to pick it · Commands · Layout · Testing & BDD runner · Container · Cloud fit · Junior gotchas), and add a row to the table in `docs/stacks/README.md`. `/scaffold` and `/deploy` read these files, so keep commands exact.

### Checks

`npm run verify:harness` must pass. It validates skill and role frontmatter, that generated adapters are in sync, that relative Markdown links resolve, and that `.feature` files carry scenario tags. CI runs the same script.
