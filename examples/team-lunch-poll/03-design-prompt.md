# Claude Design prompt — Team lunch poll

> **Spec:** `examples/team-lunch-poll/` · **Design library:** shadcn/ui (Project Profile default) · **Generated:** 2026-11-18
> **Covers:** 4 screens · 18 scenarios (`@LUNCH-01` … `@LUNCH-18`)
>
> **How to use:** open Claude Design (claude.ai → Design), start a new project, and paste everything between the two `---` lines below.
> Optionally attach your logo, brand colours, or screenshots of products you like. Iterate, then
> **Export → Hand off to Claude Code** (or HTML .zip + PDF) into `04-design/` and run `/import-design`.

---

You are designing **Lunchpoll**: a tiny web app that lets a team decide where to eat in under a minute. Build a **clickable prototype** of the "Team lunch poll" feature. Follow every section below. Section 9 (output format) is mandatory.

## 1. Product context

Every day a 9-person engineering team wastes 15 minutes and 40 Slack messages deciding where to have lunch, and quieter people never get a say. Lunchpoll replaces that: someone starts a poll with a few places and a closing time, everyone votes privately from their phone, and the winner appears the moment it closes. Tone: friendly, quick, a little playful — never corporate. It should feel like a utility you use in 20 seconds, not an app you "spend time in".

## 2. Users and jobs to be done

| Persona | Job to be done | Context of use |
| --- | --- | --- |
| Priya, organiser | Start a poll and get a decision by 11:45 without herding people | Desktop at her desk, around 10:30–11:00 |
| Sam, team member | Vote in a couple of taps | Phone, walking back from stand-up or between calls |
| Lena, quiet voice | Say what she prefers without anyone seeing her vote | Phone or desktop |

## 3. Design system

- Use **shadcn/ui** components on **Tailwind CSS**, with **lucide-react** icons. Do not invent a custom component when a shadcn/ui one exists.
- Component vocabulary for this feature: `Button`, `Card`, `Input`, `Label`, `Form`, `Checkbox`, `RadioGroup`, `Badge`, `Avatar`, `Progress`, `Skeleton`, `Alert`, `AlertDialog`, `DropdownMenu`, `Separator`, `Tooltip`, `Sonner` (toasts).
- Theme with shadcn/ui CSS variables only — no hard-coded colours: `--background`, `--foreground`, `--card`, `--card-foreground`, `--popover`, `--popover-foreground`, `--primary`, `--primary-foreground`, `--secondary`, `--secondary-foreground`, `--muted`, `--muted-foreground`, `--accent`, `--accent-foreground`, `--destructive`, `--border`, `--input`, `--ring`, `--radius`.
- Design **light and dark** themes.
- Brand: neutral base with one warm accent (think tomato or saffron) as `--primary`, passing WCAG AA on both themes. Rounded but not bubbly (`--radius` around 0.625rem). Use lucide `Utensils` as the app mark and `Leaf` for the vegetarian-friendly marker.

## 4. Screens

### 01 — Sign in

- **Purpose:** sign in with the company Google account.
- **Scenarios:** `@LUNCH-12`
- **Key elements:** app mark + "Lunchpoll", one-line pitch, `Button` "Continue with Google" (Google icon), small print "Use your company account".
- **Primary action:** Continue with Google.
- **States:**
  - `default` — as above.
  - `from-poll` — arrived from a poll link while signed out: `Alert` above the button "Sign in to vote in Friday lunch". (`@LUNCH-12`)
  - `loading` — button shows a spinner and "Signing you in…", disabled.
  - `error` — `Alert` (destructive) "We couldn't sign you in. Make sure you use your company Google account." + button again.

### 02 — Poll list

- **Purpose:** see the team's open polls and polls from the last 7 days.
- **Scenarios:** `@LUNCH-01`, `@LUNCH-05`, `@LUNCH-06`
- **Key elements:** header with app mark, team name "Platform", `Avatar` + `DropdownMenu` (Sign out); `Button` "New poll"; section "Open" with `PollCard`s; section "Last 7 days" with closed `PollCard`s. A `PollCard` shows title, closing time with time zone ("Closes 11:45 CET"), number of votes, a `Badge` "Open" / "Closed", and — if closed — the winner.
- **Primary action:** open a poll; secondary: New poll.
- **States:**
  - `default` — 1 open poll at the top, 3 closed below. (`@LUNCH-01`)
  - `empty` — friendly illustration-free empty state: "No polls yet. Start one and let the team decide." + `Button` "Start a poll". (`@LUNCH-05`)
  - `loading` — `Skeleton` cards in the same layout.
  - `error` — `Alert` "Couldn't load polls. Check your connection and try again." + `Button` "Try again".
  - `no-access` — signed in but not on the team: `Alert` "You're not a member of this team" + "Ask your team lead to add you." No polls visible. (`@LUNCH-06`)

### 03 — New poll

