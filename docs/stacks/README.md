# Stack profiles

A **stack profile** is the recipe for one kind of app: how to create it, run it, test it, containerize it and deploy it. `/scaffold` reads the profile named in the Project Profile (`AGENTS.md`) to create the app; `/build` reads it for commands and test conventions; `/deploy` reads its "Container" section.

Every app lives in its own folder under `apps/` (for example `apps/web`, `apps/api`) with its **own lockfile**, so each folder is a self-contained Docker build context and `scripts/verify.mjs` can detect and check it on its own.

| Profile | Kind | Language | BDD runner | Best cloud fit | Junior difficulty |
| --- | --- | --- | --- | --- | --- |
| [`nextjs-shadcn`](nextjs-shadcn.md) — **default** | Full-stack web app (UI + API in one) | TypeScript | playwright-bdd | Any — Cloud Run is the simplest | ★☆☆ easy |
| [`react-vite-shadcn`](react-vite-shadcn.md) | Single-page frontend (pair with an API) | TypeScript | playwright-bdd | Any container service, or static hosting | ★☆☆ easy |
| [`node-api`](node-api.md) | REST API | TypeScript (Fastify) | @cucumber/cucumber | Any | ★★☆ easy–medium |
| [`python-fastapi`](python-fastapi.md) | REST API | Python (FastAPI) | pytest-bdd | Any | ★★☆ easy–medium |
| [`dotnet-api`](dotnet-api.md) | REST API | C# (ASP.NET Core) | Reqnroll | Any — natural fit for Azure shops | ★★☆ medium |
| [`go-api`](go-api.md) | REST API | Go (net/http) | godog | Any | ★★☆ medium |

## Which one should I pick?

- **Building a web product and not sure?** `nextjs-shadcn`. One app, one language, one deploy. Add an API profile later only if you need one.
- **Your team already has a backend language** (Python, C#, Go, Node)? Pair `react-vite-shadcn` (or `nextjs-shadcn`) as `apps/web` with that API profile as `apps/api`.
- **API only, no UI?** Pick the API profile in the language you know best — the harness works the same for all of them.

## What every profile guarantees

| Guarantee | Why it matters |
| --- | --- |
| A `GET /health` endpoint returning `200` and `{"status":"ok"}` (`/api/health` for Next.js) | Clouds and smoke tests use it to know the app is alive |
| Listens on the `PORT` environment variable (default `8080` in containers) | Cloud Run, Container Apps and ECS all tell the container which port to use |
| A multi-stage `Dockerfile` that runs as a **non-root** user | Small images, smaller attack surface |
| `lint`, `typecheck`, `test`, `test:bdd`, `build` commands that `npm run verify` auto-detects | One command checks every app, whatever the language |
| Gherkin scenarios from `specs/*/02-scenarios/*.feature` run as acceptance tests | The spec *is* the test |
| An `.env.example` listing every variable, with no real values | New teammates know what to set; secrets stay out of git |

## How `npm run verify` detects each app

| Found in `apps/<name>/` | Commands run |
| --- | --- |
| `package.json` | the `format:check`, `lint`, `typecheck`, `test`, `test:bdd`, `build` scripts that exist |
| `pyproject.toml` | `ruff check .` and `pytest` (through `uv run` when `uv.lock` exists) |
| `go.mod` | `go vet ./...`, `go test ./...` and `go build ./...` |
| `*.sln`, `*.slnx` or `*.csproj` | `dotnet build` and `dotnet test` |

`test:bdd` runs your Gherkin scenarios. In the web profiles it starts the app and a headless browser, so the first `verify` downloads Playwright's Chromium (`npx playwright install chromium`) and takes longer than the other gates. It still runs on every `verify`, because the scenarios *are* the acceptance tests. For Python, Go and .NET the BDD runner is part of the normal test command, so no separate script is needed.

## Adding a profile

Copy an existing file, keep the same section headings (Overview · When to pick it · Commands · Layout · Testing & BDD runner · Container · Cloud fit · Junior gotchas), and add a row to the table above. See [CONTRIBUTING.md](../../CONTRIBUTING.md#adding-a-stack-profile).
