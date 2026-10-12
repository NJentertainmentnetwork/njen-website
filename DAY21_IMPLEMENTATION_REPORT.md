# NJEN — Day 21 Implementation Report

**Date:** 12-10-2026 · **Phase:** Days 18–23, Operations and hardening · **Baseline commit:** `e41b4f2` (read from `.git/HEAD` and `refs/heads/main`; no Git commands were run)

**Nothing was committed, pushed or deployed.** No Supabase project, database, Vercel project, environment variable, domain, billing setting or dependency was changed.

**Real email collection: NOT VERIFIED.** No signup has ever been written to NJEN's database. Every "stored" result below comes from a local mock endpoint or a throwaway in-memory database on the developer's machine.

---

## 1. Summary

- **Fixed a real defect:** the Early Access API's 4 KB request limit could be bypassed by sending the body in chunks without a `Content-Length` header. The full body was then read and parsed. The limit is now enforced on the bytes actually read.
- **Created a tested, client-friendly read-only Supabase inspection guide.** Every query was executed against a throwaway PostgreSQL (PGlite) seeded with the repository's migrations and a stand-in `early_access_leads` table. All ran; none returned personal data.
- **Created** the compatibility report, deployment readiness checklist, data-protection and access guide, security patch recommendation and client action list (all under `docs/`).
- **Resolved three open questions from Day 20 using official sources:**
  - Vercel overwrites `X-Forwarded-For`, so visitors cannot fake the rate-limit key.
  - The four PostCSS CVE IDs are now verified.
  - The sharp CVE discrepancy is explained: the CVE belongs to the upstream library, librsvg, not to sharp itself.
- **Found new access constraints that shape the client questions:**
  - Vercel's Hobby plan cannot add team members.
  - Vercel's Developer role cannot set Production variables.
  - Supabase's only SELECT-only role requires its Team plan.

---

## 2. Files inspected

**Docs:**
- `30_DAY_LAUNCH_PLAN.md`
- `DAY12_VERCEL_REVIEW.md`
- `DAY15_EARLY_ACCESS_SUPABASE_SETUP.md`
- `DAY20_IMPLEMENTATION_REPORT.md`
- `ENVIRONMENT_VARIABLES.md`
- `LAUNCH_QA_CHECKLIST.md`
- `db/migrations/README.md`
- `.env.example`

**Code:**
- `app/early-access/page.tsx`
- `app/api/early-access/route.ts`
- `app/api/health/route.ts`
- `components/EarlyAccessForm.tsx`
- `lib/early-access.ts`
- `lib/early-access-store.ts`
- `lib/forms.ts`
- `db/migrations/0001_init_app_schema.sql`
- `db/migrations/0002_early_access_signups.sql`
- `next.config.ts`, `vercel.json`, `package.json`, the dependency tree (`npm ls`)

**Test conventions:** there is no test framework. `package.json` has no `test` script. A `lint` script (`next lint`) exists, but ESLint is not installed or configured (see §8).

---

## 3. Files created or modified

| File | Type | Purpose |
|---|---|---|
| `app/api/early-access/route.ts` | **Code, modified** | New `readCappedBody()`: reads the request stream and returns 413 as soon as it exceeds 4,096 bytes. Replaces `request.json()`. The existing `Content-Length` fast-path is kept |
| `docs/NJEN_SUPABASE_READ_ONLY_INSPECTION_GUIDE.md` | New | Step-by-step guide plus 15 tested read-only queries and 2 optional follow-ups; replaces Day 20 §3.5 |
| `docs/NJEN_SUPABASE_STATUS_AND_COMPATIBILITY.md` | New | Evidence-tagged status, data flow, mismatch, decision table, options |
| `docs/NJEN_EARLY_ACCESS_DEPLOYMENT_READINESS.md` | New | Variables, finding the official Vercel project, deployment checks, controlled test signup (SQL tested) |
| `docs/NJEN_SUPABASE_DATA_PROTECTION_AND_ACCESS.md` | New | Pause/plan facts, export vs backup vs restore test, preserving data, access roles, key handling |
| `docs/NJEN_SECURITY_PATCH_RECOMMENDATION.md` | New | Separate approval document for the patch; PostCSS treated separately |
| `docs/NJEN_DAY21_CLIENT_ACTIONS.md` | New | 11 prioritised client actions and decisions |
| `DAY21_IMPLEMENTATION_REPORT.md` | New | This report |
| `LAUNCH_QA_CHECKLIST.md` | Modified | Forms row: body cap now enforced on bytes read. §6 test 8: Vercel `X-Forwarded-For` behaviour per Vercel docs |
| `DAY20_IMPLEMENTATION_REPORT.md` | Modified | One note: §3.5 is superseded by the new guide (the Day 20 queries are kept as record) |

