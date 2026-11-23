# Splitting patterns

A story is too big when it is `L`, has more than ~5 acceptance criteria, has "and" in its *I want*, serves two personas, hides several business rules, or the team can't agree on its size. Split it so that **the first child is worth shipping on its own**. If neither half is useful alone, you cut along the wrong line — try another pattern.

## Never split by layer

| ❌ Horizontal (layers) | ✅ Vertical (slices) |
| --- | --- |
| "Build the export API" · "Build the export screen" · "Test the export" | "Export the filtered view as CSV (≤ 1,000 rows)" · "Email exports over 1,000 rows" · "Remember my last export's filters" |
| None of the three helps anyone until all three are done. | The first one alone already saves the ops manager a request to the data team. |

**Exception — quality-bar / ML work:** a story that proves a probabilistic capability hits its bar on an eval set, with no UI yet, *is* a valid first vertical slice. The measured accuracy is the value. See `story-quality.md` § Probabilistic features.

## The patterns

Try them roughly in this order; the first that produces a valuable first child wins.

### 1. Workflow steps
Slice along the steps of a process; ship the start-to-end path with the simplest version of each step first, then deepen steps.
- *Publish an article* → write and publish directly · add an editor review step · add legal review for flagged topics.
- **Tip:** don't ship "step 1 only" if it leaves the user stranded — ship a thin version of *every* step first.

### 2. Business-rule variations
One story per rule; the simplest rule first.
- *Apply discounts* → percentage off · buy-one-get-one · loyalty-tier discount.
- *Search flights* → flexible dates · "within 2 hours of a time" · multi-city.

### 3. Happy path vs. edge paths
Ship the main success path, then the alternatives and failures as follow-ups — as long as the happy path is safe on its own.
- *Pay by card* → pay with a valid card · handle a declined card · handle 3-D Secure.
- **Watch out:** never defer an edge that makes the happy path dangerous (e.g. double charging). That edge belongs in the first story.

### 4. Simple vs. complex
Do the basic version, defer the sophisticated one.
- *Search products* → exact name match · fuzzy matching · filters and facets.

### 5. Variations in data
Split by input type, format, data source or channel.
- *Import contacts* → CSV · Excel · Google Contacts sync.
- *Notify a user* → in-app · email · SMS.

### 6. Data-entry methods
Same capability, different ways to provide input.
- *Pick a date* → type it · date picker · "next Friday" natural language.

### 7. Operations (CRUD)
Create, read, update and delete are often separate stories. Read-only frequently ships first.
- *Manage saved reports* → view saved reports · save a report · rename · delete.

### 8. Defer performance and scale
Make it work, then make it fast or big — with the non-functional bar as its own story's criteria.
- *Generate the monthly report* → generate it (any speed, ≤ 10k rows) · generate in < 2 s · handle 1M rows.

### 9. Major effort first
When one variant carries most of the work (the "first one is expensive, the rest are cheap" case), make it its own story and batch the cheap ones.
- *Accept card payments* → accept Visa (builds the whole payment flow) · add Mastercard, Amex and Bancontact.

### 10. Break out a spike
When you can't size a story because of an unknown, add a **time-boxed spike**: a question, a time box, and a concrete output. Then write the real stories with what you learned.
- *Spike:* "Can we get room availability from the hotel's booking API within 2 s? Time box: 1 day. Output: a yes/no with a measured latency and a note in the tech plan."
- A spike is **not** a user story (it has no "so that" for a user) — label it `Spike` in the card header, keep it rare, and never let it ship code to production.

## Choosing a pattern — quick flow

```
Is the story big because of an UNKNOWN?           → 10. Spike, then re-split
Does it describe a multi-step PROCESS?             → 1. Workflow steps
Does it contain several RULES or POLICIES?         → 2. Business-rule variations
Does it mix the main path with many ALTERNATIVES?  → 3. Happy vs. edge
Is there a basic version and a SOPHISTICATED one?  → 4. Simple vs. complex
Does it accept several INPUTS / FORMATS / CHANNELS?→ 5. Data variations · 6. Entry methods
Does it say "manage" (= create + read + update + delete)? → 7. Operations
Is the hard part SPEED or SCALE?                   → 8. Defer performance
Is ONE variant most of the work?                   → 9. Major effort first
```

## After every split — re-check

- [ ] The first child is valuable alone (would someone be better off if only it shipped?)
- [ ] Each child passes INVEST on its own
- [ ] Children share no acceptance criteria (each `@KEY-nn` lives in exactly one story)
- [ ] The parent's criteria are all accounted for — moved to a child or explicitly deferred
- [ ] The split is recorded in *Splits made* with the pattern and the reason

## Worked example — "bulk CSV export"

The lazy split is by layer: backend story, frontend story, QA story. Three stories, none of which ships value alone.

The useful split is three thin vertical slices (patterns: *defer performance* + *simple vs. complex*):

1. **As an** ops manager, **I want** to export the current filtered view as CSV, **so that** I can hand my director numbers without asking the data team for a pull. — one view, ≤ 1,000 rows, synchronous download.
2. **As an** ops manager, **I want** exports over 1,000 rows to arrive by email, **so that** a big export doesn't time out in my browser.
3. **As an** ops manager, **I want** my last export's filters remembered, **so that** the Monday report takes one click.

Story 1 alone is worth shipping — that's the test. And notice each *so that* names a real outcome; *"so that I can export a CSV"* would be the tell that the value wasn't understood.
