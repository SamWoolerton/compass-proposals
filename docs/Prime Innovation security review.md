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

To secure the admin accounts themselves, Prime Innovation and Bearing each have configured their respective auth provider so that all accounts require MFA (applies to internal emails & account access, rather than specifically to the portal).

**Potential concerns**

| #   | Description                                                                                                                                                                                                                                                                                         | Risk                                       |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| 1   | **`users.list` is open to any admin regardless of permissions.** It uses `adminProcedure` rather than a permission-gated one and returns every user's name, email and organisation. An admin added with only `impersonate` - or with no grants at all - can enumerate the full client contact list. | Low to none (it's already only for admins) |

---

## Impersonation ("view as client")

**Notes**

- Cookie is HMAC-SHA256 (signed with the configured `AUTH_SECRET`) and verified with a constant-time comparison, meaning there's no potential for timing attacks that could leak the secret.
- The permission is re-checked server-side on every request, not just when impersonation starts. A cookie held by someone whose permission was revoked stops working immediately.
- The impersonated context is stripped of all admin rights, so an admin viewing a client cannot use admin endpoints while doing so.
- Impersonation is cleared before sign-out is processed.
- Impersonation start and stop events are tracked in the audit log

**Potential concerns**

| #   | Description                                                                                                                                                                                                                                                                                                                                    | Risk |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| 2   | **The impersonation auth doesn't automatically expire**. The 8-hour limit is a browser cookie `maxAge`, which the browser enforces and an attacker doesn't. The token value stays valid indefinitely (as long as the admin still has the `impersonate` permission). Fix is small: sign `userId + orgId + expiry` and check the expiry on read. | Low  |

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

We host on [Render](https://render.com/). Their documentation covers it well - links at the end of this section.

**In transit**

- **Browser to app - Render.** Every Render service gets a free managed TLS certificate, for both the `onrender.com` subdomain and any custom domain we add. Render issues them through Let's Encrypt and Google Trust Services and renews them automatically before expiry, and it "automatically redirects all `HTTP` requests to `HTTPS`".
- **App to database - Render** The portal uses the internal connection that Render provides, so traffic to the database travels over Render's internal network, not the public internet.
- **App to Backblaze (client logos):** over HTTPS.
- **App to Bearing's internal tool Mission Control for monitoring uptime:** over HTTPS.
- **Direct access to database for debugging** Where direct access to the database is required for debugging, we use Render's external connection. This external access is locked down to only approved IPs. Render enforces TLS on external connections, requiring clients to support "TLS version 1.2 or higher" and a set list of cipher suites.

**At rest**

- **Database - Render.** "Render Postgres databases are encrypted at rest using AES-256 data encryption", and that covers the primary, any replicas, and all backups. Note that nothing in the application encrypts columns before storing them.
- **Environment variables and secrets - Render.** "Your environment variables and secret files are encrypted at rest using a minimum AES-128 standard", with "TLS 1.2 or higher" securing the transport layer to the app.
- **Logos - Backblaze.** The `prime-innovation` bucket is private, and default server-side encryption (SSE-B2, Backblaze-managed keys) is enabled.

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
| 3   | **No rate limiting.** API calls and sign-in attempts aren't rate-limited. The identity provider (Microsoft or Google) will definitely have rate limiting on their side, so this isn't a security risk as much as not having protected against getting DDoSed offline. | Low for security, medium for DDoS risk (Render has some network-level protections too) |

---

## Logging and monitoring

The portal has an audit log for security-related events:

- Access granted or revoked for a client
- An admin being added or removed
- An admin's permissions changing
- Impersonation starting or ending
- Client creation or deletion
- Sign-ins

**Potential concerns**

| #   | Description                                                                                                                                                                                                                     | Risk          |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| 4   | **No alerting on suspicious sign-in attempts.** We don't have handling in place for repeated denied sign-ins; most of the work here is on the auth provider's side (Microsoft and Google), but we could add more handling here. | Low to medium |

---

## API keys, credentials and secrets

**Notes**

- Every secret is read from environment variables, rather than hard-coded into the codebase.
- `.env` and `.env.*` are gitignored to prevent them from being accidentally tracked in Git's code history.
- CI doesn't use real credentials

---

## Dependencies and third parties

**Dependencies:**

Dependencies are up to date (as of the time of writing), with no known security vulnerabilities in packages the portal uses.

We have GitHub's Dependabot enabled to track reported dependency vulnerabilities and alert us of these, so we can patch them promptly when reported.

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

**Optional for defence in depth**

1. Small feature: add rate limiting to the sign-in and API endpoints (#3).
2. Small feature: add much more logging on data-viewing actions across the app
3. Small feature: set up a log retention platform so we can access logs for more than 14 days.

**Nice to have & polish**

4. Tweak: make impersonation expire after a time (#2).
5. Small feature: add alerting on repeated denied sign-ins (#4).
