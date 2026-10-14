# NJEN: Day 23 Implementation Report

**Date:** 14-10-2026 · **Phase:** end of Days 18–23, Operations and hardening · **Baseline:** `9ed6930` "Complete Day 22 Early Access and Phase 1 review" (local `main` and GitHub `main`, both read with read-only Git commands)

**Nothing was committed, pushed or deployed.** No change was made to NJEN's Supabase project, any Vercel project, environment variable, domain, DNS record, billing setting, GitHub setting or dependency. The developer-owned test Supabase project was **not written to** on Day 23.

**Signup storage status:**
- **Developer-owned test Supabase:** verified 13-10-2026 (Day 22 report §3.3). Not re-run today; see §4.
- **NJEN's Supabase: NOT VERIFIED.** It has not been inspected, connected or written to. **No production signup has ever been saved.**
- **Vercel preview: NOT AVAILABLE.** No project deploys the official repository. The public `njen-website.vercel.app` still serves a build from about 29-09-2026.
- **Production:** not ready. The launch gate is unchanged.

---

## 1. Work performed

1. **Inspection:**
   - the 30-day plan and the Day 20–22 reports;
   - the Phase 1 review and the Day 22 client actions;
   - all Early Access code: route, store, shared logic, form and page;
   - migration 0002;
   - `vercel.json`, `package.json`, `.gitignore`, `.env.example`, `next.config.ts` and `globals.css` (form styles).
2. **Automated test suite (new).** 126 tests across the Early Access logic and the API route, run with `npm test`:
   - they use Node's built-in test runner and type stripping, so **no dependency was added**;
   - the network is replaced by a stub, so no real service is contacted.
3. **Four defects fixed** (§3). Design, wording, layout and business rules are unchanged.
4. **Local mobile and accessibility check** in headless Microsoft Edge (already installed; driven over its debugging protocol from a scratch script, nothing installed) at 7 viewport widths, plus keyboard and form-flow checks.
5. **Regression runs:** typecheck, production build, the existing live check (unconfigured mode).
6. **Read-only checks:**
   - Git remote, branch and status;
   - `git ls-remote` for GitHub `main`;
   - the public Vercel URL;
   - Vercel's documentation on Deployment Protection, share links and `X-Forwarded-For`.
7. **Deliverables:**
   - compatibility assessment;
   - Vercel preview readiness;
   - plan tracker;
   - one next client action, with a client update.

---

## 2. Files changed

**Application code (modified):**
| File | Change |
|---|---|
| `lib/early-access-store.ts` | Configuration read per call through `readConfig()`. Values trimmed. Non-https URLs (except localhost) and browser keys (`sb_publishable_…`, legacy `anon`/`authenticated` JWTs) count as **not configured** |
| `lib/early-access.ts` | New `normaliseSignupSource()` (safe label shape, ≤ 64), used by `readSignupSource()`. New `interpretSignupResponse()` and `SIGNUP_FAILURE_MESSAGES`: the reply-to-screen mapping as a pure, tested function. Message text unchanged |
| `app/api/early-access/route.ts` | Uses `normaliseSignupSource()` for `source` |
| `components/EarlyAccessForm.tsx` | Uses `interpretSignupResponse()`. A non-JSON reply now gives the "not saved … at our end" message instead of "could not reach the server" |
| `package.json` | Added the `"test"` script only. No dependency or version change; lockfile untouched |

**Tests (new):**
- `tests/early-access-logic.test.mjs`
- `tests/early-access-route.test.mjs`
- `tests/support/register.mjs`
- `tests/support/resolve-hook.mjs` (resolves the `@/` alias for Node)

**Documents (new):**
- `docs/NJEN_DAY23_EARLY_ACCESS_COMPATIBILITY.md`
- `docs/NJEN_DAY23_VERCEL_PREVIEW_READINESS.md`
- `docs/NJEN_DAY23_PLAN_TRACKER.md`
- `docs/NJEN_DAY23_NEXT_CLIENT_ACTION.md`
- this report

