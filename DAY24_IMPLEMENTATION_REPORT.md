# NJEN: Day 24 Implementation Report

**Date:** 15-10-2026 · **Phase:** Days 24–27, QA (day 1 of 4) · **Baseline:** `cc29593` "Complete Day 23 Early Access hardening and tests". This was `cf3bff7` until 15-10-2026, when the author name on the 8–14 October commits was corrected to Viral, at the developer's request. The content is identical; only the commit IDs changed. No other Git command was run for the Day 24 QA work.

**Nothing was committed, pushed or deployed.** No change was made to NJEN's Supabase project, any Vercel project, environment variable, domain, DNS record, billing setting, GitHub setting or dependency. The developer-owned test Supabase project was not touched. `.env.local` was not opened or read.

**Status at a glance:**
- **Day 24 is locally complete only.** Everything that can be checked on the developer's machine was checked. Real-device, screen-reader and deployed checks wait for the Preview URL.
- **NJEN's Supabase: NOT VERIFIED.** No production signup has ever been saved.
- **Vercel Preview: NOT AVAILABLE.**

---

## 1. Executive summary

- The three required checks pass: `npm test` (**132/132**, up from 126), `npx tsc --noEmit` and `npm run build`.
- A real-browser QA pass (headless Microsoft Edge, already installed) found **three genuine defects**, all in the Early Access form's keyboard and screen-reader behaviour:
  1. When the **server** flagged a field (for example the email), the error was shown, but focus did not move to the field. It stayed on the page body.
  2. After **every** server answer (success, "not saved", rate limit, error, network failure), keyboard focus was lost to the page body. The next Tab started again from the top of the page.
  3. An unexpected error field from the server could put keyboard focus **inside the hidden anti-spam field**.
- All three are fixed with small changes:
  - no change to design, wording, layout, business rules, architecture or database behaviour;
  - one CSS rule, which hides a focus ring on a heading that is not a control.
- The fixes are covered by:
  - 6 new automated tests;
  - a new dependency-free browser check, `scripts/early-access-browser-check.mjs`, which passes **41/41**. With the old code put back, **13** of its checks fail.
- No regressions found in links, routes, hidden content, robots/noindex, security headers, CSP, logs or secret handling.
- Progress stays at **14.5 / 32 ≈ 45%**. Nothing is re-scored upward without a deployment or a real device.

---

## 2. Day 24 requirements from `30_DAY_LAUNCH_PLAN.md`

The plan has no single "Day 24" entry. Day 24 opens the **Days 24–27, QA** window, which lists:

1. iPhone-first device testing and responsive browser testing.
2. Keyboard/screen-reader/accessibility review against WCAG 2.2 AA target.
3. Authorization/RLS abuse tests and cross-account access tests.
4. Broken-link, empty-state, form-validation, error-state and performance checks.
5. Content review: no demo jobs represented as live jobs.

Also binding: the plan's definition of done ("deployed, responsive, accessible to the agreed target, validated…"), and `LAUNCH_QA_CHECKLIST.md` §1 and §6.

Today covered the parts of items 1, 2, 4 and 5 that can be done locally. Item 3 was re-confirmed only for public routes (§9); RLS needs NJEN's project.

---

## 3. Files inspected

**Plan and evidence:**
- `30_DAY_LAUNCH_PLAN.md`
- `DAY23_IMPLEMENTATION_REPORT.md`
- `docs/NJEN_DAY23_PLAN_TRACKER.md`
- `docs/NJEN_DAY23_EARLY_ACCESS_COMPATIBILITY.md`
- `docs/NJEN_DAY23_VERCEL_PREVIEW_READINESS.md`
- `docs/NJEN_DAY23_NEXT_CLIENT_ACTION.md`
- `LAUNCH_QA_CHECKLIST.md`
- `docs/NJEN_PHASE1_SCOPE_REVIEW.md` §3 (scoring method)

All named documents exist.

**Read in part:**
- `docs/NJEN_EARLY_ACCESS_DEPLOYMENT_READINESS.md`, `docs/NJEN_SUPABASE_READ_ONLY_INSPECTION_GUIDE.md`: as referenced from the Day 23 documents; no change needed.

