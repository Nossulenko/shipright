---
name: scaffold
description: Creates the app skeleton under apps/ for the stack in the Project Profile, using the official generators and the matching stack profile in docs/stacks/ — design library, lint, type-check, tests, BDD runner wired to the spec folders, /health endpoint, Dockerfile and .env.example. Use once per project (or when adding a new app) after /start, or when the human asks to set up, create or initialise the app.
argument-hint: "[optional: app name, e.g. web or api]"
---

# /scaffold — Create the app skeleton

> **Role:** frontend-engineer + backend-engineer (main conversation orchestrates) · **Input:** Project Profile, `docs/stacks/<profile>.md` · **Output:** `apps/<name>/`, `docs/architecture/README.md` · **Next:** `/new-feature` (or `/tech-plan` if specs are ready)

## What this does

Builds an empty-but-working app for the stack the human chose: it starts, it has a `/health` endpoint, its tests run, its acceptance tests read the Gherkin files in `specs/`, and it can be packaged as a container for any cloud. No product features yet — those come one scenario at a time with `/build`.

## Before you start

1. Read the **Project Profile** in `AGENTS.md`. If Frontend and Backend are both `not set`, stop: *"Run `/start` first so I know which stack to set up."*
2. Read `docs/stacks/README.md` and the profile file(s) for the chosen Frontend and Backend. **The stack profile is the source of truth for commands, folder layout, test runner wiring and Dockerfile.** Don't use commands from memory when the profile gives them.
3. If `apps/<name>/` already exists, stop and ask whether to add a *new* app or leave the existing one alone. Never overwrite an existing app.
4. Check the branch: if on `main`, create `chore/scaffold` (`git switch -c chore/scaffold`).

## Steps

### Step 1 — Plan the apps and confirm

Decide which apps to create:

| Project Profile                                   | Apps                          |
| ------------------------------------------------- | ----------------------------- |
| Next.js frontend, backend = "same Next.js app"    | `apps/web`                    |
| Frontend + separate backend                       | `apps/web` and `apps/api`     |
| API only (Frontend `none`)                        | `apps/api`                    |

Use the argument as the app name if given. Show the plan as a short list — app, stack profile, generator command, design library, database, BDD runner — and ask *"Create these?"*.

### Step 2 — Generate with the official tool

