# Gherkin style guide

How ShipRight writes `.feature` files. The short version: **business language, one behaviour per scenario, every scenario tagged.**

---

## 1. Anatomy

```gherkin
# OPEN QUESTION: Can a poll creator vote in their own poll? (Recommended: yes)
Feature: Vote in a lunch poll
  As a team member
  I want to vote for where we eat
  So that lunch is decided without a long chat thread

  Background:
    Given the "Platform" team has an open poll "Friday lunch" with options:
      | option        |
      | Thai Garden   |
      | Burger Barn   |
    And Sam is signed in as a member of the "Platform" team

  @LUNCH-05 @FR-4 @happy
  Scenario: A member casts a vote
    When Sam votes for "Thai Garden"
    Then Sam sees their vote recorded for "Thai Garden"
    And the poll shows 1 vote for "Thai Garden"
```

- **Feature** — the capability, plus a short user story (As a / I want / So that).
- **Background** — setup that *every* scenario in the file needs. If only some need it, put it in those scenarios.
- **Scenario** — one behaviour. Its title says the rule in plain English.
- **Given** — the world before. **When** — the one action. **Then** — the observable outcome.
- **And / But** — continue the previous step type.

---

## 2. Declarative, not imperative

Describe *what* the user achieves, not *how* they click. UI changes; behaviour doesn't.

❌ **Imperative (brittle)**

```gherkin
Scenario: Vote
  Given I go to "/polls/42"
  When I click the button with id "option-2"
  And I click "Submit"
  Then the element ".vote-count" contains "1"
```

✅ **Declarative (durable)**

```gherkin
@LUNCH-05 @FR-4 @happy
Scenario: A member casts a vote
  When Sam votes for "Thai Garden"
  Then the poll shows 1 vote for "Thai Garden"
```

The step definitions (written in `/build`) hold the clicks and selectors — in one place, easy to update.

---

## 3. One behaviour per scenario

One `When`. If you need two actions, you probably have two scenarios — or the first action belongs in `Given`.

❌

```gherkin
Scenario: Voting and changing vote
  When Sam votes for "Thai Garden"
  Then the poll shows 1 vote for "Thai Garden"
  When Sam changes their vote to "Burger Barn"
  Then the poll shows 1 vote for "Burger Barn"
```

✅

```gherkin
@LUNCH-05 @FR-4 @happy
Scenario: A member casts a vote
  When Sam votes for "Thai Garden"
  Then the poll shows 1 vote for "Thai Garden"

@LUNCH-06 @FR-5 @happy
Scenario: A member changes their vote while the poll is open
  Given Sam has voted for "Thai Garden"
  When Sam changes their vote to "Burger Barn"
  Then the poll shows 1 vote for "Burger Barn"
  And the poll shows 0 votes for "Thai Garden"
```

---

## 4. Business language and real data

- Use the personas' names from the PRD (`Sam`, `Priya`), not `user1`.
- Use realistic values (`"Thai Garden"`, `"12:00"`), not `foo`, `test`, `xxx`.
- Use the PRD's vocabulary. If the PRD says "poll", don't write "survey".
- `Then` describes what the user **sees or can do**, not database rows or internal state.

❌ `Then the votes table has a row with user_id 7`
✅ `Then Sam sees their vote recorded for "Thai Garden"`

---

## 5. Scenario Outline — when only data varies

```gherkin
@LUNCH-02 @FR-1 @error
Scenario Outline: A poll needs a valid title
  When Priya creates a poll titled "<title>"
  Then Priya sees the error "<message>"

  Examples:
    | title                                                         | message                                 |
    |                                                               | Give your poll a title                  |
    | Lunch on Friday at the new place near the station by the park | Keep the title under 60 characters      |
```

Use an outline when the *steps* are identical and only values change. If the steps differ, write separate scenarios.

---

## 6. Rule — grouping scenarios under one business rule

```gherkin
Rule: Votes are only accepted while the poll is open

  @LUNCH-08 @FR-6 @error
  Scenario: A member cannot vote after the deadline
    Given the poll "Friday lunch" closed at 11:30
    When Sam votes for "Thai Garden"
    Then Sam sees "This poll has closed"
```

Use `Rule:` when a file has several scenarios illustrating the same rule — it makes the file read like a spec.

---

## 7. Tags

Every scenario carries:

| Tag | Required | Meaning |
| --- | --- | --- |
| `@<KEY>-<nn>` | ✅ exactly one | Unique scenario ID, e.g. `@LUNCH-04`. Sequential across the whole `02-scenarios/` folder. Never reused or renumbered — commits, tests and design artboards reference it. |
| `@FR-<n>` / `@NFR-<n>` | ✅ at least one | Which PRD requirement(s) this proves. |
| `@happy` / `@edge` / `@error` | ✅ exactly one | Main success path / boundary or unusual case / failure or rejection. |
| `@wip` | optional | Deliberately unfinished — excluded from CI until ready. |

Put tags on the line directly above `Scenario:` / `Scenario Outline:`.

---

## 8. Coverage checklist

For every happy path, consider:

- [ ] **Validation** — missing, too long, wrong format
- [ ] **Permissions** — who must *not* be able to do this
- [ ] **Empty state** — nothing exists yet
- [ ] **Limits** — 0, 1, max, max + 1
- [ ] **Duplicates & concurrency** — same action twice, two users at once
- [ ] **Time** — deadlines, time zones, expiry
- [ ] **Dependency failure** — a service or network is down

Rule of thumb: every **Must** FR has at least one `@error` or `@edge` scenario.

---

## 9. Coverage matrix

After writing, fill section 12 of the PRD:

```markdown
| Requirement | Scenarios |
| --- | --- |
| FR-1 | @LUNCH-01, @LUNCH-02, @LUNCH-03 |
| FR-2 | @LUNCH-04 |
| FR-3 | ⚠️ none — open question Q2 |
```

An FR with no scenario won't be built. A scenario with no FR is scope creep — raise it.

---

## 10. Smells to fix before showing the human

| Smell | Fix |
| --- | --- |
| "click", "page", "button", URL, CSS selector in a step | Rewrite as the user's intent |
| More than one `When` | Split the scenario or move setup into `Given` |
| `Then` checks the database | Assert what the user sees |
| Scenario title is "Test 3" or "Vote works" | Title states the rule: "A member cannot vote twice" |
| Background used by only half the scenarios | Move those steps into the scenarios that need them |
| More than ~8 steps | Too much setup in steps — collapse into one meaningful `Given` |
| Missing tag | Add `@KEY-nn`, `@FR-n`, type tag |
