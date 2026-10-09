# NJEN — Day 20 Implementation Report

**Date:** 09-10-2026 · **Phase:** Days 18–23, Operations and hardening · **Base commit:** `e532760`

**Nothing in this report was committed, pushed or deployed.** No database, Supabase setting, Vercel setting, DNS record, account or paid service was created or changed. No dependency was upgraded. Git is operated by the developer manually.

---

## 1. Executive summary

- **The Early Access page is built and its whole signup path works locally. It is NOT yet collecting real signups.** No real database write has ever been performed. Every "stored" result in this report came from a **local mock** endpoint.
- **There is a confirmed contract gap between the website and NJEN's Supabase project.** The website calls one database function, `public.record_early_access_signup`, which writes to `app.early_access_signups` (migration 0002). NJEN reports an existing table named **`early_access_leads`**. **Nothing in this repository reads or writes that table.** Until the function exists in NJEN's project, every signup would fail safely: the visitor is told "not saved", and nothing is stored.
- **Fixed today: Supabase's new secret-key format.** Supabase says its new secret keys (`sb_secret_...`) go on the `apikey` header, not `Authorization: Bearer`, and it is retiring the legacy `service_role` key by the end of 2026. The website now sends either key type the documented way. Verified against a local mock only; no live Supabase project was contacted.
- **Supabase Free plan:**
  - It handles the volume.
  - It is not a safe place to run a live campaign: projects can be paused after a week of low activity, and there are **no automatic backups**.
  - **Recommendation:** Free until the authorized test write passes; Pro ($25/month) before traffic is sent. This needs Raphael's approval.
- **Security advisories:** `npm audit` reports 4 vulnerable packages (1 moderate, 3 high), carrying 8 individual advisories.
  - A proposed **patch-level** fix, tested only in an isolated copy, clears **4 of the 8 advisories** (both `next` advisories, `sharp`, `source-map-js`).
  - The 4 PostCSS advisories remain, in the copy of PostCSS that Next.js bundles. No Next.js 15 release fixes them; only a major Next.js 16 upgrade does.
  - The site's exposure is assessed as low, based on each advisory's stated conditions (§5.1).
  - **Nothing was upgraded.**

**Minimum path to verified signup collection** (detail in §2.4):
1. Raphael runs the read-only queries in §3.5.
2. Raphael approves one exact database change.
3. The change is applied, the two variables are set in the official Vercel project, and the site is redeployed.
4. Run tests 1–4 of `LAUNCH_QA_CHECKLIST.md` §6.

---

## 2. Early Access status

### 2.1 Status ladder

| Stage | Status | Evidence |
|---|---|---|
| Page developed (artwork, copy, H1, form) | **DONE** | `app/early-access/page.tsx`; approved artwork used unaltered |
| Form functional locally | **DONE — verified** | Days 19–20, local `next start` |
| API validation functional | **DONE — verified** | 90/90 automated checks (§6.3) |
| Server-side consent enforcement | **DONE — inert** | Verified with dummy wording (Day 19); switched off until B6 wording exists |
| Database adapter implemented | **DONE — verified against a mock only** | Correct endpoint, headers and payload confirmed for legacy-JWT, `sb_secret_` and (misplaced) `sb_publishable_` dummy keys |
| Supabase configured for this website | **NOT VERIFIED — no access** | Raphael reports a project and an `early_access_leads` table; nothing about its schema, RLS, functions or keys has been seen by the developer |
| Real database write verified | **NOT DONE** | Blocked on the database decision (§3) and access |
| Production registration verified | **NOT DONE** | Blocked on the above plus the official Vercel project (D2a) |

### 2.2 What is implemented (verified locally)

