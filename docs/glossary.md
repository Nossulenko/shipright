# Glossary

Plain-language definitions for every term ShipRight uses. If you meet a word that isn't here, ask `/explain <word>` — and suggest adding it.

[A](#a) · [B](#b) · [C](#c) · [D](#d) · [E](#e) · [F](#f) · [G](#g) · [H](#h) · [I](#i) · [L](#l) · [M](#m) · [O](#o) · [P](#p) · [R](#r) · [S](#s) · [T](#t) · [V](#v) · [W](#w)

---

## A

**Acceptance criteria** — The conditions a feature must meet to count as done, written from the user's point of view. In ShipRight they're written as Gherkin scenarios, so they double as tests.

**ADR (Architecture Decision Record)** — A short document recording one important technical decision: the context, the options, what was chosen and why. Stored in `docs/decisions/`, never edited after acceptance — a later ADR supersedes it instead. Like a ship's log for design choices.

**Artifact registry / container registry** — A private storage service for container images, like a library for the packaged versions of your app. Your cloud pulls the image from here when it deploys. AWS: ECR · Azure: Azure Container Registry · Google Cloud: Artifact Registry.

## B

**BDD (Behaviour-Driven Development)** — Writing down how software should behave, in examples everyone can read (Gherkin), *before* building it — then turning those examples into automated tests.

**Branch** — A separate line of work in git. You make changes on a branch (`feat/001-team-lunch-poll`) so `main` stays stable, then merge through a pull request.

**Budget alert** — A cloud setting that emails you when spending passes an amount you choose. Set one before deploying anything so a mistake never becomes a surprise bill.

**Buildpacks** — A tool that looks at your code, works out the language, and builds a container image for you without a Dockerfile. `gcloud run deploy --source .` and `az containerapp up --source .` can use them.

## C

**CI/CD (Continuous Integration / Continuous Delivery)** — Automation that runs on every push. CI checks the code (lint, tests, build); CD deploys it. ShipRight uses GitHub Actions.

**Claude Design** — Anthropic's design tool (claude.ai/design) that turns a prompt into screens and clickable prototypes. `/design-prompt` writes the prompt for you; you export the result into `04-design/`.

**Cold start** — The extra delay on the first request after a scaled-to-zero app wakes up, because a new container has to start. Usually a second or two; set a minimum of one instance if it matters.

**Container** — Your app packaged with everything it needs to run (runtime, libraries, files), so it behaves the same on your laptop and in the cloud. Like a shipping container: the ship doesn't care what's inside.

**Container image** — The built, read-only package a container runs from, made from a Dockerfile and tagged with a version (`web:3f2a1c`). You push images to a container registry; the cloud runs containers from them.

**CORS (Cross-Origin Resource Sharing)** — Browser rules about which websites may call your API. If your frontend and API live on different domains, the API must list the frontend's domain as allowed, or the browser blocks the request.

## D

**Distroless image** — A minimal container base image with only your app's runtime — no shell, no package manager. Smaller and safer, but harder to debug from inside.

**Dockerfile** — The recipe for building a container image: start from this base, copy these files, install these packages, run this command. Each app has one in `apps/<name>/Dockerfile`.

## E

**Environment variable** — A named setting given to a program from outside its code (`DATABASE_URL`, `PORT`). Lets the same code run with different settings locally and in production — and keeps secrets out of the code.

## F

**Fargate** — AWS's serverless engine for containers: you say how much CPU and memory, AWS runs the container, and you never manage servers. ECS Express Mode runs your app on Fargate.

**Federated credential** — Azure's way of letting GitHub Actions log in without a stored password: Azure trusts tokens that GitHub signs for your specific repository and branch. See **OIDC**.

## G

**Gherkin** — A structured plain-English format for describing behaviour: `Feature`, `Scenario`, `Given` (starting situation), `When` (action), `Then` (expected result). Files end in `.feature` and live in `specs/NNN-slug/02-scenarios/`.

**GitHub environment** — A named deploy target in a GitHub repo (e.g. `production`) with its own variables, secrets and approval rules. ShipRight's deploy workflows use `environment: production`, and the cloud only trusts tokens from that environment.

**Grilling** — Having your decisions questioned hard, on purpose, before they're locked in. `/grill` asks one tough question at a time and records the answers in `grill-log.md`. It's cheaper to defend a decision now than to undo it later.

## H

**Handoff bundle** — The package Claude Design produces when you choose *Export → Hand off to Claude Code*: the screens, components and notes a coding agent needs to build the real UI. Drop it in `specs/NNN-slug/04-design/` and run `/import-design`.

**Health check** — A tiny endpoint (`GET /health`) that answers "I'm alive" with status 200. Clouds call it to decide whether your app is running and ready for traffic.

**Hook** — A script that runs automatically at a certain moment. *Agent hooks* run before or after the AI uses a tool (e.g. blocking dangerous commands). *Git hooks* run before a commit or push (e.g. running tests).

## I

**IaC (Infrastructure as Code)** — Describing cloud resources (databases, networks, services) in files (Terraform, Bicep, CloudFormation) instead of clicking in a console, so they can be reviewed, versioned and recreated.

**IAM role** — In AWS, a set of permissions that a person, service or GitHub Actions run can *assume* for a short time, instead of using a permanent key. ShipRight's CI deploys by assuming a role through OIDC.

**Idempotent** — Safe to run more than once with the same result. Running an idempotent setup script twice doesn't create two databases.

## L

**Least privilege** — Give every person, service and pipeline only the permissions it needs, and nothing more. If a key leaks, the damage is limited.

**Lint / linter** — A tool that reads your code and flags likely mistakes and style problems without running it (ESLint, ruff, go vet).

**Load balancer** — A front door that receives traffic for your app and spreads it across running copies, dropping copies that fail their health check. ECS Express Mode creates an Application Load Balancer (ALB) for you.

## M

**Managed identity** — Azure's way of giving an app its own identity, so it can read Key Vault or a database without storing a password. Azure manages the credentials for you.

**Migration** — A numbered file describing one change to the database structure ("add column `deadline_at` to `polls`"). Everyone applies migrations in order, so every copy of the database ends up identical.

**MoSCoW** — A way to prioritise requirements: **M**ust have, **S**hould have, **C**ould have, **W**on't have (this time). Used in the PRD to keep v1 small.

**Multi-stage build** — A Dockerfile with a *build* stage (compilers, dev dependencies) and a slim *run* stage that copies in only the finished app. The final image is smaller and has less to attack.

## O

**Observability** — How well you can tell what your running app is doing from the outside: logs, metrics (numbers over time) and traces (the path of one request).

**OIDC (OpenID Connect)** — A standard for proving identity with short-lived signed tokens. In ShipRight, GitHub Actions uses OIDC to log in to AWS, Azure or Google Cloud **without storing any long-lived keys**.

**ORM (Object-Relational Mapper)** — A library that lets you work with database rows as objects in your language (Drizzle, Prisma, SQLAlchemy, EF Core) and usually manages migrations too.

## P

**PR (Pull Request)** — A request to merge your branch into `main`. It shows the changes, the description and test results, so someone can review before merging. `/ship` opens one.

**PRD (Product Requirements Document)** — The document that says *what* we're building and *why*: the problem, the users, the goals, the requirements (FR-1, NFR-1…), what's out of scope, and how we'll measure success. Lives at `specs/NNN-slug/01-prd.md`.

## R

**Region** — The physical location of the data centre your cloud resources run in (`europe-west1`, `westeurope`, `eu-west-1`). Pick one close to your users and keep everything in it.

**Resource group** — Azure's folder for related resources. Deleting the resource group deletes everything in it — handy for teardown, dangerous by accident.

**Revision** — A numbered, immutable version of your deployed app on Cloud Run or Container Apps. Rolling back means sending traffic to an earlier revision.

**Role (subagent)** — A specialist AI teammate with its own instructions and tools — e.g. `griller`, `security-reviewer`, `mentor`. The main agent delegates focused work to a role, which starts with a fresh context. Defined in `.agents/roles/`.

**Rollback** — Undoing a release to get back to the last working version. Every PR states how it would be rolled back.

**Runbook** — Step-by-step instructions for operating a system: how to deploy, check logs, roll back and tear down. Deploy skills write one to `docs/deploy/<cloud>.md`.

## S

**Scale to zero** — When nobody is using your app, the platform stops every copy so you pay nothing; the next request starts one again (see **Cold start**). Cloud Run and Container Apps can do this.

**Scenario tag** — The ID on each Gherkin scenario, like `@LUNCH-03`. It links the scenario to its tests, commits and PR, so you can always trace code back to the requirement it serves.

**Secret manager** — A cloud service that stores secrets (passwords, API keys) encrypted and hands them to your app at runtime. AWS Secrets Manager · Azure Key Vault · Google Secret Manager.

**Security group** — An AWS firewall attached to resources, listing which traffic may come in and go out. ECS Express Mode creates sensible ones for you.

**Server Component** — In Next.js App Router, a React component that runs only on the server: it can read the database directly and sends finished HTML to the browser. Add `"use client"` at the top of a file to make it a *Client Component* that runs in the browser (needed for clicks, state and effects).

**Service account** — A non-human account that an app or pipeline uses to call cloud APIs (Google Cloud's term; similar to an AWS IAM role or an Azure managed identity). Give it least privilege.

**shadcn/ui** — A collection of good-looking, accessible React components built on Tailwind CSS and Radix. Unlike most libraries, the components are copied into your project (`components/ui/`) so you own and can change them. ShipRight's default design library.

**Skill** — A packaged, step-by-step workflow the AI follows, invoked with a slash command like `/prd` or `/build`. Defined in `.agents/skills/<name>/SKILL.md`.

**Smoke test** — A quick check that the most basic thing works — the app starts and `/health` answers — run right after a deploy. If smoke appears, stop and look.

**Spec-driven development** — Writing the specification (PRD + scenarios) first and letting it drive the design, the tests and the code. The spec is the source of truth; code follows it.

**Step definition** — The code behind a Gherkin line. `When I vote for "Pizza"` is matched by a step definition that actually clicks the button or calls the API.

**Subagent** — See **Role**.

## T

**TDD (Test-Driven Development)** — Write a failing test first (**red**), write just enough code to pass (**green**), then tidy up (**refactor**). Repeat.

**Teardown** — Deleting the cloud resources you created, so they stop costing money. Every `deploy-*` skill documents how, and asks before doing it.

**Type-check** — Running the type checker (`tsc --noEmit`, mypy, pyright) to catch mistakes like passing a string where a number is expected, before the code runs.

## V

**Vertical slice** — A thin piece of a feature that goes through every layer (UI → API → database) and delivers something a user can actually do. ShipRight builds one scenario — one vertical slice — at a time.

**VPC (Virtual Private Cloud)** — Your own private network inside AWS. Every account has a *default VPC*, which ECS Express Mode uses unless you choose another.

## W

**Workload Identity Federation** — Google Cloud's way of letting GitHub Actions act as a service account without a stored key file: Google trusts tokens that GitHub signs for your repository. See **OIDC**.
