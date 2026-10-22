# NJEN: Day 30 Implementation Report

**Date:** 22-10-2026 · **Starting point:** c08984d - Add Day 29 report: access blockers and PostCSS findings (local `main` = GitHub `main`, working tree clean).

**Nothing was staged, committed, pushed or deployed.** No Vercel or Supabase account was accessed: no access has been granted. No SQL was run and no database was connected to. No production setting, domain, environment variable, permission or billing setting was changed. No consent or legal wording was added. `.env.local` was not opened. `package.json` and `package-lock.json` are unchanged. The PostCSS override was **not** applied to the repository. No Phase 2 work was started.

**Status at a glance:**
- **Local only.** Nothing is verified on Vercel, in NJEN's database or on a real device.
- **The public registration flow is not ready.** Real storage in NJEN's database and a controlled test registration have not been verified.

---

## 1. Verified at the start of the day

The Day 29 report was not taken on trust. Each point below was checked again today.

| Item | Result |
|---|---|
| Repository and branch | `NJentertainmentnetwork/njen-website`, `main`; HEAD `c08984d` = GitHub `main`; tree clean |
| Versions installed | `next` 15.5.28, `sharp` 0.35.5, `source-map-js` 1.2.2, `react`/`react-dom` 19.1.0; nested `postcss` 8.4.31 under `next` |
| Application code since Day 25 (`e824481`) | No commit touches `app/`, `lib/`, `components/` or `db/` |
| Newer Next.js 15.5.x | None after 15.5.28 (registry, 22-10-2026) |
| `npm audit` | 2 findings (1 moderate, 1 high): the nested `postcss` and `next`, which is flagged only because it bundles that `postcss`. Same as Day 29 |
| Day 29 test figures | Reproduced: 194/194 tests before today's additions; smoke 40/40; browser 41/41 |