| Control | Where | Verified behaviour |
|---|---|---|
| Two fields, name and email | `components/EarlyAccessForm.tsx`, `lib/forms.ts` | Required; email pattern; name ≤ 120 chars; email ≤ 254 |
| Client validation | same | Field errors, focus moves to the first error |
| Server re-validation | `app/api/early-access/route.ts` | Same rules re-run; the browser result is never trusted |
| Honeypot + timing guard | route + `lib/forms.ts` | Filled honeypot or submit in under 900 ms → generic 400 |
| Request-size cap | route | Bodies over 4 KB → 413; malformed JSON → 400 |
| Rate limit | route | 5 per IP per 10 min → 429 on the 6th. **Per server instance**, not site-wide. Keys on the first `X-Forwarded-For` entry, and locally a client-supplied value is honoured. On a host that passes that header through unchanged, the limit can be sidestepped. **How Vercel sets it was not verified** |
| Consent | route + form | Enforced server-side when `EARLY_ACCESS_CONSENT.required`; stores the server's copy of the wording. Off today (B6) |
| Storage adapter | `lib/early-access-store.ts` | 8 s timeout, `no-store`, logs **HTTP status only** |
| Honest outcomes | form + route | Success screen only on `stored` (201). Unconfigured → "Preview only" / "not saved". Failure → "not saved". **Verified** for missing function (404), rejected key (401) and server error (500) |
| NOINDEX | page metadata + `robots.ts` | `noindex, nofollow`; robots disallows all; not in sitemap |
| Open Graph | page metadata | Title and description set. **No image** until a 1200×630 asset and the domain exist (C12, C13) |
| Security headers / CSP | `next.config.ts` | Exact CSP + 4 headers on page, API and 404 (local) |
| Cache headers | route handlers | `/api/health` sends `Cache-Control: no-store`. **`/api/early-access` sends no `Cache-Control` header** (observed locally). It is POST-only and its route is `force-dynamic`, and shared caches do not store POST responses that carry no explicit freshness information. So this is **not a defect**, but adding `no-store` to its `json()` helper would be a one-line hardening. **Not applied**; offered for review |

### 2.3 Incomplete or unverified

- Real database write, duplicate-email behaviour on a real database, deployed behaviour, and production logs.
- Browser console and CSP check in a real browser, iPhone/Safari, keyboard and screen-reader passes on this page. **Not run.**
- Consent wording and Privacy Policy URL (B6).
- Open Graph image (C12) and canonical URL (C13).
- **Legal clearance of the hero artwork.** It shows studio logos and recognisable actor likenesses. No record of usage rights or clearance exists in the repository (C12 asks for an asset inventory with usage rights). This is a client/legal dependency, not a code issue.

### 2.4 Minimum steps to verified signup collection