**Documents (one-paragraph pointers added):**
- `docs/NJEN_SUPABASE_STATUS_AND_COMPATIBILITY.md` §6;
- `docs/NJEN_DAY22_CLIENT_ACTIONS.md` (header);
- `docs/NJEN_EARLY_ACCESS_DEPLOYMENT_READINESS.md` §2.

**Unchanged:**
- migrations;
- `.env.example`;
- `vercel.json`;
- `next.config.ts`;
- styles, images and page content;
- the lockfile.

`git diff --stat`: 5 files, +160 / −30 (code and `package.json`), plus untracked `tests/` and the new docs. `git diff --check` is clean.

---

## 3. Defects found and fixed

| # | Defect | Effect before | Fix | Test |
|---|---|---|---|---|
| 1 | Key or URL pasted into Vercel with a trailing space or newline | Every signup failed ("not saved"), while the page showed no "Preview only" notice | Values trimmed | `storage configuration` (whitespace and newline case); `trims a pasted key…` |
| 2 | Impossible settings (URL without `https://`; publishable or `anon` key in the server variable) | The page looked live, but every visitor got "not saved" | Treated as not configured; the "Preview only" notice reveals it at the first post-deploy check | 8 cases in `storage configuration` |
| 3 | `source` accepted any characters up to 64 | A tampered link such as `?utm_source==HYPERLINK(…)` could store a spreadsheet formula in the lead list | Label limited to letters, digits, space and `. _ - : / +`, starting with a letter or digit; anything else stored as null (the signup still succeeds) | `normaliseSignupSource`, `campaign source` |
| 4 | A non-JSON error reply (platform error page or timeout) | Visitor told "We could not reach the server", which is wrong though still says "not saved" | Mapped to "Something went wrong at our end and your signup was not saved" | `interpretSignupResponse` (`null` body case) |

**Behaviour changes to note:**
- A source value that used to be stored (for example one containing `,` or `"`) is now stored as null.
- No realistic `utm_source` or referrer host is affected. The test list includes `facebook`, `fb_ads`, `l.facebook.com`, `Facebook Ads` and `ig:story`.

---

## 4. Tests run and exact results

| Test | Result |
|---|---|
| `npm test` | **126 tests, 126 pass, 0 fail**, 12 suites, about 8.4 s. Includes one real-timer test: a provider that never answers is abandoned after about 8 s |
| Mutation check: storage errors deliberately ignored in a temporary edit, then the file restored byte-for-byte | **7 tests failed** (all provider-error cases), so the suite detects a "silent success" regression |
| `npm run typecheck` | Pass, no errors |
| `npm run build` (storage variables blanked in the shell, so `.env.local` was not used for storage) | Pass, 23 routes. No key prefixes found in `.next/static` |
| `scripts/early-access-live-check.mjs --mode unconfigured` against that build | **11 passed, 0 failed** |
| Server log after the live and browser checks | 0 matches for test addresses or `sb_secret` |
| Developer `.env.local` accepted by the new `readConfig()` (prints only true or false; no value read into output) | `true`, so the Day 22 developer-project setup still counts as configured under the new rules |
| Headless Edge, 7 widths (320, 375, 393, 430, 768, 1280, 1920 px; iPhone user agent and touch below 768) | Results below |

**Headless Edge results (all widths):**
- 0 px horizontal overflow;
- 1 `h1`, `lang="en"`;
- robots `noindex, nofollow`;
- "Preview only" notice visible;
- correct artwork per width (mobile poster below 700 px), loaded;
- name and email inputs: 16 px text (no iOS focus zoom), 56 px tall, each with a `<label>`, `autocomplete` name/email, `inputmode=email`;
- submit button 56 px tall;
- honeypot off-screen, `tabindex=-1`, `aria-hidden`;
- form message has `role="alert"`.

**Keyboard and form flow (393 px):**
- tab order is CTA → name → email → submit, each with a visible 3 px focus outline;
- empty submit: focus moves to name; `aria-invalid="true"`, `aria-describedby="name-error"`; both field errors shown;
- invalid email: focus moves to email with "Enter a valid email address.";
- valid submit (no storage): "Checked - but not saved" with `role="status"`; "You're in" never appears.