- **Purpose:** create a poll with a title, 2–8 places and a closing time today.
- **Scenarios:** `@LUNCH-01`, `@LUNCH-02`, `@LUNCH-03`, `@LUNCH-04`, `@LUNCH-07`
- **Key elements:** `Form` with `Label` + `Input` "Poll title" (helper "Up to 60 characters", live counter); "Places" list — each row an `Input` + `Checkbox` "Vegetarian-friendly" (with `Leaf` icon) + remove icon `Button`; `Button` (ghost) "Add place" (disabled at 8); time `Input` "Closes at" with helper "Today, Europe/Brussels time"; `Button` "Start poll"; `Button` (ghost) "Cancel".
- **Primary action:** Start poll.
- **States:**
  - `default` — empty title, 2 empty place rows, closes at 11:45 pre-filled.
  - `filled` — "Friday lunch", Thai Garden, Burger Barn, Falafel Stop (veggie ✓), 11:45. (`@LUNCH-01`, `@LUNCH-07`)
  - `validation-error` — inline errors under fields: "Give your poll a title", "Add at least 2 places", "Pick a closing time later than now". Error summary `Alert` at top listing them. (`@LUNCH-02`, `@LUNCH-03`, `@LUNCH-04`)
  - `max-places` — 8 rows, "Add place" disabled with helper "A poll can have up to 8 places". (`@LUNCH-03`)
  - `submitting` — "Start poll" shows spinner, form disabled.
  - `success` — back on poll list with `Sonner` toast "Poll started — share the link with your team" and the new poll on top. (`@LUNCH-01`)

### 04 — Poll detail

- **Purpose:** vote, change vote, see live counts, see the result.
- **Scenarios:** `@LUNCH-08`, `@LUNCH-09`, `@LUNCH-10`, `@LUNCH-11`, `@LUNCH-13`, `@LUNCH-14`, `@LUNCH-15`, `@LUNCH-16`, `@LUNCH-17`, `@LUNCH-18`
- **Key elements:** back link to list; title "Friday lunch"; `Badge` "Open · closes 11:45 CET" or "Closed"; "Started by Priya"; options as `VoteOptionRow`s — a large tappable row (whole row is the target, ≥ 44 px tall) with the place name, `Leaf` icon if vegetarian-friendly, a `Progress` bar and the vote count. Counts only — **never names or avatars of voters**. "Your vote" indicator (check icon + text) on the chosen row. Total votes line "6 of 9 members voted". For the creator only: `Button` (outline) "Close poll now".
- **Primary action:** tap an option to vote.
- **States:**
  - `open-not-voted` — Sam's view: no selection, helper "Tap a place to vote. You can change it until 11:45." No "Close poll now" button. (`@LUNCH-08`, `@LUNCH-13`, `@LUNCH-18`)
  - `open-voted` — Sam voted Thai Garden: that row shows "Your vote"; helper "Changed your mind? Tap another place." (`@LUNCH-08`, `@LUNCH-09`, `@LUNCH-10`)
  - `open-creator` — Priya's view: same as open, plus "Close poll now". (`@LUNCH-17`)
  - `close-confirm` — `AlertDialog`: "Close Friday lunch now?" / "Nobody can vote after this. 6 of 9 members have voted." / Cancel · Close poll. (`@LUNCH-17`)
  - `vote-rejected` — Sam tapped after 11:45: `Sonner` toast (destructive) "This poll has closed — your vote wasn't counted", page switches to closed. (`@LUNCH-11`)
  - `closed-winner` — winner row highlighted with `Badge` "Winner" and trophy icon, heading "Falafel Stop wins with 4 votes"; all counts visible; voting disabled. (`@LUNCH-14`, `@LUNCH-17`)
  - `closed-tie` — heading "It's a tie between Burger Barn and Falafel Stop", both rows highlighted equally, no "Winner" badge, helper "Decide together — it's a close one." (`@LUNCH-15`)
  - `closed-no-votes` — heading "No votes were cast", muted rows, no winner. (`@LUNCH-16`)
  - `loading` — `Skeleton` rows.
  - `error` — `Alert` "Couldn't load this poll." + "Try again".

## 5. Flows

1. **Start a poll** (`@LUNCH-01`, `@LUNCH-07`): `02-poll-list--default` → "New poll" → `03-new-poll--default` → fill → `03-new-poll--filled` → "Start poll" → `03-new-poll--submitting` → `03-new-poll--success`
2. **Fix a bad poll** (`@LUNCH-02`–`@LUNCH-04`): `03-new-poll--default` → "Start poll" with empty fields → `03-new-poll--validation-error`
3. **Vote** (`@LUNCH-08`, `@LUNCH-09`): `02-poll-list--default` → tap open poll → `04-poll-detail--open-not-voted` → tap "Thai Garden" → `04-poll-detail--open-voted` → tap "Falafel Stop" → `04-poll-detail--open-voted` (selection moved)
4. **Signed-out voter** (`@LUNCH-12`): poll link → `01-sign-in--from-poll` → "Continue with Google" → `01-sign-in--loading` → `04-poll-detail--open-not-voted`
5. **Close early** (`@LUNCH-17`): `04-poll-detail--open-creator` → "Close poll now" → `04-poll-detail--close-confirm` → "Close poll" → `04-poll-detail--closed-winner`
6. **Too late** (`@LUNCH-11`): `04-poll-detail--open-not-voted` (stale) → tap option after 11:45 → `04-poll-detail--vote-rejected` → `04-poll-detail--closed-winner`
7. **Not on the team** (`@LUNCH-06`): sign in as Dana → `02-poll-list--no-access`

