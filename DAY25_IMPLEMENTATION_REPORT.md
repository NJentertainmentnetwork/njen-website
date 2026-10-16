# NJEN: Day 25 Implementation Report

**Date:** 16-10-2026 · **Baseline:** `1f15825` "Complete Day 24 Early Access accessibility QA" (as given; no Git command was run).

**Nothing was committed, pushed or deployed.** No change was made to NJEN's Supabase, any Vercel project, environment variable, domain, DNS, billing, account or dependency. `.env.local` was not opened. No live signup was written anywhere, including the developer-owned test project.

**Status at a glance:**
- **Two genuine Early Access defects found and fixed** (§1). Tests: 132 → **140**, all pass.
- **Security: the 14 October Next.js update affects the installed `next@15.5.25`.** One Critical and one High advisory. Proposed fix: `next@15.5.28`, awaiting approval (§3).
- **NJEN's Supabase: NOT VERIFIED.** No inspection results received (§4).
- **Vercel Preview: NOT AVAILABLE.** Needs an NJEN owner action (§5).
- **Not launch-ready.** No real registration has been stored in NJEN's database.

---

## 1. Code fixes

Both were confirmed with failing tests **before** the fix. Before the fix, each request below was **stored** (201) by the route.

| # | Defect | Fix (`app/api/early-access/route.ts`) |
|---|---|---|
| 1 | **Timing guard bypassed by leaving the field out.** A request with no `elapsedMs`, or with `"5000"` as a string, skipped the minimum-fill-time check entirely. Only a numeric value was ever checked. | A missing, non-numeric or non-finite `elapsedMs` counts as 0, i.e. "too fast", and gets the existing generic rejection. The real form always sends a number. |
| 2 | **Any `Content-Type` accepted.** A `text/plain` or form body is a "simple" cross-site request, so any other website could make its visitors' browsers post signups, from their IP addresses. That gets around the per-IP rate limit, with no CORS preflight. | Non-`application/json` requests get `415` with the existing form-level "Invalid request." answer. A JSON request from another origin needs a preflight, which the route never approves. |

**Unchanged:**
- wording, design, page and form code;
- the response format the form understands (the 415 body reuses the existing `form` error shape);
- storage code, database contract and dependencies.

**Tests added** (`tests/early-access-route.test.mjs`, 8 new):
- timing value missing, a string, or negative → 400, nothing stored;
- `text/plain`, `text/plain;charset=UTF-8`, form-urlencoded, multipart → 415, nothing stored;
- `application/json; charset=utf-8` still accepted;
- the 415 answer added to the "every rejection reaches the visitor" contract test.

**Checked and found correct (no change):**
- name and email validation, on the client and the server;
- the 4 KB body cap, including chunked bodies;
- honeypot;
- rate limit, with honest 429 wording;
- success shown **only** for `{"status":"stored"}`;
- missing or impossible storage settings give "Preview only" or 503, never success;
- duplicate email: idempotent in migration 0002;
- `source` limited to a safe label shape, so no leading `= + - @`;
- consent inert while `EARLY_ACCESS_CONSENT` is `null`, and the server ignores browser-claimed consent text;
- no credentials in browser bundles or logs;
- keyboard and focus behaviour (Day 24 fixes, re-run below).

**Known and not changed (needs a decision, not a fix):**
- **Names and emails can still begin with `=`, `+`, `-` or `@`.** That is a spreadsheet-formula risk when NJEN opens an export. It is already documented in `docs/NJEN_SUPABASE_STATUS_AND_COMPATIBILITY.md` §6: import the CSV as text, or approve a small export-time change.
- The rate limit is per server instance.

## 2. Commands and actual results