1. **Raphael:** run the read-only queries in §3.5 in the Supabase SQL Editor and return the output. They return structure and a row count, not lead data.
2. **Developer:** propose one exact SQL change (Option A or B, §3.4) for written approval.
3. **Raphael approves; the change is applied** in the SQL Editor (to a development project first, if one exists).
4. **Raphael confirms which Vercel project is official (D2a)** and sets `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (Production) there. Prefer a `sb_secret_` key.
5. **Deploy once both are in place:** the Day 20 code change (required if a `sb_secret_` key is used) and the two variables. The page is static, so the variables take effect only on a build made after they are set (verified locally).
6. Run `LAUNCH_QA_CHECKLIST.md` §6 tests 1–4 with an NJEN-controlled test address, then delete the test row.
7. **Decide the plan (§4) before sending traffic.**

---

## 3. Supabase compatibility (read-only audit)

### 3.1 What the application expects (verified from source)

| Item | Value |
|---|---|
| Endpoint | `POST {SUPABASE_URL}/rest/v1/rpc/record_early_access_signup` |
| Body (JSON) | `p_name` (text), `p_email` (text), `p_source` (text or null), `p_signed_up_at` (ISO 8601, server clock), `p_consent_text` (text or null) |
| Headers | `Content-Type: application/json`; `apikey: <key>`; plus `Authorization: Bearer <key>` **only** for a legacy JWT key |
| Success | Any 2xx → `stored`. Body ignored |
| Failure | Any non-2xx, network error or 8 s timeout → `error`, visitor told "not saved" |
| Direct table access | **None.** `git grep early_access_leads` → no matches. The app never reads leads |

### 3.2 What migration 0002 provides (from source — not applied anywhere)

- Table `app.early_access_signups`:
  - `id` uuid
  - `name` text, not null, 1–120
  - `email` text, not null, 3–254
  - `signed_up_at` timestamptz, default now()
  - `source` text ≤ 64
  - `consent_text`, `consent_given_at`, `created_at`, `updated_at`
  - unique index on `lower(email)`
- RLS **enabled and forced with no policy**. All table rights are revoked from `public`, `anon` and `authenticated`.
- Function `public.record_early_access_signup(text, text, text, timestamptz, text)`, `security definer` with pinned `search_path`. It trims, caps and lower-cases the email, then upserts on `lower(email)`:
  - a resubmission updates `name` only
  - `consent_text` is kept once given
  - execute is granted to `service_role` only
- Depends on migration 0001, which creates the `app` schema and revokes `anon`/`authenticated` access to it.
- **Design intent:** the `app` schema is **not** exposed through the Supabase Data API. The public function is the only reachable interface. **The application does not need `app` exposed, and it must not be.**

### 3.3 The mismatch

| | Website / 0002 | NJEN's project (as reported) |
|---|---|---|
| Table | `app.early_access_signups` | `early_access_leads` (schema, columns, constraints **unknown**) |
| Write path | RPC `public.record_early_access_signup` | **Unknown** whether any function exists |
| Duplicate rule | One row per lower-cased email | Unknown (needs a unique constraint) |
| Consent | `consent_text` + `consent_given_at` | Unknown |
| Anonymous access | Impossible by design | **Unknown: must be checked.** If `early_access_leads` is in `public` without RLS, anyone holding the project's public key could read it |

**Whether 0001/0002 have ever been applied is unknown.** The repository cannot show live state; query 1 below answers it.

### 3.4 Options (none implemented; each needs Raphael's approval)

| Option | Database change | Code change | Security | Maintenance | When it fits |
|---|---|---|---|---|---|
| **A. Apply 0001 + 0002 as written** | Creates schema `app`, one table, one function | None | Strongest: table hidden from the Data API, RLS forced | A second lead table beside `early_access_leads`; NJEN must know which is live | `early_access_leads` is empty/unused, or NJEN is happy to retire it |
| **B. Adapter function onto `early_access_leads`** *(recommended if the table fits)* | Creates **one function only**, same name and signature as 0002, inserting into the existing table; possibly one unique index on `lower(email)` | None | Good: one service-role-only entry point. Also requires `early_access_leads` to have RLS on and no `anon`/`authenticated` grants or policies | Keeps one lead list; app contract unchanged and already tested | Columns can hold name, email, timestamp, source |
| C. App inserts directly into `early_access_leads` over REST | None, if the table is in an exposed schema | Adapter rewrite (endpoint, column names, duplicate handling) | Weakest of the three: the table must be Data-API-exposed, so RLS becomes its only protection | Column names hard-coded in the app; no DB-side validation | Only if NJEN refuses any database change |
| D. Rename or alter `early_access_leads` | Alters an existing table | Maybe | — | Risks anything else that uses it | **Not recommended** |

**Recommendation:** run §3.5 first. If `early_access_leads` has suitable columns, choose **Option B**: the smallest database change, no new table, no app change, and the already-tested contract. If the table is unsuitable or unused, choose **Option A**. **In either case**, if §3.5 shows `early_access_leads` is readable by `anon`/`authenticated`, that is an existing exposure to fix first (with approval).

**Illustrative shape of Option B. This is NOT a migration and must not be run.** Column names are placeholders until §3.5 returns.

```sql
-- PROPOSAL SKETCH ONLY. Placeholders in <>. Final SQL is sent for approval separately.
create or replace function public.record_early_access_signup(
  p_name text, p_email text, p_source text default null,
  p_signed_up_at timestamptz default now(), p_consent_text text default null
) returns void language plpgsql security definer set search_path = <schema>, pg_temp as $$
begin
  insert into <schema>.early_access_leads (<name_col>, <email_col>, <created_col>, <source_col>)
  values (left(btrim(p_name),120), lower(left(btrim(p_email),254)), coalesce(p_signed_up_at, now()),
          nullif(left(btrim(coalesce(p_source,'')),64),''))
  on conflict (<unique email expression>) do update set <name_col> = excluded.<name_col>;
end $$;
-- + revoke from public/anon/authenticated; grant execute to service_role only (as in 0002).
```

### 3.5 Read-only inspection queries for Raphael

Run in **Supabase → SQL Editor**. Every statement is a `select`. They change nothing, and none returns a name or email. Please send back the output (screenshots or CSV).

```sql
-- 1. Has 0001/0002 been applied? Does the app schema or function exist?
select to_regnamespace('app') as app_schema,
       to_regclass('app.early_access_signups') as signups_table,
       to_regprocedure('public.record_early_access_signup(text,text,text,timestamptz,text)') as rpc;

-- 2. Where does early_access_leads live? (also catches similar names)
select table_schema, table_name, table_type
from information_schema.tables
where table_name ilike '%early_access%' or table_name ilike '%lead%'
order by 1, 2;

-- 3. Its columns
select table_schema, table_name, ordinal_position, column_name, data_type,
       is_nullable, column_default, character_maximum_length
from information_schema.columns
where table_name in ('early_access_leads', 'early_access_signups')
order by table_schema, table_name, ordinal_position;

-- 4. Constraints and indexes (is email unique? case-insensitive?)
select schemaname, tablename, indexname, indexdef
from pg_indexes where tablename in ('early_access_leads', 'early_access_signups');
select conrelid::regclass as table_name, conname, contype, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid::regclass::text ilike '%early_access%';

