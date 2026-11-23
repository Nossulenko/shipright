# specs/

Every feature you build gets its own folder here. The folder holds the whole story of the feature — from the messy idea you started with to the plan the code was built from — so anyone (including future you) can see *what* was built and *why*.

## Start a feature

```text
/new-feature "paste your notes, a transcript, or a one-line idea"
```

That creates the next folder and walks you through stages 00 → 03. Run `/next` any time to see where a feature is and what to do next.

## Folder layout

```
specs/NNN-feature-slug/
  00-input.md            the raw input, verbatim — never edited
  01-prd.md              the PRD — requirements with IDs (FR-1, NFR-1…)
  02-scenarios/          Gherkin .feature files — the acceptance tests
  03-design-prompt.md    copy-paste prompt for Claude Design
  04-design/             drop the Claude Design export here
  05-tech-plan.md        architecture, data model, API, ordered task list
  grill-log.md           every /grill session, appended
```

| Stage | File | Made by |
| --- | --- | --- |
| 00 | `00-input.md` | `/new-feature` (or `/prd` with raw text) |
| 01 | `01-prd.md` | `/prd` |
| — | `grill-log.md` | `/grill` |
| 02 | `02-scenarios/*.feature` | `/scenarios` |
| 03 | `03-design-prompt.md` | `/design-prompt` |
| 04 | `04-design/` | you, exporting from Claude Design → then `/import-design` |
| 05 | `05-tech-plan.md` | `/tech-plan` |

## Numbering and names

- `NNN` is a zero-padded sequence: `001`, `002`, `003`… Take the next free number; never reuse one, even if a feature is abandoned (mark it abandoned in its PRD status instead).
- The slug is kebab-case, 2–4 words: `001-team-lunch-poll`, `002-user-invites`.
- The feature branch matches the folder: `feat/001-team-lunch-poll`.

## Traceability

- Requirements in the PRD have IDs: `FR-1`, `NFR-1`.
- Every scenario has a unique tag `@<KEY>-<nn>` (the KEY is chosen in the PRD, e.g. `LUNCH`) plus the `@FR-n` it proves.
- Design artboards, tech-plan tasks, tests, commits and PRs all reference scenario tags — so you can follow any requirement from idea to code.

## See a finished example

[`examples/team-lunch-poll/`](../examples/team-lunch-poll/) is a complete, filled-in feature folder: messy Slack thread → PRD → scenarios → design prompt → grill log → tech plan. Read it before your first feature.