| Command | Result |
|---|---|
| `npm test` (before changes) | 132/132 pass |
| `npm test` with new tests, before fix | **7 fail**, confirming both defects |
| `npm test` (after fix) | **140/140 pass**, 12 suites |
| `npx tsc --noEmit` | Pass (exit 0), before and after |
| `npm run build` (storage variables blanked in the shell) | Pass, 23 routes |
| Secret scan of `.next/static` | 0 matches |
| `node scripts/early-access-live-check.mjs --mode unconfigured` (local `next start`, 127.0.0.1:3625) | **11/11 pass**; nothing can be stored in this mode |
| `curl` probes on the same server | `text/plain` POST → 415; JSON without `elapsedMs` → 400 |
| `node scripts/early-access-browser-check.mjs` (headless Edge, API mocked in-browser) | **41/41 pass**, including the unmocked real-route check. So the real form still passes both new guards |
| Server log scan (test names and emails, key prefixes) | 0 matches |
| `npm audit` (read-only) | 4 packages, 8 advisories (1 moderate, 3 high); see §3 |

**Not run:**
- the configured live check: it writes a row;
- axe and Lighthouse: not installed, and installing them is not permitted;
- anything on a device or a deployment: there is none.

## 3. Dependencies and security advisories

**Installed (lockfile = `node_modules`):**
- `next` 15.5.25;
- nested `postcss` 8.4.31 and `sharp` 0.35.4;
- root `postcss` 8.5.28;
- `source-map-js` 1.2.1.

**14 October 2026 Next.js update** (official blog post and GitHub advisories, read 16-10-2026). Fixed in **15.5.28** / 16.4.1:

| Advisory | Severity | 15.5.25 affected? | This site |
|---|---|---|---|
| GHSA-2464-fhr4-w9xw / CVE-2026-96889: RCE in Image Optimization via SVG (sharp/librsvg, glibc Linux) | **Critical** 9.5 | **Yes** | The site uses the optimizer for its own PNG/JPG; no SVG; `dangerouslyAllowSVG` off; no remote images. The published conditions are not fully specified, so **not treated as low risk** |
| GHSA-p3m5-59mp-jv5r: DoS via Server Actions | High 8.2 | **Yes** | No Server Actions in the code (checked), so not exploitable today |
| GHSA-673q-mjm6-r5xr: RCE via `use cache` | Critical 9.5 | No (16.x only) | n/a |

`npm audit` does not yet list the 14 October Next.js advisories against `next`. It does list:
- the earlier `next` cache-poisoning pair (moderate; conditions not met);
- `sharp` (high);
- `source-map-js` (high);
- 4 nested `postcss` advisories, which are **not fixable on Next.js 15**.

**Proposal (awaiting written approval; nothing applied):** `next@15.5.28` (exact), `sharp@0.35.5` and `source-map-js@1.2.2`, as their own commit.
- **Major upgrade:** avoidable for this patch, but **not for long**. Next.js 15.x is Maintenance LTS, and by the support policy's two-year rule its security support ends around **21-10-2026**, five days from now. A separately scoped Next.js 16 upgrade should follow; it also clears PostCSS.
- **Risks:**
  - `sharp@0.35.5` needs Node ≥ 20.9.0;
  - `next@15.5.28` also accepts the vulnerable `sharp@0.34.x`, so `npm ls sharp` must confirm 0.35.5;
  - not yet re-tested at 15.5.28 in an isolated copy.
- **Tests after approval:**
  - `npm ci`, typecheck, build, `npm test`;
  - live check (unconfigured) and browser check;
  - `/_next/image` returns the hero image;
  - secret scan;
  - Preview console/CSP checks.

Full detail: `docs/NJEN_SECURITY_PATCH_RECOMMENDATION.md` (rewritten today; it previously proposed 15.5.27, now superseded).

## 4. Supabase compatibility (read-only; nothing run against NJEN)

**Known (verified in code):**
- The site calls **one** thing: `POST /rest/v1/rpc/record_early_access_signup` with `p_name`, `p_email`, `p_source`, `p_signed_up_at`, `p_consent_text`.
- It needs a 2xx answer to report "stored".
- Migration 0002 implements that function over `app.early_access_signups`.
- Nothing in the repository reads or writes `early_access_leads`.

**Reported, not verified:** NJEN has a project containing `early_access_leads`, and the project was paused and possibly restored.

