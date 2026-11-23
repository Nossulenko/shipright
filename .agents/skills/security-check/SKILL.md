---
name: security-check
description: Security pass over the branch or the whole repo — scans for committed secrets, audits dependencies with the stack's tool, and reviews authentication, authorization, input validation, headers/CORS and environment handling, delegating the deep review to the security-reviewer role. Writes a severity-ranked findings summary. Use before shipping anything that touches auth, user data, uploads, payments, secrets, CI or cloud config, or when the human asks for a security check or audit.
argument-hint: "[branch | repo]  (default: branch)"
---

# /security-check — Find the holes before someone else does

> **Role:** security-reviewer (delegated) · **Input:** branch diff (default) or whole repo · **Output:** ranked findings summary · **Next:** fix Critical/High, then `/ship`

## What this does

Runs the automatic checks a security engineer would run first — leaked secrets, known-vulnerable packages — then has the `security-reviewer` role read the code for the mistakes tools can't catch: missing permission checks, unvalidated input, unsafe headers. You get one table, worst problems first, each with the file, line and fix.

## Before you start

- Scope: `branch` (default) = changes vs `main`; `repo` = everything under `apps/`, `.github/`, `scripts/`, infra files.
- Read the Project Profile (stack, cloud) and [`docs/standards/security.md`](../../../docs/standards/security.md).
- Detailed checklist: [`references/security-checklist.md`](references/security-checklist.md).

## Steps

### Step 1 — Secret scan

Scan tracked files (and the branch's commits) for secret patterns:

```bash
git grep -nIE 'AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9_-]{20,}|xox[baprs]-[A-Za-z0-9-]{10,}|AccountKey=[A-Za-z0-9+/=]{20,}|AIza[0-9A-Za-z_-]{35}' -- . ':!*.lock' ':!**/package-lock.json'
git log -p main..HEAD | grep -nE 'AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|ghp_[A-Za-z0-9]{36}|sk-[A-Za-z0-9_-]{20,}' || true
git ls-files | grep -E '(^|/)\.env($|\.)' | grep -v '\.env\.example$' || true
```

Any hit in a tracked file is **Critical**. If a real secret was ever committed, removing it isn't enough — tell the human it must be **rotated** (revoked and replaced) at the provider, then removed from the code. Don't print the secret value in your report; show file:line and the first 4 characters only.

If `gitleaks` is installed, also run `gitleaks detect --no-banner --redact`.

### Step 2 — Dependency audit (per app)

For each app under `apps/`, run the stack's audit tool from the app folder:

| Stack        | Command                                                        |
| ------------ | -------------------------------------------------------------- |
| npm          | `npm audit --omit=dev`                                         |
| pnpm         | `pnpm audit --prod`                                            |
| Python (uv)  | `uvx pip-audit` (or `pip-audit` if installed)                  |
| Go           | `go run golang.org/x/vuln/cmd/govulncheck@latest ./...`        |
| .NET         | `dotnet list package --vulnerable --include-transitive`        |

Summarise: package · severity · fixed version · direct or transitive. Critical/High with a fix available → **High** finding ("upgrade X to Y"). No fix available → **Medium**, note the advisory.

Also list **new dependencies** added on this branch (diff the manifest files) — the reviewer checks they're maintained and not typosquats.

### Step 3 — Delegate the code review

Delegate to the **`security-reviewer`** role with:

- scope and the list of files to review (`git diff --name-only main...HEAD` for branch scope),
- the spec folder (PRD says what data and users are involved; tech plan has the auth model),
- the secret-scan and audit results from Steps 1–2,
- the list of new dependencies.

Ask it to work through its full checklist and return its standard output format.

If roles aren't available in this runtime, do the review yourself using `references/security-checklist.md`.

### Step 4 — Quick config checks

While the reviewer works, check the things that live in config:

- **CORS:** not `*` when cookies/credentials are used.
- **Security headers** set by the framework or middleware: `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `frame-ancestors` / `X-Frame-Options`.
- **Cookies:** `HttpOnly`, `Secure`, `SameSite=Lax` or `Strict`.
- **Env handling:** every secret read from env/secret manager; `.env` git-ignored; `.env.example` has placeholders only; client-exposed env prefixes (`NEXT_PUBLIC_`, `VITE_`) contain nothing secret.
- **CI:** cloud auth via OIDC (no `AWS_SECRET_ACCESS_KEY`, `AZURE_CLIENT_SECRET`, service-account JSON in repo secrets if avoidable); workflows use `permissions:` least privilege; no `pull_request_target` checking out PR code.
- **Containers:** run as non-root; no secrets baked into images (`ENV`/`ARG` with secret values).

### Step 5 — Merge and report

Combine everything into one table ranked **Critical → High → Medium → Low → Info**. Give a verdict:

- **Block** — any Critical.
- **Fix before ship** — any High.
- **OK with follow-ups** — Medium/Low only; offer to open GitHub issues for them (`gh issue create`) if the tracker is GitHub Issues.
- **OK** — nothing found.

## Output format

```markdown
## 🛡️ Security check — branch feat/001-team-lunch-poll

**Verdict:** Fix before ship
**Automatic checks:** secrets ✅ none · dependencies ⚠️ 1 high (fix available)

| # | Severity | Category | Location | Finding | Fix |
|---|----------|----------|----------|---------|-----|
| 1 | High | Authorization | apps/web/src/app/api/polls/[id]/route.ts:24 | Any signed-in user can delete any poll. | Compare poll owner with session user; return 403. |
| 2 | High | Dependency | apps/web/package.json | `next` 15.1.0 has a high-severity advisory. | Upgrade to the patched version shown by `pnpm audit`. |

### For the junior
<one paragraph: the most important finding, what an attacker would do, why the fix stops it>
```

## Gate — before moving on

- [ ] No Critical findings
- [ ] Every High is fixed or explicitly accepted by the human (recorded in the PR's Risk section)
- [ ] Any secret that was ever committed has been rotated, not just deleted

## Tell the human

> **What I did:** scanned for leaked secrets, audited every dependency, and had the security reviewer read the code that handles users, data and permissions.
> **Why:** most real-world breaches are boring — a missing permission check or a leaked key. These checks catch the boring ones.
> **What to check:** the Critical and High rows. I can fix them — say "fix 1".
>
> **Next:** fix the High findings, then `/ship`.
