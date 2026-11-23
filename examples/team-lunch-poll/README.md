# Example — Team lunch poll

A complete, filled-in Shipright spec folder. It shows what every pipeline stage produces for one small, realistic feature: a team deciding where to eat lunch without a 40-message Slack thread.

In a real project this folder would be `specs/001-team-lunch-poll/`. It lives in `examples/` so it never gets mixed up with your own features.

## Read it in this order

| # | File | What to notice |
| --- | --- | --- |
| 00 | [`00-input.md`](00-input.md) | Messy on purpose: a Slack thread plus notes, full of solution ideas ("react with 🍔"), contradictions ("no login please") and half-thoughts. This is normal raw input. |
| 01 | [`01-prd.md`](01-prd.md) | The problem is separated from the solutions. Requirements have IDs (`FR-1`…), priorities, and a scenario key `LUNCH`. Non-goals are explicit. Two requirements were added *because of the grill*. |
| 🔥 | [`grill-log.md`](grill-log.md) — session 1 | A gentle first grill on the PRD. "No login" turned out to break "one vote per person" — caught before a single line of code. |
| 02 | [`02-stories.md`](02-stories.md) | The PRD's 6 stories cut into 10 delivery stories on a story map. The walking skeleton (sign in → start → vote → winner) comes first, every split names its pattern, and each acceptance criterion already carries its `@LUNCH-nn` tag. |
| 02 | [`02-scenarios/`](02-scenarios/) | 18 scenarios across three files: the stories' acceptance criteria as executable Gherkin. Each has a unique `@LUNCH-nn` tag, the `@US-n` story and `@FR-n` requirement it proves, and `@happy` / `@edge` / `@error`. Business language only — no clicks or selectors. |
| 03 | [`03-design-prompt.md`](03-design-prompt.md) | A copy-paste prompt for Claude Design: shadcn/ui (the default), four screens with every state, real copy, and the mandatory OUTPUT FORMAT block. |
| 04 | [`04-design/`](04-design/) | Empty here — this is where *your* Claude Design export goes before `/import-design`. |
| 05 | [`05-tech-plan.md`](05-tech-plan.md) | Data model with "needed by" scenario tags, server-action contracts whose errors map to `@error` scenarios, and eleven thin vertical-slice tasks starting with a walking skeleton. |
| 🔥 | [`grill-log.md`](grill-log.md) — session 2 | A standard grill on the tech plan: two ❌ (a security hole and an untestable clock) fixed before building. |

## Things to copy into your own specs

- **Every requirement has a test, every test has a requirement.** Look at the coverage table at the end of the PRD.
- **Assumptions are written down.** A1–A4 in the PRD; A2 (time zones) came back in the tech-plan grill.
- **The design prompt names states, not just screens.** `04 — Poll detail` has ten states — that's where real UIs get hard.
- **Stories are slices, not layers.** No "build the API" story; each one would be worth shipping alone — that's the test.
- **Tasks are slices too.** No "build the database" task; every task makes specific scenarios pass end to end.
- **The grill log explains *why*.** Six months from now, "why is there no scheduler?" has an answer.

## Try it yourself

Run the pipeline on the same raw input and compare:

```text
/new-feature examples/team-lunch-poll/00-input.md
```

Your PRD won't be identical — and that's fine. Compare where you differ and ask `/explain` why the example made its choices.
