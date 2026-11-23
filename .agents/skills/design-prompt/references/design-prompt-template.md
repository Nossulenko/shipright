# Design prompt template

Copy this structure into `specs/NNN-slug/03-design-prompt.md`. Everything above the first `---` is for the human; everything between the two `---` lines is pasted into Claude Design in one go. Replace every `<…>`. Keep section 9 verbatim apart from the placeholders.

````markdown
# Claude Design prompt — <Feature name>

> **Spec:** `specs/NNN-slug/` · **Design library:** <shadcn/ui (Project Profile default) | <library> (Project Profile)> · **Generated:** <YYYY-MM-DD>
> **Covers:** <n> screens · <n> scenarios (`@<KEY>-01` … `@<KEY>-nn`)
>
> **How to use:** open Claude Design (claude.ai → Design), start a new project, and paste everything between the two `---` lines below.
> Optionally attach your logo, brand colours, or screenshots of products you like. Iterate, then
> **Export → Hand off to Claude Code** (or HTML .zip + PDF) into `specs/NNN-slug/04-design/` and run `/import-design NNN`.

---

You are designing <product name>: <one-line pitch>. Build a **clickable prototype** of the "<feature name>" feature. Follow every section below. Section 9 (output format) is mandatory.

## 1. Product context

<2–4 sentences from the PRD summary and problem: what the product is, why this feature exists, the tone (e.g. friendly and quick, not corporate).>

## 2. Users and jobs to be done

| Persona | Job to be done | Context of use |
| --- | --- | --- |
| <Sam, team member> | <decide where to eat in under a minute> | <on a phone, between meetings> |

## 3. Design system

<!-- Use 3A for shadcn/ui (default). Use 3B for any other library named in the Project Profile. Delete the unused one. -->

### 3A. shadcn/ui (default)

- Use **shadcn/ui** components on **Tailwind CSS**, with **lucide-react** icons. Do not invent a custom component when a shadcn/ui one exists.
- Component vocabulary to use (pick what the screens need): `Button`, `Card`, `Input`, `Textarea`, `Label`, `Form`, `Select`, `Checkbox`, `RadioGroup`, `Switch`, `Dialog`, `AlertDialog`, `Sheet`, `Popover`, `DropdownMenu`, `Tabs`, `Table` / data table, `Badge`, `Avatar`, `Progress`, `Skeleton`, `Alert`, `Tooltip`, `Separator`, `Calendar`, `Sonner` (toasts), `Breadcrumb`, `Pagination`, `Sidebar`.
- Theme with shadcn/ui CSS variables only — no hard-coded colours: `--background`, `--foreground`, `--card`, `--card-foreground`, `--popover`, `--popover-foreground`, `--primary`, `--primary-foreground`, `--secondary`, `--secondary-foreground`, `--muted`, `--muted-foreground`, `--accent`, `--accent-foreground`, `--destructive`, `--border`, `--input`, `--ring`, `--radius`.
- Design **light and dark** themes.
- Brand: <brand colour / font if known, else "neutral base, one accent colour of your choice that passes WCAG AA on both themes">.
- <If the org has a Claude Design design system: "Use the design system named '<name>' for colours and typography; keep shadcn/ui component names.">

### 3B. <Library name> (from Project Profile)

- Use **<library>** components only, with <its icon set>. Do not invent a custom component when a <library> one exists.
- Component vocabulary: <the library's names for button, card, text input, select, dialog, drawer, table, tabs, badge, avatar, skeleton, alert, tooltip, toast>.
- Theme with <the library's theming mechanism — e.g. MUI `createTheme` palette/typography, Mantine theme object, Chakra tokens>. No hard-coded colours.
- Design light and dark themes.

## 4. Screens

<!-- One block per screen, in the order a user meets them. Every scenario tag must appear at least once. -->

### 01 — <Screen name>

