# NJEN: Day 27 Implementation Report

**Date:** 19-10-2026 · **Starting point:** ad2269f - Add Day 26 report and security patch trial results (local `main` = GitHub `main`, working tree clean).

This work was done as **the next day's tasks (Day 27)**, the last day of the plan's **Days 24–27, QA** window.

**Nothing was staged, committed, pushed or deployed.** No change was made to NJEN's Supabase, any database, Vercel, domains, environment variables, permissions or billing. No consent or legal wording was added. `.env.local` was not opened. **`package.json` and `package-lock.json` are unchanged.** The dependency patch is still awaiting written approval and was not applied or re-trialled. No signup was stored anywhere.

**Status at a glance:**
- **Local only.** Nothing is verified on a Preview, in production or on a real device.
- **Not launch-ready** (§7).

---

## 1. Next-day tasks completed

The next unfinished Phase 1 items that need no client input were in the QA window:
- "authorization… abuse tests";
- "broken-link, empty-state… error-state checks";
- preparing the Preview QA so it can run the moment access exists.

**1. Automated tests for the site-wide launch gates.** Until today, the repository's tests covered only Early Access. The rules that keep unfinished or unapproved content off the public site had been checked only by one-off crawls in earlier days, with no test kept in the repository:
- the fail-closed publication gate;
- the section registry and navigation;
- robots.txt and sitemap.xml;
- the health endpoint;
- the security headers and CSP.

The new `tests/site-launch-gates.test.mjs` adds **54 tests** for them.

**2. A read-only smoke check that can run against the Preview.** `docs/NJEN_DAY24_PREVIEW_QA_CHECKLIST.md` said its rows had to be done by hand, because the existing scripts refuse deployed URLs: the live check submits signups.

The new `scripts/site-smoke-check.mjs` runs rows **A3, A4, B1–B8 and C1** automatically:
- protection, health, robots, sitemap;
- noindex, security headers (including HSTS over https);
- hidden sections and probe paths;
- the 404 page, internal and external links, third-party content;
- redirect probes and the "Preview only" notice.

It sends **GET requests only**, never submits the form, and reads the hidden-section list from `lib/sections.ts` so it can't drift. A Vercel share link can be passed to reach a protected Preview. When the link arrives, it is one command.

**Proving the new checks work** (each mutated file was restored byte-for-byte, hash-compared):
- expiry boundary changed from `<=` to `<` → 1 test fails;
- navigation stops filtering hidden sections → 2 fail;
- `object-src 'none'` removed from the CSP → 1 fails;
- robots opened by any non-empty value → 4 fail.

Publishing a hidden section correctly fails **no** test: publishing is a business decision, so the tests check the rules, not today's list. The smoke check itself fails as expected when told to expect a different storage state (39 passed, 1 failed), and rejects bad arguments.

**Defect found and fixed in my own new script before use:** the first run built the redirect-probe URL with `new URL("//evil.example/", base)`, which resolves to **another host**. It tried to request `evil.example`; the DNS lookup failed, so nothing was sent. Paths are now appended to the base as text, and `get()` refuses any URL outside the site under test.

**3. A gap fixed in an existing QA script.** A run of `scripts/early-access-browser-check.mjs` hung today with no output. The script had no overall time limit, so a DevTools call the browser never answered would wait forever and leave a headless browser behind. It now stops after 5 minutes and reports the hang as a failure (§3).

**No defect was found in the application code.** All 54 new tests passed against the existing code, and the mutation runs show that they can fail.

## 2. Code and file changes

| File | Change |
|---|---|
| `tests/site-launch-gates.test.mjs` (new) | 54 tests: publication gate (statuses, case and whitespace, missing status, closed, scheduled, expiry boundary, unusable dates, list filtering), section registry and all three navigations, noindex and canonical rules, robots.txt (only exactly `true` opens it), sitemap (empty until the domain is set; never unpublished sections; no empty jobs or publications), `/api/health` (exact body, no-store, noindex, reveals nothing when storage is set), headers and CSP directive by directive |
| `scripts/site-smoke-check.mjs` (new) | Read-only HTTP smoke check for a local build or the protected Preview (above) |
| `scripts/early-access-browser-check.mjs` | Adds a 5-minute watchdog (override: `NJEN_BROWSER_CHECK_TIMEOUT_MS`). A hang now fails with exit 1 and closes the headless browser instead of waiting forever. No check or expected result changed |
| `tests/support/resolve-hook.mjs` | Maps `next/navigation` the same way it already mapped `next/server`, so the test runner can load `lib/sections.ts`. Test tooling only |
| `docs/NJEN_DAY24_PREVIEW_QA_CHECKLIST.md` | One bullet: which rows the new script covers, and the command |
| `DAY27_IMPLEMENTATION_REPORT.md` (new) | This report |

**No application code changed**: no change under `app/`, `components/`, `lib/`, `data/`, `db/` or `public/`, and no change to `next.config.ts`, `vercel.json`, `package.json` or the lockfile. No design, wording, navigation or business rule changed.

## 3. Tests run and exact results

