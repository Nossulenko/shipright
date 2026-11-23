---
name: new-feature
description: Guided spec session that takes raw input (notes, a transcript, an email, a Slack dump, or a one-line idea) through stages 00→03 — capture, PRD, optional grill, user stories, Gherkin scenarios, Claude Design prompt — with a checkpoint after each stage. Use when the user wants to start a new feature or product idea, or says "I have an idea", "new feature", "here are my notes". Resumable on an existing spec folder.
argument-hint: "[raw text | path to notes | NNN to resume]"
---

# /new-feature — Raw idea → ready-to-design spec, one checkpoint at a time

> **Role:** product-manager → business-analyst (stories, scenarios) → ux-designer · **Input:** raw text, a file path, or an existing spec number · **Output:** `specs/NNN-slug/00-input.md` … `03-design-prompt.md` · **Next:** Claude Design, then `/import-design` or `/tech-plan`

## What this does

You bring something messy — meeting notes, a voice-memo transcript, a Slack thread, or just one sentence. This skill turns it into a spec folder in five stages: save the raw input, write the PRD, cut it into user stories, write Gherkin scenarios, and write a prompt for Claude Design. After every stage it stops and asks you to check the result, so nothing gets built on a wrong assumption.

## Before you start

- If the Project Profile in `AGENTS.md` has `Product name` = `not set`, suggest `/start` first — but you may continue if the human wants to explore an idea before setting up the stack. The design prompt stage needs only the Design library row (which defaults to shadcn/ui).
- If the argument is a number (`3`, `003`) or an existing folder name, **resume**: jump to the first stage whose file is missing (see Step 0).
- If there is no argument, ask: *"Paste your idea, notes or transcript — as messy as you like — or give me a file path."*

## Steps

### Step 0 — Find or create the spec folder

1. List `specs/` folders matching `NNN-*`. The next number is the highest `NNN` + 1, zero-padded to three digits (`001` if none exist).
2. **Resuming?** Find the folder, then check which files exist and jump to the first missing stage:

   | Missing file | Resume at |
   | --- | --- |
   | `00-input.md` | Step 1 |
   | `01-prd.md` | Step 2 |
   | `02-stories.md` | Step 4 |
   | `02-scenarios/*.feature` | Step 5 |
   | `03-design-prompt.md` | Step 6 |
   | none | everything is done → tell the human and suggest `/next` |

3. **New?** Propose a kebab-case slug from the input (2–4 words, e.g. `team-lunch-poll`) and confirm: *"I'll create `specs/004-team-lunch-poll/`. OK?"* Then create the folder.

### Step 1 — Capture the raw input (stage 00)

Write `specs/NNN-slug/00-input.md`:

```markdown
# Raw input — <slug>

> Captured <YYYY-MM-DD> via /new-feature. Verbatim — do not edit. Later stages quote this as evidence.

**Source:** <pasted text | path/to/file | conversation>

---

<the input exactly as given — if it was a file, copy its contents>
```

Never clean up, summarise or correct the input. Typos and contradictions are evidence.

> **Checkpoint 00:** "I saved your input as-is. Next I'll turn it into a PRD — I'll ask a few questions first. Ready?"

### Step 2 — Write the PRD (stage 01)

Follow `.agents/skills/prd/SKILL.md` from its Step 2 onward (the folder and input already exist). That skill asks clarifying questions one at a time and writes `01-prd.md`.

> **Checkpoint 01:** Show the PRD summary: KEY, Must-have requirements, non-goals, open questions. Ask the human to read `01-prd.md` and reply *"approve"*, or tell you what to change. Do not continue until they approve.

### Step 3 — Offer a grill (recommended)

Ask: *"Before we cut this into stories, want me to grill the PRD? It takes ~5 minutes and catches the assumptions that cause rework. (Recommended: yes, gentle mode for your first time.)"*

- **Yes** → follow `.agents/skills/grill/SKILL.md` with target `prd`. If the grill produced ❌ verdicts, update the PRD with the human's OK before moving on.
- **No** → append a skip record `## Skipped — <YYYY-MM-DD> — target: 01-prd.md` to `grill-log.md` (create it from `.agents/skills/grill/references/grill-log-template.md` if needed) and continue.

### Step 4 — Write the user stories (stage 02)

Follow `.agents/skills/stories/SKILL.md` from its Step 1 onward (skip the optional tracker export unless the human asks).

> **Checkpoint 02a:** Show the story map, the walking skeleton and the build order. Point out any split you made and any uncovered requirement. Ask for *"approve"* or changes.

### Step 5 — Write the scenarios (stage 02)

Follow `.agents/skills/scenarios/SKILL.md` from its Step 2 onward — it starts from the stories' acceptance criteria and keeps their tags.

> **Checkpoint 02b:** Show the coverage matrix (FR → scenario tags) and the list of `.feature` files. Point out any uncovered requirement. Ask for *"approve"* or changes.

### Step 6 — Write the Claude Design prompt (stage 03)

Follow `.agents/skills/design-prompt/SKILL.md` from its Step 2 onward.

> **Checkpoint 03:** Show the screen → scenario table and the design library used. Explain the hand-off (Step 7).

### Step 7 — Hand off

The spec is ready for design. Tell the human the exact next moves:

1. Open `specs/NNN-slug/03-design-prompt.md`, copy everything between the two `---` lines.
2. Paste it into Claude Design (claude.ai → Design), iterate until happy.
3. Export → **Hand off to Claude Code** (or HTML .zip + PDF) and drop the files into `specs/NNN-slug/04-design/`.
4. Run `/import-design NNN` to turn it into components, then `/tech-plan NNN`.

Backend-only feature with no UI? Skip design and go straight to `/tech-plan NNN`.

## Gate — before moving on

- [ ] `00-input.md` is verbatim
- [ ] `01-prd.md` approved by the human, open questions answered or consciously parked
- [ ] Grill run, or skip recorded in `grill-log.md`
- [ ] `02-stories.md` approved: walking skeleton and build order agreed
- [ ] Every Must/Should FR has at least one story and at least one scenario
- [ ] `03-design-prompt.md` contains the OUTPUT FORMAT block and every scenario tag

## Tell the human

```
✅ Spec ready: specs/NNN-slug/
   00-input.md · 01-prd.md (KEY: <KEY>, <n> FRs) · 02-stories.md (<n> stories) · 02-scenarios/ (<n> scenarios) · 03-design-prompt.md

Next: paste 03-design-prompt.md into Claude Design → export into 04-design/ → /import-design NNN
```

In Teaching mode add **What I did / Why / What to check**: e.g. *Why: writing the spec first means every later step — design, code, tests — is checked against the same agreed behaviour, so you don't build the wrong thing fast.*

If the session ends early, say which checkpoint was reached and that `/new-feature NNN` resumes from there.