**Code:**
- `components/EarlyAccessForm.tsx`
- `lib/early-access.ts`
- `lib/early-access-store.ts`
- `lib/forms.ts`
- `app/api/early-access/route.ts`
- `app/early-access/page.tsx`
- `app/(site)/layout.tsx`
- `components/SiteHeader.tsx`
- `lib/sections.ts`
- `lib/publish-gate.ts`
- `lib/jobs.ts` (sample-data flag)
- `app/globals.css` (Early Access and focus rules)
- `package.json`
- `tests/early-access-logic.test.mjs`
- `tests/early-access-route.test.mjs`
- `scripts/early-access-live-check.mjs`

---

## 4. Commands run and exact results

All runs were local. The production build was made with `SUPABASE_URL=` and `SUPABASE_SERVICE_ROLE_KEY=` blanked in the shell, so storage was **unconfigured** and nothing could be stored.

| # | Command / check | Result |
|---|---|---|
| 1 | `npm test` (before changes) | **126 tests, 126 pass, 0 fail**, 12 suites, 8.4 s |
| 2 | `npx tsc --noEmit` (before changes) | Pass, exit 0 |
| 3 | `npm run build` (before changes) | Pass, 23 routes |
| 4 | Secret scan of `.next/static` (`sb_secret_`, `sb_publishable_`, `service_role`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, JWT prefix) | 0 matches |
| 5 | Local crawl (scratch script, local only): every internal link, hidden routes, API methods, headers, robots, sitemap, redirect probes | 0 broken links, 0 external links, 0 missing in-page targets; all 19 hidden/probe paths 404 with noindex (§9) |
| 6 | Headless Edge sweep: 7 pages × 6 widths, keyboard pass, 20 mocked server answers | **Found the defects in §5** |
| 7 | `npm test` (after fixes) | **132 tests, 132 pass, 0 fail**, 12 suites, 8.4 s |
| 8 | `npx tsc --noEmit` (after fixes) | Pass, exit 0 |
| 9 | Mutation: new error-field guard disabled, then the file restored byte-for-byte (hash compared) | **4 tests fail**, as expected |
| 10 | `npm run build` (after fixes) | Pass, 23 routes; secret scan 0 matches |
| 11 | `node scripts/early-access-browser-check.mjs --base http://127.0.0.1:3624` | **41 passed, 0 failed** |
| 12 | Mutation: old focus code put back and rebuilt, browser check run, file restored byte-for-byte, rebuilt | **13 checks fail**, all "focus … (body)" |
| 13 | `node scripts/early-access-live-check.mjs --base http://127.0.0.1:3624 --mode unconfigured` | **11 passed, 0 failed** |
| 14 | Headless Edge sweep re-run on the final build | 42 page/width runs: 0 layout issues; every form outcome ends with focus in the right place; 0 CSP violations |
| 15 | Server log scan after all browser runs (test names and addresses, `sb_secret`, JWT prefix) | 0 matches |
| 16 | `npm audit` (read-only; nothing installed) | 4 packages, 8 advisories (1 moderate, 3 high); same set as Day 20; fix now offered as `next@15.5.28` (§10) |

**Not run, and why:**

| Check | Reason |
|---|---|
| Configured live check against the developer-owned Supabase | It writes a row. The storage code (`lib/early-access-store.ts`) and the request format are unchanged since Day 23 |
| axe-core automated rule scan | Not installed in this repository (Days 4–11 used it from outside the repo). Adding it is a dependency decision |
| Lighthouse / performance | Not installed; same reason. Planned as a dependency-free local measurement for Day 25 (§14) |
| Real iPhone, Safari, Facebook in-app browser, VoiceOver, NVDA | Need the Preview URL and devices |
| Anything on NJEN's Supabase or Vercel | No access, by design |
| Any Git command | Not permitted for Day 24 |

---

## 5. Bugs found, with evidence

Evidence is from the headless Edge run **before** the fix (390 px, iPhone emulation). The form was filled by keyboard and submitted with Enter, with the signup API answered by a mock inside the browser.

