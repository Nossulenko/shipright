# Security standards

You don't need to be a security expert to build secure software. You need a handful of habits, applied every time. This file lists them in plain language. `/security-check` and the `security-reviewer` role check them for you, but the habits are yours.

---

## 1. Secrets

A **secret** is anything that grants access: passwords, API keys, tokens, database connection strings, private keys, signing keys.

- **Never in git.** Not in code, tests, fixtures, Dockerfiles, CI files, commit messages, or "temporary" branches. Git history is forever, and public repos are scanned by bots within minutes.
- **Locally:** put secrets in `.env` (git-ignored). Document the *names* in `.env.example` with placeholder values.
- **In production:** use the cloud's secret manager — AWS Secrets Manager, Azure Key Vault, Google Secret Manager — and inject secrets as environment variables at runtime.
- **In the browser: nothing is secret.** Anything in client code or `NEXT_PUBLIC_*` / `VITE_*` variables is public.
- **If a secret leaks:** deleting it from the code is not enough. **Rotate it** — revoke the old one at the provider and issue a new one — then clean up. Tell someone immediately; it's a normal event, not a disgrace.

Shipright's guard hook blocks writes that look like keys, and the pre-commit hook scans staged changes. They are a safety net, not a substitute for the habit.

## 2. CI authenticates with OIDC, not stored keys

Long-lived cloud keys stored as CI secrets are the most common way small teams get breached. Instead, GitHub Actions proves its identity to the cloud with a short-lived **OIDC** token, and the cloud trusts only your repository (and branch) to assume a narrowly scoped role:

| Cloud | Mechanism                                   |
| ----- | ------------------------------------------- |
| AWS   | IAM OIDC identity provider + IAM role       |
| Azure | Entra ID app registration + federated credential |
| GCP   | Workload Identity Federation + service account |

The `deploy-*` skills set this up. The deploy role can deploy the app — it can't administer the account.

## 3. Authentication — who are you?

- Use a vetted library or identity provider (Auth.js, Clerk, Entra ID, Cognito, Firebase Auth, Supabase Auth…). Never write your own password hashing, session or token crypto.
- If you store passwords at all, hash them with argon2id, bcrypt or scrypt.
- Sessions expire. Logging out ends the session on the server.
- Rate-limit login, signup and password reset. Error messages don't reveal whether an account exists ("If that email is registered, we've sent a link").

## 4. Authorization — are you allowed to do *this* to *that*?

**Broken access control is the #1 web security risk.** It's also the easiest to get wrong, because the app *looks* fine.

- Check on the **server**, on **every request**, that the current user may act on **this specific record**. Hiding a button in the UI is not a permission check.
- Scope queries by owner or tenant: `WHERE team_id = $currentTeam`, not just `WHERE id = $id`.
- Never trust an ID from the URL or body without checking ownership.
- Default to deny. A new route is private unless deliberately made public.

Write a scenario for it: *"A member of another team cannot close my poll."*

## 5. The OWASP Top 10, in junior terms

| Risk | What it means | Habit that prevents it |
| ---- | ------------- | ---------------------- |
| Broken access control | Users can see or change things that aren't theirs | Ownership check on every data access (§4) |
| Cryptographic failures | Sensitive data unprotected | HTTPS everywhere, vetted libraries, no home-made crypto |
| Injection | User input runs as code (SQL, shell, HTML) | Parameterised queries / ORM; never build SQL or shell commands with strings; escape output |
| Insecure design | The feature itself is unsafe | Grill abuse cases in the PRD; write "must not" scenarios |
| Security misconfiguration | Defaults left open | Security headers, CORS allow-list, no debug mode in prod, private buckets |
| Vulnerable components | Old packages with known holes | Run the audit tool; upgrade little and often |
| Identification & auth failures | Weak login/session handling | Use an identity provider; expiring sessions; rate limits |
| Software & data integrity failures | Untrusted code or data in the pipeline | Lockfiles, pinned GitHub Actions, verify webhook signatures |
| Logging & monitoring failures | Attacks go unnoticed | Log security events (failed logins, permission denials) without secrets |
| Server-side request forgery (SSRF) | Server fetches attacker-chosen URLs | Allow-list outbound hosts when fetching user-supplied URLs |

## 6. Input and output

- **Validate input** at the boundary with a schema; limit sizes and lengths. See [`engineering.md`](engineering.md) §5.
- **Escape output.** Frameworks do this by default — don't turn it off (`dangerouslySetInnerHTML`, `v-html`, `|safe`) for user content.
- **Uploads:** limit size, check type by content, store in object storage, never execute.
- **Webhooks:** verify the signature before trusting the payload.

## 7. Web settings that should always be on

- HTTPS only, with HSTS.
- Cookies `HttpOnly`, `Secure`, `SameSite=Lax` (or `Strict`).
- CSRF protection for cookie-authenticated state changes (most frameworks do this; don't disable it).
- CORS: only your own origins; never `*` with credentials.
- Headers: `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `frame-ancestors 'none'`.

## 8. Dependency hygiene

- Every new package needs a reason and the human's OK (see [`engineering.md`](engineering.md) §8).
- Check it's maintained, popular, and spelled right — typosquatted packages steal credentials on install.
- Commit lockfiles. Run the audit tool in `/security-check` and fix High/Critical issues before shipping.
- Pin GitHub Actions to a version tag (or a commit SHA for third-party actions).

## 9. Personal data (PII)

**Personally identifiable information** is anything that identifies a person: name, email, phone, address, IP address, photos, IDs.

- **Collect only what the PRD needs.** Data you don't store can't leak.
- Don't log it, don't put it in URLs, don't send it to analytics without a reason and consent.
- Know where it's stored and who can access it. Write it in the tech plan's data model.
- Support deletion if users can ask for it (GDPR and similar laws). Grill this in the PRD.

## 10. When you find a problem

Stop, tell the human (or your team) plainly what you found, and fix or rotate. Security incidents get worse with time and silence, never better.
