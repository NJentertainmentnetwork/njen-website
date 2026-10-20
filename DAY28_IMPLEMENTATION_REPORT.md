# NJEN: Day 28 Implementation Report

**Date:** 20-10-2026 · **Starting point:** 130d101 - Add Day 27 launch-gate tests and read-only Preview smoke check (local `main` = GitHub `main`, working tree clean).

**Nothing was staged, committed, pushed or deployed.** No Vercel project, old or new, was inspected or changed. No change was made to NJEN's Supabase, any database, domains, environment variables, permissions or billing. No SQL was run. `.env.local` was not opened. No signup was stored anywhere.

**Status at a glance:**
- **Approved security patch: applied** in the development codebase. All local checks pass.
- **Registration against NJEN's database: NOT VERIFIED.** It cannot be verified until NJEN's schema is known and the storage settings are configured (§4).
- **Not launch-ready.**

---

## 1. What was changed

| File | Change |
|---|---|
| `package.json` | `next` 15.5.25 → **15.5.28** (exact). Nothing else in the file changed |
| `package-lock.json` | `next`, `@next/env` and 8 `@next/swc-*` binaries → 15.5.28; `sharp` → **0.35.5**, with 16 `@img/sharp-*` binaries → 0.35.5 and 10 `@img/sharp-libvips-*` → 1.3.4; `source-map-js` → **1.2.2**. **0 unrelated packages changed**; every package resolves from `registry.npmjs.org` |
| `docs/NJEN_SECURITY_PATCH_RECOMMENDATION.md` | Status: applied in development, not deployed; approval as relayed |
| `LAUNCH_QA_CHECKLIST.md` | Dependency row: patch applied locally, not yet deployed |
| `DAY28_IMPLEMENTATION_REPORT.md` (new) | This report |

**No application code changed.** Nothing changed under `app/`, `components/`, `lib/`, `data/`, `db/`, `public/`, `tests/` or `scripts/`, and `next.config.ts` and `vercel.json` are unchanged. The Early Access page, its artwork, logo, headlines, colours and layout are untouched.

**Approval:** the developer relayed on 20-10-2026 that NJEN approved the patch, "subject to compatibility verification". The written approval itself is not in the repository; keep it on file with the project records. The two other decisions in the recommendation are not recorded as answered: accepting the PostCSS risk, and scoping Next.js 16.

**Commands (exactly as trialled on Day 26):** `npm install next@15.5.28 --save-exact`, then `npm update sharp source-map-js`. The resulting tree matches the Day 26 isolated trial package-for-package. Before applying, I checked that no newer 15.x release or Next.js advisory had appeared since 14-10-2026; none had.

## 2. Test results and build status (actual)

Storage was off for every run (`SUPABASE_URL=` and `SUPABASE_SERVICE_ROLE_KEY=` set empty in the shell), so nothing could be stored.

| Check | Result |
|---|---|
| `npm ls next sharp source-map-js` | `next@15.5.28`, `sharp@0.35.5`, `source-map-js@1.2.2` (both PostCSS copies) |
| `npm audit` | **2** entries (1 high, 1 moderate), down from 4. The nested `postcss@8.4.31` inside `next`, and `next` flagged only because it bundles it. Fixable only with Next.js 16 |
| `npm test` | **194 tests, 194 pass, 0 fail**, 18 suites |
| `npx tsc --noEmit` | **Pass** (exit 0) |
| `npm run build` | **Pass**, Next.js 15.5.28, 23 routes |
| Secret scan of `.next/static` | 0 matches |
| `/_next/image`, both hero images (exercises `sharp` 0.35.5) | 200 WebP (86,730 B mobile; 144,174 B desktop, at 828 px) |
| `node scripts/site-smoke-check.mjs` (local) | **40 passed, 0 failed** |
| `node scripts/early-access-live-check.mjs --mode unconfigured` | **11 passed, 0 failed** |
| `node scripts/early-access-browser-check.mjs` | **41 passed, 0 failed** |
| Server log scan (test names and emails, key prefixes) | 0 matches |

**Not run:**
- the configured live check: it writes a row;
- anything against NJEN's database or on Vercel;
- real devices and screen readers.

## 3. Is the local registration flow verified?