## 6. Copy and sample data

Use this copy exactly; write any missing copy in the same voice. No lorem ipsum.

| Where | Text |
| --- | --- |
| App name | Lunchpoll |
| 01 pitch | Decide lunch in a minute. No 40-message threads. |
| 02 title | Lunch polls · Platform |
| 02 empty | No polls yet. Start one and let the team decide. |
| 02 no access | You're not a member of this team. Ask your team lead to add you. |
| 03 title | New poll |
| 03 errors | Give your poll a title · Keep the title under 60 characters · Add at least 2 places · A poll can have up to 8 places · Pick a closing time later than now · Polls close on the same day they start |
| 04 helper (open) | Tap a place to vote. You can change it until 11:45. |
| 04 closed | This poll has closed — your vote wasn't counted |
| 04 non-creator close (if forced) | Only the poll's creator can close it early |
| 04 tie | It's a tie between Burger Barn and Falafel Stop |
| 04 no votes | No votes were cast |

Sample data:

| Poll | Started by | Closes | Status | Votes |
| --- | --- | --- | --- | --- |
| Friday lunch | Priya | 11:45 today | Open | Thai Garden 2 · Burger Barn 1 · Falafel Stop 3 🌿 |
| Thursday lunch | Tom | 11:45 yesterday | Closed | Falafel Stop wins (4) |
| Wednesday lunch | Priya | 11:40, 2 days ago | Closed | Tie: Burger Barn / Noodle Bar (3 each) |
| Team dinner? | Marco | 16:00, 4 days ago | Closed | No votes were cast |

Team members (for avatars in the header only): Priya, Sam, Lena, Tom, Marco, Aïsha, Jonas, Dana (not on team).

## 7. Accessibility (WCAG 2.2 AA)

- Text contrast ≥ 4.5:1 (≥ 3:1 for large text, icons and the `Progress` bars) in both themes.
- Visible focus ring (`--ring`) on every interactive element; logical tab order; each `VoteOptionRow` is a radio option in a `RadioGroup` so arrow keys work.
- Every input has a visible `Label`; errors appear as text under the field and in the summary, never by colour alone.
- Touch targets at least 44×44 px — vote rows especially.
- "Winner", "Your vote" and "Vegetarian-friendly" are conveyed with text or accessible labels, not only icons or colour.
- Vote recorded / rejected messages are announced (toast with live region).

## 8. Responsive

- **Mobile ≤ 640 px:** single column; on 03 "Start poll" is a full-width sticky button at the bottom; on 04 vote rows are full-width; header collapses to app mark + avatar.
- **Tablet ≤ 1024 px:** single column, max width 640 px, centred.
- **Desktop:** max content width ~720 px, centred — this is a small, focused app.
- Produce **mobile and desktop** artboards for 02 (`default`), 04 (`open-not-voted`, `open-voted`, `closed-winner`); desktop only for the rest.

## 9. OUTPUT FORMAT (required)

Follow every rule. The export is imported into code automatically, so naming matters.

1. **Clickable prototype.** Wire the flows in section 5 so they can be clicked through.
2. **One artboard per screen × state**, named exactly `NN-screen-name--state` in kebab-case — e.g. `02-poll-list--empty`, `04-poll-detail--closed-tie`. Mobile variants add `--mobile`: `04-poll-detail--open-voted--mobile`.
3. **Component names:** name every layer that is a library component with its shadcn/ui name (`Card`, `Button`, `AlertDialog`). Name custom compositions in PascalCase describing what they are (`PollCard`, `VoteOptionRow`, `PollResultHeading`). Reuse the same composition name everywhere it appears.
4. **Scenario notes:** add a canvas note beside every artboard listing the scenario tags it satisfies, e.g. `Scenarios: @LUNCH-08, @LUNCH-13`.
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
6. **Stay in scope.** Design only what the screens and scenarios above describe. If something seems missing, do not invent it — add a canvas note starting `OPEN QUESTION:` next to the relevant artboard.
7. **Real content only.** Use the copy and sample data from section 6.
8. **Deliver:** Export → **Hand off to Claude Code** (preferred). If hand-off isn't available, Export → **HTML (.zip)** of all artboards **and** a **PDF** of all artboards. The files go into `specs/001-team-lunch-poll/04-design/`.

---
