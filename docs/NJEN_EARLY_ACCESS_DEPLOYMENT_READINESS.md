# NJEN Early Access — Deployment Readiness

**Prepared 12-10-2026 (Day 21). Nothing here has been done on Vercel or Supabase.** This is the checklist for whoever holds the access (NJEN), with what the developer has verified locally.

The variable reference is `ENVIRONMENT_VARIABLES.md`. The full post-deploy test list is `LAUNCH_QA_CHECKLIST.md` §6.

---

## 1. Current state

| Item | State |
|---|---|
| Code | Ready locally at baseline `e41b4f2`, plus the Day 21 request-size fix (not yet committed) |
| Official GitHub repository | `NJentertainmentnetwork/njen-website`, branch `main` |
| Vercel projects seen by NJEN | `njen-website`, `njen-website-live`, `njen-website-production`, all **reported connected to the old repository `NJEnetwork/njen-website`** |
| Vercel project connected to the official repository | **Not found / not confirmed** |
| Supabase variables on any Vercel project | `njen-website-live`: none at project level. The other two: **not checked** |
| Preview URL for the current code | **None known.** Do not assume one exists |
| Real signup saved | **Never** |

**Consequence:** a push to the official repository may currently deploy nowhere. Any project still linked to the old repository will keep serving old code. Until a project is confirmed as linked to `NJentertainmentnetwork/njen-website`, the Early Access code cannot be tested on Vercel.

---

## 2. Required environment variables

| Name | Secret? | Needed for | Set in |
|---|---|---|---|
| `SUPABASE_URL` | No (an address) | Signup storage | **Production**. Preview only if preview signups should go into the same list, which is usually not wanted |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes, highest sensitivity.** Full database access; bypasses all row security | Signup storage | Same as above. Prefer a **secret key** (`sb_secret_…`); a legacy `service_role` key also works. A **publishable** key (`sb_publishable_…`) is the wrong key and will fail |

Rules:
- Both or neither: with only one set, storage stays off.
- **Never** use a `NEXT_PUBLIC_` name for either. That would publish the key in the browser.
- Type the values only into Vercel's Environment Variables screen. Never paste them in email, chat, tickets, screenshots or repository files.
- **Who sets them:** on Vercel Pro, the **Developer** role *cannot* change Production environment variables; Owners and Members can (Vercel docs, read 12-10-2026). So NJEN sets them. This also means the developer never needs to see the key.
- **Redeploy afterwards.** Vercel applies variable changes to new deployments. The Early Access page is pre-built, so the "Preview only" notice only disappears in a build made after the variables are set (verified locally).

Other variables (`NJEN_SITE_URL`, `NJEN_ALLOW_INDEXING`, `NJEN_PREVIEW_UNPUBLISHED`) are unrelated to signups. Leave `NJEN_ALLOW_INDEXING` unset until launch; Early Access stays noindex either way.

---

## 3. Find the official Vercel project (read-only; change nothing)

For each of the three projects:
1. Open the project → **Settings → Git**. Note the **Connected Git Repository** and the **Production Branch**.
2. Open **Deployments**. For the latest Production deployment, note the **commit message and short hash** and the **source repository** shown.
3. Open **Settings → Domains**. Note any domains attached.
4. Open **Settings → Environment Variables**. Note **only the variable names** and their environments. Do not reveal or copy values.

Report all four for each project. The official project is the one connected to **`NJentertainmentnetwork/njen-website`** with production branch **`main`**.

**If none is connected to the official repository**, a project must be connected to it, or a new one created. That is an account change for NJEN to make or explicitly authorise. The developer will not do it, and it is the first deployment blocker.

---

## 4. Verify a deployment

| Check | How | Pass |
|---|---|---|
| Right code | Deployment's commit hash and repository | Matches the agreed commit on `NJentertainmentnetwork/njen-website` `main` |
| Site is up | Open `https://<deployment-host>/api/health` | `{"status":"ok"}` |
| Variables reached the build | Open `/early-access` | No amber "Preview only" box |
| Search engines kept out | View page source | `<meta name="robots" content="noindex, nofollow">` |
| Security headers | `curl -sI https://<deployment-host>/early-access` | `Content-Security-Policy`, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`; no `X-Powered-By` |

### The health check is not a database check

`/api/health` answers "ok" whenever the website's server code runs. **It never contacts Supabase**, by design, so it reveals nothing about configuration to the public. A green health check with a broken database is entirely possible. **Only a real test signup (section 5) proves storage works.**

---

## 5. Controlled test signup (only after the database decision is approved and applied)

1. Use **one test address NJEN controls** (for example a team mailbox), not a real visitor's.
2. Open `/early-access?utm_source=day21-test` and submit name "NJEN Test" plus the test address.
3. **Expected:** the "You're in" screen. Any other message means it was not saved; capture the message and the time.
4. **Confirm the row without exposing personal data.** In Supabase SQL Editor, run the query below with the test address substituted. It returns only a count, a time and the test source:
   ```sql
   select count(*) as rows_for_test_address, max(signed_up_at) as signed_up_at, max(source) as source
   from app.early_access_signups
   where lower(email) = lower('<test address>');
   ```
   Expected: `1`, a time matching the test, and `day21-test`. (If Option B is chosen, the table and column names change. The approved proposal will include the matching query.)
5. **Duplicate test:** submit again with the same address in different capitals (e.g. `Test@…`). Expected: "You're in" again, and the query still returns **1**. This is Option A's behaviour; restate for Option B.
6. **Logs:** Vercel → project → **Logs**, filtered to `/api/early-access`. Expected: no `signup store failed` lines for the test. If there are any, report the status code shown (it contains no personal data).
7. **Clean up:** NJEN deletes the test row in the SQL Editor (a write, so NJEN performs it): `delete from app.early_access_signups where lower(email) = lower('<test address>');`

**Do not send Facebook or paid traffic until steps 3–5 pass.**

---

## 6. Failure behaviour (do not force on production)

These were verified locally against a simulated Supabase (Days 20–21). Do not break production to repeat them.

| Simulated condition | Result |
|---|---|
| Function missing (404) | 502, visitor told "not saved" |
| Key rejected (401) | 502, "not saved" |
| Database error (500) | 502, "not saved" |
| No answer for 8 s | 502 after 8 s, "not saved" |
| Same email twice | 201 both times (one row, per the database function) |

If NJEN wants to see a failure on the real platform, the safe way is a **Preview** deployment whose Preview-only variables point at a non-existent function or carry a wrong key. That is a Vercel configuration change, so NJEN must approve and perform it. It is **optional** and not required for launch.

---

## 7. Unverified on the real platform

- Vercel's maximum function duration for the project's plan versus the 8-second storage timeout (not checked).
- How the rate limit behaves across Vercel's server instances. It is per instance, so it may be looser than 5 per 10 minutes. Vercel's documentation says it **overwrites `X-Forwarded-For` with the real client IP and does not forward client-supplied values**, so visitors cannot fake the address the limiter uses. Confirm with one test on the deployment.