- **Purpose:** <what the user does here, one line>
- **Scenarios:** `@<KEY>-01`, `@<KEY>-02`
- **Key elements:** <list: e.g. page title, list of PollCard, "New poll" Button, filter Tabs>
- **Primary action:** <the one thing most users do here>
- **States** (one artboard each):
  - `default` — <what's shown>
  - `empty` — <message + call to action>
  - `loading` — <Skeleton layout matching default>
  - `error` — <Alert with message + retry>
  - `<scenario-specific state>` — <e.g. `closed`: results shown, voting disabled, Badge "Closed">

### 02 — <Screen name>

…

## 5. Flows

<!-- From the When/Then steps. Use artboard names. -->

1. **<Journey name>** (`@<KEY>-01`): `01-<screen>--default` → <action> → `02-<screen>--default` → <action> → `03-<screen>--success`
2. …

## 6. Copy and sample data

Use this copy exactly; write any missing copy in the same voice. No lorem ipsum.

| Where | Text |
| --- | --- |
| <01 title> | <"Lunch polls"> |
| <01 empty> | <"No polls yet. Start one and let the team decide."> |
| <error: title missing> | <"Give your poll a title"> |

Sample data:

| <column> | <column> |
| --- | --- |
| <realistic row> | <realistic row> |

## 7. Accessibility (WCAG 2.2 AA)

- Text contrast ≥ 4.5:1 (≥ 3:1 for large text and UI components) in both themes.
- Visible focus ring (use `--ring`) on every interactive element; logical tab order.
- Every input has a visible `Label`; errors are shown as text next to the field, not by colour alone.
- Touch targets at least 44×44 px.
- Status changes (vote recorded, error) are announced in text (e.g. a toast or inline message).

## 8. Responsive

- **Mobile ≤ 640 px:** <single column; primary action as full-width Button at the bottom; tables become stacked Cards>
- **Tablet ≤ 1024 px:** <…>
- **Desktop:** <max content width ~1100 px, centred>
- Produce mobile **and** desktop artboards for screens <01, 03>; desktop only for the rest unless a layout changes meaningfully.

## 9. OUTPUT FORMAT (required)

Follow every rule. The export is imported into code automatically, so naming matters.

1. **Clickable prototype.** Wire the flows in section 5 so they can be clicked through.
2. **One artboard per screen × state**, named exactly `NN-screen-name--state` in kebab-case — e.g. `01-poll-list--empty`, `03-poll-detail--closed`. Mobile variants add `--mobile`: `01-poll-list--default--mobile`.
3. **Component names:** name every layer that is a library component with its <shadcn/ui | library> name (`Card`, `Button`, `Dialog`). Name custom compositions in PascalCase describing what they are (`PollCard`, `VoteOptionRow`). Reuse the same composition name everywhere it appears.
4. **Scenario notes:** add a canvas note beside every artboard listing the scenario tags it satisfies, e.g. `Scenarios: @<KEY>-04, @<KEY>-05`.
5. **Theme tokens:** add one canvas note titled `THEME TOKENS` containing the final values as a CSS block in shadcn/ui format:
   ```css
   :root {
     --radius: 0.625rem;
     --background: …; --foreground: …;
     --primary: …; --primary-foreground: …;
     /* every token listed in section 3 */
   }
   .dark {
     --background: …; --foreground: …;
     /* every token again, dark values */
   }
   ```
   <For a non-shadcn library: "add the final theme as a <library> theme object in a canvas note titled THEME TOKENS.">
6. **Stay in scope.** Design only what the screens and scenarios above describe. If something seems missing, do not invent it — add a canvas note starting `OPEN QUESTION:` next to the relevant artboard.
7. **Real content only.** Use the copy and sample data from section 6.
8. **Deliver:** Export → **Hand off to Claude Code** (preferred). If hand-off isn't available, Export → **HTML (.zip)** of all artboards **and** a **PDF** of all artboards. The files go into `specs/<NNN-slug>/04-design/`.

---
````

## Notes for the ux-designer

- Section 4 is where most of the value is. A screen without states is not finished.
- Keep sections 1–2 short; Claude Design needs context, not the whole PRD.
- If the PRD has NFRs about performance or accessibility beyond AA, add them to section 7.
- If the human attached brand assets, mention them in section 3 ("use the attached logo and the colour #… as `--primary`").
