# 04-design — drop your Claude Design export here

This folder is empty in the example on purpose: the export is whatever Claude Design produced for *you* from [`../03-design-prompt.md`](../03-design-prompt.md).

## How to fill it

1. Paste the prompt into Claude Design and iterate until you're happy.
2. Export → **Hand off to Claude Code** (preferred), or Export → **HTML (.zip)** + **PDF**.
3. Put the exported files here.
4. Run `/import-design`.

## What to expect in here

| File | Comes from | Used for |
| --- | --- | --- |
| Hand-off bundle (folder or archive) | Export → Hand off to Claude Code | Best source: artboards, component names, canvas notes, theme tokens |
| `*.zip` → unzipped to `html/` | Export → HTML | Structure, styles, copy |
| `*.pdf` | Export → PDF | Visual reference when comparing screenshots |
| `*.png` | Screenshots | Visual reference only |

For this example you would expect artboards named like `02-poll-list--empty`, `04-poll-detail--open-voted--mobile` and `04-poll-detail--closed-tie`, each with a canvas note such as `Scenarios: @LUNCH-15`, plus one `THEME TOKENS` note with the `:root { … } .dark { … }` CSS block.

Keep the export in git (minus duplicates and huge binaries) — it's the visual record of what was agreed.