**Verified locally:**
- validation (browser and server);
- anti-abuse checks;
- error handling and honest failure messages;
- source handling;
- consent staying off;
- the "storage not configured" path, end to end in a real browser.

**The "stored" path is verified against a simulated Supabase only.** The unit tests stub the network; it was also verified once against the developer's own test project on 13-10-2026 (Day 22), which was not re-run today.

**It is not verified against NJEN's Supabase.** It has never been connected (§4).

**Registration review** (current code, unchanged since the Day 25 review: no commit has touched `app/`, `lib/`, `components/` or `db/` since `e824481`):

| Question | Current behaviour |
|---|---|
| Name and email validation | Both required and trimmed. Name ≤ 120 characters; email ≤ 254 characters and `x@y.zz` format. Checked in the browser, then again on the server (`lib/forms.ts`) |
| Abuse controls | Body ≤ 4,096 bytes (counted as read); JSON only (415 otherwise); hidden honeypot; minimum fill time 900 ms, and a missing timing value counts as too fast; 5 attempts per IP per 10 minutes, per server instance |
| Consent | **Off by design.** `EARLY_ACCESS_CONSENT` is `null` because no approved wording or Privacy Policy URL exists (B6). No checkbox is shown, and the server ignores consent text sent by the browser. When wording is approved, one constant switches on the checkbox, server enforcement and storage of the exact wording |
| Storage target | `POST {SUPABASE_URL}/rest/v1/rpc/record_early_access_signup` with `p_name`, `p_email`, `p_source`, `p_signed_up_at` (server clock), `p_consent_text`. Server-only key, 8-second timeout. Any 2xx = stored |
| Duplicates | Handled **in the database**, not the app. Migration 0002's function keeps one row per email regardless of capitalisation (updates the name; keeps the first time and source). The app answers "stored" for a repeat. **Against NJEN's table the behaviour is unknown** until its constraints are known |
| Source / Facebook | `?source=`, then `?utm_source=`, then `?ref=`, then the referring host only (e.g. `l.facebook.com`). Limited to a safe ≤ 64-character label, so no spreadsheet formulas. `fbclid` is never stored. **Untagged in-app visits with no referrer record no source**, so campaign links should carry `?utm_source=facebook` |
| What the visitor sees | "You're in. Welcome to NJEN." **only** when the server confirms storage. Every failure (bad input, rate limit, server or network error, unexpected reply) says plainly that nothing was saved. With storage off, the page and the result say "Preview only… not saved" |
| Secrets | Storage variables have no `NEXT_PUBLIC_` prefix; 0 matches in browser bundles; logs carry only the HTTP status on failure |

## 4. Supabase integration findings

**Implemented (no change today):** an HTTPS adapter (`lib/early-access-store.ts`) that calls **one database function** through Supabase's REST API. It does not insert into a table directly and never reads leads back.

**What the code expects** (from migration `db/migrations/0002_early_access_signups.sql`, which has **not** been applied anywhere NJEN owns):
- **Function:** `public.record_early_access_signup(p_name text, p_email text, p_source text default null, p_signed_up_at timestamptz default now(), p_consent_text text default null) returns void`. It is `security definer` with a pinned `search_path`, and executable by `service_role` only.
- **Table it writes:** `app.early_access_signups` in a non-API `app` schema. RLS is on with no policies. Columns: `id uuid`, `name text` (1–120), `email text` (3–254), `signed_up_at timestamptz`, `source text` (≤ 64), `consent_text text`, `consent_given_at timestamptz`, `created_at`, `updated_at`. Unique index on `lower(email)`.

**The exact mismatch:** the application calls `public.record_early_access_signup`. NJEN reports an existing table, `early_access_leads`; which schema it is in, and its columns, are unknown. **Whether the expected function already exists in NJEN's project is unknown. It is not assumed missing.** If the storage variables were set today, either:
- the function exists, and the signup works; or
- Supabase answers 404, and every visitor is told "not saved". Safe, but nothing is collected.

**Why it can't be verified yet:**
- no inspection results;
- no storage variables on any project connected to the official repository;
- no Preview.

**Information needed** (read-only queries already written in `docs/NJEN_SUPABASE_READ_ONLY_INSPECTION_GUIDE.md`):

