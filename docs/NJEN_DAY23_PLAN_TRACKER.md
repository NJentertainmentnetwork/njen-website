# NJEN 30-Day Plan Tracker (Day 23)

**Prepared 14-10-2026.** Traced against `30_DAY_LAUNCH_PLAN.md`, the Day 20–22 reports and `docs/NJEN_PHASE1_SCOPE_REVIEW.md`. Day 23 closes the plan's "Days 18–23, Operations and hardening" window.

"Verified" names its evidence. Code existing is not enough to count as verified. **Nothing is verified on a deployed site**, because no deployment of the official repository exists.

---

## A. Planned through Day 23: implemented and verified

| Plan item (window) | Evidence |
|---|---|
| Single source of truth: official repository (1–3) | Local remote and `git ls-remote`: `NJentertainmentnetwork/njen-website`, `main` at `9ed6930` |
| KEEP/REFACTOR/REBUILD; stack decision (1–3) | Delivered documents (`KEEP_REFACTOR_REBUILD_BASELINE.md`, register T-items) |
| Structured validation on writes (4–10) | **Day 23:** 126 automated tests (`npm test`) cover Early Access validation and the API |
| Filters; SEO, robots, social metadata, error and not-found states (11–17) | Regression suite (Day 22, 90/90); noindex on Early Access confirmed in the Day 23 browser check |
| Rate limiting on the public write endpoint (18–23) | **Day 23:** automated tests show the 6th request from one IP gets 429, invalid attempts count, and other visitors are unaffected. *Per server instance only* (documented limit) |
| Security headers and CSP (18–23) | Regression suite on the local build. **Not yet seen on a deployment** |
| Early Access stores a real signup (supporting the plan's "replace demo data with validated database-backed writes") | **Developer-owned test Supabase only**, 13-10-2026, count 1/1 |
| No demo content presented as real (24–27, done early) | Regression: old demo job URLs 404 |

## B. Implemented but not verified

| Item | What's missing |
|---|---|
| Security headers on the real platform | A deployment |
| Health check for monitoring (18–23) | Works locally (`/api/health` 200). No monitoring service is watching it (Sentry/uptime account, D6) |
| Rate limit behaviour on Vercel (multiple instances) | A deployment; the limit may be looser than 5 per 10 minutes there |
| Migrations 0001/0002 (4–10) | Verified on the developer-owned project; **not applied or approved for NJEN's** |
| iPhone-first layout (24–27, started early) | **Day 23:** emulated in headless Edge at 320, 375, 393, 430, 768, 1280 and 1920 px: no horizontal scroll, inputs 16 px (no iOS focus zoom), tap targets ≥ 56 px tall, one `h1`, labels on every field, keyboard order correct with a visible focus ring, errors announced and focused. **Not a real iPhone or Safari**, and not the Facebook in-app browser |
| Contrast (24–27) | All Early Access text measured ≥ 4.5:1 against the actual navy background (lowest: the orange button, 4.81:1). Placeholder text is 3.05:1. That is allowed, since every field has a visible label; a colour change would be a design decision |

## C. Developer work through Day 23 that could be done safely today: done

| Item | Done on Day 23 |
|---|---|
| Automated tests for signup validation, size limits, duplicates, storage failures, configuration errors and user-facing states | `tests/early-access-logic.test.mjs` and `tests/early-access-route.test.mjs`, run with `npm test` (no new dependency). 126/126 pass. A mutation check (storage errors deliberately ignored) made 7 tests fail, so the suite catches a "silent success" regression |
| Fix: pasted variables with stray whitespace broke every signup while the page claimed storage was on | Values are trimmed |
| Fix: an impossible configuration (non-https URL, browser key in the server variable) failed per visitor | Now treated as not configured, so "Preview only" shows on the first post-deploy check |
| Fix: a tampered campaign link could store a spreadsheet formula as `source` | Source limited to a plain label shape, in both browser and server |
| Fix: a non-JSON error page (platform timeout) was reported to the visitor as "could not reach the server" | Now "something went wrong at our end … not saved"; failure wording centralised and tested |
| Local mobile and accessibility check | See B |
| Compatibility assessment, Vercel preview readiness, one next client action | `docs/NJEN_DAY23_*.md` |

**Still developer work, but blocked on one of D's items:** iPhone and Facebook in-app tests (preview URL); the header and rate-limit check on Vercel (preview URL); the Option A/B SQL proposal (inspection results); and monitoring integration (accounts).

## D. Blocked by NJEN access, approvals, content or decisions

| Item | Blocked on | Plan window |
|---|---|---|
| Vercel project on the official repository; private preview | **NJEN, the single next action** (`docs/NJEN_DAY23_NEXT_CLIENT_ACTION.md`) | 1–3 (environments), 28–30 |
| NJEN Supabase inspection, then database approval | NJEN (Q0, Q1, Q3, Q4, Q9, Q12), then written approval | 4–10 |
| Backups and a restore test | Supabase plan decision (T8) | 18–23 |
| Privacy, Terms, consent wording, abuse-reporting pages | NJEN / counsel (B6) | 18–23 |
| Analytics | Plausible account (D6) | 18–23 |
| Error monitoring | Sentry account (D6) | 18–23 |
| CMS, admin and moderation; staff roles | Supabase access (D4) and approval of the Payload dependency (T3) | 4–10 |
| Content for 10 hidden sections; first verified jobs | NJEN content (C-items) | 11–17 |
| Security patch `next` 15.5.27 etc. | NJEN approval (`docs/NJEN_SECURITY_PATCH_RECOMMENDATION.md`) | 18–23 |
| Production domain; social share image | NJEN (C13, C12) | 28–30 |

## E. Outside current scope, or post-launch

- Member authentication (deferred, T2).
- Background Performer directory (never public; post-launch).
- Payments (T10).
- Newsletter platform (T5a).
- A distributed (cross-instance) rate limiter.
- A CSP nonce (an architecture decision, flagged on Day 18).
- Next.js 16 upgrade (separate approval).

---

## Progress estimate

Same method as Day 22 (`docs/NJEN_PHASE1_SCOPE_REVIEW.md` §3): 32 plan items; Done = 1, Partial = 0.5.

| | Day 22 | Day 23 |
|---|---|---|
| Score | 14.5 / 32 | **14.5 / 32 ≈ 45%** |

**Unchanged, on purpose.** Day 23's work strengthened the evidence inside items that were already "Partial":
- form, validation and error-state checks;
- accessibility.

None of those can become "Done" without a deployment, a real device or an NJEN dependency. Every item still at zero waits on something in D.

| Milestone | Status |
|---|---|
| Local app | Pass: typecheck, build, 126 unit/API tests, 11/11 live check (unconfigured), browser check at 7 widths |
| Developer-owned test Supabase | **Verified 13-10-2026** |
| NJEN's Supabase | **Not verified** |
| Vercel preview | **Not available**; waiting on the next client action |
| Production | **Not ready**; launch stays gated on testing and NJEN's approval |
