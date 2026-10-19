# NJEN: Day 26 Implementation Report

**Date:** 19-10-2026 · **Starting point:** e824481 - Fix Day 25 Early Access API validation

**Nothing was staged, committed, pushed or deployed.** No change was made to NJEN's Supabase, any Vercel project, environment variable, domain, DNS, billing or permission. `.env.local` was not opened or copied. **No dependency in the repository was changed.** No signup was written to any database.

**Git:** One read-only Git command (git diff --no-index, a file comparison) was run in error; it does not touch the repository.

**Status at a glance:**
- **Local only.** Nothing is verified on a Vercel Preview or in production. No real registration has been stored in NJEN's database.
- **Dependency patch: not applied.** No approval is recorded. It was re-tested in an isolated copy and **passes every check** (§2).
- **Next.js 15 security support ends around 21-10-2026**, two days from now.

---

## 1. Work completed

| Task | Result |
|---|---|
| Early Access review | Re-checked the landing page, form, route and adapter. **No new code defects found.** The Day 25 fixes (timing value required, JSON-only) are present and tested |
| Name / email | Validated in the browser and again on the server (required, ≤120 / ≤254 characters, email format). Covered by the 140 tests and the browser check |
| Consent | Inert by design: `EARLY_ACCESS_CONSENT` is `null` (no approved wording, register B6). No checkbox is shown; the server ignores consent text sent by the browser |
| Success / errors | "You're in" only for `{"status":"stored"}`. Every other answer says "not saved". Verified in the browser for 9 failure types |
| Source attribution | Exercised directly (table below). Works as designed. One campaign-setup gap, not a code defect: see §6 |
| Mobile / accessibility | Browser check at 320–1440 px: layout, labels, 16 px inputs, ≥44 px tap targets, focus handling. Headless Edge emulation only, not a real device |
| Dependency patch | **Not applied** (no approval). Isolated trial at the proposed versions: all checks pass (§2). Recommendation updated with the evidence |
| Supabase preparation | Re-confirmed what the code expects; no inspection results received (§4) |
| Vercel readiness | Re-confirmed the build needs no variables; owner action unchanged (§5) |
| Housekeeping | Found and stopped two local `next start` processes I had left running: one since Day 25 (port 3625) and today's trial (port 3626). The Day 25 report said the server was stopped; only its shell had been. Day 25's results were not affected, because the checks ran before the stop |

**Source attribution**, as computed by `readSignupSource()`:

| Visit | Stored `source` |
|---|---|
| `?utm_source=facebook&utm_medium=paid&fbclid=…` | `facebook` (`fbclid` not stored) |
| No tag, referrer `l.facebook.com` | `l.facebook.com` |
| No tag, referrer `m.facebook.com` | `m.facebook.com` |
| `?utm_source=Facebook Ads` | `Facebook Ads` |
| `?utm_source==HYPERLINK(1)`, Facebook referrer | `l.facebook.com`: the formula is dropped and the referrer is used instead |
| `?utm_source=@cmd`, no referrer | none |
| No tag, no referrer (common in in-app browsers) | **none** |

The server applies the same check again: `-1+1` and a 65-character label are rejected.

## 2. Dependency patch: isolated trial (repository unchanged)

**Approval status:** none found. `docs/NJEN_SECURITY_PATCH_RECOMMENDATION.md` §4 is still unanswered, so `package.json` and `package-lock.json` were **not** changed.

**Trial:** a copy of the repository in a scratch folder, with no `node_modules`, `.next`, `.git` or `.env*`. There I ran `npm ci`, `npm install next@15.5.28 --save-exact` and `npm update sharp source-map-js`.