| Need | Query | Why |
|---|---|---|
| Project active? | Q0, D6 | Nothing else can be checked otherwise |
| Does the function already exist, and what does it write to? | Q1, Q10, Q11 | If it exists and is `service_role`-only, **no database change at all** |
| `early_access_leads` schema and columns | Q2, Q3 | Which columns hold name, email, time, source; is there anywhere for consent text |
| Does it hold real leads; is something still writing to it? | Q4 (+ §6 dates) | Real leads must be preserved; a second writer must be agreed |
| Is email unique, case-insensitively? | Q5, Q6 | Decides duplicate handling |
| Can the public read it? | Q7–Q9 | If `anon`/`authenticated` can read leads, that is an **existing exposure** to fix first |
| Dependents, triggers, webhooks | Q12, Q13, D4 | Anything a new writer would set off |
| Exposed API schemas; key types | D2, D3 | Which key goes in `SUPABASE_SERVICE_ROLE_KEY`; the app supports both kinds |

**Smallest safe integration change**, decided by the answers:
1. **The function already exists and is suitable: no database change.** Set the two variables, redeploy, test.
2. **`early_access_leads` holds real leads or is used elsewhere** (most likely): **one new function** with the same name and five inputs, writing into `early_access_leads`, `service_role` only. **No website code change, no new table, no data moved.**
3. **The table is empty and unused, and NJEN prefers a clean list:** apply migration 0002 as written. `early_access_leads` is left untouched.

**PROPOSED, NOT IMPLEMENTED: outline for option 2.** It can't be run as written: the `<placeholders>` must come from Q2–Q6, and the final SQL goes to NJEN for written approval first.

```sql
-- PROPOSAL OUTLINE ONLY. NOT RUN. NOT FOR EXECUTION.
create or replace function public.record_early_access_signup(
  p_name text, p_email text, p_source text default null,
  p_signed_up_at timestamptz default now(), p_consent_text text default null
) returns void
language plpgsql security definer
set search_path = <schema>, pg_temp
as $$
begin
  insert into <schema>.early_access_leads (<name_col>, <email_col>, <signed_up_col>, <source_col>)
  values (left(btrim(p_name), 120), lower(left(btrim(p_email), 254)),
          coalesce(p_signed_up_at, now()), nullif(left(btrim(coalesce(p_source, '')), 64), ''))
  <duplicate handling: depends on Q5/Q6. "on conflict" needs a unique index on lower(email);
   adding one is a separate approval and fails if duplicates already exist>;
end;
$$;
revoke all on function public.record_early_access_signup(text, text, text, timestamptz, text) from public, anon, authenticated;
grant execute on function public.record_early_access_signup(text, text, text, timestamptz, text) to service_role;
```

**Open points the outline can't settle:**
- consent text has no column unless the table has one, but consent is off anyway until B6;
- duplicates, if email is not unique;
- any trigger or webhook on the table.

**To undo option 2:** `drop function public.record_early_access_signup(text, text, text, timestamptz, text);`. The table and its rows are untouched.

**Configuration (later, by NJEN):** `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` on the official Vercel project, Production scope only, then a redeploy. The Developer role cannot set Production variables.

## 5. Requirements for the new Vercel Preview

**The client creates it.** Steps: `docs/NJEN_DAY23_NEXT_CLIENT_ACTION.md`. The old projects are not involved and must not be changed.

| Setting | Value |
|---|---|
| Repository / branch | `NJentertainmentnetwork/njen-website`, `main` |
| Project name | New, e.g. `njen-website-preview`. Do not reuse an existing project |
| Framework / build | Next.js, detected from `vercel.json`. Leave root directory, install and build commands at their defaults |
| Node.js version | **20.x or newer** (Settings → Build and Deployment). New requirement from `sharp@0.35.5` (Node ≥ 20.9.0). Next.js 15.5.28 itself accepts ≥ 18.18 |
| Environment variables | **None.** The build needs none (verified locally; 23 routes) |
| Must NOT be set on the Preview | `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` (until the database step is approved); `NJEN_ALLOW_INDEXING`; `NJEN_SITE_URL`; `NJEN_PREVIEW_UNPUBLISHED`; anything `NEXT_PUBLIC_*`. `.env.example` lists 12 further names (Payload, Sentry, Resend, Plausible, `NEXT_PUBLIC_SUPABASE_*`) that **no current code reads**; none should be set |
| Domain | None |
| Protection | Deployment Protection: Vercel Authentication on **All Deployments**; a share link for the developer. No paid Password Protection |
| Who can do it | A GitHub organisation Owner, or a Member with access to the repository (Vercel docs), with a Vercel role that can create projects |
| Plan | The repository is currently **public**, so the reported Hobby limit on *private* organisation repositories doesn't apply today. If it becomes private (recommended, register A2a), Pro may be required, and Pro is required for commercial use anyway |
| Send back | Project name, share link, deployment commit hash (should include the Day 28 commit once pushed), protection screenshot |