| # | Defect | Evidence (before) | Why it matters |
|---|---|---|---|
| 1 | **A server-side field error never moved focus to the field.** The response handler called `focus()` while the inputs were still disabled from "submitting", which does nothing | Mocked `400 {"status":"invalid","errors":[{"field":"email",…}]}`: error shown, `aria-invalid="true"`, but `document.activeElement` = `BODY`. The code's own comment says it takes users "straight to what needs fixing" | WCAG 3.3.1 / 2.4.3. A screen-reader user hears "Please correct the highlighted fields" with no way to reach the field except searching from the top |
| 2 | **Focus lost after every server answer.** The focused input or button is disabled during the request, so focus falls to the page body. On success and "not saved", the whole form is replaced | `activeElement` = `BODY` in 17 of the 18 server-answer cases: stored, stored after a slow reply, not-configured, 429, 502, 504 non-JSON, truncated JSON, empty 200, unknown status, string body, network failure, timeout, field error, form error, hostile field, maximum-length name, real unconfigured route. The 18th (unknown field) is defect 3 | WCAG 2.4.3. The next Tab restarts at the top of the page. On success, a `role="status"` region inserted together with its text is not reliably announced, so a screen-reader user may hear nothing after submitting |
| 3 | **An unknown error field could focus the hidden honeypot.** The form focused whatever element had the id named in the server's first field error | Mocked `{"field":"company"}` error: `activeElement` = `company`, the off-screen anti-bot input, under "Please correct the highlighted fields" | The real route never sends this today, so it is a robustness fix: a future server change, a proxy or an error page shaped like JSON could trigger it |

**Checked and found correct (not defects):**
- Validation, required errors and loading state ("Sending…", button and inputs disabled).
- Repeat submits: repeated Enter and click during a 1.5 s reply sent **one** request.
- All 11 kinds of failure reply show "not saved" wording, and **only** `{"status":"stored"}` shows "You're in".
- Recovery after a failure.
- Consent hidden.
- Source handling.
- Keyboard order.
- The skip link.

---

## 6. Code fixes made

| File | Change |
|---|---|
| `components/EarlyAccessForm.tsx` | Focus is now moved **after** the re-render, when controls are enabled again. Field errors focus the field, from the browser's own checks or from the server. A failure with no field to fix returns focus to the submit button, only if focus was lost, so Enter retries. Success and "not saved" move focus to the result heading (`tabIndex={-1}`), so a screen reader reads the outcome. No text, layout or styling change |
| `lib/early-access.ts` | `interpretSignupResponse()` keeps only error fields the form has: `name`, `email`, `consent` (only while a consent box exists) and `form`. Anything else is treated as the server failure it is ("…your signup was not saved…"). Imports `earlyAccessFields` from `lib/forms.ts`, which is browser-safe and already used by the form |
| `app/globals.css` | One rule: `.ea-success-title:focus { outline: none; }`. The heading is focused by script, not by the visitor, and it is not a control, so it shows no ring. Verified in the browser: no visible change |

**Confirmed unchanged:**
- design, colours, artwork, wording, navigation;
- business rules and consent behaviour;
- the API's request and response format;
- the database function contract;
- storage code;
- dependencies and `package.json`.

---

## 7. New or updated tests

| File | Added | Covers |
|---|---|---|
| `tests/early-access-logic.test.mjs` | 5 tests | A `form`-level rejection still passes through. Unknown fields are dropped while known ones are kept. A `consent` error is dropped while no consent box exists. `company` and an unrelated id (`main`) give "not saved" instead of a field error |
| `tests/early-access-route.test.mjs` | 1 test | **Contract:** every rejection the real route produces (missing name or email, bad email, long name, honeypot, too fast, malformed JSON, array body, 5 KB body) reaches the visitor with its message intact. A future server field the form does not know would fail this test, not vanish silently |
| `scripts/early-access-browser-check.mjs` (new) | 41 checks | Real-browser check, local only. The signup API is **mocked inside the browser**; the one unmocked check runs only if the page shows "Preview only". It covers: layout at 320/375/390/768/1024/1440 px; one h1, labelled 16 px inputs, tap targets ≥ 44 px; success and "not saved" screens and focus; loading state; one request on repeated submits; 9 failure types (message and focus); server field error (`aria-invalid`, `aria-describedby`, focus); browser-side errors; retry after failure. It finds Edge or Chrome itself, or takes `--browser`. Nothing is downloaded |

Run with `npm test` and, with a local build running, `node scripts/early-access-browser-check.mjs`. The Day 23 tests were not duplicated.

---

## 8. Accessibility findings

### Verified (automated browser checks in headless Edge, emulation)

- **Layout:**
  - 7 pages (`/`, `/early-access`, `/jobs`, `/publications`, `/careers`, `/industry`, 404) × 6 widths (320, 375, 390, 768, 1024, 1440): **0 px horizontal scroll**, no clipped text.
  - 320 px CSS width also covers the WCAG reflow case (1.4.10).
