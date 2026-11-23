---
name: import-design
description: Turn a Claude Design export in specs/NNN-slug/04-design/ (Claude Code hand-off bundle, HTML .zip, PDF or screenshots) into real components in the app using the Project Profile's design library — shadcn/ui by default via `npx shadcn@latest add` — with theme tokens in globals.css, one route/component per artboard, scenario tags as data-testid hooks, mock data first, and visual verification with Playwright. Use when the user has exported a design, says "import the design", "build the UI from the design", or drops files into 04-design/.
argument-hint: "[NNN]"
---

# /import-design — Claude Design export → real components

> **Role:** frontend-engineer · **Input:** `specs/NNN-slug/04-design/`, `03-design-prompt.md`, `02-scenarios/` · **Output:** components, pages and theme in the app (mock data) · **Next:** `/tech-plan` (if not done), then `/build`

## What this does

Claude Design gave you a prototype. This skill rebuilds it as real, maintainable code in your app — using real library components (not copied HTML), your theme tokens, and test hooks tied to your scenarios. The UI runs on **mock data** first; `/build` later connects it to real logic one scenario at a time.

## Before you start

- The app must exist (`apps/web/` or the frontend path from the stack profile). If not, run `/scaffold` first.
- `specs/NNN-slug/04-design/` must contain an export. If it's empty, remind the human how to export (see `/design-prompt` → *Tell the human*).
- Resolve the design library from the Project Profile — `shadcn/ui` if empty or `not set`. It must match the library named in `03-design-prompt.md`; if not, stop and ask which wins.
- Work on a feature branch `feat/NNN-slug` (create it if you're on `main`).

## Steps

### Step 1 — Identify what was exported

| Found in `04-design/` | Treat as | Source of truth for |
| --- | --- | --- |
| A Claude Code hand-off bundle (a folder/archive with artboards, component structure and notes — follow any README or instructions it contains) | **Best** | structure, component names, notes, tokens |
| `*.zip` of HTML artboards | Good | structure and styles — unzip into `04-design/html/` |
| `*.pdf` | Visual reference | layout and copy only |
| `*.png` / `*.jpg` screenshots | Visual reference | layout and copy only |

Unzip archives in place. Don't commit huge binaries you don't need — keep the PDF and the hand-off/HTML, skip duplicates.

### Step 2 — Inventory the design

Build a table and show it to the human:

| Artboard | Screen | State | Scenarios (from canvas note) | Components used |
| --- | --- | --- | --- | --- |
| `01-poll-list--default` | 01 poll list | default | @LUNCH-01 | Card, Button, Badge, `PollCard` |

Then check against the spec:

- Every scenario tag from `02-scenarios/` appears on an artboard → else flag it.
- Every `OPEN QUESTION:` canvas note → list for the human; don't resolve by guessing.
- Anything in the design **not** in the scenarios → flag as scope creep; don't build it unless the human adds a scenario.

### Step 3 — Install library components

**shadcn/ui (default):**

```bash
cd apps/web                                       # or the frontend path from the stack profile
npx shadcn@latest init                            # only if components.json doesn't exist yet
npx shadcn@latest add card button badge input label form dialog sonner skeleton alert   # the ones in your inventory
```

Use the package manager from the Project Profile (`pnpm dlx shadcn@latest add …` for pnpm). Only add components the inventory lists.

**Other library:** install it per its docs and the stack profile; map each artboard component to the library's equivalent.

### Step 4 — Apply the theme

Take the `THEME TOKENS` canvas note (or read the colours from the HTML/CSS) and put the values into the app's global stylesheet — for shadcn/ui that's the `:root { … }` and `.dark { … }` blocks in `app/globals.css` (path per stack profile). Replace only the token values; keep the file's structure. Never hard-code colours in components.

### Step 5 — Build compositions and pages

- **Custom compositions** (`PollCard`, `VoteOptionRow`) → one component file each under `components/<feature>/`, built from library components. Same name as in the design.
- **Screens** → one route/page per screen; **states** → the same page rendering different data (empty list, loading skeleton, error alert) — not separate pages.
- **Copy** → use the exact text from the design/prompt.
- **Test hooks** → add `data-testid` attributes for elements scenarios interact with, named by intent (`data-testid="vote-option-thai-garden"`, `data-testid="poll-status"`). Add a short comment at the top of each page listing its scenario tags: `// Scenarios: @LUNCH-04, @LUNCH-05`.
- **Accessibility** → semantic elements, labels on inputs, focus states kept from the library.

### Step 6 — Mock data first

Create `mocks/<feature>.ts` (path per stack profile) with the design's sample data and a typed shape. Pages read from it for now. Make every state reachable — e.g. a `?state=empty|loading|error` query param or a story — so you can check each artboard.

**Do not** build real API calls, database access or business rules here. That's `/build`, scenario by scenario.

### Step 7 — Verify visually

1. Start the dev server (stack profile command).
2. Use the **Playwright MCP** server to open each screen and state, at desktop and mobile widths, and take screenshots.
3. Compare each screenshot with its artboard (open the HTML export or PDF page). Fix layout, spacing and copy differences that matter; note intentional differences.
4. Check keyboard navigation and focus visibility on the primary flow.

If Playwright MCP isn't connected, ask the human to check the screens in the browser, listing each URL and state.

### Step 8 — Run the gates and commit

```bash
npm run verify
```

Commit on the feature branch:

```
feat(<slug>): import Claude Design screens with mock data [<KEY>-01 <KEY>-02 …]
```

## Gate — before moving on

- [ ] Every artboard has a matching page/state; every scenario tag is on a screen
- [ ] Theme tokens applied; no hard-coded colours
- [ ] `data-testid` hooks on elements the scenarios touch
- [ ] Screenshots compared at desktop + mobile; differences noted
- [ ] Open questions and scope-creep items listed for the human
- [ ] `npm run verify` passes

## Tell the human

```
🧩 Design imported for specs/NNN-slug/
   <n> pages · <n> custom components · <n> library components added · theme applied
   Running on mock data — try: <dev URL>/<route>?state=empty

Open questions from the design: …
Next: /tech-plan NNN (if not done), then /build NNN
```

Teaching mode: **What I did** (rebuilt the design with real library components and wired fake data) · **Why** (real components are accessible and maintainable; mock data lets you see every state before any backend exists) · **What to check** (click through each screen — does it match the design? does each state look right on your phone?).
