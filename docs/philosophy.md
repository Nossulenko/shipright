# Philosophy

Shipright exists because AI coding agents made it easy to *start* a product and just as easy to end up with something nobody can explain, test or deploy. Juniors feel this most: the agent is fast, confident and fallible, and they do not yet have the experience to tell when it is wrong.

The answer is not to review every line. It is to put structure **before** the code and guardrails **around** it.

## 1. Specs lead, code follows

Vibe coding without a spec is guessing at speed. Shipright makes the intent explicit, in files, before any code exists:

- **PRD** — the problem, the users, what is in and out of scope, numbered requirements.
- **User stories** — the PRD cut into small slices that are each worth shipping, walking skeleton first.
- **Gherkin scenarios** — the stories' acceptance criteria as concrete examples that are also executable tests.
- **Design prompt** — the same scenarios, translated into screens and states.
- **Tech plan** — the same scenarios, translated into thin vertical slices of work.

Each artifact is derived from the one before, and every scenario carries a tag that follows it all the way into commits and pull requests. When the agent drifts, the spec catches it. When the spec is wrong, you change the spec first — then the code.

## 2. Grill decisions while they are cheap

A decision costs almost nothing to change in a PRD, a little in a tech plan, and a lot in production. So Shipright puts an adversarial reviewer — the **griller** — at the two cheapest moments: after the PRD and after the tech plan. Its job is to find the question you have not asked yet, offer its own best answer, and make you either defend the decision or change it. The outcome is written down, so it is never re-argued from memory.

## 3. Swiss-cheese guardrails

No single check is perfect. Stacked, they are very hard to slip past:

```
PreToolUse hook     blocks destructive commands, cloud spend and secret writes before they run
PostToolUse hook    formats every file the agent touches
Stop hook           reminds the agent to keep specs and docs in sync
pre-commit          no commits on main, secret scan, harness check
pre-push            the full verify suite
CI                  the same gates on every push and pull request
AI review           code-reviewer, security-reviewer and griller roles
Human review        spot-checking — the last slice, not the only one
```

The guards are deterministic — regular expressions and exit codes, not model judgement — so they behave the same every time.

## 4. Teach while you build

Shipright assumes the person at the keyboard is learning. Teaching mode (on by default) makes every step end with *What I did / Why / What to check*, defines jargon on first use, and keeps a glossary one link away. The goal is a junior who ships the product **and** could explain every part of it in a code review.

## 5. Boring, reversible, cheap

Default choices are deliberately boring: Postgres, containers, managed platforms (Cloud Run, Container Apps, ECS Express Mode), keyless CI login, budget alerts before the first deploy, and a teardown section in every runbook. Exciting technology is allowed — after the griller has had a go at it.

## 6. One source of truth, every runtime

`AGENTS.md` is the contract. Skills live once in `.agents/skills/`, roles once in `.agents/roles/`. Claude Code, Codex and GitHub Copilot get thin adapters generated from those sources, and a checker fails the build if they drift. Change the source, run `npm run sync:agents`, done.