`docs/` did not exist before. It was created for the client-facing guides named in the Day 21 brief, and day reports stay at the root as before. `package.json`, `package-lock.json`, `.env.example`, migrations and all other source files are **unchanged**.

---

## 4. Early Access code review

| Area | Finding |
|---|---|
| Form fields / payload | Sends `name`, `email`, `source`, `company` (honeypot), `elapsedMs`, `consent`. Correct |
| Validation | Server re-runs the shared rules: required fields, name ≤ 120, email ≤ 254 and format. Correct |
| Honeypot / timing | Generic 400 on either. `elapsedMs` is client-supplied, so the timing check only stops naive bots, as designed |
| **Request size** | **Defect, fixed.** Before: a 200 KB chunked body was accepted and parsed (reached the 503 `not-configured` answer). After: 413. The boundary holds at 4,096 bytes (accepted) and 4,097 bytes (rejected), chunked or not |
| Malformed bodies | Bad JSON → 400; empty body → 400. A JSON array is treated as an object with missing fields → 400 field errors. Harmless; left as is |
| Rate limit | 5 per IP per 10 min, in memory, per server instance. Vercel overwrites `X-Forwarded-For` (Vercel docs), so the key comes from Vercel, not the visitor |
| Consent | `EARLY_ACCESS_CONSENT` is `null`, so no checkbox is shown and nothing is enforced. The server enforcement (Day 19) is ready for approved wording |
| Environment detection | Storage is on only when both variables are set. The page's notice is fixed at build time, so a **redeploy** is required after setting variables |
| Auth headers | `sb_secret_…` → `apikey` only; anything else → `apikey` + `Bearer`. Matches Supabase's documentation |
| RPC / parameters | `/rest/v1/rpc/record_early_access_signup` with `p_name`, `p_email`, `p_source`, `p_signed_up_at`, `p_consent_text`. **These match migration 0002's function signature**, confirmed by calling it in PGlite |
| Failures / timeout | 404, 401, 500 and an 8-second hang all give 502 "not saved" (re-verified Day 21) |
| Duplicate email | The database function makes resubmission idempotent: one row per case-insensitive email, name updated, first `source` kept (PGlite). The UI shows "You're in" both times |
| False success | Not possible: "You're in" only follows a 2xx from the database |
| Leakage | Logs: status code only. A sentinel string, the test email, the source and the dummy key appeared 0 times. Responses never include provider text |
| Export risk (new note) | Names starting `=`, `+`, `-`, `@` could act as spreadsheet formulas when NJEN opens an exported CSV. Documented with a workaround; **no code change** (it would alter accepted input, so it is a product decision) |

---

## 5. Supabase status

| Item | Status |
|---|---|
| Project restored and active | **Unknown.** NJEN could not confirm |
| `early_access_leads` | **Reported, not verified.** Nothing in the repository uses it |
| Migrations 0001/0002 applied there | **Unknown** |
| Expected function exists there | **Unknown.** If absent, signups fail safely with 404 → "not saved" |
| Compatibility of the existing table | **Unknown** until guide queries 2–13 return |
| Migrations themselves | **Apply cleanly to PostgreSQL** (PGlite; the `pgcrypto` extension line was skipped, and the migration marks it optional on PostgreSQL 13+). Not tested on Supabase |

The decision table and options are in `docs/NJEN_SUPABASE_STATUS_AND_COMPATIBILITY.md` §5. No database change is proposed until the inspection results exist.

---

## 6. Deployment and environment