**Finding:** the simplest safe option is likely **Option B**: one `security definer` function with **the same name and five inputs**, `service_role`-only, inserting into `early_access_leads`. It needs **no website code change**. It cannot be written yet: its column mapping, duplicate handling and grants depend on facts nobody has seen. No schema was invented. **No inspection results exist in the repository.**

**Missing information** (queries in `docs/NJEN_SUPABASE_READ_ONLY_INSPECTION_GUIDE.md`):

| Query | Answers |
|---|---|
| Q0 / D6 | Is the project active? |
| Q1 | Do migration 0002 and its function already exist? |
| Q3 | `early_access_leads` columns, types, required fields and defaults |
| Q4 | Row count, and whether something still writes to it |
| Q5 / Q6 | Is email unique, case-insensitively? |
| Q9 (with Q7 / Q8) | Can `anon` or `authenticated` read it? If yes, that is an **existing exposure** to report first |
| Q12 / Q13 / D4 | Other dependents, triggers and webhooks |
| D2 / D3 | Exposed schemas, and which key types the project has |

Also needed: NJEN's knowledge of who created the table and what uses it.

Until approved storage is configured, signup stays honest: "Preview only" or "not saved", never "You're in".

## 5. Vercel Preview blocker

**Known:**
- `vercel.json` sets only `framework: nextjs`.
- The build needs **no** environment variables (verified again today).
- The three Vercel projects NJEN has are reported connected to the **old** repository `NJEnetwork/njen-website`.
- No project is confirmed on `NJentertainmentnetwork/njen-website`.
- No Preview URL or deployed commit exists, so **nothing is verified on a deployment.**

**Why the developer cannot do it:**
- Vercel's GitHub documentation (read 16-10-2026) says importing an organization repository needs **Owner**, or **Member with repository access**, of the GitHub organization. Outside collaborators cannot.
- Creating a project in NJEN's Vercel team is an account change that NJEN makes or authorises.

**Owner action:** unchanged. Follow `docs/NJEN_DAY23_NEXT_CLIENT_ACTION.md`:
- create `njen-website-preview` from `NJentertainmentnetwork/njen-website` (`main`);
- add no environment variables and no domain;
- set Deployment Protection to All Deployments;
- send back the share link, commit hash and protection screenshot.

**Possible additional blocker (not confirmed in official docs):**
- Vercel community threads say a **Hobby** team cannot deploy a **private repository owned by a GitHub organization**, and that on Hobby the commit author must be the account owner.
- If the import or build is refused, NJEN's team must be on **Pro**. Pro is also required for commercial use, a separate item already open.
- If the repository is still public, the Day 12 finding applies: it should be made private.

## 6. Phase 1 launch-readiness status

### Completed and verified

Locally, with the evidence named:
- Early Access form and API: validation, body cap, honeypot, timing (**hardened today**), JSON-only, rate limit, honest outcomes, focus and keyboard behaviour. Evidence: 140 tests, 11/11 live check, 41/41 browser check.
- No credentials in browser bundles or logs (scan, 0 matches).
- Campaign `source` cannot carry spreadsheet formulas (tests).
- Build passes with zero environment variables.
- Security headers and CSP (local).
- No demo content.
- Storing to the developer-owned test Supabase project: verified 13-10-2026. This says nothing about NJEN's database.

### Implemented but still requiring testing

- Facebook source attribution: `utm_source`, `source`, `ref` and the referrer host are captured. **Never tested on a deployment or inside the Facebook in-app browser.**
- Duplicate-email behaviour: depends on Option A or B. **Never tested on NJEN's database.**
- Mobile and browser layout: emulation only. Real iPhone Safari, Facebook and Instagram in-app browsers, Android and screen readers are untested.
- Headers, HSTS, noindex, rate limit on Vercel: local only.

### Remaining before launch

