# NJEN: Day 22 Implementation Report

**Date:** 13-10-2026 · **Phase:** Days 18–23, Operations and hardening · **Baseline commit:** `f958f38` "Complete Day 21 Early Access readiness work" (from the session's Git status snapshot; no Git commands were run)

**Nothing was committed, pushed or deployed.** No change was made to NJEN's Supabase project, any Vercel project, environment variable, domain, DNS record, billing setting or dependency.

The only database changes were in the **developer-owned test project**:
- the developer applied migrations 0001 and 0002 there manually;
- the local integration test stored one test row.

**Signup storage status:**
- **Developer-owned test Supabase: VERIFIED (13-10-2026).** A real local signup was stored through `public.record_early_access_signup` into `app.early_access_signups`, confirmed by the count-only query (`rows_for_test_address = 1`, `with_test_source = 1`). Evidence in §3.3.
- **NJEN's Supabase: NOT VERIFIED.** No connection has ever been made and no write has ever been attempted.
- **Vercel preview and production: NOT VERIFIED.** No deployment of the official repository exists.
- **Loom:** not recorded.

---

## 1. Summary

- **New local verification tool:** `scripts/early-access-live-check.mjs` drives a running local build over HTTP. It covers a valid signup, a duplicate, invalid input, oversize (5,000 bytes with a length header; 4,097 bytes chunked) and the 4,096-byte boundary. It has three modes:
  - `configured`: expects 201;
  - `unconfigured`: expects 503;
  - `failure`: expects 502.

  It refuses non-localhost URLs, never reads `.env.local` or any key, and masks the test address. It was validated today in all three modes; the configured and failure modes ran against a **mock** Supabase. The mock results are labelled as mock throughout.
- **Developer-owned Supabase test guide:** `docs/NJEN_DEV_SUPABASE_TEST_SETUP.md`. It covers which migrations to apply and in what order, what each creates, the permissions and RLS they set, platform requirements, a one-query verification, `.env.local` names, the live run, count-only proof of the row, failure and log checks, cleanup and troubleshooting. All three SQL blocks were run in a throwaway PGlite database and return what the guide says.
- **Loom plan:** `docs/NJEN_DAY22_LOOM_DEMO_PLAN.md`. A pre-flight checklist, a 10-shot script, a never-show list and post-recording checks. **Not recorded.**
- **Phase 1 scope review and evidence-based progress:** `docs/NJEN_PHASE1_SCOPE_REVIEW.md`.
- **Vercel mismatch now has independent evidence:** the public URL serves a build from about 29-09-2026 (§5).
- **New conflict found and documented, not changed:** ARCH-1 versus the Early Access function (§6).
- **Client actions:** updated and narrowed in `docs/NJEN_DAY22_CLIENT_ACTIONS.md`.
- **Second pass (same day, after the final Day 22 prompt):**
  - **Setup guide:** new pre-flight in §3, a project-identity check plus a read-only query that stops the migrations if the project looks like NJEN's.
  - **Loom plan:** uses a reserved demo identity (`NJEN Test`, `@example.com`) on camera, so no real name or email appears.
  - **Client actions:** item 6 now covers Preview environment variables (don't share production values).
  - **Tests:** half-configured startups tested; all checks re-run.

---

## 2. Files

**Inspected:**
- **Plans and reports:** `30_DAY_LAUNCH_PLAN.md`, `DAY21_IMPLEMENTATION_REPORT.md`, `DAY15_EARLY_ACCESS_SUPABASE_SETUP.md`, `ENVIRONMENT_VARIABLES.md`, `LAUNCH_QA_CHECKLIST.md`, `WEEK1_CLIENT_INPUT_REGISTER.md`.
- **Database:** `db/migrations/README.md`, `0001_init_app_schema.sql`, `0002_early_access_signups.sql`.
- **Day 21 docs:** all six under `docs/`.
- **Code:** `lib/early-access-store.ts`, `lib/early-access.ts`, `lib/sections.ts`, `lib/publish-gate.ts`, `lib/publications.ts`, `lib/jobs.ts` (excerpts), `lib/forms.ts` (excerpts), `lib/email.ts`, `lib/content-types.ts`.
- **Routes and components:** `app/api/early-access/route.ts`, `app/api/health/route.ts`, `app/early-access/page.tsx`, the `(site)` pages, `components/EarlyAccessForm.tsx`, `components/ContactForm.tsx`, `components/SiteHeader.tsx`.
- **Config:** `package.json`, `tsconfig.json`, `vercel.json`, `.gitignore`, `.env.example`, `.git/config` (read as a file: remote `NJentertainmentnetwork/njen-website`).
- **Framework:** `node_modules/@next/env` (to confirm environment precedence).

**Created:**
| File | Purpose |
|---|---|
| `scripts/early-access-live-check.mjs` | Local-only HTTP verification of the Early Access API (§1) |
| `docs/NJEN_DEV_SUPABASE_TEST_SETUP.md` | Developer-owned test project: setup, verification, live test, cleanup |
| `docs/NJEN_DAY22_LOOM_DEMO_PLAN.md` | Loom checklist and script |
| `docs/NJEN_PHASE1_SCOPE_REVIEW.md` | Area-by-area review, business-rule check, progress calculation |
| `docs/NJEN_DAY22_CLIENT_ACTIONS.md` | Current client actions (supersedes the Day 21 list) |
| `DAY22_IMPLEMENTATION_REPORT.md` | This report |

**Modified (short, dated notes only):**
| File | Change |
|---|---|
| `LAUNCH_QA_CHECKLIST.md` | §6: points to the live-check script and the dev guide; states that a dev-project pass doesn't tick "Deployed" |
| `ENVIRONMENT_VARIABLES.md` | Local `.env.local` note for a developer-owned test project |
| `db/migrations/README.md` | Dev-project application allowed; the ARCH-1 conflict |
| `DAY15_EARLY_ACCESS_SUPABASE_SETUP.md` | Step 5's `select *` shows personal data, so it now points to the count-only query; adds a link to the dev guide |

**Unchanged:**
- all application source (`app/`, `lib/`, `components/`) and `next.config.ts`;
- `package.json`, `package-lock.json` and `.env.example`;
- `.gitignore`, `vercel.json` and both migrations.

No `.env` or `.env.local` was created.

---

## 3. Tests

### 3.1 Local code checks: passed
| Check | Result |
|---|---|
| `npm run typecheck` | Pass |
| `npm run build` (no Supabase variables) | Pass, 23 routes |
| Regression suite (Day 19 script, local `next start`) | **90/90** |

### 3.2 Mocked or isolated tests: passed (not a real database)
| Test | Result |
|---|---|
| Live-check `unconfigured` mode, real local build with no variables | 11/11: "Preview only" shown; valid → 503 `not-configured`; invalid ×5 → 400; 5,000 B → 413; 4,097 B chunked → 413; 4,096 B chunked → accepted (503) |
| Live-check `configured` mode, build pointed at a **mock** PostgREST | 12/12: no "Preview only"; valid → 201; same address in capitals → 201; 400s; 413s; 4,096 B → 201. The mock saw `apikey` with **no Bearer header** for an `sb_secret_` key, all 5 parameters, and 1 distinct address |
| Live-check `failure` mode, **mock** returning 401 for the wrong key | 11/11: valid → 502 `error`, never "stored" |
| Server logs during those runs | Only `[early-access] signup store failed: HTTP 401`. 0 matches for the test address, its domain, `sb_secret` or the dummy key |
| Guard tests | Refuses `https://njen-website.vercel.app`; refuses `configured` mode without `--email`; rejects an unknown mode |
| Dev-guide SQL in PGlite (repository migrations applied, `pgcrypto` line skipped in harness only) | Step 4 on a fresh install returns exactly the documented values. After three service-role stores of one address in mixed case, Step 7 gives 1/1. `anon` calling the function → "permission denied". Step 9 delete → 0/0. A planted `anon` execute grant flips `anon_can_call` to true, so the check catches it |
| Environment precedence | `@next/env` only fills names absent from `process.env`, so the guide's shell override for the failure test works as described |
| Earlier mocked results still valid (code unchanged since Day 21) | Missing function 404 / 500 / 8-second timeout → 502 |
| **Second pass:** half-configured server (only `SUPABASE_URL`, or only the key, set at runtime) | Valid signup → 503 `not-configured` in both cases; 11/11 each. Never attempts a write, never "stored" |
| **Second pass:** guide pre-flight query (new) in PGlite | Fresh database: `has_njen_leads_table = false`, `app_schema_exists = false`, `public_table_count = 0`. Database containing an `early_access_leads` table: `has_njen_leads_table = true`, so the "stop, wrong project" rule fires |
| **Second pass:** all dev-guide SQL re-run after the edit | Same results as above (4 blocks) |

**Second pass, same day:** typecheck pass; build pass (23 routes, no Supabase variables); regression 90/90; live-check `unconfigured` 11/11; server logs 0 matches for keys or addresses.

### 3.3 Developer-owned live Supabase test: **PASSED and write VERIFIED** (sixth and seventh passes below; earlier passes kept as a record)
**Re-checked in the second pass:** `.env.local` still does not exist, and no `SUPABASE_*` variable is set in the shell (variable names checked only; no values read). The test can't run, and no database write is claimed.

**Third pass (13-10-2026, after the developer reported credentials were added):**
- `.env.local` exists in the project root (created 11:12) but is **0 bytes on disk**: no variable names are present. The values were probably not saved.
- `.gitignore` excludes it (`.env`, `.env.*`), and `.env.example` has no uncommented assignments.
- Project identity, migrations, the live check and the count query were therefore **not run**. No connection to any Supabase project was attempted.

**Fourth pass (13-10-2026, after the developer saved `.env.local`):**
- **`.env.local`:** 122 bytes; exactly `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Checked by a script that printed formats only, never values.
- **`SUPABASE_URL`:** `https://<ref>.supabase.co`, with a 20-character ref beginning `nlgo` and ending `dp`. The developer is to confirm the ref matches the intended test project.
- **Key:** a secret key (`sb_secret_`), not a publishable or anon key.
- **Read-only API listing** (`GET /rest/v1/`, OpenAPI; nothing written) → **HTTP 200**, so the key is accepted by this project.
  - **0 exposed functions and 0 exposed tables**, so `record_early_access_signup` is absent and `early_access_leads` is absent.
  - Consistent with a brand-new, empty test project; no sign it is NJEN's project.
- **Migrations 0001/0002 are not applied yet.** Stopped here, as instructed: the developer runs the guide §3 pre-flight query and both migrations in the test project's SQL Editor, then the §4 verification query. Build, live check and count query not yet run.

**Fifth pass (13-10-2026): automated migration runner.**
- **Developer-reported pre-flight results** (SQL Editor, test project): PostgreSQL 17.11, `has_njen_leads_table = false`, `app_schema_exists = false`, `public_table_count = 0`. The project ref was confirmed by the developer in the dashboard.
- **Method chosen:** no SQL client exists locally (no `psql`, Supabase CLI, Docker or `pg` package), and the Data API cannot run SQL. The supported no-install route is the Supabase **Management API** (`/v1/projects/<ref>/database/query`), which needs a personal access token (`SUPABASE_ACCESS_TOKEN`). The secret key cannot be used for it.
- **Created `scripts/setup-dev-supabase.mjs`:**
  - read-only by default; `--apply` to write;
  - every request pinned to `--project-ref`, which must match `SUPABASE_URL`;
  - checks the key against that project;
  - pre-flight refuses projects with `early_access_leads`, public tables or foreign `app` tables;
  - applies 0001, then 0002, only if absent, and refuses a half-applied 0002;
  - verifies after each, using the guide's §4 checks, plus an empty table and the Data API listing;
  - scrubs credentials from all output.
- **Run against the real test project (checks only):**
  - `.env.local` names present;
  - URL ref = `--project-ref` (`nlgo…dp`);
  - secret-key format;
  - key accepted (HTTP 200).
  - It then stopped: **no `SUPABASE_ACCESS_TOKEN` in `.env.local`**, so no SQL was run and **migrations are still not applied**.
- **Guards:** a wrong ref stops with "Nothing was done"; a missing ref stops.
- **Full flow against a mock** (a local stand-in for the Management API backed by in-memory PGlite; the harness copy pointed at localhost; the `pgcrypto` line skipped by the mock only):
  - empty project, `--apply` → both migrations executed and all 17 verification checks pass;
  - re-run → "already applied", verified, nothing re-run;
  - project containing `early_access_leads` → STOP, nothing applied;
  - wrong token → STOP with HTTP 401, 0 credential strings in the output.

  **This is a mock: it doesn't prove the real Management API's behaviour.**
- **Guide updated:** §3 now has Option A (script) and Option B (manual SQL Editor).
- **Still required (developer):** add a short-lived `SUPABASE_ACCESS_TOKEN` to `.env.local` and run the script with `--apply`, or apply manually. The signup test waits for `DATABASE SETUP VERIFIED`.

**Sixth pass (13-10-2026): real local integration test against the developer-owned test project.**
- **Migrations:** applied by the developer manually in the SQL Editor (Option B); no access token was used.
- **Developer-reported §4 verification:**
  - `table_exists`, `function_exists`, `rls_enabled`, `rls_forced`, `security_definer` and `service_role_can_call` all `true`;
  - every `anon`/`authenticated` check `false`;
  - `policy_count = 0`, `row_count = 0`.
- **Re-checked here:**
  - `.env.local` names `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`;
  - no `SUPABASE_*` in the shell;
  - a read-only Data API listing → HTTP 200, `/rpc/record_early_access_signup` listed, `early_access_signups` **not** exposed, no `early_access_leads`.
- **`npm run typecheck`:** pass.
- **`npm run build`:** pass, 23 routes, "Environments: .env.local". 0 Supabase hostnames or `sb_secret_` strings in `.next/static`.
- **`npm run start`, then the live check in `configured` mode → 12/12 passed:**
  - health 200;
  - no "Preview only" notice;
  - valid → **201 stored**;
  - same address in capitals → 201;
  - invalid email, missing name, honeypot, too-fast, malformed JSON → 400;
  - 5,000 B with a length header → 413;
  - 4,097 B chunked → 413;
  - 4,096 B chunked → 201.
- **Test address:** a reserved `example.com` address with no personal data; it isn't recorded here. Source label `dev-test-day22`.
- **Failure mode against the real project:** server restarted with a deliberately wrong key set in the shell, and `failure` mode run → **11/11**. Valid → **502 "error"**, never "stored". Server log: only `[early-access] signup store failed: HTTP 401` (twice). Server then stopped.
- **Log exposure scan** (normal server log, wrong-key server log, build log): 0 matches each for a fragment of the real key, `sb_secret`, the project ref, the test address, `example.com` and the test name.
- At the end of this pass, the stored row was not yet confirmed; the count query followed in the seventh pass.

**Seventh pass (13-10-2026): database write confirmed.**
- The developer ran guide §7's count-only query in the test project's SQL Editor, for the test address.
- Results: **`rows_for_test_address = 1`, `with_test_source = 1`**.
- This confirms three things:
  - the signup was **actually stored** in `app.early_access_signups` through the RPC;
  - the three stores of one address, in different capitalisations, produced **one row** (case-insensitive idempotency);
  - the row carries the `dev-test-day22` source label.
- **The developer-owned test Supabase milestone is VERIFIED.**
- The test row has **not** been deleted. Nothing was deleted automatically.
- **Loom plan reviewed and updated** (`docs/NJEN_DAY22_LOOM_DEMO_PLAN.md`):
  - prerequisites marked met;
  - new §1a with the manual cleanup SQL (a count first, then a delete limited to the test address **and** source `dev-test-day22`);
  - a demo count query for the on-camera address and source `loom-demo`;
  - a server restart before recording, to reset the rate limit.
- **The §1a SQL was checked in PGlite** with decoy rows present: the delete affected exactly 1 row, and a decoy with the same source but a different address survived. The demo query went 0/0 before the signup and 1/1 after a signup plus a capitalised duplicate.
- **Loom status: NOT RECORDED.**

**Blocked on:** the developer creating the test project and `.env.local` (guide Steps 1–5). The one remaining step after that:
1. `npm run build`, then `npm run start`;
2. `node scripts/early-access-live-check.mjs --mode configured --email <your test address>`;
3. the count query in guide §7.

### 3.4 Not run
- `npm run lint`: ESLint isn't installed, and running it would install it.
- `git diff --check` and any Git command: not permitted.
- Real browsers, devices, Safari, keyboard and screen reader: no browser test was performed.
- Lighthouse and performance.

### 3.5 Blocked by missing access
- NJEN's Supabase: inspection and integration.
- Vercel preview: no project on the official repository.
- Production: nothing deployed.

---

## 4. Early Access status

| Milestone | Status |
|---|---|
| 1. Local application | **Passed**, with a mock standing in for Supabase |
| 2. Developer-owned test Supabase | **VERIFIED** 13-10-2026: live check 12/12; wrong-key run 11/11 (502, never "stored"); clean logs; count query 1/1 (§3.3) |
| 3. NJEN's Supabase | **Not verified.** Inspection, the `early_access_leads` explanation and an approved change are needed |
| 4. Vercel preview | **Not verified.** No official-repository project |
| 5. Production | **Not verified** |

**Code review, unchanged since Day 21:**
- Server validation, honeypot and timing guard, and the 4,096-byte cap on bytes actually read.
- Per-IP rate limit of 5 per 10 minutes, **per server instance and not distributed**. A distributed limiter would need a paid or extra service, so it is not proposed now.
- Duplicate handling: idempotent on lowercase email; the first source is kept.
- 8-second timeout; any non-2xx answer → 502 "not saved".
- Key is server-only; logs record the status only.
- Consent stays off until B6.
- `/api/health` doesn't touch the database and is no evidence of storage.

No code change was needed today.

---

## 5. Vercel official-repository mismatch

**Two pieces of evidence:**
- **The screenshot:** all three projects (`njen-website-live`, `njen-website`, `njen-website-production`) show the old repository, `NJEnetwork/njen-website`.
- **A read-only check of `https://njen-website.vercel.app` (13-10-2026, plain GET requests):**
  - `/` 200, `/jobs` 200, `/publications` 200;
  - **`/early-access` 404** (added Day 15) and **`/api/health` 404** (added Day 19);
  - **no `Content-Security-Policy` header** (added in `a16186f`);
  - the homepage reported `Age: 1207480`, so it has been cached for about 14 days, since about 29-09-2026.

**Conclusion:** that URL is not deploying the current official repository. **No evidence exists of any deployment of `NJentertainmentnetwork/njen-website`.**

The repository itself is ready: `vercel.json` is framework-only and no Vercel-specific changes are needed. The fix is an account action by NJEN (client action 1), followed by a preview URL (action 2). **Nothing was changed in Vercel.**

---

## 6. New conflict: ARCH-1 versus the Early Access function (decision needed later, not urgent)

**The two decisions:**
- **ARCH-1 (register T11):** recommends removing `public` from Supabase's exposed schemas, or disabling the Data API, so that future Payload CMS tables in `public` aren't reachable. Migration 0001's closing comment says the same.
- **Day 15 Early Access design:** puts `record_early_access_signup` in `public` precisely *because* `public` is exposed. It is the only reachable entry point.

**Applying both breaks signups:** the website would get 404 and show "not saved".

**Nothing changed.** Day 20's dashboard check already expects `public` exposed and `app` hidden, and the dev guide says to keep it that way.

**Options for when Payload is set up (developer recommendation: option 1):**
1. Configure Payload to use its own schema, such as `payload`, not exposed. Keep `public` exposed, holding only the signup function.
2. Move the function to a small dedicated exposed schema, such as `api`, and drop `public` from the exposed list. This needs a new migration and a one-line code change.
3. Leave both in `public` and rely on RLS for Payload tables. This is the weakest option and not recommended.

**Decision needed:** NJEN's approval, at the Payload setup step. No action today.

---

## 7. Phase 1 progress (method in `docs/NJEN_PHASE1_SCOPE_REVIEW.md` §3)

**Plan coverage: 14.5 of 32 items, about 45%.**
- **Scoring:** each of the 30-day plan's 33 bullets is one item. Done = 1, Partial = 0.5, Blocked or not started = 0. Authentication is excluded because NJEN deferred it (T2).
- **By window:** Days 1–3: 4/5 · Days 4–10: 2.5/5 · Days 11–17: 2.5/5 · Days 18–23: 2.5/6 · Days 24–27: 2.5/5 · Days 28–30: 0.5/6.
- **This is coverage, not effort, and not launch readiness.** By the plan's own definition of done (deployed, monitored and so on), **no item is fully done**, because nothing current is deployed.
- **All 12 zero-scored items wait on NJEN:** Supabase access, the Vercel project, accounts, wording, content or the backup decision.

**Completed and verified locally:**
- section gating and navigation;
- the publication gate;
- jobs pages and filters, with no demo jobs;
- SEO, robots, sitemap and canonical switches;
- CSP and headers;
- error boundaries;
- the health check;
- the Early Access form and API, including validation, size cap, rate limit and honest states;
- the storage adapter (mock, then the developer-owned test Supabase: real write verified 13-10-2026).

**Implemented but unverified:**
- migrations 0001 and 0002 on **NJEN's** Supabase (they are verified only on the developer's own test project);
- everything on a real deployment;
- mobile and accessibility on real devices.

**Remaining development (ours, once unblocked):**
- Payload CMS (collections, staff roles, review workflow, jobs and content connection);
- job intake;
- contact delivery (Resend);
- Sentry and Plausible;
- the backup and restore test;
- the consent switch-on;
- the approved security patch;
- the QA pass;
- the launch gate.

---

## 8. Client-side blockers

See `docs/NJEN_DAY22_CLIENT_ACTIONS.md`. In priority order:
1. Vercel project on the official repository.
2. A preview URL.
3. The Supabase read-only inspection.
4. `early_access_leads` explained.
5. Approval of one database change.
6. NJEN sets the two variables and redeploys.
7. Consent wording and Privacy Policy URL.
8. The patch decision.
9. Free or Pro.
10. Access.
11. Launch scope (X3).
12. The Payload go-ahead.

Plus outstanding content items (C1–C15).

**Security and approval requirements unchanged:**
- no database change, dependency update, Next.js 16 upgrade, paid service, or Vercel, DNS or domain change without written approval;
- secrets never sent by chat or email.

---

## 9. Launch target (conditional; not a commitment)

**Basis:**
- **Day numbering:** Day 20 = 09-10, Day 21 = 12-10, Day 22 = 13-10 (working days). On that count, the plan's nominal Day 30 is **Friday 23-10-2026**.

**Early Access landing page only (Facebook-ready):**
- **Needs:** client actions 1, 3–6, plus a consent decision (7, or counsel's go-ahead without it).
- **Our side:** about 2 working days after the inspection results arrive: proposal, verification run, controlled test. NJEN's approval and settings time comes on top of that.
- **When:** if those arrive by about **16-10-2026**, a verified Early Access page **can still land within the nominal Day 30**.

**Full Phase 1 to the plan's definition of done:**
- **Not achievable by 23-10-2026.** The CMS can't start until NJEN's database exists.
- **Planning estimate, developer judgement, from receipt of Supabase access plus the Payload go-ahead:**
  - CMS, roles, workflow and content connection: about 8–10 working days;
  - monitoring, analytics and backup: about 2–3 working days, in parallel if the accounts exist;
  - QA: 4 working days;
  - launch gate: 3 working days.
  - **In total: roughly 15–20 working days.**
- **Example:** if access arrives by 20-10-2026, the earliest realistic window is **mid-to-late November 2026**.
- **This assumes** content, legal wording (B6) and the domain (C13) arrive in that window. A smaller launch scope (X3) would shorten it.

---

## 10. Next steps (30-day plan order)

**Developer, now (no approval needed):**
- Create the test project.
- Run the dev guide, then record the Loom.
- On a preview URL once one exists: browser, keyboard and screen-reader QA (Days 24–27).
- Draft the database proposal when inspection results arrive.

**NJEN:** actions 1–4 first.

**After approvals:**
- apply the patch as its own commit;
- NJEN applies the database change and sets the variables;
- the controlled deployed test (`LAUNCH_QA_CHECKLIST.md` §6);
- the CMS build;
- operations accounts;
- QA;
- the launch gate.

---

## 11. Change-control confirmation

| Area | Changed? |
|---|---|
| Application code | **No.** One new standalone dev script under `scripts/`; nothing imports it, and it isn't part of the build |
| Documentation | 5 created, 4 modified (§2) |
| Dependencies / lockfile / `package.json` | **No** |
| `.env.example`, `.env.local`, `.env` | **No.** None created or edited |
| Supabase (any project) | **No.** No connection made. PGlite (in-memory, scratch folder) only |
| Vercel / DNS / domains / billing | **No.** Only read-only GET requests to the public URL |
| Git | **One deviation:** in the second pass, a shell line included `git --version`. It only prints the installed Git version: it read no repository data and changed nothing. It shouldn't have been run, and it is recorded here for transparency. No other Git command, commit, push or deployment |
| Secrets | None used except obvious local dummy values in shell variables for mock runs. None written to any file |