**Early Access, as it stands in the code:**
- **Page.** `/early-access` is static and kept out of search engines (noindex and nofollow). It shows the approved artwork.
- **API.** `POST /api/early-access` validates the request and then calls one Supabase database function, `record_early_access_signup`.
- **Duplicates.** Handled inside the database function. The code expects it to update the name of an existing email and keep the first signup time and source. The app treats a repeat signup as a success.
- **Consent.** `EARLY_ACCESS_CONSENT = null`, so no checkbox is shown and no consent text is sent. Any consent text the browser sends is ignored by the server.
- **Tests.** Route, logic, validation, store adapter and site launch gates.
- **Environment.** The code reads only five variables: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NJEN_SITE_URL`, `NJEN_ALLOW_INDEXING` and `NJEN_PREVIEW_UNPUBLISHED`. `.env.example` lists more names that no code reads.

### Supabase integration review (local code only)

**Exact call.** The server sends `POST {SUPABASE_URL}/rest/v1/rpc/record_early_access_signup` with a JSON body of exactly five inputs:

| Input | Value | Required |
|---|---|---|
| `p_name` | Trimmed name, 1–120 characters | Yes (validated before the call) |
| `p_email` | Trimmed email, at most 254 characters and in valid format | Yes (validated before the call) |
| `p_source` | Campaign source, at most 64 characters, from a safe character set; otherwise `null` | No |
| `p_signed_up_at` | Server time, ISO 8601 | Yes (always set by the server) |
| `p_consent_text` | `null` until approved wording exists | No |

**Headers.**
- The key always goes in `apikey`.
- `Authorization: Bearer <key>` is added only for older JWT-style keys. New `sb_secret_` keys go only in `apikey`.

**Response and error handling.**
- **Any 2xx.** The signup is stored: 201 `stored`. Only this shows "You're in".
- **Any other status, network error or 8-second timeout.** 502 `error`. The visitor sees a "not saved, try again" message.
- **Storage settings missing or unsafe.** 503 `not-configured`. "Unsafe" means a publishable or anon key, or a non-https URL. The page also shows "Preview only".
- **Logs.** Only the HTTP status is written to the logs. No names, emails or keys.

**Does the code match `early_access_leads`?** **Unknown, and it cannot be decided locally.**
- No code in this repository mentions `early_access_leads`.
- The code depends only on the function `record_early_access_signup`. The repository's own version, `db/migrations/0002_early_access_signups.sql`, writes to `app.early_access_signups`.
- **Never assumed or inspected:**
  - whether NJEN's database already has that function;
  - which columns `early_access_leads` has;
  - how `early_access_leads` handles duplicates.
- The three options from Day 28 still stand:
  1. no change, if a suitable function already exists;
  2. one new function that writes into `early_access_leads`;
  3. apply migration 0002.

  Choosing between them needs the screenshots in §6, plus an authorised technical inspection for anything screenshots can't show.

## 2. Code changes and why

| File | Change | Why |
|---|---|---|
| `tests/early-access-logic.test.mjs` | **5 new tests**, no behaviour change | Covers the real link shapes NJEN's Facebook and Instagram campaigns produce (below). The probe found no defect, so the tests lock in the current, correct behaviour |
| `DAY30_IMPLEMENTATION_REPORT.md` (new) | This report | Required deliverable |

**The five cases the new tests cover:**
1. Meta's short source names `fb`, `ig`, `msg` and `an` are kept.
2. An unfilled `{{site_source_name}}` template is rejected. The source then falls back to the referring site, or to nothing.
3. Facebook (`lm.facebook.com`), Instagram (`l.instagram.com`), Messenger (`l.messenger.com`) and Android Facebook-app referrers are recorded as host names only.
4. A link carrying only `fbclid` stores no source; `fbclid` itself is never stored.
5. `Facebook+Ads` is decoded to `Facebook Ads`.

**No application code changed.** Nothing under `app/`, `components/`, `lib/`, `data/`, `db/` or `public/` changed, and neither did the configuration. The design, wording and consent state are unchanged. No database assumption was altered.

## 3. Already working and reused

Nothing here was rebuilt. Each item was re-run against today's build.
- **Validation and anti-abuse.** Length and format checks, the honeypot field, the minimum fill time, the 4 KB body limit, the JSON-only content type and the per-IP rate limit.
- **Mobile layout.** 16 px inputs, so iPhone Safari doesn't zoom in. Tap targets are 44 px or more, with no sideways scrolling from 320 px to 1440 px. Email and name fields use the right keyboards, `autocomplete` and `enterkeyhint`.
- **Result screens.** Success, "not saved", rate-limited, storage error, network failure and field errors. Each one moves focus correctly for keyboard and screen-reader users.
- **Repeat signups.** They get the same success screen as a first signup, and the database keeps one row per email (§1).
- **Read-only smoke check** (Day 27), **local live check** and **headless browser check**.

## 4. Exact test results

All builds and servers ran with `SUPABASE_URL=` and `SUPABASE_SERVICE_ROLE_KEY=` set empty, so storage was off and nothing could be stored. Node 24.21.0 was used locally.

| Command | Result |
|---|---|
| `npm test` | **199 tests, 199 pass, 0 fail**, 18 suites (194 existing + 5 new) |
| `npx tsc --noEmit` | **Pass** |
| `npm run build` | **Pass**, Next.js 15.5.28, 23 routes; `/early-access` static |
| Secret scan of `.next/static` (key prefixes, variable names, JWT header) | 0 matches |
| `node scripts/site-smoke-check.mjs --base http://127.0.0.1:3630` | **40 passed, 0 failed** |
| `node scripts/early-access-live-check.mjs --mode unconfigured` | **11 passed, 0 failed** |
| `node scripts/early-access-browser-check.mjs` | **41 passed, 0 failed** (6 viewports including 320, 375 and 390 px iPhone widths; all result states; keyboard focus) |
| Server log scan (key prefixes, test emails) | 0 matches |
| Leftover server or headless browser after the run | None |

**PostCSS override readiness check.** This ran in a scratch copy outside the repository, with no `.env` files. The override was `"overrides": { "next": { "postcss": "$postcss" } }`, with the nested lockfile entry removed.

