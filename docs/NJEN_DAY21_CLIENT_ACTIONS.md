# NJEN — Day 21 Client Actions

> **Superseded on 13-10-2026 by `docs/NJEN_DAY22_CLIENT_ACTIONS.md`.** Kept as a record.

**Prepared 12-10-2026.** Only the items that unblock real work, in priority order. Each says what is needed, why, and what it costs. **Nothing here has been approved yet.**

## A. Needed now (blocks the first real test signup)

| # | Action | Why | Cost |
|---|---|---|---|
| 1 | **Confirm the Supabase project is active after the restore attempt.** Report its name, region and status (guide §2) | Nothing can be inspected or tested on a paused project | — |
| 2 | **Run the read-only inspection** in `docs/NJEN_SUPABASE_READ_ONLY_INSPECTION_GUIDE.md` and send the results (queries 0–14, dashboard checks D1–D6) | Decides whether any database change is needed, and which. The queries change nothing and return no names or emails | — |
| 3 | **Tell us about `early_access_leads`:** who created it, when, whether it holds real signups, and whether any form, website builder, Zapier/Make, email or CRM tool writes to it | If something else uses it, the website must not repurpose it without a plan for both | — |
| 4 | **Find the Vercel project connected to `NJentertainmentnetwork/njen-website`.** For each of the three projects send: connected repository, production branch, latest production commit, domains, and environment variable *names* only (`docs/NJEN_EARLY_ACCESS_DEPLOYMENT_READINESS.md` §3) | All three are reported linked to the old repository. Without a project on the official repository, the current code cannot be deployed or tested | — |
| 5 | **If no project is connected to the official repository:** decide whether to reconnect an existing project or create a new one. NJEN performs or explicitly authorises it | It is an account change; the developer will not make it | Depends on Vercel plan (item 10) |

## B. Needed once the inspection results are in

| # | Action | Why | Cost |
|---|---|---|---|
| 6 | **Approve one specific database change, only if the inspection shows one is needed.** The developer will send the exact SQL, reason, impact and undo steps. The likely options are "no change", "one new function onto `early_access_leads`", or "apply the prepared migrations 0001 + 0002" | Without the expected function, every signup fails safely, but nothing is saved | $0 |
| 7 | **NJEN sets `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in the official Vercel project (Production), then redeploys.** Prefer a secret key (`sb_secret_…`). Never send the key to anyone | Turns storage on. The developer never needs to see the key | — |
| 8 | **Approved consent wording and Privacy Policy URL**, or counsel's confirmation that signups may be collected before they exist | The consent checkbox is built but switched off until approved wording is supplied (register B6). No legal text has been written on NJEN's behalf | — |

## C. Decisions (with the facts to decide them)

| # | Decision | Facts | Cost |
|---|---|---|---|
| 9 | **Security patch:** approve `next` 15.5.27, `sharp` 0.35.5, `source-map-js` 1.2.2 as a separate change, and accept the PostCSS advisories until a later Next.js 16 upgrade | `docs/NJEN_SECURITY_PATCH_RECOMMENDATION.md`. Tested in an isolated copy; clears 4 of 8 advisories; revert = one commit | $0 |
| 10 | **Access for testing:** <br>• Vercel: invite the developer as **Pro Viewer** (free, cannot see logs), or a **Developer** seat ($20/month, can see deployments and logs but cannot change Production variables). Hobby has no team access. <br>• Supabase: either NJEN runs the inspection itself (recommended), or invites the developer as **Developer**, a role that can read the service key. Supabase's read-only role exists only on its Team plan and above | `docs/NJEN_SUPABASE_DATA_PROTECTION_AND_ACCESS.md` §7. Confirm the current Vercel plan and whether the seat charge is acceptable | $0 or $20/month (Vercel) |
| 11 | **Supabase Free vs Pro, before real traffic:** <br>• stay on Free and accept the pause risk with manual exports, or <br>• move to Pro (from $25/month: no pausing, daily backups for 7 days) | Free is adequate for the test signup. The decision is needed before Facebook or paid traffic, not before testing | $0 or from $25/month |

## Not needed from NJEN right now

Passwords, API keys, the service-role key, database connection strings, or any export of real signups. **Please do not send them.** The developer needs counts and structure, never contents or credentials.