All builds were made with `SUPABASE_URL=` and `SUPABASE_SERVICE_ROLE_KEY=` set empty in the shell, so storage was off and nothing could be stored.

| Command | Result |
|---|---|
| `node --test tests/site-launch-gates.test.mjs` (via the test loader) | **54 pass, 0 fail** |
| `npm test` | **194 tests, 194 pass, 0 fail**, 18 suites (140 existing + 54 new) |
| `npx tsc --noEmit` | **Pass** (exit 0) |
| `npm run build` | **Pass**, Next.js 15.5.25 |
| Secret scan of `.next/static` | 0 matches |
| `node scripts/site-smoke-check.mjs --base http://127.0.0.1:3627` | **40 passed, 0 failed** |
| `node scripts/early-access-live-check.mjs --mode unconfigured` | **11 passed, 0 failed** |
| `node scripts/early-access-browser-check.mjs` | **41 passed, 0 failed**, run twice: before and after the watchdog change. **One earlier run hung** (below) and was discarded |
| Browser check watchdog, forced to 3 s | Fails as intended: exit 1, "a hang, not a test result"; no headless browser left behind |
| Final regression after all edits | `npm test` 194/194; typecheck pass; smoke check 40/40 |
| Server log scan (test names and emails, key prefixes) | 0 matches |

**The hung run:** the first browser-check run today produced no output for over 20 minutes, while a normal run takes under a minute. It was stopped, and the immediate re-run passed 41/41 in under a minute. The cause was not reproduced. What allowed it is the gap fixed in §2: nothing bounded a DevTools call that never got an answer. Stopping it left two throwaway browser-profile folders in the system temp folder (one from this run, one from earlier the same day); both were removed.

**Not run:**
- the configured live check: it writes a row;
- anything against NJEN's database or on Vercel;
- the smoke check's `--share` path and HSTS check, which need a protected https deployment. They are written but **unverified** until the Preview exists;
- axe or Lighthouse (not installed);
- real devices and screen readers;
- the dependency patch trial, which was not repeated, as instructed.

## 4. Work completed without client input

Everything in §1–§3. No step needed NJEN access, approval, credentials or wording.

## 5. Remaining developer tasks

- **On approval:** apply the dependency patch in the repository and repeat the checks.
- **When the Preview link arrives:** run `scripts/site-smoke-check.mjs` against it, then the manual rows A1–A2 and C2–E of the Preview checklist.
- **After the Supabase inspection:** write the exact SQL, test it on the developer-owned project, hand it over for approval, then run the controlled test signup.
- **Still possible locally, no client input needed:**
  - a performance measurement through the browser's own DevTools metrics (largest contentful paint, bytes per page);
  - forced-colours, reduced-motion and 200% text-zoom checks;
  - a keyboard pass on `/industry`, `/publications` and the 404 page.
- **Scope the Next.js 16 upgrade** for approval. Next.js 15 security support ends around 21-10-2026.

## 6. Client-blocked tasks and the input needed

| Item | Input needed |
|---|---|
| Dependency security patch (`next@15.5.28`, `sharp@0.35.5`, `source-map-js@1.2.2`) | Written yes/no on `docs/NJEN_SECURITY_PATCH_RECOMMENDATION.md` §4 |
| Private Vercel Preview on `NJentertainmentnetwork/njen-website` | NJEN Vercel owner creates it (`docs/NJEN_DAY23_NEXT_CLIENT_ACTION.md`) and sends the share link and commit |
| Storage integration with `early_access_leads` | Read-only inspection results, then written approval of the exact SQL |
| Supabase variables on the official project | NJEN sets them and redeploys |
| One real registration stored and verified in NJEN's database | All of the above |
| Consent checkbox | Approved wording + Privacy Policy URL (B6) |
| Facebook attribution | Campaign links tagged `?utm_source=facebook` (no code needed) |
| Domain/SSL, monitoring, backups + restore test, analytics, legal pages, Vercel plan, repository visibility (still public) | NJEN (C13, D6, T8, B6, plan, A2a) |

## 7. Is the site launch-ready?

**No.**
- No Preview or production deployment of the official repository exists.
- No real registration has been stored in NJEN's database.
- The known Critical/High Next.js advisories are unpatched, pending approval.
- Consent wording, the domain, monitoring and backups are outstanding.

The code passes every local check, which is necessary but not sufficient.

**Progress estimate:** unchanged at **14.5 / 32 ≈ 45%** (method in `docs/NJEN_PHASE1_SCOPE_REVIEW.md` §3). Today strengthens items already scored Partial: authorization tests, and link/error checks. The plan scores those items partial until they're done against the real deployment and database, so no score moves.

## 8. Recommended next development task

**If the Preview link arrives first:** run `node scripts/site-smoke-check.mjs --base <preview> --share "<link>"`, then the manual rows of the Preview checklist on a real iPhone and in the Facebook in-app browser.

**If patch approval arrives first:** apply it in the repository and re-run all of §3.

**If neither:** the local performance and accessibility checks in §5, all dependency-free.
