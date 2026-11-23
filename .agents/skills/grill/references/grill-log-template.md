# Grill log template

Create `specs/NNN-slug/grill-log.md` with the header below the first time, then **append** one session block per grill. Never edit earlier sessions — if a later session overturns a verdict, say so in the new session and link back.

---

## File header (first time only)

```markdown
# Grill log — <feature name>

> Every `/grill` session for this spec, newest at the bottom. Append only.
> Verdicts: ✅ defended · ⚠️ accepted risk · ❌ revise
```

---

## Session block (append each time)

```markdown
## Session <n> — <YYYY-MM-DD> — target: <file name, e.g. 01-prd.md> (<intensity>)

**Target:** [`<file>`](<relative path>) <or the free-text decision in quotes>
**Fresh-eyes critique:** <"griller role delegated" | "built from question bank">
**Decisions on the tree:** <n> · **Questions asked:** <n>

### Q1 [<Lens>] <question>
- **Why this matters:** <one line>
- **Recommended:** <griller's recommendation>
- **Answer:** <the human's answer, paraphrased faithfully>
- **Verdict:** ✅ Defended | ⚠️ Accepted risk — revisit if <trigger> | ❌ Revise — <what changes, where>

### Q2 …

### Summary

| # | Decision | Verdict | Follow-up | Owner |
| --- | --- | --- | --- | --- |
| 1 | <decision> | ✅ | — | — |
| 2 | <decision> | ❌ | <change in file X> | <who> |

**Applied in this session:** <list of edits made, with file paths> | none
**ADRs proposed:** <[ADR-NNNN](../../docs/decisions/NNNN-title.md)> | none
**Not covered:** <decisions skipped because the human said stop> | none
```

---

## Skip record

When the human chooses to skip a recommended grill, append:

```markdown
## Skipped — <YYYY-MM-DD> — target: <file name, e.g. 01-prd.md>

Grill offered and skipped by choice. Reason given: <reason or "none">.
```

---

## Header convention (machine-read)

`/next` and `/build` decide whether a stage was grilled by finding a session header that names its target **file**. Always write the header exactly as:

```
## Session <n> — <YYYY-MM-DD> — target: <file> (<intensity>)
## Skipped — <YYYY-MM-DD> — target: <file>
```

`<file>` is the spec file's name — `01-prd.md`, `02-scenarios`, `03-design-prompt.md`, `05-tech-plan.md` — or the repo-relative path for anything outside the spec folder (`docs/decisions/0002-derive-poll-status.md`). For a free-text decision use `target: decision` and quote the decision on the **Target:** line.