| | Repository (unchanged) | Isolated trial |
|---|---|---|
| `next` | 15.5.25 | **15.5.28** |
| `sharp` | 0.35.4 | **0.35.5** (libvips 1.3.3 → 1.3.4) |
| `source-map-js` | 1.2.1 | **1.2.2** |
| `package.json` diff | — | `next` line only |
| `npm audit` | 4 packages (1 moderate, 3 high) | **2** (nested `postcss` high; `next` moderate only because it bundles that `postcss`) |
| `npx tsc --noEmit` | pass | pass |
| `npm test` | 140/140 | 140/140 |
| `npm run build` | pass, 23 routes | pass, 23 routes |
| `.next/static` secret scan | 0 | 0 |
| `/_next/image`, both hero images (exercises `sharp`) | — | 200 WebP |
| Live check (unconfigured) | 11/11 | 11/11 |
| Browser check | 41/41 | 41/41 |

The trial build warned about an "inferred workspace root". The cause is a stray package-lock.json in the user's home folder, above the scratch folder. The repository on `D:` doesn't get this warning, so it is not a patch issue.

**No newer release or advisory:** checked 19-10-2026. `next` backport is still 15.5.28 and latest is 16.4.2; no Next.js advisory after 14-10-2026.

## 3. Tests and build (repository, actual results)

All builds were made with `SUPABASE_URL=` and `SUPABASE_SERVICE_ROLE_KEY=` blanked in the shell, so nothing could be stored.

| Command | Result |
|---|---|
| `npm test` | **140 tests, 140 pass, 0 fail**, 12 suites |
| `npx tsc --noEmit` | **Pass** (exit 0) |
| `npm run build` | **Pass**, Next.js 15.5.25, 23 routes |
| Secret scan, `.next/static` | 0 matches |
| `node scripts/early-access-live-check.mjs --mode unconfigured` (fresh `next start`, 127.0.0.1:3625) | **11 passed, 0 failed** |
| `node scripts/early-access-browser-check.mjs` (headless Edge; API mocked in the browser, plus one real-route check) | **41 passed, 0 failed**. Server log scan: 0 names, emails or key text |

**One run was discarded:** the first live check today hit the leftover Day 25 server, because port 3625 was in use. It was re-run against a fresh server from today's build.

**Not run:**
- the configured live check: it writes a row;
- anything against NJEN's database;
- axe or Lighthouse: not installed;
- a real iPhone, the Facebook in-app browser or a screen reader;
- anything on Vercel.

## 4. Supabase: what the code expects, and what is missing

**Expected (verified in code, unchanged):**
- one call, `POST {SUPABASE_URL}/rest/v1/rpc/record_early_access_signup`, with JSON `p_name`, `p_email`, `p_source`, `p_signed_up_at` (server clock) and `p_consent_text`;
- a server-only key on `apikey`, plus `Authorization: Bearer` for legacy JWT keys only;
- an 8-second timeout;
- any 2xx answer = stored; anything else = "not saved".

Detail: `docs/NJEN_SUPABASE_STATUS_AND_COMPATIBILITY.md` §2 and `docs/NJEN_DAY23_EARLY_ACCESS_COMPATIBILITY.md`.

**Simplest safe recommendation (unchanged):** if `early_access_leads` holds real leads, keep it as the single list. Add **one** `security definer` function with that same name and those same five inputs, executable by `service_role` only, writing into it. **No website code change, no new table, no data moved.** If the table turns out to be empty and unused, migration 0002 as tested is the alternative. Either way, the exact SQL is written only after the inspection and applied only after written approval.

**Still missing** (queries in `docs/NJEN_SUPABASE_READ_ONLY_INSPECTION_GUIDE.md`; none received):
- Q0 / D6: is the project active?
- Q1: does the function already exist?
- Q3: `early_access_leads` columns.
- Q4: row count and recent writes.
- Q5 / Q6: is email unique, case-insensitively?
- Q7–Q9: RLS and public-role access.
- Q12 / Q13 / D4: dependents, triggers and webhooks.
- D2 / D3: exposed schemas and key types.
- NJEN's knowledge of what else uses the table.

## 5. Vercel Preview readiness

**Verified locally:**
- `vercel.json` is `{"framework":"nextjs"}`;
- a clean build needs **no** environment variables;
- `/api/health`, security headers and noindex behave as expected on `next start`;
- no credentials in the client bundle.