Run the generator command from the stack profile, from the repo root, targeting `apps/<name>`. Use the non-interactive flags the profile lists so nothing hangs on a prompt. Examples of what profiles use (always prefer the profile's exact line):

- Next.js: `npx create-next-app@latest apps/web --ts --eslint --tailwind --app --src-dir --import-alias "@/*" --use-pnpm`
- Vite + React: `pnpm create vite apps/web --template react-ts`
- FastAPI / .NET / Go: the profile's `uv init`, `dotnet new webapi`, or `go mod init` sequence.

**The root `package.json` belongs to the harness.** Never replace or delete it. Each app has its own `package.json` / `pyproject.toml` / `.csproj` / `go.mod` and its own lockfile.

### Step 3 — Design library (apps with a UI)

- **shadcn/ui** (default, or Design library `not set`):
  ```bash
  cd apps/web
  npx shadcn@latest init
  npx shadcn@latest add button card input label form dialog sonner skeleton badge
  ```
  Accept the profile's style/base-colour defaults. Add `lucide-react` if the init didn't.
- **Any other library** named in the Project Profile: follow the profile's install section, or the library's official getting-started guide (fetch it — don't guess). Note the choice in `docs/architecture/README.md`.

### Step 4 — Quality scripts

Make sure the app exposes these commands, because `npm run verify` and CI look for them:

| Script / command | Purpose                                   |
| ---------------- | ----------------------------------------- |
| `lint`           | linter (ESLint, ruff, golangci-lint/go vet, dotnet format --verify-no-changes) |
| `typecheck`      | type checker (`tsc --noEmit`, mypy/pyright) — skip for Go/.NET where `build` covers it |
| `test`           | fast unit tests (Vitest, pytest, go test, dotnet test) |
| `test:bdd`       | acceptance tests from `.feature` files    |
| `build`          | production build                          |
| `format`         | formatter (Prettier, ruff format, gofmt)  |

For JS/TS apps these are `package.json` scripts. For other stacks, follow the profile's mapping (e.g. a `Makefile` or documented commands). Add a starter unit test so `test` is not empty.

### Step 5 — Wire the BDD runner to the specs

The runner named in the Project Profile must read feature files **from the spec folders**, not from copies:

- Glob: `../../specs/**/02-scenarios/*.feature` (relative to `apps/<name>/`) plus the app's own smoke feature.
- Follow the profile's exact config (e.g. `defineBddConfig({ features: [...], steps: [...] })` for playwright-bdd; `paths` in `cucumber.js`; `bdd_features_base_dir` for pytest-bdd; Reqnroll linked files; godog `Paths`).

Add one smoke feature inside the app so the wiring is proven on day one:

```gherkin
# apps/<name>/e2e/smoke.feature   (path per the profile)
Feature: App is alive
  @smoke @SMOKE-01
  Scenario: Health check responds
    When I request the health endpoint
    Then the response status is 200
```

Keep the lower-case `@smoke` tag: the deploy skills run `--grep @smoke` against the live URL after every deploy. Write its step definitions. Run `test:bdd` once **before** adding the `/health` route and confirm it fails because the route is missing (observed red), then continue.

### Step 6 — Health endpoint

Add `GET /health` (Next.js: `src/app/health/route.ts` or `api/health`, per the profile) returning `200` and `{"status":"ok"}`. No database call in v1 — it must answer even when dependencies are down. Re-run `test:bdd` → green.

### Step 7 — Container

Add the profile's `Dockerfile` and `.dockerignore` to `apps/<name>/`. The container must listen on `$PORT` (default `8080`) — every cloud skill relies on that. If Docker is available:

```bash
docker build -t <name>:local apps/<name>
docker run --rm -p 8080:8080 -e PORT=8080 <name>:local
curl -fsS localhost:8080/health
```

If Docker isn't installed, say so and skip — `/deploy` will remind them later.

### Step 8 — Environment and ignore files

- `apps/<name>/.env.example` listing every variable with placeholder values and a comment each (`PORT=8080`, `DATABASE_URL=postgres://user:password@localhost:5432/app`).
- Make sure `.env`, `.env.local`, build output and dependency folders are git-ignored (append to the root `.gitignore` only if missing).

### Step 9 — Database (if the Profile names one)

Install the ORM/migration tool the profile names, create the config pointing at `DATABASE_URL`, and generate an **empty initial migration** so the migration workflow exists from day one. Offer a `docker compose` file for a local Postgres if the profile includes one. Don't create tables yet — the tech plan decides the data model.

### Step 10 — Current-state architecture doc

Create or update `docs/architecture/README.md`:

```markdown
# Architecture — current state

## Apps
| App | Path | Stack profile | Port | Health |
|-----|------|---------------|------|--------|
| web | apps/web | docs/stacks/nextjs-shadcn.md | 3000 (dev) / 8080 (container) | GET /health |

## Key choices
- Design library: shadcn/ui (Tailwind CSS, lucide-react)
- Database: PostgreSQL via Drizzle ORM — migrations in apps/web/drizzle/
- Acceptance tests: playwright-bdd reading specs/**/02-scenarios/*.feature

## How to run locally
<the 3–5 commands from the stack profile>
```

### Step 11 — Verify and commit

```bash
npm run verify
```

Fix anything red. Then show `git status`, propose the commit `chore: scaffold <name> app (<stack>)`, and commit **only after the human says yes**. Don't push — that's `/ship`.

## Gate — before moving on

- [ ] App starts locally with the profile's dev command
- [ ] `GET /health` returns 200
- [ ] Smoke scenario `@SMOKE-01` was seen red, then green
- [ ] `npm run verify` passes
- [ ] `.env.example` documents every variable; no real secrets anywhere
- [ ] `docs/architecture/README.md` describes the app

## Tell the human

> ✅ **Your <stack> app is ready in `apps/<name>/`.**
>
> **What I did:** generated the app with the official tool, added <design library>, wired acceptance tests to read your Gherkin files in `specs/`, added a `/health` check and a Dockerfile.
> **Why:** every feature from now on starts as a failing scenario and ends green — the wiring has to exist first. The Dockerfile means any of AWS, Azure or Google Cloud can run it later.
> **What to check:** run `<dev command>` and open `http://localhost:<port>` — then `http://localhost:<port>/health`.
>
> **Next:** `/new-feature` — paste your first idea, notes or meeting transcript.
