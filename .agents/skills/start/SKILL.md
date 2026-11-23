---
name: start
description: User-invoked only. First-run onboarding for ShipRight — checks the tools on this machine, turns on the git hooks, interviews the human one question at a time, and fills in the Project Profile in AGENTS.md. Re-run any time to change an answer.
argument-hint: "[optional: the setting to change, e.g. cloud]"
disable-model-invocation: true
---

# /start — Set up ShipRight for your product

> **Role:** mentor (main conversation) · **Input:** this machine + the human's answers · **Output:** filled Project Profile in `AGENTS.md`, git hooks on · **Next:** `/scaffold`, then `/new-feature`

## What this does

Gets a brand-new ShipRight project ready in about five minutes. You check that the right tools are installed, switch on the safety hooks, and ask the human a short list of questions about their product. Their answers go into the **Project Profile** table at the top of `AGENTS.md`, which every other skill reads.

## Before you start

- If an argument names a single setting (e.g. `/start cloud`), skip to Step 3 and ask only about that setting, then go to Step 4.
- If the Project Profile already has values, show them first and ask: *"Want to change anything, or keep these?"* Only re-ask the settings they want to change.
- Greet the human by explaining in two sentences what ShipRight is: *"ShipRight walks you from a raw idea to a deployed product. Every feature goes idea → PRD → Gherkin scenarios → design → code → deploy, and I'll explain each step as we go."*

## Steps

### Step 1 — Check the tools

