# Security checklist

A lightweight checklist based on the OWASP Top 10 and the most useful items from OWASP ASVS level 1, written for small product teams. Work through every section; mark each item **pass**, **finding**, or **n/a**.

---

## A. Secrets & configuration

- [ ] No secrets in tracked files, git history of this branch, Dockerfiles, CI files, test fixtures or logs.
- [ ] `.env` and `.env.local` are git-ignored; `.env.example` holds placeholders only.
- [ ] Client-exposed variables (`NEXT_PUBLIC_*`, `VITE_*`) contain nothing secret.
- [ ] Production secrets come from the cloud secret manager (Secrets Manager, Key Vault, Secret Manager), injected at runtime.
- [ ] CI authenticates to the cloud with OIDC / federated credentials, not stored keys.

## B. Authentication

- [ ] Every non-public route and API requires a valid session or token.
- [ ] Authentication uses a vetted library or provider (Auth.js, Clerk, Entra ID, Cognito, Firebase Auth…), not hand-rolled crypto.
- [ ] Passwords (if stored at all) use argon2id, bcrypt or scrypt.
- [ ] Sessions expire; logout invalidates the session server-side.
- [ ] Login, signup and password reset are rate-limited and don't reveal whether an account exists.

## C. Authorization (broken access control — OWASP #1)

- [ ] Every read, update and delete checks the caller may act on **that specific record**.
- [ ] Queries are scoped by owner / team / tenant (`WHERE team_id = $currentTeam`).
- [ ] IDs from the client (URL, body) are never trusted without an ownership check.
- [ ] Admin / privileged actions are checked on the server, not just hidden in the UI.
- [ ] Default is deny: new routes are protected unless deliberately public.

## D. Injection

- [ ] SQL uses parameters or the ORM — never string concatenation.
- [ ] No shell commands built from user input (`exec`, `subprocess` with `shell=True`, `child_process.exec`).
- [ ] No `eval`, `new Function`, `dangerouslySetInnerHTML`, `v-html`, `|safe` with user-controlled data.
- [ ] File paths from input are normalised and confined to an allowed directory (no `../`).
- [ ] NoSQL queries don't accept raw operator objects from the client (`{"$gt": ""}`).

## E. Input validation & uploads

- [ ] Every request body, query string, header and webhook payload is validated with a schema at the boundary.
- [ ] String lengths, array sizes, numeric ranges and request body size are limited.
- [ ] Webhooks verify the sender's signature.
- [ ] Uploads: size limit, type checked by content (magic bytes), stored outside the web root or in object storage, served with `Content-Disposition` and a safe `Content-Type`.

## F. Sensitive data & privacy

- [ ] Only the personal data the PRD actually needs is collected (data minimisation).
- [ ] No passwords, tokens, full card numbers or unnecessary PII in logs, analytics, URLs or error messages.
- [ ] Stack traces and internal errors aren't returned to clients in production.
- [ ] Data in transit uses HTTPS everywhere; databases aren't reachable from the public internet.

## G. Web protections

- [ ] CSRF protection on state-changing requests that use cookie auth (framework default, SameSite cookies, or tokens).
- [ ] CORS allows only known origins; never `*` together with credentials.
- [ ] Security headers: `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `frame-ancestors 'none'` (or `X-Frame-Options: DENY`).
- [ ] Cookies: `HttpOnly`, `Secure`, `SameSite=Lax` or `Strict`.
- [ ] Redirects only go to allow-listed destinations (no open redirect via `?next=`).

## H. Dependencies & supply chain

- [ ] Audit tool shows no unaddressed Critical/High advisories.
- [ ] New dependencies are maintained (recent releases), widely used, and spelled correctly (typosquatting).
- [ ] Lockfiles are committed.
- [ ] GitHub Actions are pinned to a version tag or SHA; workflows declare least-privilege `permissions:`.

## I. Infrastructure & containers

- [ ] Containers run as a non-root user.
- [ ] No secrets in image layers (`ENV`, `ARG`, copied `.env`).
- [ ] Cloud roles follow least privilege (deploy role can deploy, not administer the account).
- [ ] Storage buckets / blob containers are private unless deliberately public.
- [ ] A budget alert exists so a runaway resource doesn't become a surprise bill.

## J. Abuse & availability

- [ ] Expensive or abusable endpoints (email/SMS sending, search, AI calls, exports) are rate-limited.
- [ ] Pagination and limits on list endpoints.
- [ ] Timeouts on outbound HTTP calls.