- **All three Vercel projects are reported connected to the old repository `NJEnetwork/njen-website`.** No project is confirmed for `NJentertainmentnetwork/njen-website`, which makes this the first deployment blocker.
- `njen-website-live` showed no project-level variables. The other two are unchecked.
- **Required variables:** `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (secret), set in Production by NJEN, followed by a redeploy. The developer does not need to see the key.
- **The health endpoint never contacts Supabase.** Only a real test signup proves storage works (deployment doc §4–5).
- `vercel.json` (framework only) and `next.config.ts` are unchanged and need nothing for Early Access.
- **Not checked:** Vercel's maximum function duration versus the 8-second storage timeout.

---

## 7. Security recommendations

- **Dependency patch:** `next` 15.5.27, `sharp` 0.35.5 and `source-map-js` 1.2.2 are still the current fixed versions (registry, 12-10-2026). Approval is requested as a separate change; nothing has been applied.
- **PostCSS:** 4 advisories, CVE IDs now verified. They cannot be fixed on Next.js 15. Next.js 16 is on hold. The recommendation is to accept them as a documented low build-time risk.
- **Advisory counts:** unchanged at 4 vulnerable packages and 8 advisories.

Detail is in `docs/NJEN_SECURITY_PATCH_RECOMMENDATION.md`.

---

## 8. Tests executed (actual results)

| Test | Result |
|---|---|
| `npm run typecheck` | Pass |
| `npm run build` | Pass. 23 entries in the route table; built with no Supabase variables |
| Regression suite (Day 19 script, local `next start`) | **90/90 pass** after the fix |
| Body cap: 200 KB chunked / 200 KB with length / 4,096 chunked / 4,097 chunked / 150 B chunked | 413 / 413 / accepted / 413 / accepted |
| Malformed JSON / empty body / JSON array | 400 / 400 / 400 |
| Mock Supabase (`sb_secret_` dummy key): success, duplicate, 404, 401, 500, no answer | 201, 201, 502, 502, 502, 502 after 8 s. `apikey` only, no Bearer; all 5 parameters sent |
| Server logs during those tests | Only status / "network or timeout" lines; 0 hits for test email, source, sentinel or key |
| Inspection guide SQL (17 blocks) in PGlite | 16 ran. The one error was the optional migration-history query, which is expected when that table is absent (the guide runs it only if query 1 shows the table). No personal data in any output. Query 9 caught a deliberately planted public read grant; query 12 caught a planted dependent view |
| Deployment-doc verification + cleanup SQL in PGlite | 1 row after a duplicate in different capitals, `source` kept; 0 rows after the delete |
| `npm audit` (read-only) | 4 packages, 8 advisories, unchanged |
| **Not run** | `npm run lint` (ESLint isn't installed; `next lint` would try to install it, which is a dependency change); real browsers, devices, Safari, screen readers; any Supabase project; any Vercel deployment; `git diff --check` (no Git commands, per instruction) |

PGlite 0.2.17 was installed only in a scratch folder outside the repository and is not a project dependency.

---

## 9. Blocked work

| Blocked on | Unblocks |
|---|---|
| Supabase active + inspection results + knowledge of `early_access_leads` | Choosing "no change" / Option A / Option B |
| Written approval of that specific change | Applying it (NJEN or the developer, as agreed) |
| Vercel project on the official repository | Any deployment of the current code |
| NJEN setting the two variables and redeploying | Turning storage on |
| Consent wording + Privacy Policy URL (B6) | Consent checkbox; counsel's view on collecting without it |
| Patch approval | Dependency update commit |
| Plan and seat decisions | Pro/backups; developer access to logs |

---

## 10. Outstanding risks

1. **No real write has ever been verified.** Collection must not be announced until it is.
2. The existing `early_access_leads` table may already be **publicly readable** if its RLS or grants are loose. Unknown until queries 7–9 run, and urgent if so.
3. Pausing on the Free plan loses leads during the pause. There are no automatic backups on Free.
4. Pushes to the official repository may not deploy anywhere today.
5. The per-instance rate limit is looser under load.
6. Formula injection in exported CSVs (documented workaround).
7. PostCSS advisories remain open until a Next.js 16 decision.

---

## 11. Recommended next actions (priority order)

1. **NJEN:** confirm the project is active and run the inspection guide (client actions 1–3).
2. **NJEN:** identify or connect the Vercel project for the official repository (actions 4–5).
3. **Developer:** turn the results into one exact proposal (SQL, reason, impact, undo) for written approval.
4. **NJEN:** set the variables and redeploy. Run the controlled test signup (deployment doc §5) and delete the test row.
5. **NJEN:** decide on the patch, the plan and seats, and consent wording.
6. Continue the roadmap: QA phase (Days 24–27: real devices, keyboard, screen reader, full `LAUNCH_QA_CHECKLIST.md` §6), then the launch gate (Days 28–30).

**Can be done next without approval:**
- reviewing the inspection results when they arrive and drafting the proposal;
- a browser-based console and CSP check of the local build;
- keyboard testing of the local page;
- re-running the test suite after any change.

---

## 12. Still within the 30-day launch

- Verified signup collection.
- Operations hardening: monitoring and analytics once accounts exist, plus the backup and restore test (Days 18–23).
- QA (Days 24–27).
- Launch gate (Days 28–30).

Nothing new was added to launch scope today.

---

## 13. Change-control confirmation

| Area | Changed? |
|---|---|
| Application code | **Yes, one file:** `app/api/early-access/route.ts` (request-size enforcement). Database contract unchanged |
| Documentation | 7 files created, 2 modified (§3) |
| Dependencies / lockfile | **No** |
| Supabase (project, schema, tables, functions, RLS, grants, data, plan) | **No.** No connection was made |
| Vercel (projects, variables, domains, settings, deployments) | **No** |
| DNS, GitHub settings, billing, seats, paid services | **No** |
| Secrets | None used except obvious local dummy values in environment variables for mock tests. None written to any file |
| Git | **No Git commands run.** The baseline was read from `.git/HEAD` and `.git/refs/heads/main` |
