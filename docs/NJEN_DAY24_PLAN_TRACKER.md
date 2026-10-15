# NJEN 30-Day Plan Tracker (Day 24)

**Prepared 15-10-2026.** Follows `docs/NJEN_DAY23_PLAN_TRACKER.md`, which stays as the Day 23 record. Day 24 is the first day of the plan's **Days 24–27, QA** window.

"Verified" names its evidence. **Nothing is verified on a deployed site**, because no deployment of the official repository exists.

---

## The QA window (Days 24–27), item by item

Plan wording from `30_DAY_LAUNCH_PLAN.md`, with the status after Day 24.

| Plan item | Status | Evidence after Day 24 | What is missing |
|---|---|---|---|
| iPhone-first device testing and responsive browser testing | **Blocked (0)**, responsive half verified in emulation | Headless Edge: 7 pages × 6 widths (320, 375, 390, 768, 1024, 1440): 0 px horizontal scroll, nothing clipped, labelled controls, named links and buttons | A real iPhone, Safari and the Facebook in-app browser: needs the Preview URL |
| Keyboard/screen-reader/accessibility review against WCAG 2.2 AA | **Partial (0.5)** | Keyboard pass on `/`, `/jobs`, `/careers` at 3 widths: visible ring on every stop; the fixed mobile bar never fully hides focus (2.4.11); the skip link works in Edge. **Two focus defects found and fixed** in the Early Access form (report §5) | Screen reader (VoiceOver, NVDA): not tested. Automated rule scan (axe) not re-run: not installed in this repo |
| Authorization/RLS abuse tests and cross-account access tests | **Partial (0.5)**, unchanged | Earlier local and PGlite tests; Day 24 re-confirmed unpublished sections, portal and directory paths return 404 | RLS on NJEN's project: needs inspection and approval. No accounts exist (auth deferred, T2) |
| Broken-link, empty-state, form-validation, error-state and performance checks | **Partial (0.5)** | Local crawl: 0 broken internal links, 0 external links, 0 missing in-page targets. Empty states shown honestly ("No current listings", "No publications yet"). 20 mocked server answers checked in a real browser. 132 unit/API tests | Performance not measured. A broken-link pass with final content and on the deployment |
| Content review: no demo jobs represented as live jobs | **Done (1)**, unchanged | Jobs board is empty; no sample or demo text on any public page; `/api/jobs` 404 | Re-check when real jobs arrive |

## Developer work done on Day 24

| Item | Result |
|---|---|
| `npm test`, `npx tsc --noEmit`, `npm run build` | 126 → **132** pass; typecheck pass; build pass (23 routes) |
| Fix: server-flagged field never received focus; focus lost to the page after every result and failure | Fixed; checked in the browser (41/41). With the fix reverted, **13** checks fail |
| Fix: an unexpected error field from the server could put focus in the hidden honeypot | Fixed; 6 new automated tests; with the guard removed, 4 fail |
| New local browser check | `scripts/early-access-browser-check.mjs`: no dependency, local only, signup API mocked inside the browser |
| Security and privacy regression review | No regressions (report §9) |
| Preview QA checklist | `docs/NJEN_DAY24_PREVIEW_QA_CHECKLIST.md` (every row Not tested) |

## Blocked: unchanged from Day 23

| Item | Blocked on |
|---|---|
| Private Vercel Preview on the official repository | **NJEN: the single next action** (`docs/NJEN_DAY23_NEXT_CLIENT_ACTION.md`) |
| NJEN Supabase inspection, then database approval | NJEN (Q0, Q1, Q3, Q4, Q9, Q12), then written approval |
| Dependency security patch (`next` now offered at 15.5.28) | NJEN approval |
| Legal pages and consent wording | NJEN / counsel (B6) |
| Analytics, monitoring | Accounts (D6) |
| Backups and restore test | Supabase plan decision (T8) |
| CMS, admin, content for hidden sections | D4, T3, C-items |

---

## Progress estimate

Same method as Days 22–23 (`docs/NJEN_PHASE1_SCOPE_REVIEW.md` §3): 32 plan items; Done = 1, Partial = 0.5.

| | Day 23 | Day 24 |
|---|---|---|
| Score | 14.5 / 32 | **14.5 / 32 ≈ 45%** |

**Unchanged, on purpose.** Day 24 found and fixed real defects and added evidence, but every QA item was already scored Partial or Done, except device testing. That one can't move without a real device on a deployed Preview.

| Milestone | Status |
|---|---|
| Local app | Pass: typecheck, build, 132 unit/API tests, 11/11 live check (unconfigured), 41/41 browser check, 42 page/width layout runs |
| Developer-owned test Supabase | Verified 13-10-2026 (not re-run; storage code unchanged since Day 23) |
| NJEN's Supabase | **Not verified** |
| Vercel Preview | **Not available** |
| Production | **Not ready**; launch stays gated on testing and NJEN's approval |