-- 5. Row level security on/off
select n.nspname as schema, c.relname as table_name,
       c.relrowsecurity as rls_enabled, c.relforcerowsecurity as rls_forced
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where c.relname in ('early_access_leads', 'early_access_signups');

-- 6. RLS policies
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies where tablename in ('early_access_leads', 'early_access_signups');

-- 7. Who holds table privileges (anon/authenticated must hold none)
select grantee, table_schema, table_name, privilege_type
from information_schema.role_table_grants
where table_name in ('early_access_leads', 'early_access_signups')
order by grantee, privilege_type;

-- 8. Any existing early-access functions, and who may execute them
select n.nspname as schema, p.proname, pg_get_function_identity_arguments(p.oid) as args,
       p.prosecdef as security_definer
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where p.proname ilike '%early_access%' or p.proname ilike '%lead%';
select routine_schema, routine_name, grantee, privilege_type
from information_schema.role_routine_grants
where routine_name ilike '%early_access%' or routine_name ilike '%lead%';

-- 9. Triggers on the table (anything else depends on it?)
select event_object_schema, event_object_table, trigger_name, action_timing, event_manipulation
from information_schema.triggers
where event_object_table in ('early_access_leads', 'early_access_signups');

-- 10. How many rows exist (a count only; no personal data)
-- Replace <schema> with the value from query 2.
select count(*) as rows from <schema>.early_access_leads;
```

**Also needed from the dashboard (no SQL):**
- **Project Settings → Data API → Exposed schemas.** Expect `public` and **not** `app`.
- **Project Settings → API Keys.** Which key types exist: legacy `service_role` and/or `sb_secret_`? Send only the *type*, never the key.
- **Billing → plan name.**

### 3.6 Permissions summary

- The website needs **execute on one function** for `service_role`. It needs nothing else: no table grant, no exposed `app` schema, no anon key.
- The service key is read only server-side (no `NEXT_PUBLIC_` prefix). A Day 19/20 scan of `.next/static` found no Supabase variable names or key patterns. Supabase also rejects secret keys sent from a browser with 401 (User-Agent check, per Supabase docs).
- Anonymous clients cannot reach leads through the website: no read endpoint exists. Whether they can reach `early_access_leads` **directly** through the Data API is **unknown** until queries 5–7 return.

---

## 4. Supabase Free plan, pausing and cost

Sources are official Supabase pages, **read 09-10-2026**: [Pricing](https://supabase.com/pricing), [Project pausing](https://supabase.com/docs/guides/platform/free-project-pausing), [Backups](https://supabase.com/docs/guides/platform/backups), [API keys](https://supabase.com/docs/guides/getting-started/api-keys). **NJEN's actual plan and project settings have not been inspected.**

### 4.1 Verified from Supabase's pages

| | Free | Pro |
|---|---|---|
| Price | $0 | from **$25/month** |
| Projects / size | 2 active projects; 500 MB database per project | 8 GB disk included (`INFRASTRUCTURE_AND_COST_ASSESSMENT.md`, 22-09-2026) |
| Pausing | "Free projects are paused after 1 week of inactivity." The docs say a project showing "low activity over a 7-day period" can be paused, and "typically a few user requests to the database each day" is usually enough to avoid it. A warning email comes about one week before, then a confirmation | "Projects on paid plans are not paused for inactivity." |
| Restore after a pause | From the dashboard; returns "to its previous state, including data and configurations." **The window is unclear:** the page text says up to 1 year, while the section anchor says 90 days. Treat it as 90 days until confirmed | n/a |
| Automatic backups | **None documented.** Daily backups are listed for Pro, Team and Enterprise only. Supabase recommends Free projects "regularly export their data" with the CLI `db dump` | **Daily, 7 days retained.** Restoring makes the project inaccessible while it runs |
| Point-in-time recovery | Not available | Add-on: **≈ $100/month per 7 days retained**. Also **requires at least the Small compute add-on** (extra cost, not priced here), and replaces daily backups |
| Spend cap | — | On by default |

### 4.2 What a pause means for Early Access

- While paused, the database function is unreachable. **Every signup fails.** The site tells the visitor it was not saved (verified behaviour for provider errors), so no false confirmation is shown, but **the lead is lost**.
- Pausing is most likely during quiet periods between campaigns, which is exactly when nobody is watching.
- With no automatic backups on Free, an accidental deletion or bad change cannot be undone from Supabase. Only NJEN's own exports would help.

### 4.3 Keep-alive

Supabase's own guidance says activity (API calls or dashboard visits) prevents pausing, and that upgrading removes it. The pages read do not say whether an automated keep-alive is allowed or forbidden (the terms of service were not reviewed). **Not recommended.** It hides the limit without fixing the absence of backups, and it adds a scheduled job to own. **Nothing was scheduled.**

### 4.4 Recommendation (needs approval; no action taken)

| Option | Cost | Risk |
|---|---|---|
| Free, for setup and the authorized test write | $0 | Fine: no live traffic yet |
| **Pro, from the day traffic is sent** *(recommended)* | **$25/month** | No pausing; daily backups (7 days); a real restore test becomes possible |
| Free during the campaign + weekly manual `db dump`/CSV export | $0 + staff time | Pause risk remains; leads since the last export are unprotected |
| Pro + PITR | ≈ $125+/month plus compute add-on | Not justified for a lead list at launch |

**Before upgrading:** confirm the project's current plan and organisation (the Free plan allows only 2 active projects), and that NJEN owns the organisation and billing.

---

## 5. npm / Next.js security advisories

**Local evidence:** `npm audit` / `npm audit --json` against the committed lockfile, 09-10-2026: **4 vulnerable packages** (1 moderate, 3 high) carrying **8 individual advisories**. Installed versions were confirmed with `npm ls`.

**Official references:**
- GitHub Security Advisory pages for the `next`, `sharp` and `source-map-js` items, read 09-10-2026.
- The PostCSS details (titles, ranges, severities) come from npm's advisory data. Their GHSA pages were not opened individually, and **no CVE IDs were retrieved for them**: *requires verification* on each linked GHSA page.
- CVSS scores in the table are the **CVSS v4** values shown on the GHSA pages. `npm audit --json` reports different, older-format scores for the two `next` items (5.3 and 4.8).

| Package | Installed | Direct / transitive | Where it runs | Advisory | Severity | Vulnerable | Fixed in |
|---|---|---|---|---|---|---|---|
| `next` | 15.5.25 | **Direct** | Build + server runtime | [GHSA-4jqv-mc3x-m676](https://github.com/advisories/GHSA-4jqv-mc3x-m676) / CVE-2026-94543: cache poisoning of SSG and ISR pages in self-hosted applications | Moderate (6.3) | ≥15.0.0 <15.5.27; ≥16.0.0 <16.3.8 | **15.5.27** (patch) |
| `next` | 15.5.25 | **Direct** | Build + server runtime | [GHSA-mcj8-r9mp-w47p](https://github.com/advisories/GHSA-mcj8-r9mp-w47p) / CVE-2026-94484: SSG/ISR cache poisoning, cross-user content substitution, persistent DoS | Moderate (6.3) | same | **15.5.27** (patch) |
| `postcss` | 8.4.31 | **Transitive**: nested inside `next` (`node_modules/next/node_modules/postcss`) | Build only | 4 advisories: [GHSA-qx2v-qp2m-jg93](https://github.com/advisories/GHSA-qx2v-qp2m-jg93) XSS via unescaped `</style>` (<8.5.10, moderate); [GHSA-6g55-p6wh-862q](https://github.com/advisories/GHSA-6g55-p6wh-862q) file read via `sourceMappingURL` (≤8.5.11, high); [GHSA-fxqj-rqcc-2cmp](https://github.com/advisories/GHSA-fxqj-rqcc-2cmp) incomplete fix (≤8.5.22, moderate); [GHSA-r28c-9q8g-f849](https://github.com/advisories/GHSA-r28c-9q8g-f849) path traversal (≤8.5.17, high) | **High** (package) | ≤8.5.22 | **No Next 15.x release fixes it.** `next@15.5.27` still pins postcss 8.4.31 (registry metadata). Next 16.3.6–16.4.0 pin 8.5.23 |
| `sharp` | 0.35.4 | **Transitive**: optional dependency of `next` | Server runtime (image optimizer, where `next` performs optimization itself) | [GHSA-wq5f-xc86-pv6w](https://github.com/advisories/GHSA-wq5f-xc86-pv6w): librsvg use-after-free; possible RCE on glibc Linux "when certain runtime-specific conditions apply". The page title cites CVE-2026-96889, but its CVE field reads "No known CVE" (*verify on cve.org*) | High (8.9) | <0.35.5 | **0.35.5** (patch; within `next`'s range, lockfile only) |
| `source-map-js` | 1.2.1 | **Transitive**: via both copies of `postcss` | Build only | [GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q) / CVE-2026-93749: event-loop DoS from crafted indexed source maps | High (8.7) | ≥1.0.0 <1.2.2 | **1.2.2** (patch; in range, lockfile only) |

The project's own direct `postcss@8.5.28` is **not** vulnerable. `npm audit` also lists `next` a second time, as vulnerable *via* its nested PostCSS. That listing is not a separate advisory.

**Correction to npm's own output:** `npm audit` says the PostCSS issue is fixable "via next@15.5.27". The isolated trial (below) shows it is not: after that upgrade, audit then proposes `next@16.4.0`, "a breaking change".

### 5.1 Exposure assessment for this site

"Exposure" below compares each advisory's **stated conditions** with this repository. It is conditional reasoning, not a confirmed test against an exploit. **No vulnerability is resolved:** the installed tree still contains every version listed above.

| Advisory | Conditions stated in the advisory | This site | Assessed exposure |
|---|---|---|---|
| GHSA-4jqv | Pages Router; SSG/ISR; self-hosted. The advisory text (as read 09-10-2026) says: "Applications deployed on Vercel are not affected." | App Router only (no `pages/` directory). Currently served from a Vercel deployment; which Vercel project is official is still open (D2a) | **Conditions not met** as described; patch anyway |
| GHSA-mcj8 | Root-level catch-all page + SSG/ISR routes | No catch-all route exists (`find app -name "*...*"` → none). Deployment scope not stated in the advisory | **Conditions not met** as described; patch anyway |
| PostCSS ×4 | Attacker-controlled CSS or `sourceMappingURL` processed by PostCSS | PostCSS only processes this repository's own `globals.css` at build time | **Low**: no attacker input reaches it |
| sharp | Decoding SVG through librsvg | Optimizer sources are 2 local PNGs. No SVGs in `public/`. `dangerouslyAllowSVG` not set (Next.js refuses to optimise SVG by default). Whether Vercel's hosted optimizer uses this `sharp` was **not verified** | **Low**, but this is a runtime package: **patch** |
| source-map-js | Parsing an attacker-supplied indexed source map | Build-time only, own files | **Low** |

### 5.2 Proposed upgrade plan (APPROVAL REQUIRED, NOT APPLIED)

**Step 1, recommended now (patch-level only):**
```
npm install next@15.5.27 --save-exact
npm update sharp source-map-js
```
- Changes: `package.json` (one line: `next` 15.5.25 → 15.5.27) and `package-lock.json` (next alone: ≈ 52 insertions / 40 deletions; sharp and source-map-js are in-range lockfile updates).
- In the isolated copy, this cleared 4 of the 8 advisories: both `next` advisories, `sharp` and `source-map-js`. **Audit there went from 4 vulnerable packages to 2**: the nested `postcss` (4 advisories), and `next` flagged *via* that PostCSS.
- **Tested in an isolated copy outside the repository** (scratch directory, from `git archive HEAD`). The repository's own `package.json` and lockfile were never touched:
  - `npm ci` ✓
  - `npm run typecheck` ✓
  - `npm run build` ✓ (23 routes)
  - Days 19/20 regression suite **90/90** ✓
  - hero image through the optimizer → 200 `image/webp` ✓ (exercises the new sharp)
- Node.js: `next@15.5.27` requires `^18.18.0 || ^19.8.0 || >= 20.0.0` (unchanged). **`sharp@0.35.5` requires Node ≥ 20.9.0.** Vercel's 20.x/22.x defaults satisfy this; confirm the project isn't pinned to 18.
- **Release notes for 15.5.26/15.5.27 were not reviewed.** Both are patch releases on the 15.5 "backport" line.

**Step 2, decide later: the remaining PostCSS advisory.**
1. Upgrade to **Next.js 16** (major). This clears it but is a scoped task of its own, with full QA. It is not a hardening-day change.
   - Known from registry metadata: `next@16.4.0` requires Node ≥ 20.9.0 and accepts React `^18.2.0 || ^19.0.0` (this project uses React 19.1.0).
   - **Not reviewed:** the Next.js 16 upgrade guide and breaking changes. Any effect on this site's App Router pages, metadata, image handling, `headers()` config or build output is unknown until that review is done.
   - The Day 19/20 regression suite would be the minimum re-test, plus real-browser checks.
2. **Accept and document** the low build-time-only risk until then. *(Recommended for launch.)*
3. An npm `overrides` entry forcing Next's PostCSS to 8.5.28 was **tried in the isolated copy and did not apply cleanly**: an incremental install reported `ELSPROBLEMS` (invalid nested postcss). It would need a lockfile regeneration. **Not recommended.**

**Tests after approval:**
- `npm ci`, `npm run typecheck`, `npm run build`
- the regression suite (§6.3)
- `/_next/image` returns the hero
- on the deployed Preview: browser console free of CSP errors, and `LAUNCH_QA_CHECKLIST.md` §6 tests 12–15 and 20

**Rollback:** revert the single commit (`package.json` + `package-lock.json`). On Vercel, NJEN can promote the previous deployment (a production action, NJEN-performed).

**No `npm audit fix`, `--force`, version change or lockfile regeneration was run in the repository. npm itself was not upgraded.**

---

## 6. Day 20 work completed

### 6.1 Files changed

| File | Change | Why |
|---|---|---|
| `lib/early-access-store.ts` | New `authHeaders()`: keys starting **`sb_secret_`** are sent on `apikey` only. Every other value, including legacy JWT keys, goes on `apikey` + `Authorization` (unchanged behaviour). *Review pass:* the first draft matched any `sb_` prefix, which also caught browser-only `sb_publishable_` keys; narrowed to `sb_secret_` | Supabase's API-key guide: "Send publishable and secret keys on the `apikey` header, not on `Authorization: Bearer`." Legacy keys are being deprecated by the end of 2026, so NJEN's project may offer only the new kind. Without this, the first real signup could fail with a key the docs call correct |
| `ENVIRONMENT_VARIABLES.md` | Corrected: 5 variables are read, not 3; Supabase section rewritten; both key formats; redeploy requirement; "configured ≠ working" table; `vercel.json` **is** present | Doc predated Day 15 and contradicted the code |
| `LAUNCH_QA_CHECKLIST.md` | Corrected the API-routes row (two exist); CSP marked local-only; forms row; new advisory row; **new §6 real-world verification checklist (21 tests)**. *Review pass:* advisory count clarified (packages vs advisories); duplicate-email expectation tied to Option A; `X-Forwarded-For` caveat; appended lines normalised from LF to CRLF to match the rest of the working file | Stale rows; checklist requested |
| `DAY15_EARLY_ACCESS_SUPABASE_SETUP.md` | Day 20 notice at the top: existing `early_access_leads`; do not run Step 2 yet; Free-plan and key-format corrections | Prevents someone following an outdated setup path |
| `db/migrations/README.md` | Added the missing 0002 row; "do not apply without approval" note | Table listed 0001 only |
| `.env.example` | Comment: both key formats; redeploy after setting | Matches the code |

### 6.2 File created

`DAY20_IMPLEMENTATION_REPORT.md` (this file).

### 6.3 Checks run (actual results)

| Check | Result |
|---|---|
| `npm run typecheck` | Pass |
| `npm run build` | Pass, 23 routes, final build made **without** any Supabase variable |
| Regression suite (Day 19 script, `next start`): routes, 404s, old sample-job URLs, CSP and headers, subresource inventory, noindex/robots/sitemap/canonical, internal links, health, Early Access validation, honeypot, timing, body cap, rate limit | **90/90 pass** |
| Adapter vs. mock Supabase, legacy-format dummy key | Headers `apikey` + `Bearer`; success → 201; 404/401/500 → 502 "not saved" |
| Adapter vs. mock Supabase, `sb_secret_` dummy key | Header `apikey` only, **no Bearer**; same outcomes |
| Adapter vs. mock Supabase, `sb_publishable_` dummy key (review pass) | Falls through to `apikey` + `Bearer`, as intended. The mock accepts any key, so **what real Supabase returns for a misplaced publishable key was not tested** |
| `/early-access` consent control | Absent from the rendered page (`EARLY_ACCESS_CONSENT` is `null`), so consent stays inactive |
| Server logs during failures | Only `[early-access] signup store failed: HTTP <status>`. A sentinel email placed in the mock's error body, the test address and the dummy key appeared **0 times** |
| Build-time storage state | Build with variables → no "Preview only"; without → notice. No dummy value found in `.next/static` or `.next/server` |
| Secret scan (working tree diff, `.next/static`) | No key patterns |
| `git diff --check` | Clean |
| **Not run** | Real browser/console, real devices, Safari, screen readers, any real database, the deployed site |

There is no automated test framework in the repository (`package.json` has no `test` script). The regression suite is a scratch script, not committed.

---

## 7. Remaining work and blockers

**Developer-owned (unblocked once inputs arrive):**
- Final Option A/B SQL for approval, after §3.5 results.
- Run §6 checklist tests on the deployed site with NJEN.
- Apply the approved dependency patch (Step 1).
- Sentry wiring once the account exists: `@sentry/nextjs`, `instrumentation.ts`, `instrumentation-client.ts`, a `next.config.ts` wrapper, and CSP `connect-src` (or a tunnel route).
- Plausible: script + CSP `script-src`/`connect-src` (or a same-origin proxy).
- A distributed rate limiter, if traffic justifies it.
- Confirm how Vercel populates `X-Forwarded-For` (Vercel docs, plus a header echo on a Preview deployment), so the rate limit cannot be sidestepped by a client-supplied value.
- Optional: `Cache-Control: no-store` on `/api/early-access` responses (§2.2), if approved.
- Pre-launch secret scan and full QA re-run.

**Client-owned:**

| Item | Status |
|---|---|
| Supabase read-only inspection results (§3.5) and project access | **Needed now**: blocks signup collection |
| Approval of the exact database change (Option A or B) | Needed after §3.5 |
| Official Vercel project (D2a) | Open: variables set on the wrong project have no effect |
| Supabase plan decision (§4) and backup/PITR decision (T8), plus approval for a real restore test | Open |
| Approval of dependency patch (§5.2 Step 1) | Open |
| Consent wording + Privacy Policy URL (B6) | Open |
| Privacy Policy and Terms wording (B6) | Open |
| Contact and abuse-reporting routing (C8) | Open |
| NJEN-owned Sentry account / invite (D6/T7) | Open; not active |
| NJEN-owned Plausible account / invite (D6/T6) | Open; not active |
| Production domain (C13) | Open |
| GitHub repository made private (A2a) | Open since 30-09-2026; not re-verified today |
| Artwork legal clearance: studio logos, actor likenesses (relates to C12, B10) | Open; no clearance recorded |
| Nonce-based CSP decision (Day 18) | Open |

---

## 8. Next steps before launch (in order)

1. Raphael returns §3.5 query results and dashboard facts.
2. Developer sends the exact SQL (Option A or B); Raphael approves in writing.
3. Raphael approves the dependency patch. Developer applies it in **its own** reviewed commit, separate from the Day 20 code and documentation commit, so either can be reverted alone.
4. Raphael confirms the official Vercel project and sets the two variables (Production); redeploy.
5. Run `LAUNCH_QA_CHECKLIST.md` §6 tests 1–4 (real write, duplicate) and delete the test row. **Only then** describe Early Access as collecting signups.
6. Decide the plan: upgrade to Pro before traffic (recommended).
7. Run the remaining §6 tests (headers, console, devices, keyboard, screen reader).
8. Once Sentry and Plausible access exist: wire them, adjust the CSP, send a deliberate test error, confirm analytics sets no cookies.
9. On Pro: perform and document a real restore test.
10. Final pre-launch QA, secret scan, then launch gate (Days 28–30).

---

## 9. Client decisions required (for Raphael)

1. **Run the read-only queries in §3.5** and send the output, plus the exposed schemas, key *types* and plan name.
2. **Is `early_access_leads` the list to keep?** Is anything else (a form, a tool, Zapier) writing to it, and does it already hold real leads?
3. **Approve Option A or B** (§3.4) once the exact SQL is sent.
4. **Supabase plan:** stay on Free for testing, then **Pro ($25/month) before sending traffic**? Yes/no.
5. **Backups:** daily-only on Pro, or PITR (≈ $100/month + compute add-on)? Approve a real restore test?
6. **Approve dependency patch Step 1** (§5.2): `next` 15.5.27, `sharp` 0.35.5, `source-map-js` 1.2.2. Accept the remaining PostCSS item until a Next 16 upgrade?
7. **Which Vercel project is official** (D2a)?
8. **Consent wording and Privacy Policy URL** (B6): needed before collecting consent; is collection without it acceptable to NJEN's counsel?
9. **Artwork rights:** confirm clearance for the studio logos and actor likenesses in the Early Access artwork.
10. **Sentry and Plausible:** create NJEN-owned accounts and invite the developer?
11. **Make the GitHub repository private** (A2a), if not already done.

---

## 10. Change-control confirmation

| Area | Changed? |
|---|---|
| Application code | **Yes, one file:** `lib/early-access-store.ts` (request headers only; prefix narrowed to `sb_secret_` in the review pass) |
| Documentation | Yes: 5 files updated, 1 created (§6.1–6.2) |
| `package.json` / `package-lock.json` / dependencies | **No.** The upgrade trial ran in a scratch copy outside the repository. `npm ci` was run in the repository from the existing lockfile, which reinstalls `node_modules` and changes no tracked file |
| Database / Supabase (tables, schema, functions, migrations, RLS, plan, keys) | **No.** No connection to any Supabase project was made |
| Vercel / production / deployment | **No** |
| DNS / domain / GitHub or account settings | **No** |
| Paid services / new accounts / scheduled jobs | **No** |
| Secrets | None added, logged or committed. Only obvious dummy values were used, in local environment variables for mock tests, and none are in any file |
| Git | Read-only commands only. **No add, commit, push, reset, checkout or clean.** |
