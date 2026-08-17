# Prime Innovation portal - pre-go-live security review

## Authentication and access control

**High-level overview**

- No passwords are held anywhere in the app. Sign-in is Google or Microsoft Entra ID only. Password policy, MFA, lockout and account recovery are all the identity provider's job.
- Sign-in is deny-by-default. A user gets in only if they are a Prime Innovation admin or their email is on a client's allowlist.
- Admin rights are re-read from the database on every single request, so removing an admin takes effect immediately.
- Three permission levels beyond plain admin: the ability to manage `clients`, to manage `admins`, and to `impersonate` client users, enforced server-side per procedure.

**Client data isolation**

- All client data queries use a database wrapper that bakes in per-client filtering, and enforces this with type-checking at compile-time.
- Client-facing endpoints take the org ID from the session (handled via our auth layer), not the request body. A client cannot ask for another client's data as there's no way to do so.
- The only endpoints that accept explicit org-level filtering are gated behind a check that the user has the `clients` management admin permission.

**Potential concerns**

| #   | Description                                                                                                                                                                                                                                                                                         | Risk                                       |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| 1   | **`users.list` is open to any admin regardless of permissions.** It uses `adminProcedure` rather than a permission-gated one and returns every user's name, email and organisation. An admin added with only `impersonate` - or with no grants at all - can enumerate the full client contact list. | Low to none (it's already only for admins) |
| 2   | **No MFA requirement expressed by the app.** Prime Innovation should enforce MFA on the admin accounts in Google Workspace / Entra before go-live, to ensure that these are secure.                                                                                                                 | Medium                                     |

---

## Impersonation ("view as client")

**Notes**

- Cookie is HMAC-SHA256 (signed with the configured `AUTH_SECRET`) and verified with a constant-time comparison, meaning there's no potential for timing attacks that could leak the secret.
- The permission is re-checked server-side on every request, not just when impersonation starts. A cookie held by someone whose permission was revoked stops working immediately.
- The impersonated context is stripped of all admin rights, so an admin viewing a client cannot use admin endpoints while doing so.
- Impersonation is cleared before sign-out is processed.

**Potential concerns**

| #   | Description                                                                                                                                                                                                                                                                                                                                    | Risk   |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 3   | **The impersonation auth doesn't automatically expire**. The 8-hour limit is a browser cookie `maxAge`, which the browser enforces and an attacker doesn't. The token value stays valid indefinitely (as long as the admin still has the `impersonate` permission). Fix is small: sign `userId + orgId + expiry` and check the expiry on read. | Low    |
| 4   | **No record is kept of impersonation.** We don't track when an admin opens a client's dashboard. Given this is patent portfolio data, we should be able to answer "who looked at this client's data, and when".                                                                                                                                | Medium |

---

## Import system, file storage and backend access

**Notes**