**Needs the NJEN account owner** (developer has no Vercel permission):
- create one new private project from `NJentertainmentnetwork/njen-website` (`main`), with no variables and no domain, protected on All Deployments (`docs/NJEN_DAY23_NEXT_CLIENT_ACTION.md`);
- importing an organisation repository needs a GitHub organisation Owner, or a Member with repository access (Vercel docs);
- if Vercel refuses the import or build on the Hobby plan (reported in Vercel's community forum for private organisation repositories; not confirmed in the official docs), the team needs Pro, which commercial use requires anyway;
- later: set the two Supabase variables on the official project and redeploy.

Still **not available**: no Preview URL or deployed commit exists.

## 6. New risks or issues

1. **Next.js 15 security support ends around 21-10-2026.** After that, a new Next.js advisory may get no 15.x fix. The patch should be approved now, and a Next.js 16 upgrade scoped next.
2. **The installed `next@15.5.25` still carries the 14 October Critical (image optimisation/SVG) and High (Server Actions) advisories.** The trial shows the patch is low-effort and passes all local checks.
3. **Untagged Facebook links lose attribution.** Facebook and Instagram in-app browsers often send no referrer, and a visit with no `utm_source` and no referrer is stored with an empty source. That's not a code defect. NJEN should always link to `/early-access?utm_source=facebook` (or `instagram`). Optionally add `&utm_campaign=…`, though only `source` is stored today.
4. **Local process hygiene (developer-side only):** stopping a background shell does not stop `next start`. Found and fixed today; servers are now stopped by port.

No new code defect was found.

## 7. Unfinished, and blocked

**Unfinished (developer, once unblocked):**
- apply the patch in the repository (separate commit);
- run `docs/NJEN_DAY24_PREVIEW_QA_CHECKLIST.md` on the Preview;
- write and test the approved database function;
- run `LAUNCH_QA_CHECKLIST.md` §6 on the deployment;
- scope the Next.js 16 upgrade.

**Blocked by client access or approval:**

| Item | Blocked on |
|---|---|
| Dependency patch in the repository | Written approval (recommendation §4) |
| Private Vercel Preview on the official repository | NJEN Vercel owner |
| Storage integration with `early_access_leads` | Inspection results, then written approval of exact SQL |
| Supabase variables on the official project | NJEN (the Developer role cannot set Production variables) |
| One real registration stored and verified in NJEN's database | All of the above |
| Consent checkbox | Approved wording + Privacy Policy URL (B6) |
| Domain, monitoring, backup + restore test, legal pages, Vercel plan, repository visibility | NJEN (C13, D6, T8, B6, plan, A2a) |

## 8. Client actions, in order

1. **Approve the dependency patch** (`docs/NJEN_SECURITY_PATCH_RECOMMENDATION.md` §4, yes/no ×3). It has been tested in isolation; Next.js 15 support ends around 21-10-2026.
2. **Create the private Vercel Preview** (`docs/NJEN_DAY23_NEXT_CLIENT_ACTION.md`) and send back the share link, commit hash and protection screenshot.
3. **Run the read-only Supabase inspection** (guide §5 queries + §7 dashboard checks) and send back the results. No keys, no personal data.
4. **Use tagged links** in every Facebook and Instagram post or ad: `…/early-access?utm_source=facebook` (or `instagram`).
5. When available: consent wording and Privacy Policy URL (B6).

## 9. Recommended next development task

**On approval of item 1:** apply the patch in the repository as its own change. Use exactly the trial commands, then repeat §2's checks there (`npm ls`, audit, typecheck, 140 tests, build, live and browser checks, image optimizer).

**If approval is not received:** prepare the Next.js 16 upgrade assessment for approval: breaking changes that affect this code, and a trial in an isolated copy. Don't apply it.

## 10. Files changed today

| File | Purpose |
|---|---|
| `docs/NJEN_SECURITY_PATCH_RECOMMENDATION.md` | Approval status, isolated 15.5.28 trial evidence, and removal of the stale "five days" wording |
| `DAY26_IMPLEMENTATION_REPORT.md` | This report |

No application code, test, `package.json` or lockfile was changed today.