**All five variables the code reads:**
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`: storage. Later, Production only.
- `NJEN_SITE_URL`: canonical and sitemap. At launch, with the domain.
- `NJEN_ALLOW_INDEXING`: robots. `true` at launch, Production only.
- `NJEN_PREVIEW_UNPUBLISHED`: shows hidden sections for staging review. Never in Production.

**Once it exists:** `node scripts/site-smoke-check.mjs --base <preview> --share "<link>"`, then the manual rows of `docs/NJEN_DAY24_PREVIEW_QA_CHECKLIST.md`.

## 6. Client approvals or access still needed

1. **Create the private Preview** (§5) and send the share link and commit.
2. **Run the read-only Supabase inspection** and send the results (§4). No keys, no personal data.
3. **Written approval of the exact SQL**, if any change is needed after (2).
4. **Set the two Supabase variables** on the official project, then redeploy. Then one controlled test signup with an NJEN-controlled address, verified by a count-only query, and the test row removed.
5. **Consent wording and Privacy Policy URL** (B6), if NJEN wants consent recorded at launch.
6. **Recorded answers** to recommendation decisions (2) PostCSS risk and (3) Next.js 16 scoping.
7. Domain/SSL, monitoring, backups + restore test, Vercel plan, repository visibility (C13, D6, T8, A2a).

## 7. Phase 1 status

| Category | Items |
|---|---|
| **Completed and verified (locally)** | Early Access form and API: validation, abuse controls, honest outcomes, focus and keyboard behaviour. Source handling. Consent kept off. No secrets in bundles or logs. Site launch gates tested (Day 27). **Security patch applied, all local checks pass (today)** |
| **Implemented, still requiring testing** | Everything above on a deployment and on real devices (iPhone Safari, Facebook in-app browser). Storage against NJEN's database. Duplicate behaviour against NJEN's table |
| **Remaining before launch** | Commit and deploy the patch; Preview QA; database step; one verified real registration; export access for NJEN staff; launch gates (domain, monitoring, backups) |
| **Blocked by client action** | §6 items 1–7 |
| **Can follow launch** | Distributed rate limiter; CSP nonce; Next.js 16 if not done first (strongly advised soon: **Next.js 15 security support is expected to end around 21-10-2026, tomorrow**, so 15.5.28 is likely the last 15.x security fix) |

**Not launch-ready:**
- no deployment of the official repository;
- no registration verified in NJEN's database;
- consent, domain, monitoring and backups outstanding.

Progress estimate: unchanged at **14.5 / 32 ≈ 45%**. The patch closes a launch blocker, but it isn't one of the 32 plan items.

## 8. Phase 2 status

**Not started, by design.** The roadmap (`POST_LAUNCH_DEVELOPMENT_ASSESSMENT.md`, Phases A–J: membership and authentication, performer profiles, industry portal, directory, payments and others) is unchanged. No Phase 2 code was written.

## 9. Recommended next action

1. **Developer:** review and commit the patch as its own commit (`package.json` and `package-lock.json`), separate from the documentation if preferred, and push it so the new Preview builds the patched code.
2. **Client:** create the Preview (§5) and run the Supabase inspection (§4). These are independent and can happen in parallel.
3. **Developer, on the Preview link:** run the smoke check and the Preview checklist; confirm the deployed commit is the patched one.
4. **Developer, next independent task:** scope the Next.js 16 upgrade for approval (assessment and isolated trial only), given the end of 15.x support.
