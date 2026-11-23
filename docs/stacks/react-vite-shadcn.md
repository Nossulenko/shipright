# Stack profile: React + Vite + shadcn/ui (SPA)

## Overview

A single-page app: the browser downloads static HTML/JS/CSS once and talks to a separate API.

| Layer | Choice |
| --- | --- |
| Build tool | Vite, React, TypeScript |
| UI | Tailwind CSS v4 + **shadcn/ui** + lucide-react |
| Routing | React Router |
| Server data | TanStack Query (caching, loading and error states) |
| Unit tests | Vitest + Testing Library |
| Acceptance tests | Playwright + **playwright-bdd** |
| Production server | nginx (unprivileged image) serving the built files |
| App folder | `apps/web` (pair it with an API in `apps/api`) |

## When to pick it

- The backend is a separate service (often in another language: [`python-fastapi`](python-fastapi.md), [`dotnet-api`](dotnet-api.md), [`go-api`](go-api.md), [`node-api`](node-api.md)).
- The app sits behind a login, so search-engine indexing and server rendering do not matter.
- **Pick [`nextjs-shadcn`](nextjs-shadcn.md) instead** if you want UI and API in one app, or care about SEO and first-load speed.

## Commands

```bash
pnpm create vite@latest apps/web --template react-ts
cd apps/web
pnpm install
pnpm add tailwindcss @tailwindcss/vite react-router @tanstack/react-query
pnpm add -D @types/node vitest jsdom @testing-library/react @testing-library/jest-dom @playwright/test playwright-bdd
```

Then wire Tailwind and the `@/` import alias before running shadcn (the shadcn "Vite" installation guide has the same steps):

1. `src/index.css` → replace contents with `@import "tailwindcss";`
2. `vite.config.ts` → add the `tailwindcss()` plugin and `resolve: { alias: { "@": path.resolve(__dirname, "./src") } }`
3. `tsconfig.json` and `tsconfig.app.json` → `"baseUrl": "."`, `"paths": { "@/*": ["./src/*"] }`
4. `pnpm dlx shadcn@latest init`, then `pnpm dlx shadcn@latest add button card input label dialog sonner skeleton`
5. `pnpm exec playwright install --with-deps chromium`

| Script | Command | Used by |
| --- | --- | --- |
| `dev` | `vite` | you, Playwright `webServer` |
| `build` | `tsc -b && vite build` | verify, Docker |
| `preview` | `vite preview` | local production check |
| `lint` | `eslint .` | verify |
| `typecheck` | `tsc -b --noEmit` | verify |
| `test` | `vitest run` | verify |
| `test:bdd` | `bddgen && playwright test` | verify, `/build`, CI |

## Layout

```
apps/web/
  src/main.tsx               entry: router + QueryClientProvider
  src/routes/                one file per screen
  src/components/ui/         shadcn/ui components (you own them)
  src/components/            your compositions
  src/lib/api.ts             typed fetch helpers; base URL from import.meta.env.VITE_API_URL
  tests/steps/               playwright-bdd step definitions
  nginx/default.conf.template
  playwright.config.ts  vite.config.ts
  Dockerfile  .dockerignore  .env.example
```

There is no server code, so the health endpoint is served by nginx (see Container).

## Testing & BDD runner

Same as the Next.js profile, with Vite's port and the API mocked or running:

```ts
import { defineConfig, devices } from "@playwright/test";
import { defineBddConfig } from "playwright-bdd";

const testDir = defineBddConfig({
  features: "../../specs/*/02-scenarios/*.feature",
  steps: "tests/steps/**/*.ts",
});

const baseURL = process.env.BASE_URL ?? "http://localhost:5173";

export default defineConfig({
  testDir,
  use: { baseURL, trace: "on-first-retry" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.BASE_URL ? undefined : { command: "pnpm dev", url: baseURL, reuseExistingServer: !process.env.CI },
});
```

For UI scenarios that need data, either run the real API locally (`apps/api`) or intercept calls in steps with `page.route("**/api/**", …)`. Tag API-only scenarios `@api` and UI scenarios `@ui` so each app runs the right ones (`--grep @ui`).

## Container

`apps/web/nginx/default.conf.template` — nginx substitutes `${PORT}` at start-up (only variables that are set in the environment are replaced, so `$uri` stays intact):

```nginx
server {
  listen ${PORT};
  root /usr/share/nginx/html;

  location = /health {
    default_type application/json;
    return 200 '{"status":"ok"}';
  }

  location /assets/ {
    add_header Cache-Control "public, max-age=31536000, immutable";
  }

  # Client-side routing: unknown paths fall back to index.html
  location / {
    try_files $uri /index.html;
  }
}
```

`apps/web/Dockerfile`:

```dockerfile
# syntax=docker/dockerfile:1
FROM node:24-alpine AS build
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN pnpm build

FROM nginxinc/nginx-unprivileged:stable-alpine AS runtime
ENV PORT=8080
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
```

The `nginx-unprivileged` image already runs as a non-root user. Build with `docker build --build-arg VITE_API_URL=https://api.example.com -t web:local apps/web`.

## Cloud fit

| Cloud | Container path (ShipRight default) | Static hosting alternative |
| --- | --- | --- |
| Google Cloud | Cloud Run | Firebase Hosting |
| Azure | Container Apps | Static Web Apps (uses a deployment token — see `/deploy-azure`) |
| AWS | ECS Express Mode | Amplify Hosting |

The container path keeps one deploy pipeline (OIDC, same workflow shape) for frontend and API.

## Junior gotchas

- **`VITE_` variables are baked in at build time** and readable by anyone who opens DevTools. Never put secrets in them; the API URL is fine. Changing one means rebuilding the image.
- **CORS.** The browser blocks calls from `https://web…` to `https://api…` unless the API allows that origin. Configure allowed origins in the API — never `*` with credentials.
- **Refreshing a deep link 404s** without the `try_files … /index.html` fallback above.
- **Authentication tokens:** prefer secure, http-only cookies set by the API over `localStorage`.
- **Run shadcn init after the alias is configured** — it reads `tsconfig.json` to know where to put components.
