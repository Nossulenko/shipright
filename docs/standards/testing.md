# Testing standards

In Shipright the Gherkin scenarios in `specs/` **are** the acceptance tests. Everything else in this file exists to make those scenarios fast, honest and trustworthy.

---

## 1. Why we test (the junior version)

A test is a promise written as code: *"this keeps working."* Without tests, every change is a gamble and you only find out in production. With good tests, you can change code confidently — and so can the AI agent working with you.

## 2. The test pyramid

```
            ▲   Acceptance (Gherkin scenarios, real browser / real HTTP)
           ▲▲▲  few, slow, prove the user-visible behaviour
         ▲▲▲▲▲▲  Integration (API + database, component + API)
        ▲▲▲▲▲▲▲▲  some, medium speed, prove the parts fit together
     ▲▲▲▲▲▲▲▲▲▲▲▲  Unit (pure functions, business rules)
                    many, milliseconds each, prove the rules
```

- **Unit** — one function or rule, no network, no database. `canVote(poll, member, now)`. Most of your tests.
- **Integration** — an API route against a real (test) database, or a component rendering with a mocked API. Proves wiring.
- **Acceptance** — a Gherkin scenario run end to end. One per scenario tag. Proves the feature works for a user.

Every scenario gets an acceptance test. Every business rule with branches (each distinct row in a scenario's Examples table) gets a unit test.

## 3. Gherkin scenarios as acceptance tests

- Feature files live in `specs/NNN-slug/02-scenarios/` and are read **in place** by the BDD runner — never copied.
- Each scenario has a scenario tag (`@LUNCH-03`) and at least one requirement tag (`@FR-2`). Commits and tests reference the scenario tag.
- Step definitions are shared and reused. Search before writing a new one.
- `Given` sets up state through the fastest honest path (API call or test data builder), not by clicking through the UI.
- `When` performs exactly one user action.
- `Then` asserts what the user sees or receives — visible text, roles, status codes, response bodies. Never internal state.
- If a scenario is wrong, fix the **spec** first (with the human's OK and a `grill-log.md` note), then the test. Never edit a `.feature` file to match the code.

## 4. Observed red — the most important rule

> A test only counts once you have seen it fail for the right reason.

1. Write the test before the implementation.
2. Run it. Read the failure.
3. It must fail **because the behaviour is missing** (element not found, 404, wrong value) — not because of a typo, missing import, undefined step or wrong URL.
4. Record the failure line in `PROGRESS.md` and the commit body.

A test you've never seen fail might be testing nothing. An assertion against a mock goes green against an empty function.

## 5. Tools per stack

| Stack            | Unit                  | Integration                              | Acceptance (BDD runner)          |
| ---------------- | --------------------- | ---------------------------------------- | -------------------------------- |
| Next.js / React  | Vitest                | Vitest + Testing Library; route handlers with a test DB | playwright-bdd (Playwright) |
| Node API         | Vitest                | Vitest + supertest + test DB             | @cucumber/cucumber               |
| Python FastAPI   | pytest                | pytest + `httpx`/TestClient + test DB    | pytest-bdd                       |
| .NET             | xUnit                 | xUnit + `WebApplicationFactory` + Testcontainers | Reqnroll                 |
| Go               | `go test`             | `go test` + `httptest` + test DB         | godog                            |

Exact commands and config live in each stack profile in [`docs/stacks/`](../stacks/). Each app exposes `test` (unit + integration) and `test:bdd` (acceptance) so `npm run verify` and CI can find them.

## 6. Writing good tests

- **Arrange – Act – Assert.** Set up, do one thing, check the result. One reason to fail per test.
- **Name tests as behaviour:** `rejects a vote after the deadline`, not `test2`.
- **Test behaviour, not implementation.** Don't assert that a private function was called; assert the outcome.
- **Mock at the edges only** — external HTTP APIs, email, payments, the clock. Don't mock your own modules to make a test pass.
- **Control time.** Inject a clock or use fake timers; never depend on "now".
- **No sleeps.** Use the runner's auto-waiting (`await expect(locator).toBeVisible()`), polling helpers, or events.
- **Selectors (UI):** role + accessible name → label → `data-testid="<tag-lowercase>-<element>"`. Never CSS classes or DOM position.
- **No `.only`, `.skip`, `xit`, `@skip`** committed without a linked issue and the human's OK.

## 7. Test data

- Use **builders** with sensible defaults so each test states only what matters: `aPoll().closingAt("12:00").build()`.
- Each test creates its own data and cleans up (transaction rollback, fresh schema, or unique IDs). Tests never depend on order.
- Use a separate test database, never a shared dev or production one. Testcontainers or a local Docker Postgres works well.
- Never use real personal data or production dumps.

## 8. Flaky tests

A flaky test passes and fails without code changes. It destroys trust in the whole suite.

1. **Confirm:** run it repeatedly in isolation (`npx playwright test --grep @LUNCH-03 --repeat-each=10`, `pytest --count=10` with pytest-repeat, `go test -count=10`).
2. **Classify:** timing (missing await/auto-wait) · shared state (order dependency) · environment (port, clock, network, time zone) · a real race condition in the product.
3. **Fix the cause.** A real race in the product is a bug — write a scenario for it.
4. **Quarantine only as a last resort**, with the human's OK and a tracking issue. Never delete a flaky test silently.

## 9. Coverage — a signal, not a target

- Coverage tells you what code **no test touches**. It doesn't tell you the tests are any good.
- Look at uncovered lines in business logic and ask "what behaviour isn't specified here?" — often the answer is a missing scenario.
- Don't write tests just to raise the number. A 60% suite of honest behaviour tests beats a 95% suite of assertion-free calls.
- **Scenario coverage** matters more: every scenario tag in the feature has a passing acceptance test before the feature ships.