**Contrast:**
- calculated from the CSS colours against the actual navy background (the probe's automatic background detection mis-read the gradient, so ratios were recomputed by hand from `globals.css` tokens);
- white 16.15–18.11:1; footnote 9.54:1; errors 10.73:1; notice 12.66:1; orange button 4.81:1;
- placeholder 3.05:1 (fields have visible labels; no design change made).

**Browser console:** one entry, the expected 503 for the unconfigured signup request.

**Not run, and why:**
| Test | Reason |
|---|---|
| Configured live check against the developer-owned Supabase | It would add a row to the test project, which may have been cleared for the Loom demo. The request format is unchanged and checked by stub tests; `readConfig()` accepts the real settings (above). Recommended re-run before the Loom: `docs/NJEN_DEV_SUPABASE_TEST_SETUP.md` §6 |
| Real iPhone, Safari, Facebook in-app browser, screen reader (VoiceOver) | Need a preview URL and a device |
| Headers, rate limit and timeout on Vercel | No deployment exists |
| Anything on NJEN's Supabase | No access, by design |
| Performance (Lighthouse etc.) | Not installed; would need approval or a deployed URL |

---

## 5. Verified vs unverified

| | Status |
|---|---|
| Validation, size cap, honeypot, timing, rate limit, honest error states, no personal data or secrets in logs | **Verified locally** (automated tests and live check) |
| Real write to Supabase | **Verified on the developer-owned project only** (13-10-2026) |
| Responsive layout and basic accessibility | **Verified in emulation only** |
| NJEN Supabase structure, compatibility, write | **Not verified** |
| Vercel preview, headers on the platform, platform rate limiting | **Not verified** |
| Production signup | **Never attempted** |
| Loom | **Not recorded** |

---

## 6. Findings for decisions (not changed)

- **The website is already decoupled from the table name.** It calls one function with five inputs. Keeping `early_access_leads` (Option B) or using the prepared table (Option A) needs **no website code change**, only the matching function in the database. Details and the six decisive read-only queries: `docs/NJEN_DAY23_EARLY_ACCESS_COMPATIBILITY.md`.
- **The claim in migration 0002 that the Table Editor will not show `app` is unverified.** It could be checked in the developer-owned project before it is repeated to NJEN.
- **Header comment in migration 0002** still says "No NJEN-owned Supabase project exists yet". It is outdated, but left alone because migration files are kept exactly as tested.
- **Private preview:** Vercel's "All Deployments" protection with Vercel Authentication is documented (read 14-10-2026) as available on all plans without a paid add-on. A new, separate project avoids touching the three existing ones (`docs/NJEN_DAY23_VERCEL_PREVIEW_READINESS.md`).

---

## 7. Work intentionally not done

- No Git write commands, deployment, Vercel CLI or Supabase CLI.
- No dependency added (a test framework, Playwright or Lighthouse would each need approval).
- No changes to wording, design or colours, the placeholder contrast or the consent text (B6).
- No change to the requirement for `elapsedMs`. A client that omits it skips the timing check. That check is a weak signal anyway, since a script can send any value, so requiring it would add little.
- No database SQL proposed for NJEN. That waits for inspection results.
- No re-scoring upward. Progress stays **14.5 / 32 ≈ 45%** (`docs/NJEN_DAY23_PLAN_TRACKER.md`).

---

## 8. Next action

**One client action:** create one new, private Vercel project from `NJentertainmentnetwork/njen-website`:
- no environment variables, no domain;
- Deployment Protection set to All Deployments;
- a share link sent back to the developer.

iPhone steps are in `docs/NJEN_DAY23_NEXT_CLIENT_ACTION.md`.

**Developer, once the link arrives:** run the checks in `docs/NJEN_DAY23_VERCEL_PREVIEW_READINESS.md` §4, then real iPhone and Facebook in-app tests.

**Before that:** the developer reviews and pushes the Day 23 changes, so the preview includes them.
