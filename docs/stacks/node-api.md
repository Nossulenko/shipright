# Stack profile: Node.js API (Fastify)

## Overview

A typed REST API in TypeScript.

| Layer | Choice |
| --- | --- |
| Runtime | Node.js 24 LTS, TypeScript, ES modules |
| HTTP | Fastify 5 + `@fastify/helmet` + `@fastify/cors` |
| Validation | Zod 4 via `fastify-type-provider-zod` (request/response schemas = types) |
| Data | PostgreSQL + Drizzle ORM, SQL migrations with drizzle-kit |
| Unit tests | Vitest, using Fastify's `app.inject()` (no real network) |
| Acceptance tests | **@cucumber/cucumber** running the `.feature` files |
| App folder | `apps/api` |

## When to pick it

- You want the API in the same language as a TypeScript frontend, as a separate service.
- You want fast startup and a small container.
- **Pick [`nextjs-shadcn`](nextjs-shadcn.md) instead** if the only client is your own Next.js app — its route handlers may be enough.

## Commands

```bash
mkdir -p apps/api && cd apps/api
pnpm init
pnpm add fastify @fastify/helmet @fastify/cors fastify-type-provider-zod zod drizzle-orm pg
pnpm add -D typescript tsx @types/node @types/pg vitest drizzle-kit @cucumber/cucumber cross-env \
  eslint @eslint/js typescript-eslint
```

Set `"type": "module"` in `package.json`.

| Script | Command | Used by |
| --- | --- | --- |
| `dev` | `tsx watch src/server.ts` | you |
| `build` | `tsc -p tsconfig.build.json` | verify, Docker |
| `start` | `node dist/server.js` | Docker |
| `lint` | `eslint .` | verify |
| `typecheck` | `tsc --noEmit` | verify |
| `test` | `vitest run` | verify |
| `test:bdd` | `cross-env NODE_OPTIONS=--import=tsx cucumber-js` | verify, `/build`, CI |
| `db:generate` | `drizzle-kit generate` | after schema changes |
| `db:migrate` | `drizzle-kit migrate` | apply migrations |

## Layout

```
apps/api/
  src/app.ts               buildApp(): registers plugins and routes — imported by server AND tests
  src/server.ts            reads PORT, calls buildApp().listen()
  src/routes/              one file per resource (polls.ts, votes.ts)
  src/db/schema.ts         Drizzle schema
  src/db/client.ts
  drizzle/                 generated SQL migrations — commit them
  tests/steps/             Cucumber step definitions
  tests/support/world.ts   per-scenario state (the app instance, last response)
  cucumber.mjs
  Dockerfile  .dockerignore  .env.example
```

`src/app.ts` (health endpoint included):

```ts
import Fastify from "fastify";
import helmet from "@fastify/helmet";
import cors from "@fastify/cors";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";

export function buildApp() {
  const app = Fastify({ logger: true });
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  app.register(helmet);
  app.register(cors, { origin: process.env.CORS_ORIGIN?.split(",") ?? false });

  app.get("/health", async () => ({ status: "ok" }));
  return app;
}
```

`src/server.ts`:

```ts
import { buildApp } from "./app.js";

const app = buildApp();
await app.listen({ port: Number(process.env.PORT ?? 8080), host: "0.0.0.0" });
```

## Testing & BDD runner

`cucumber.mjs`:

```js
export default {
  paths: ["../../specs/*/02-scenarios/*.feature"],
  import: ["tests/support/**/*.ts", "tests/steps/**/*.ts"],
  tags: "@api",
  format: ["progress-bar", "html:reports/cucumber.html"],
};
```

`tests/steps/health.steps.ts`:

```ts
import assert from "node:assert/strict";
import { Given, When, Then, Before, After } from "@cucumber/cucumber";
import { buildApp } from "../../src/app.js";

let app: ReturnType<typeof buildApp>;
let response: Awaited<ReturnType<typeof app.inject>>;

Before(async () => { app = buildApp(); await app.ready(); });
After(async () => { await app.close(); });

When("I request {string}", async (path: string) => {
  response = await app.inject({ method: "GET", url: path });
});

Then("the response status is {int}", (status: number) => {
  assert.equal(response.statusCode, status);
});
```

Only scenarios tagged `@api` run here; UI scenarios run in the web app. Run one scenario: `pnpm test:bdd --tags "@LUNCH-03"`.

## Container

`apps/api/Dockerfile`:

```dockerfile
# syntax=docker/dockerfile:1
FROM node:24-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS build
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build && pnpm prune --prod

FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=8080
COPY --from=build --chown=node:node /app/package.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/drizzle ./drizzle
USER node
EXPOSE 8080
CMD ["node", "dist/server.js"]
```

`.dockerignore`: `node_modules`, `dist`, `.git`, `.env*`, `!.env.example`, `reports`.

Health path for deploys: **`/health`**.

## Cloud fit

| Cloud | Service | Notes |
| --- | --- | --- |
| Google Cloud | Cloud Run | `gcloud run deploy --source apps/api` |
| Azure | Container Apps | `az containerapp up --source apps/api` |
| AWS | ECS Express Mode | `docker build --platform linux/amd64`, push to ECR |

## Junior gotchas

- **Listen on `0.0.0.0`, not `localhost`.** Inside a container, `localhost` is unreachable from outside and the cloud health check fails.
- **ES modules need `.js` in relative imports** (`./app.js`) even though the file is `app.ts`.
- **Export `buildApp()` separately from `listen()`** so tests can create the app without opening a port.
- **Validate every request body with Zod.** Never trust input — the schema is your first security layer.
- **Use migrations (`db:generate` + `db:migrate`), never `drizzle-kit push`, against shared databases.**
- **On Windows**, keep the `cross-env` prefix in `test:bdd` — plain `NODE_OPTIONS=…` only works in Unix shells.