Run these checks (one Bash call per line is fine; ignore failures, you're collecting facts):

```bash
git --version
node --version
gh --version && gh auth status
docker --version
```

Then, only for the cloud they choose later (come back to this after Step 3 if needed):

```bash
aws --version && aws sts get-caller-identity       # AWS
az version && az account show                      # Azure
gcloud --version && gcloud config list             # Google Cloud
```

Show a small table: tool · found? · version · needed for. Required: **git**, **Node.js ≥ 20** (the hooks and `npm run verify` use it). Recommended: **gh** (opens pull requests), **Docker** (runs containers locally before deploying), the **cloud CLI** for their cloud.

For anything missing, give the one install line for their OS (ask which OS if you can't tell from the shell):

| Tool       | macOS (Homebrew)                | Windows (winget)                         | Linux (Debian/Ubuntu)                                   |
| ---------- | ------------------------------- | ---------------------------------------- | ------------------------------------------------------- |
| git        | `brew install git`              | `winget install Git.Git`                 | `sudo apt install git`                                  |
| Node.js 20+| `brew install node@22`          | `winget install OpenJS.NodeJS.LTS`       | use nvm: https://github.com/nvm-sh/nvm                  |
| gh         | `brew install gh`               | `winget install GitHub.cli`              | https://github.com/cli/cli/blob/trunk/docs/install_linux.md |
| Docker     | `brew install --cask docker`    | `winget install Docker.DockerDesktop`    | https://docs.docker.com/engine/install/                 |
| AWS CLI    | `brew install awscli`           | `winget install Amazon.AWSCLI`           | https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html |
| Azure CLI  | `brew install azure-cli`        | `winget install Microsoft.AzureCLI`      | https://learn.microsoft.com/cli/azure/install-azure-cli-linux |
| gcloud     | `brew install --cask google-cloud-sdk` | `winget install Google.CloudSDK`  | https://cloud.google.com/sdk/docs/install              |

Missing optional tools don't block onboarding. Missing git or Node does — stop and help them install it first.

If `gh auth status` fails, suggest they run `! gh auth login` (the `!` runs it in this session).

### Step 2 — Switch on the safety hooks

```bash
npm run setup
```

This points git at `.githooks/` so every commit and push runs ShipRight's checks (no commits on `main`, secret scan, `npm run verify`). Explain that in one sentence. Confirm with `git config core.hooksPath` → `.githooks`.

### Step 3 — Interview (one question at a time)

Ask **one question per message**. Always give a recommended default they can accept with "yes" or Enter. Keep a running summary so they can see their choices build up.

| # | Question | Recommended default | Notes |
|---|----------|---------------------|-------|
| 1 | What's the product called? | — | Free text. Becomes `Product name`. |
| 2 | Describe it in one sentence: who is it for and what does it help them do? | — | Becomes `One-line pitch`. Push gently for "who + what" if vague. |
| 3 | What kind of app? Web app (most common), API only, or web + separate API? | Web app | Drives Frontend/Backend below. |
| 4 | Frontend stack? | Next.js (App Router) + TypeScript | Show the options table from `docs/stacks/README.md`. Write `none` for API-only. |
| 5 | Backend? | Same Next.js app (route handlers / server actions) | Offer the backend profiles in `docs/stacks/README.md` if they want a separate API. |
| 6 | Design library? | shadcn/ui | Explain: *"shadcn/ui gives you good-looking, accessible components you own as code. Pick something else only if your team already uses it (MUI, Mantine, Chakra…)."* |
| 7 | Database? | PostgreSQL + Drizzle ORM | Match the stack profile's recommendation (e.g. SQLAlchemy for FastAPI, EF Core for .NET). `none` is allowed. |
| 8 | Which cloud will you deploy to? | `decide later` is fine | `aws` · `azure` · `gcp` · `decide later`. One line each: GCP → Cloud Run, Azure → Container Apps, AWS → ECS Express Mode. If their company already has an account somewhere, pick that. |
| 9 | Package manager? | pnpm (JS stacks) | For non-JS stacks, record the stack's default (uv, dotnet, go) and skip the question. |
| 10 | Where do you track work? | GitHub Issues | `none` is fine. |
| 11 | Teaching mode — should I explain every step in plain language? | on | Explain they can turn it off later with `/start teaching`. |

Derive **BDD test runner** from the stack (don't ask): web frontend → `playwright-bdd`; Node API only → `@cucumber/cucumber`; Python → `pytest-bdd`; .NET → `Reqnroll`; Go → `godog`. Read the chosen stack profile in `docs/stacks/` to confirm.

If they answer "I don't know" to anything, choose the recommended default, say so, and note that `/start <setting>` can change it later.

### Step 4 — Write the Project Profile

Show the final table and ask: *"Shall I save this to AGENTS.md?"* On yes, edit **only the Value column** of the Project Profile table in `AGENTS.md`. Keep every other part of the file identical. Use backticks around values like the existing rows, e.g. `` `gcp` ``. Use `decide later` → leave Cloud as `` `not set` ``.

If they chose a cloud in Step 3 and skipped its CLI check in Step 1, run that check now.

### Step 5 — Point them to the road ahead

Explain the pipeline in five short lines using their product name:

```
1. /scaffold      create the app skeleton for your stack (once)
2. /new-feature   paste your raw idea → PRD → grill → Gherkin → design prompt
3. Claude Design  paste the prompt, export, then /import-design
4. /tech-plan + /build   plan, then build one scenario at a time
5. /ship → /deploy       open a PR, then put it on the internet
```

Mention `/next` (tells you what to do next at any moment) and `/explain` (explains anything).

## Gate — before moving on

- [ ] git and Node ≥ 20 are installed
- [ ] `git config core.hooksPath` prints `.githooks`
- [ ] Project Profile in `AGENTS.md` has no `not set` except Cloud (allowed) and values the human deferred
- [ ] The human knows the next command

## Tell the human

> ✅ **ShipRight is set up for <Product name>.**
> Stack: <frontend> / <backend> · Design: <design library> · Cloud: <cloud or "later">
>
> **What I did:** checked your tools, turned on git safety hooks, saved your choices to the Project Profile in `AGENTS.md`.
> **Why:** every other command reads that table, so you never have to repeat yourself.
> **What to check:** open `AGENTS.md` and look at the table at the top — change anything with `/start <setting>`.
>
> **Next:** run `/scaffold` to create your app.