- Upload path is admin-only, behind the `clients` permission.
- Spreadsheets are parsed with ExcelJS into a fixed set of named columns, and we take them as data only (we're not running macros etc).
- Uploaded files are **not** retained. Only the parsed rows are stored; the workbook is discarded after parsing.
- Object storage keys (used for logos only currently) are unguessable UUIDs under a namespaced prefix, and the bucket is never exposed to the browser. All reads go through our own route, which checks permission first - a client can only fetch their own org's logo.
- No raw SQL anywhere so SQL injection isn't possible - everything goes through Prisma's parameterised queries.

---

## Encryption in transit and at rest

We host on Render. Their documentation covers it well - links at the end of this section.

**In transit**

- **Browser to app - Render.** Every Render service gets a free managed TLS certificate, for both the `onrender.com` subdomain and any custom domain we add. Render issues them through Let's Encrypt and Google Trust Services and renews them automatically before expiry, and it "automatically redirects all `HTTP` requests to `HTTPS`".
- **App to database - Render** Each database gets an internal and an external URL. We currently use the **external** one, so our database traffic leaves Render and crosses the public internet. It is encrypted - Render enforces TLS on external connections, requiring clients to support "TLS version 1.2 or higher" and a set list of cipher suites, and those requirements apply only to external connections. So this is not an encryption gap. This is more about network exposure. Connecting externally means the database has to stay open to the internet, which is #5 below. **We should swap to the internal URL before go-live** - Render's own guidance is "Use the internal URL wherever possible", and external connections are also slower because "they traverse the public internet". Render's TLS enforcement applies to the external URL only, and their docs say nothing either way about internal connections, so set `sslmode=require` on the internal `DATABASE_URL` and confirm it still connects rather than assuming the encryption comes with it.
- **App to Backblaze (client logos):** over HTTPS.
- **App to Bearing's internal tool Mission Control for monitoring uptime:** over HTTPS.

**At rest**

- **Database - Render.** "Render Postgres databases are encrypted at rest using AES-256 data encryption", and that covers the primary, any replicas, and all backups. Note that nothing in the application encrypts columns before storing them.
- **Environment variables and secrets - Render.** "Your environment variables and secret files are encrypted at rest using a minimum AES-128 standard", with "TLS 1.2 or higher" securing the transport layer to the app.
- **Logos - Backblaze.** The `prime-innovation` bucket is private, and default server-side encryption (SSE-B2, Backblaze-managed keys) is enabled.

**What Render's defaults do not cover**

| #   | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Risk                                                                                         |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 5   | **Render Postgres is reachable from anywhere, and our use of the external URL is what keeps it that way.** Their docs are explicit: "By default, your Render Postgres instance is accessible from any IP address (if the connection uses valid credentials)" - the default allowlist is `0.0.0.0/0`. Encryption doesn't help if the database is exposed to credential stuffing from the whole internet, and right now a Postgres password is the only thing in front of it. We can't narrow the allowlist while the app connects externally, because we'd cut off our own app. Fix in order: move the app to the internal URL, then narrow the allowlist to specified IPs for our dev use. Allowlist rules "apply only to connections that use your database's external URL", so the app keeps working either way. **Action before go-live.** | Moderate (not an active vulnerability and the password is auto-generated, long, and random). |

**Supporting documentation**

- [TLS certificates on Render](https://render.com/docs/tls) - free managed certs, automatic renewal, automatic HTTP to HTTPS redirect
- [Render Postgres](https://render.com/docs/databases) - AES-256 at rest, TLS in transit for external connections, internal vs external URLs, IP allowlist defaults
- [Create and connect to Render Postgres](https://render.com/docs/postgresql-creating-connecting) - connection URLs, TLS 1.2+ cipher suites
- [How Render handles secrets and environment variables](https://render.com/articles/how-render-handles-secrets-and-environment-variables) - AES-128 minimum at rest and TLS 1.2+
- [Render achieves SOC 2 Type II compliance](https://render.com/blog/render-soc2-compliance)

---

## Session management

**Notes**

- Sessions are database-backed, not JWTs. That means a session can be killed server-side by deleting the row - with a JWT strategy you can't revoke until expiry.
- Revocation is immediate, so a revoked user's next call fails even if their session cookie is still valid.
- Deleting an organisation cascades to its allowlist and portfolio data and nulls the users' org binding.
- Session cookies are marked `Secure` in production without us having to configure it. Auth.js turns this on whenever the site is served over HTTPS, which Render always is, so the session cookie is never sent over an unencrypted connection.

---

## Common web attacks

- **SQL injection** - not a concern. No raw SQL; Prisma parameterises everything.
- **XSS** - no `dangerouslySetInnerHTML`, no `innerHTML`, no `eval` anywhere in `src/`. React escapes by default, and we didn't need any insecure escape hatches to achieve the app's functionality. The only user-controlled content rendered is text from spreadsheets and org names.
- **CSRF** - Auth.js endpoints carry proper CSRF tokens. The tRPC API does not use CSRF tokens, but it's protected in practice: mutations are `POST` with `Content-Type: application/json`, which forces a browser preflight cross-origin request, and the app doesn't set CORS headers (there's no reason for any other website to be hitting the portal's API), so the preflight request fails. Combined with the session cookie's `SameSite=Lax`, I don't consider this exploitable.
- **IDOR / horizontal privilege escalation** - one client accessing another client's data is the key risk for the portal; see the "Client data isolation" section for notes on how we prevent this.

**Potential concerns**

| #   | Description                                                                                                                                                                                                                                                           | Risk                                                                                   |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 6   | **No rate limiting.** API calls and sign-in attempts aren't rate-limited. The identity provider (Microsoft or Google) will definitely have rate limiting on their side, so this isn't a security risk as much as not having protected against getting DDoSed offline. | Low for security, medium for DDoS risk (Render has some network-level protections too) |

---

## Logging and monitoring

**Potential concerns**

| #   | Description                                                                                                                                                                                                                                                                                              | Risk                                                              |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| 7   | **Auth.js debug mode is enabled in all environments**. Per Auth.js's docs, it's better to disable this in production environments so user email addresses aren't logged.                                                                                                                                 | Low to medium                                                     |
| 8   | **No audit log** for security-relevant events. Importing a portfolio tracks who uploaded the document & when, but other flows don't track this sort of info. It would be good to track: granting or removing client access, changing admin permissions, starting impersonation, or exporting a schedule. | Medium (high importance, but most only possible for admins to do) |
| 9   | **No alerting on suspicious sign-in attempts.** We don't have handling in place for repeated denied sign-ins; most of the work here is on the auth provider's side (Microsoft and Google), but we could add more handling here.                                                                          | Low to medium                                                     |

Before go-live: best to add an `audit_log` table capturing actor, action, target org, timestamp and IP for access grants/revocations, permission changes and impersonation.

---

## API keys, credentials and secrets

**Notes**

- Every secret is read from environment variables, rather than hard-coded into the codebase.
- `.env` and `.env.*` are gitignored to prevent them from being accidentally tracked in Git's code history.
- CI doesn't use real credentials

---

## Dependencies and third parties

`npm audit --omit=dev`, run 2026-08-17 against `package-lock.json`: **14 vulnerabilities (3 critical, 4 high, 7 moderate)**. Not all are relevant, but one is:

| #   | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Risk |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| 10  | **`@auth/core` 0.41.2 - three advisories, one critical.** This is the library doing our authentication. The relevant one is GHSA-x445-f3h2-j279: OAuth `state`, `nonce` and PKCE check cookies are not bound to the provider that issued them - and we run two providers. Also affects `@auth/express` 0.12.2 and `@auth/prisma-adapter` 2.11.2, which depend on it. `npm audit` reports a non-breaking fix is available. **This should be patched before go-live.** | High |

The remainder are transitive and lower severity: `undici`, `brace-expansion`, `fast-uri`, `hono` (via `@prisma/dev`), `uuid` (via `exceljs` - the only fix is a major ExcelJS downgrade, so leave it; the advisory is a buffer bounds check on a code path we never call, since we don't generate UUIDs through ExcelJS).

**Action:** run `npm audit fix` to apply non-breaking patches, and re-audit to confirm they're addressed. Longer term, turn on Dependabot or Renovate.

**Third-party services and what each can see:**

- **Google + Microsoft Entra ID** - identity only (who signs in), not app data like portfolios.
- **Backblaze B2** - client logos only.
- **Mission Control (Bearing)** - receives import job status, timestamps and error messages. Error messages could incidentally contain client detail - they aren't stored indefinitely (kept for debugging purposes and then deleted on schedule), but if this is unacceptable then we can disable this and only have error logs in Render (just faster for debugging to see the exact error in our tools).
- The portal doesn't have analytics, a 3rd-party error-tracking platform, or a CDN.

---

## Hosting, database, backups and recovery

The portal and its database both run on Render, a managed platform, on a Pro workspace. We do not run servers, so there is no operating system to patch, etc. Render has been SOC 2 Type II compliant since February 2023, and the report can be requested from their Document Center on Organization and Enterprise plans.

**Backups**

- Render continuously backs up paid Postgres databases for point-in-time recovery, so we can restore the database to any moment within the retention window rather than to the last nightly snapshot. Render sets that window by workspace plan, and on Pro it is **the past 7 days**.
- Separately, Render keeps logical backups for seven days after creation, on every plan.
- Backups inherit the same AES-256 encryption at rest as the database itself.
- Restoring works by creating a new database instance at the chosen point in time and then repointing the service at it, so a restore does not overwrite the original while it runs.

**Availability**

- We do not run a high-availability standby. Render offers one, but we have not set it up, so a database failure means the portal is unavailable until Render brings the instance back rather than failing over automatically. This affects availability only - the data itself is still covered by the 7-day recovery window above. Given the portal is a reporting view over data that originates elsewhere, and nobody depends on it minute to minute, we think that is a reasonable trade rather than a gap. It is worth revisiting if the portal becomes something clients rely on daily. Straightforward config setting, just affects hosting costs.
- If the database itself was somehow entirely lost, we could rebuild the portal's data from exports from Equinox and other platforms (the portal isn't the source of truth). The list of unrecoverable data is small: client organisations, their allowlists and the record of past imports.

**Access to the platform**

- Anyone with access to the Render workspace (managed by Bearing) can read the production database credentials and open the logs, which makes the workspace itself as sensitive as the data. Two-factor authentication is enforced across the workspace, so members cannot reach any resource or setting until they have it enabled. Only the core Bearing team have access to this (at the time of writing: Sam, Jesse, and Ethan), not contractors pulled in for specific projects. Can move to a Prime Innovation Render account if you'd prefer, and we'd store Bearing's access credentials in our password manager Bitwarden.
- Render keeps audit logs of platform actions such as configuration and access changes. These cover what happens to the infrastructure, not what happens inside the portal.

**Logs**

- Render retains service logs for **14 days** on our Pro workspace. Logs older than that are gone permanently, and upgrading the plan later does not bring them back. If we need longer-term retention then we can set up an external provider to sync these to.

---

## Other things worth addressing (Tim to decide next steps)

- **Privacy Act 2020.** We store names, email addresses and profile images of client staff. This might be under some fair use clause, or there may be a legal requirement to track a stated purpose, a retention period and a route to handle an access or correction request. Could be worth writing up some terms of use for the portal and linking to them from the login page.
- **No penetration test has been done.** Everything in this report is a source code review by one dev from the Bearing team. An independent penetration test would give further confidence that the portal is as secure as it needs to be.
- **Incident response.** If we suspected unauthorised access to the platform, and wanted to dig in to find out more, we have some logs but haven't exhaustively logged everything in the app (plus we'd need to address logging retention, given the current 14 day retention cap). Could add more logging across the app & sync logs to an external platform for retention.

---

## Summary - recommended actions before go-live

**Do before launch**

1. Tweak: move the app onto the internal database URL, then narrow the Postgres IP allowlist to tighten where the database is accessible from (#5).
2. Tweak: patch `@auth/core` and run `npm audit fix` (#10, #11).
3. Tweak: turn off Auth.js debug logging in production, so user emails stop being written to the logs on every request (#7).
4. (Prime Innovation to do): Enforce MFA on the admin accounts in Google Workspace/Entra (#2).

**Optional for defence in depth**

5. Small feature: add an audit log covering access grants and removals, admin permission changes, and impersonation (#4, #8).
6. Small feature: add rate limiting to the sign-in and API endpoints (#6).
7. Tweak: set up automated dependency updates in GitHub.
8. Small feature: add much more logging on data-viewing actions across the app
9. Small feature: set up a log retention platform so we can access logs for more than 14 days.

**Nice to have & polish**

10. Tweak: make impersonation expire after a time (#3).
11. Small feature: add alerting on repeated denied sign-ins (#9).