| Command | Result |
|---|---|
| `npm ci` (new today, from the edited lockfile) | Pass; `npm ls postcss` shows one copy, 8.5.28, deduped under `next` |
| `npm audit` | **0 vulnerabilities** |
| `npm run build` | Pass, 22/22 static pages |
| `npm test` | 194/194 (the copy predates today's 5 new tests) |
| Compiled CSS | Byte-identical to the repository build (sha256 prefix `9be42c10966d803d` in both) |

**PostCSS conclusion:**
- The override is **ready to be proposed as a separate, approved change**. It is a small edit to `package.json` and the lockfile, with no visible effect on the site.
- It has **not** been applied.
- It overrides a version that `next@15.5.28` pins, which Next.js doesn't officially support. The Next.js 16 upgrade remains the long-term fix.

**Not run:**
- anything on Vercel or against NJEN's database;
- the configured live check, which writes a row;
- real iPhones, the real Facebook or Instagram in-app browser, and screen readers;
- axe or Lighthouse (not installed).

The browser check simulates iPhone *widths* in desktop Edge. **It is not real-device testing.**

## 5. Ready for the new Vercel project

The repository can be imported as it is today:
- **Framework.** Next.js, detected automatically. The default root directory, build command and output settings are correct, and `vercel.json` needs no change.
- **Node.js.** 20.x or newer. `sharp` 0.35.5 needs Node 20.9 or later.
- **Environment variables.** **None** are needed for the first deployment. With none set:
  - the page shows "Preview only";
  - nothing can be saved;
  - search engines are blocked (robots only open when `NJEN_ALLOW_INDEXING` is exactly `true`).
- **Domain.** None. The existing production site and its domain are untouched.
- **After the database is agreed.** Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in the new project only, then **redeploy**. The Early Access page is built ahead of time, so it only picks up the change on a new deployment.
- **Then run the read-only smoke check.** It sends GET requests only, never submits the form, and runs as `node scripts/site-smoke-check.mjs --base <deployment URL>`. Add `--share "<link>"` if the deployment is protected.

**Supersedes** the private-preview steps in `docs/NJEN_DAY23_NEXT_CLIENT_ACTION.md`. That file is left unchanged as a record. It also contains cost statements that the client should confirm in their own Vercel account rather than rely on.

## 6. Client actions needed in Vercel and Supabase

### Vercel: create one new project (about 10 minutes)

These steps describe Vercel's usual screens. If a label looks different, stop and send a screenshot. **Do not change an existing project to make it fit.**

1. Log in at **vercel.com**. Check that the team name at the top left is NJEN's team.
2. Click **Add New…**, then **Project**.
3. Under **Import Git Repository**, find **`NJentertainmentnetwork/njen-website`** and click **Import**.
   - **If it isn't listed:** click **Adjust GitHub App Permissions**, choose the **NJentertainmentnetwork** organisation, allow access to **njen-website**, save, and return to Vercel.
   - Importing an organisation repository needs a GitHub organisation owner, or a member with access to that repository.
4. On the setup screen:
   - **Project Name:** a new name, for example `njen-website-client-test`. This makes sure nothing existing is replaced.
   - **Framework Preset:** leave as **Next.js**.
   - **Root Directory**, **Build and Output Settings:** leave as they are.
   - **Environment Variables:** **add nothing.**
5. Click **Deploy** and wait for the success screen.
6. **Do not** add a domain. **Do not** change any setting on the existing projects.
7. If you want the test site to be private, look at **Settings → Deployment Protection** in the new project. Please check the cost of any option in your own Vercel account before turning it on. We have not inspected your account, and plans and prices can change.
8. Send back (no passwords or keys):
   - the **project URL**, for example `vercel.com/<team>/<project>`;
   - the **deployment URL** (the `….vercel.app` address);
   - the **commit hash** shown on the deployment (7 characters);
   - a share link, if protection is turned on.

### Supabase: three screenshots, no SQL

Open the NJEN project in the Supabase dashboard. **Do not** screenshot the API Keys page, any key, or the database connection string. **Do not** open rows of real signups.
1. **Project name and status.** The project's home page, showing its name and that it is active (not paused).
2. **The table's columns, with no row data.** Go to **Database → Tables**, find `early_access_leads` and open its column list. This shows the column names, types and whether each one is required. Please use the column view, not the Table Editor grid, which shows real signups.
3. **The signup function, if one exists.** Go to **Database → Functions** and search for `record_early_access_signup`. Screenshot the result, even if it says nothing was found.

Menu names may differ slightly between Supabase versions.

**What screenshots cannot show** needs an **authorised technical inspection** by the developer, with access granted by NJEN:
- security rules (RLS) and permissions;
- duplicate-email handling;
- triggers;
- what the function actually does.

## 7. Remaining blockers

| Blocker | Who | Needed |
|---|---|---|
| New Vercel project from the official repository | NJEN Vercel owner | §6 steps; send the project URL, deployment URL and commit |
| Database match with `early_access_leads` | NJEN, then the developer | Screenshots (§6); then an authorised inspection if needed; then written approval of any database change |
| Storage settings in the new project | NJEN | Only after the database is agreed; then redeploy |
| Controlled test registration | Developer + NJEN | All of the above; one agreed test entry, checked in the database, then removed or kept as agreed |
| Consent checkbox | NJEN | Approved consent wording and the Privacy Policy URL (B6) |
| Real-device checks | NJEN or developer | A real iPhone (Safari) and the Facebook/Instagram in-app browsers, on the new deployment |
| PostCSS override | NJEN | Written approval as a separate dependency change |
| Next.js 15 security support ended around 21-10-2026 | NJEN | Approval to scope the Next.js 16 upgrade |
| Launch approval | NJEN | Sign-off after the above |

## 8. Developer time remaining (Phase 1 Early Access)

These are estimates, not commitments. They exclude waiting time for client actions.

| Task | Estimate |
|---|---|
| Run the smoke check and Preview checklist on the new deployment | 1–2 hours |
| Review the Supabase screenshots and plan the database match | 1–2 hours |
| Authorised technical inspection, if needed | 1–2 hours |
| Any approved database change: write it, test it on the developer's own database, hand it over, verify | 2–4 hours (0 if the existing function fits) |
| Add the consent checkbox once wording is approved | 1–2 hours |
| Controlled test registration and verification | 1 hour |
| Apply the PostCSS override, if approved | 1 hour |
| Final launch checks and report | 1–2 hours |

**Total: about 9–16 hours** of developer time. The Next.js 16 upgrade is not included; it needs its own scope.

## 9. Client message

> **Early Access update (22-10-2026)**
>
> The Early Access page and its signup form have passed all of our checks on the developer's machine. This includes phone screen sizes and links from Facebook and Instagram. It is not live yet. Before it can be, we need three things from you.
>
> **1. Create one new Vercel project (about 10 minutes).** In Vercel, choose **Add New → Project** and import **NJentertainmentnetwork/njen-website**. Give it a new name, leave the settings as they are, add no environment variables and no domain, then click **Deploy**. Please don't change your existing projects or your live site. If you want the test site private, check the cost of that option in your Vercel account first. Then send us:
> - the project URL;
> - the deployment URL;
> - the 7-character commit code.
>
> **2. Send three Supabase screenshots (no SQL needed).**
> - The project home page, showing its name and status.
> - The column list of the `early_access_leads` table: please use **Database → Tables**, not the grid of real signups.
> - **Database → Functions**, searched for `record_early_access_signup`.
>
> Please don't include API keys or connection details. If the screenshots don't answer everything, we'll ask for a short authorised technical check.
>
> **3. Approvals before launch.**
> - The consent wording for the signup form, and your Privacy Policy URL.
> - Any change to the database. We'll propose it only after reviewing your screenshots, and nothing changes without your written approval.
> - One controlled test registration, which we check together in your database.
> - Your final go-ahead to launch.
>
> Separately, we'd like your approval for a small, already-tested security update to one build tool (PostCSS). It doesn't change the look of the site.

## 10. Branch and changed files

- **Branch:** `main` (no branch created).
- **Changed:** `tests/early-access-logic.test.mjs` (+26 lines, 5 tests).
- **New:** `DAY30_IMPLEMENTATION_REPORT.md`.
- **Nothing staged or committed.**