Developer, once the blockers clear:
- apply and re-test the approved dependency patch;
- run `docs/NJEN_DAY24_PREVIEW_QA_CHECKLIST.md` A–E on the Preview;
- write, test (dev project) and hand over the approved database function;
- run `LAUNCH_QA_CHECKLIST.md` §6 on the deployment;
- plan the Next.js 16 upgrade (15.x support ending).

### Blocked by client action or approval

| Gate | Blocked on |
|---|---|
| Official Vercel project + private Preview | NJEN owner (§5) |
| Existing Supabase schema confirmed; storage option approved and applied | NJEN inspection, then written approval of exact SQL |
| `SUPABASE_URL` / key set on the official project, then redeploy | NJEN (Developer role can't set Production variables) |
| **One authorised real registration stored and independently verified in NJEN's database** | All of the above |
| Registration export/view for authorised NJEN staff | Supabase SQL Editor export query exists for Option A; Option B's query follows the schema. Staff access is NJEN's decision |
| Consent wording + Privacy Policy URL | NJEN / counsel (B6). The slot stays `null` |
| Dependency security patch | NJEN written approval (§3) |
| Production domain + SSL, monitoring, backup + restore test, analytics, legal pages, Vercel Pro (commercial use), repository private | NJEN (C13, D6, T8, B6, plan, A2a) |

### Can be completed after launch

- Distributed rate limiter.
- CSP nonce (removes `'unsafe-inline'`).
- Automated accessibility scanning in the repository.
- Export-time formula neutralising for names (if NJEN prefers code over "import as text").
- Contact form and CMS-backed sections.
- Next.js 16 if not done before launch. This is strongly recommended soon given 15.x end of support.

**Progress estimate:** unchanged at **14.5 / 32 ≈ 45%** (`docs/NJEN_DAY24_PLAN_TRACKER.md` method). Today's fixes harden items already scored. No gate moves without a deployment, NJEN's database or approval.

## 7. Estimate for an approved live registration test

**Conditional** on, in order:
1. the Preview;
2. NJEN's inspection results;
3. written approval of the SQL;
4. NJEN setting the variables;
5. consent wording, if NJEN requires it before collecting.

| Step | Who | Estimate |
|---|---|---|
| Review inspection results; write Option A/B SQL with reason and undo | Developer | 0.5 day after results arrive |
| Test that SQL on the developer-owned project with a copy of the structure (no real data) | Developer | 0.5 day |
| Approve, apply SQL, set the two variables, redeploy | NJEN | ~30 min of NJEN time, plus their approval turnaround |
| Controlled test signup + count-only verification query + duplicate test + log check + clean-up | Developer and NJEN together | 1–2 hours |

**Developer effort:** about **1–1.5 working days** once inputs arrive. **Calendar time depends entirely on NJEN's turnaround.** If the dependency patch is approved at the same time, add about 0.5 day. If consent is required first, wiring approved wording is under an hour, but obtaining it is NJEN's.

## 8. Phase 2

Unchanged and not started. The post-launch roadmap remains `POST_LAUNCH_DEVELOPMENT_ASSESSMENT.md`, Phases A–J: membership and authentication, performer profiles, the industry portal, the directory, payments, and so on. No Phase 2 code was written today.

## 9. Files changed

- `app/api/early-access/route.ts`: the two fixes (§1).
- `tests/early-access-route.test.mjs`: 8 regression tests.
- `docs/NJEN_SECURITY_PATCH_RECOMMENDATION.md`: rewritten for 15.5.28 and the 14 October advisories.
- `LAUNCH_QA_CHECKLIST.md`: two rows updated (forms hardening, dependency advisories).
- `DAY25_IMPLEMENTATION_REPORT.md`: this report.

**Sources (read 16-10-2026):**
- nextjs.org/blog/nextjs-security-update-october-14-2026
- github.com/vercel/next.js/security/advisories (GHSA-2464-fhr4-w9xw, GHSA-p3m5-59mp-jv5r, GHSA-673q-mjm6-r5xr)
- nextjs.org/support-policy
- endoflife.date/nextjs
- vercel.com/docs/git/vercel-for-github
- community.vercel.com threads on Hobby and organization repositories (unofficial)
