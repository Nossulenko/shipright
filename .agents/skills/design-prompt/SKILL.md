---
name: design-prompt
description: Turn approved Gherkin scenarios into a copy-paste prompt for Claude Design (claude.ai, Anthropic Labs) at specs/NNN-slug/03-design-prompt.md — screens mapped to scenario tags, every UI state, flows, real copy, WCAG 2.2 AA, responsive rules, and a mandatory OUTPUT FORMAT block. Uses shadcn/ui + Tailwind + lucide-react by default unless the Project Profile names another design library. Use when the user wants UI designs, mockups, a frontend prototype, or a Claude Design prompt for a feature.
argument-hint: "[NNN]"
---

# /design-prompt — Scenarios → Claude Design prompt

> **Role:** ux-designer · **Input:** `01-prd.md`, `02-scenarios/*.feature`, Project Profile · **Output:** `specs/NNN-slug/03-design-prompt.md` · **Next:** Claude Design → `specs/NNN-slug/04-design/` → `/import-design`

## What this does

[Claude Design](https://claude.com/design) is Anthropic's tool for creating designs and clickable prototypes. This skill writes the prompt you paste into it. The prompt lists every screen your scenarios need, every state each screen can be in (empty, loading, error…), the real text to show, and — most importantly — the **exact format** the design must come back in, so `/import-design` can turn it into working components without guesswork.

## Before you start

- Resolve the spec folder (argument → branch `feat/NNN-slug` → most recent folder with scenarios but no design prompt). Ask if ambiguous.
- `02-scenarios/` must contain at least one `.feature` file. If not, run `/scenarios` first.
- No UI in this feature (pure API, background job)? Say so and suggest `/tech-plan` instead.
- If `03-design-prompt.md` exists, ask: *"Revise it, or regenerate from the current scenarios? (Recommended: regenerate if scenarios changed.)"*

## Steps

### Step 1 — Load inputs

Read the PRD (personas, goals, vocabulary, NFRs on accessibility/performance), every `.feature` file, `grill-log.md`, and the Project Profile in `AGENTS.md`. Load [`references/design-prompt-template.md`](references/design-prompt-template.md).

### Step 2 — Resolve the design library

Read the **Design library** row of the Project Profile:

| Profile value | Use |
| --- | --- |
| `shadcn/ui`, empty, or `not set` | **shadcn/ui** on Tailwind CSS with **lucide-react** icons — the default. Use section 3A of the template. |
| Anything else (MUI, Mantine, Chakra UI, Ant Design, Radix Themes, an in-house system…) | That library. Use section 3B of the template, and replace every shadcn component name and token in the prompt with the library's own names and theme format. |

If the organisation has a Claude Design **design system** set up (or one was pulled in with Claude Code's `/design-sync`), ask its name and tell Claude Design to use it — the library rule above still decides the component vocabulary.

State the choice in the file header: *"Design library: shadcn/ui (Project Profile default)"*.

### Step 3 — Derive screens from scenarios

1. List every place a user stands (`Given`) or lands (`Then`). Merge duplicates. Each becomes a **screen** or a **state** of a screen.
2. Number screens `01`, `02`… in the order a user meets them.
3. For each screen, record the scenario tags it satisfies. **Every scenario tag in `02-scenarios/` must appear on at least one screen.** List any you can't place and ask the human.
4. For each screen, list states: `default`, `empty`, `loading`, `error`, `success`, plus any a scenario names (`closed`, `no-permission`, `already-voted`…).

### Step 4 — Map flows

Turn each `When` into a click path: `01-poll-list--default → "New poll" → 02-create-poll--default → submit → 03-poll-detail--default`. Group by user journey.

### Step 5 — Write copy and sample data

Real headings, button labels, helper text, empty-state messages and error messages, using the PRD's words. Error text should say what happened and what to do. Provide 3–8 rows of realistic sample data per list. No lorem ipsum.

### Step 6 — Fill the template

Write `specs/NNN-slug/03-design-prompt.md` from the template:

- The **"How to use"** header for the human sits *above* the first `---`.
- Everything Claude Design needs sits *between* the two `---` lines, so it can be copied in one go.
- Sections: 1 Product context · 2 Users & jobs · 3 Design system · 4 Screens · 5 Flows · 6 Copy & sample data · 7 Accessibility · 8 Responsive · 9 **OUTPUT FORMAT (required)**.
- Copy the OUTPUT FORMAT block **verbatim**, filling in `<NNN-slug>` and — for a non-shadcn library — swapping the component and token lines. Never soften "required".

Worked example: [`examples/team-lunch-poll/03-design-prompt.md`](../../../examples/team-lunch-poll/03-design-prompt.md).

### Step 7 — Self-check

- [ ] Every scenario tag appears on at least one screen
- [ ] Every screen lists empty, loading and error states (or says why one doesn't apply)
- [ ] Component names are the design library's real names; custom compositions are PascalCase
- [ ] No feature beyond the scenarios; gaps written as `OPEN QUESTION:`
- [ ] OUTPUT FORMAT block present and complete
- [ ] No implementation details (routes, APIs, state management)

### Step 8 — Explain the hand-off

Walk the human through using the prompt (see *Tell the human*). Create `specs/NNN-slug/04-design/` with a one-line `README.md` saying "Drop the Claude Design export here." if it doesn't exist.

## Gate — before moving on

- [ ] Human has read the prompt and is happy with screens and copy
- [ ] Screen → scenario table shows full coverage
- [ ] `04-design/` folder exists, ready for the export

## Tell the human

```
🎨 Claude Design prompt ready: specs/NNN-slug/03-design-prompt.md
   Design library: <library> (<profile value | default>) · <n> screens · <n> states · <n>/<n> scenarios covered

How to use it:
  1. Open Claude Design (claude.ai → Design) and start a new project.
  2. Copy everything between the two --- lines in 03-design-prompt.md and paste it in.
     Optional: attach your logo, brand colours or screenshots of apps you like.
  3. Iterate in Claude Design ("make the poll card denser", "show the error state").
     Keep artboard names in the NN-screen--state format.
  4. Export → "Hand off to Claude Code" (preferred), or Export → HTML (.zip) + PDF.
  5. Put the exported files in specs/NNN-slug/04-design/.
  6. Run /import-design NNN.
```

Teaching mode: **What I did** (listed every screen and state your scenarios need, and told Claude Design exactly how to name and package its output) · **Why** (a design that names things the way our code does can be imported in minutes instead of rebuilt by eye) · **What to check** (is any screen missing? does the copy sound like your product?).
