# Grill question bank

Starting points, not a script. Always rewrite a question so it is **specific to the target** — name the file, the requirement ID, the scenario tag. Skip anything the spec, code or an earlier grill session already answers. Every question you ask still needs *Why this matters* and *My recommended answer*.

---

## By lens

### Problem
- What evidence do we have that this problem is real — and how often does it happen?
- What do people do today instead? Why is that not good enough?
- If we never built this, who would notice, and how soon?

### Users
- Who exactly is the primary user? Name one real person or role.
- Is there a second user type with different needs (admin, guest, viewer)?
- What does a first-time user see versus a returning user?

### Scope
- What is the smallest version that still solves the core problem?
- Which Must-have could become a Should without breaking the goal?
- Which non-goal will a stakeholder ask for in week one — and what will we say?

### Alternatives
- What is the boring, off-the-shelf option (a spreadsheet, an existing SaaS, a library)? Why not that?
- What did we reject, and why? Is that written down?
- If we had half the time, what would we build instead?

### Data
- Where does this data live, and who owns it?
- What happens when it's missing, duplicated, stale or wrong?
- Is any of it personal data? How long do we keep it, and how is it deleted?
- What is the source of truth if two places disagree?

### Security
- Who can do what? What stops someone doing it who shouldn't?
- What if a user lies, repeats a request, or tampers with the input?
- Where do secrets live? Who can read them?
- What is the worst thing a malicious user could do with this feature?

### Cost
- What does this cost per month to run at 10× today's expected usage?
- What does it cost in maintenance hours — who updates it in a year?
- Are we paying for anything idle (always-on servers, oversized databases)? Is there a budget alert?

### Operability
- How will we know it's broken before a user tells us?
- What does a junior on call do at 2 a.m. when it fails? Is that written down?
- How do we roll back a bad deploy? How long does it take?

### Reversibility
- Is this a one-way door (hard to undo) or a two-way door (easy to change)?
- If we're wrong, what is the migration path and roughly how many days?
- What would we have to throw away?

### Failure in 3 months
- It's three months from now and this decision hurt. What most likely happened?
- What assumption, if false, makes this whole plan wrong?
- What will the first real user do that we didn't expect?

---

## By stage

### PRD (`01-prd.md`)
- Is the problem statement about a user's pain, or about a solution we already like?
- Which FR is not testable as written? (Try writing its Given/When/Then.)
- Do the success metrics measure the goal, or just activity?
- Are there permissions in the input that never became requirements?
- Which assumption in the Assumptions table is most likely false?
- Are there more than ~8 Musts? Which ones are really Shoulds?

### Stories (`02-stories.md`)
- If only the walking skeleton shipped, would your main persona actually use it? What's the smallest thing that's missing?
- Which story is really a layer ("build the API", "set up the database") wearing a story costume?
- Which "so that" just restates the "I want"? What's the real benefit behind it?
- Which story would you struggle to demo in one sentence? That one is too big.
- Which split leaves the first child useless on its own? Try a different pattern.
- Which story depends on another that's scheduled *after* it in the build order?
- Which deferred edge case makes the happy path unsafe (double charge, data leak, wrong winner)?
- Is any Must requirement covered only by a Could story?

### Scenarios (`02-scenarios/`)
- Which Must FR has only a happy-path scenario and no `@error` or `@edge` case?
- What happens at the boundaries — zero, one, the maximum, just past the maximum?
- What happens if two users do this at the same moment?
- Which step is imperative (clicks, selectors) and will break when the UI changes?
- Is there a scenario no FR asks for (scope creep)?
- What about time — deadlines, time zones, daylight saving, "yesterday"?

### Design (`03-design-prompt.md`, `04-design/`)
- Which screen has no empty, loading or error state?
- Can every flow be done with a keyboard only? Is focus order sensible?
- What does a user with a 360 px-wide phone see?
- Is any information conveyed only by colour?
- Does the copy use the same words as the PRD and scenarios?
- Did the design add anything not in the scenarios? Who approved it?

### Tech plan (`05-tech-plan.md`)
- Why this database / framework / service over the boring default in the stack profile?
- Which table or field does no scenario need? Why does it exist?
- Which API endpoint has no error cases defined?
- Where is authorisation checked — and is it checked on the server, not just hidden in the UI?
- Is task 1 a walking skeleton that deploys end to end? If not, why not?
- Which task is "L"-sized and should be split?
- What is the migration plan if the data model changes after launch?
- What happens to in-flight requests during a deploy?

### Pull request
- Which scenario tags does this PR claim, and do the tests actually prove them?
- Was each new test seen failing first?
- What is the rollback plan if this breaks production?
- Is there any new dependency? Who maintains it, and how many weekly downloads does it have?
- Did any spec or doc need updating, and was it updated?
- What did the diff change that the PR description doesn't mention?

### Cloud choice (`/deploy`, Project Profile `Cloud`)
- Why this cloud? Credits, company standard, or just familiarity?
- Where are the users, and which region minimises latency and data-residency risk?
- Does the app scale to zero when idle, or are we paying 24/7?
- Is there a budget alert set before the first deploy?
- How does CI authenticate — OIDC, or a long-lived key that could leak?
- What is the teardown command, and has anyone tried it?
- What breaks if we later need to move to another cloud?

### New dependency
- What does it do that ~50 lines of our own code couldn't?
- Last release date, open issues, maintainers, licence?
- How big is it — what does it add to bundle size or image size?
- What's the exit plan if it's abandoned?