- **Structure:**
  - one `h1` per page and `lang="en"`;
  - site pages have header, navigation, main and footer landmarks;
  - `/early-access` has `main` only, by design (campaign page with no site navigation).
- **Names and labels:** every input labelled; no unnamed link or button; every image has `alt`, decorative ones empty.
- **Keyboard:**
  - on `/`, `/jobs` and `/careers` at 320, 390 and 1024 px, every focus stop has a ≥ 2 px outline;
  - "Skip to content" is the first stop and moves the next Tab into the page content. On `/jobs` there is nothing focusable in the content (empty board), so it correctly moves on to the footer.
- **Focus not obscured (2.4.11, new in WCAG 2.2):**
  - the fixed mobile bottom bar never fully hid a focused element;
  - the tall "Industry / Production" card is partly outside the viewport at 320 px when focused, which is allowed: it is not entirely hidden.
- **Early Access form:**
  - errors linked with `aria-invalid` and `aria-describedby`;
  - form message in a `role="alert"` region that is always in the page;
  - result screens are `role="status"`, and **now** focused;
  - focus order is name → email → submit;
  - honeypot hidden from assistive technology and not focusable;
  - the consent control is absent.

### Partially verified

- **Contrast:**
  - Early Access colours were calculated from the CSS on Day 23 and are unchanged: all text ≥ 4.5:1, lowest the orange button at 4.81:1;
  - placeholder text is 3.05:1, which is allowed because every field has a visible label; any change is a design decision;
  - the rest of the site relies on the Day 4/9 axe and manual results. **Not re-scanned today** (axe not installed).
- **Announcements:** ARIA roles and focus targets are verified. **What a screen reader actually says has not been heard.**
- **Tap targets:**
  - Early Access fields and button are 56 px;
  - on other pages only the WCAG 2.5.8 minimum (24 px) was checked: none smaller outside running text.

### Not tested

- VoiceOver (iPhone or Mac), NVDA, TalkBack.
- Real iPhone Safari, the Facebook and Instagram in-app browsers, Android.
- iOS focus zoom on a real device (16 px inputs make it unlikely).
- Forced colours / high contrast, reduced motion, browser text-only zoom.

**This report does not describe any screen-reader test as done.** It verifies the code and the ARIA state a screen reader relies on.

---

## 9. Security and privacy regression review

| Area | Finding |
|---|---|
| Secrets in browser bundles | None (2 builds scanned). Storage variables have no `NEXT_PUBLIC_` name; `lib/early-access-store.ts` is imported only by the route and the server-rendered page |
| Logs | Server log after all browser runs: 0 test names or addresses, 0 key text. The unit suite asserts the same on every test |
| False success | 20 mocked replies in a real browser: only `{"status":"stored"}` shows "You're in". A bare `"stored"` string, `{"status":"STORED"}`, empty and truncated bodies all say "not saved" |
| Unpublished and internal data | 10 hidden sections, `/directory`, `/performers`, `/background-performers`, `/portal`, `/admin`, `/api/jobs`, unknown job and publication slugs: all **404 with noindex**. No Background Performer directory exists or is linked |
| Robots / noindex | `robots.txt` disallows all; sitemap empty (no domain set); `/early-access` `noindex, nofollow`; `/jobs` `noindex, follow` (empty board). Unchanged |
| Headers / CSP | CSP, nosniff, Referrer-Policy, X-Frame-Options and Permissions-Policy present on a page, an API route and the 404 page; no `X-Powered-By`. HSTS is added by Vercel, so it is absent locally, as expected. 0 CSP violations in the browser console |
| Redirects and URLs | `//evil.example/` and `/\evil.example` give a 308 to a **same-site** path (`/evil.example/`), not off-site. `?next=` / `?redirect=` are ignored. No open redirect. No external links on any public page |
| API errors | `GET` and `PUT` on `/api/early-access` → 405; `/api/health` → `{"status":"ok"}`, `no-store`; unknown API path → the branded 404 page (HTML) |
| Preview vs production storage | Unchanged from Day 23: impossible settings count as **not configured** and show "Preview only". Storage code untouched today |
| Displayed server text | A hostile error message was rendered as plain text (React escapes it), and is now dropped entirely (fix 3) |

---

## 10. Existing defects and risks not fixed

