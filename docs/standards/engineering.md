# Engineering standards

These rules apply to every stack. Stack-specific conventions (folder names, tools, commands) live in the stack profiles in [`docs/stacks/`](../stacks/). When a stack profile and this file disagree, the stack profile wins for that stack — and someone should fix the disagreement.

The goal is code a junior developer can read, change and trust six months from now.

---

## 1. Folder conventions

```
apps/<name>/          one deployable app per folder (web, api, worker…)
  .env.example        every environment variable it reads, with placeholders
  Dockerfile          builds the production container (listens on $PORT)
specs/NNN-slug/       the spec for each feature — the source of truth for behaviour
docs/                 architecture (current state), decisions (ADRs), standards, stacks, deploy runbooks
scripts/              harness scripts and hooks — not product code
```

- Each app owns its manifest and lockfile (`package.json` + lockfile, `pyproject.toml` + `uv.lock`, `*.csproj`, `go.mod`). The root `package.json` belongs to the harness.
- Inside an app, group by **feature**, not by technical type, once the app has more than a handful of files: `polls/` with its route, service, schema and tests together beats `controllers/`, `services/`, `models/` scattered apart.
- Tests sit next to the code they test (`poll.ts` + `poll.test.ts`) unless the stack profile says otherwise. Acceptance steps live where the stack profile puts them.

## 2. Naming

- Names say **what a thing is or does**. `deadlineAt`, `closePoll`, `PollCard` — not `d`, `handle`, `Component1`.
- Booleans read as questions: `isClosed`, `hasVoted`, `canEdit`.
- Functions are verbs, values are nouns. Avoid `data`, `info`, `manager`, `helper`, `util` as whole names.
- Use the words from the PRD and Gherkin. If the spec says "poll" and "option", the code says `Poll` and `Option` — not `Survey` and `Choice`. One concept, one name, everywhere.
- Follow each language's casing: `camelCase` (TS/JS/Java), `snake_case` (Python, SQL), `PascalCase` types/components/C# methods, Go's exported `PascalCase` / unexported `camelCase`.

## 3. Functions and modules

- A function does one thing. If you need "and" to describe it, split it.
- Keep functions short enough to see at once (roughly ≤ 30 lines). Deep nesting (> 3 levels) is a sign to return early or extract.
- **Business rules live in plain functions**, not in HTTP handlers, React components or ORM hooks. `canVote(poll, member, now)` is easy to unit-test; a route handler is not.
- Pass dependencies in (database client, clock, HTTP client) rather than importing globals deep inside logic. It makes testing honest and simple.
- Prefer pure functions and immutable data where the language makes it natural.

## 4. Errors

- Fail loudly and early at the boundary; handle errors where you can do something useful about them.
- Never swallow an error (`catch {}`) without a comment explaining why it's safe.
- Distinguish **expected** failures (validation, not found, not allowed — return a clear result or HTTP 4xx) from **unexpected** ones (bugs, outages — log with context, return 5xx, don't leak internals).
- API errors use one consistent shape, defined in the tech plan, e.g. `{ "error": { "code": "POLL_CLOSED", "message": "Voting closed at 12:00." } }`.
- User-facing messages say what happened and what to do next, in plain words.

## 5. Validation at boundaries

Validate everything that crosses a trust boundary: HTTP requests, form submissions, webhooks, queue messages, file uploads, environment variables at startup, responses from third-party APIs you depend on.

- Use a schema library (Zod, Pydantic, FluentValidation / DataAnnotations, go-playground/validator — see the stack profile).
- Parse, don't just check: turn untrusted input into a typed value once, at the edge, and pass the typed value inward.
- Share schemas between client and server when the stack allows, but always validate on the server.

## 6. Configuration via environment

- All configuration that differs between environments (URLs, credentials, feature flags, ports) comes from **environment variables**.
- Read and validate config **once at startup** into a typed config object; fail fast with a clear message if something required is missing.
- Every variable is listed in the app's `.env.example` with a placeholder and a one-line comment.
- Containers listen on `$PORT` (default `8080`).
- Secrets come from `.env` locally (git-ignored) and from the cloud's secret manager in production. See [`security.md`](security.md).

## 7. Logging and observability

- Log **events**, not novels: `poll.closed pollId=… votes=12`. Use the stack's structured logger (JSON in production).
- Levels: `error` (someone should look), `warn` (unexpected but handled), `info` (important business events), `debug` (development only).
- Include context that helps debugging: request id, user id (not email), entity ids.
- **Never log** passwords, tokens, API keys, full personal data, or whole request bodies.
- Every app has `GET /health` that returns 200 without touching dependencies. Add a separate readiness check later if needed.

## 8. Dependencies

Every dependency is code you didn't write but now own.

- Before adding one, ask: can the standard library or an existing dependency do this in a few lines?
- If you do add one, check: actively maintained (release in the last ~6 months), widely used, permissive licence, spelled correctly (typosquats are real).
- Say why in the commit or PR. Adding a dependency needs the human's OK.
- Commit lockfiles. Upgrade regularly in small batches, not once a year in a panic.

## 9. Comments and documentation

- Code says **what**; comments say **why** — a business rule, a non-obvious constraint, a workaround with a link.
- Don't comment out code; delete it. Git remembers.
- Public functions in shared modules get a one-line doc comment when the name alone isn't enough.
- When behaviour changes, update the spec and `docs/architecture/` in the same PR (Golden Rule 9 in `AGENTS.md`).

## 10. Data and migrations

- Every schema change is a migration file in git. No "push schema to database" shortcuts.
- Migrations are forward-only and safe to run before the new code is deployed: add (nullable) → backfill → switch reads → enforce constraint → remove old, across separate releases when needed.
- Enforce invariants in the database where possible (unique indexes, foreign keys, NOT NULL, check constraints). App-level checks alone lose races.
- Store times in UTC; store money as integers in the smallest unit (cents) or a decimal type — never floats.

## 11. Git hygiene

- Small commits, one scenario or one concern each, Conventional Commits with the scenario tag (see [`CONTRIBUTING.md`](../../CONTRIBUTING.md)).
- Never commit to `main`, never force-push shared branches, never use `--no-verify` to get past a hook.
- Never commit generated build output, dependency folders, `.env` files or editor settings that aren't shared.