| Risk | Why not fixed today |
|---|---|
| **Dependency advisories**: `next` (2 moderate cache-poisoning advisories for self-hosted SSG/ISR), `postcss` (4), `sharp` (1, librsvg), `source-map-js` (1). npm now offers `next@15.5.28`; `docs/NJEN_SECURITY_PATCH_RECOMMENDATION.md` proposed 15.5.27 | Needs NJEN approval. The upgrade should be re-tested at 15.5.28 in an isolated copy before it is proposed again |
| The "Preview only" notice is decided at **build** time (`/early-access` is a static page) while the API checks on each request | On Vercel, variables only take effect on a new deployment, so page and API always agree there. Locally, a build made without variables and started with them would show "Preview only" while the API stores. Developer-only; documented here, no change |
| Placeholder contrast 3.05:1 | Design decision; labels are visible |
| CSP allows `'unsafe-inline'` scripts | Architecture decision (nonce), flagged Day 18 |
| Rate limit is per server instance | Needs shared infrastructure |
| Unknown `/api/…` paths answer with the HTML 404 page, not JSON | Cosmetic; leaks nothing |
| Migration 0002's outdated header comment; unverified Table Editor claim | Migration files kept exactly as tested (Day 23) |
| No automated accessibility rule scan in the repository | Adding axe-core is a dependency decision |

---

## 11. Tests that need the protected Preview URL or a real device

All are in `docs/NJEN_DAY24_PREVIEW_QA_CHECKLIST.md`, every row **Not tested**, with Pass/Fail/Not tested fields:
- deployed repository and commit, and that the Preview is private (A1–A4);
- robots, sitemap, noindex, headers including HSTS, hidden routes, links (B1–B8);
- the Early Access form on the deployment, including the Day 24 focus fix, rate limit, console (C1–C9);
- iPhone Safari, no zoom on focus, email keyboard, Facebook and Instagram in-app browsers, Android, desktop Safari, the mobile bar (D1–D8);
- skip link, visible focus, VoiceOver and NVDA announcements (E1–E5).

---

## 12. Tests that need NJEN's Supabase inspection or approval

- **Real signup stored once**, with server timestamp and source.
- **Repeat signup keeps one row**; the expected result depends on Option A or B.
- **Logs on Vercel** show status codes only.
- **Test-row clean-up.**
- **Consent box and stored wording**; needs B6.
- **Option A/B choice**: read-only queries Q0, Q1, Q3, Q4, Q9 and Q12 first, then written approval of specific SQL.
- The **dependency patch**: approval.

The database investigation stays read-only. No SQL was written or proposed today.

---

## 13. Progress against the 30-day plan

Unchanged at **14.5 / 32 ≈ 45%** (`docs/NJEN_DAY24_PLAN_TRACKER.md`).

Day 24's work sits inside QA items already scored Partial or Done:
- accessibility;
- link, form and error checks;
- content.

Device testing stays at 0 until a real device is used on a deployed Preview.

---

## 14. Next steps for Day 25

1. **Developer:** review and push the Day 24 changes, so a Preview created from `main` includes the focus fixes.
2. **If the Preview link has arrived:** work through `docs/NJEN_DAY24_PREVIEW_QA_CHECKLIST.md` A–E and record real results.
3. **If not, local QA that is still open, all without new dependencies:**
   - **Performance:** measure locally with the browser's own metrics over DevTools: largest contentful paint, image bytes per width (the Early Access posters are 0.8 MB and 2.2 MB originals, served optimised), total transfer;
   - **forced colours and reduced motion** emulation on `/` and `/early-access`;
   - **text-only zoom (200%)** on the form;
   - keyboard pass on `/industry`, `/publications` and the 404 page.
4. **Before the Loom:** re-run the configured live check on the developer-owned project (`docs/NJEN_DEV_SUPABASE_TEST_SETUP.md` §6).
5. **Approval requests in the queue (not today):** re-test the dependency patch at `next@15.5.28` in an isolated copy, then update the recommendation for NJEN's approval.

---

## 15. Client actions: genuine blockers only

**One at a time. The next one is unchanged from Day 23:**

1. **Create the private Vercel Preview** from `NJentertainmentnetwork/njen-website`. No environment variables, no domain, Deployment Protection on All Deployments, and send back a share link. iPhone steps: `docs/NJEN_DAY23_NEXT_CLIENT_ACTION.md`.

**Queued for later, not to be sent yet:**
- read-only Supabase inspection (six queries);
- approval of the dependency patch;
- consent and Privacy wording (B6).

No new client action was created by Day 24.
