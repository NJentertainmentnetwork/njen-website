# NJEN Phase 1: Scope Review and Progress (Day 22)

**Prepared 13-10-2026.** Built from the code in the working tree (baseline `f958f38` plus Day 22's uncommitted changes), the 30-day plan (`30_DAY_LAUNCH_PLAN.md`), the client input register (`WEEK1_CLIENT_INPUT_REGISTER.md`) and the Day 10–21 reports.

"Verified" means checked on Day 22 or by a recorded earlier test that still applies to unchanged code. Nothing here has been verified on a deployed site; see §4.

---

## 1. Area-by-area review

**Key:** **Done** = built and verified locally · **Built, not verified** · **Partial** · **Blocked** (named dependency) · **Post-launch** (outside the Day-30 scope)

| Area | Required for Phase 1 | Implemented | Evidence | Still missing | Who can finish it | Blocks launch? |
|---|---|---|---|---|---|---|
| **Public pages and navigation** | Approved sections only; unfinished sections hidden; no "coming soon" pages | 14 sections in `lib/sections.ts`. 4 published (Jobs, Career Center, Industry, Publications) plus Home and Early Access. The other 10 return 404 and are left out of all navigation | Regression suite: 9 published routes 200, 10 unpublished routes 404, every internal link 200 | Approved content for the 10 hidden sections (C1–C9, C14, C15); final names (B1) | **NJEN** supplies content; developer publishes | **Yes, for the full launch.** An Early-Access-only launch is not blocked |
| **Jobs** | Published listings only, with filters; demo jobs never shown as real | Index, detail and filters; fail-closed publication gate (`lib/publish-gate.ts`); demo data removed on Day 16; honest empty state | Regression: old demo job URLs 404; `/jobs` 200 | A real content source (Payload on Supabase, D4/T3); first verified listings (C11); moderation rules (B3) | Developer, once Supabase access exists; **NJEN** for listings and rules | **Yes** |
| **Job / career submissions** | Must never publish automatically | Field definitions only (`lib/forms.ts`, `job-submission`). No public form or endpoint exists | No route accepts a job; the gate rejects any record not marked published | Intake workflow (CMS form or verified posting), notification email (Resend, D5) | Developer after D4/T3/D5; **NJEN** for B3 | Yes, if job intake is in the locked scope (X3 open) |
| **What's Filming / Studio Watch** | Public information only | Page built, unpublished (404) | Regression 404 | Approved entries (C3); sources and rules (B5) | **NJEN** | Only if in scope (X3) |
| **Career and education resources** | Pathways; Internship Exchange not presented as operational | Career Center live with three pathway cards, not linked; Shortcuts to Hollywood described as a benefit, with no checkout or file | Route 200; no purchase or download path exists | Pathway guides and Internship Exchange structure (C10). The intro mentions "internships" without saying the Exchange is still in development. **Wording left as approved; flagged for NJEN** | **NJEN** | No |
| **Events and resources** | No unconfirmed events, venues, dates or partners | Pages built, unpublished (404) | Regression 404 | Event listings (C4), resources (C5, C14, C15), B12, B13 | **NJEN** | Only if in scope (X3) |
| **CMS / admin** | Staff edit, review and publish content | **Not installed.** Payload CMS is approved (T3) but needs the Supabase database (D4) | `package.json` has no Payload; no `/admin` route (regression 404) | Payload install, collections, staff accounts, admin MFA | Developer, **after D4 access and approval of the dependency addition** | **Yes** |
| **Forms and integrations** | Validation server-side; honest about delivery | Early Access: full server validation and Supabase adapter. Contact form: preview-only, sends nothing, page unpublished | Day 21/22 tests (§3 of the Day 22 report); contact page 404 | Contact delivery (Resend D5, recipients C8); approved contact wording, including a "please don't send confidential production information" line (C8, not added: wording needs approval) | Developer after D5; **NJEN** for C8 | Contact: yes, if in scope |
| **Roles and permissions** | Admin / editor / moderator; server-side authorization | None in code yet. Member authentication is deferred (T2); staff roles arrive with Payload | — | Staff list and approval levels (B7); Payload access control | Developer after T3; **NJEN** for B7 | **Yes** (with CMS) |
| **Draft → Review → Published → Archived/Expired** | Enforced before anything is public | `ContentStatus`: draft, in-review, published, rejected, archived. Expiry, schedule and closed are computed by the gate. Fail-closed on unknown or malformed data | Gate code; publications and jobs both route through it | Driving it from real CMS records | Developer after T3 | Yes (with CMS) |
| **Background Performer directory** | Never publicly searchable; enforced server-side | **Not built** (post-launch). No route exists | Regression: `/directory`, `/performers` → 404 | — | — | **Post-launch** |
| **Children and parents safety** | Protective information | Page built, unpublished | Regression 404 | Approved content (C6, C7) | **NJEN** | Only if in scope (X3) |
| **Mobile and accessibility** | iPhone-first; WCAG 2.2 AA target | Mobile bottom navigation, skip link, labelled fields, focus-to-error, CTA colour adjusted for contrast (B17) | Viewport emulation (Day 15) | Real iPhone and Safari, keyboard pass, screen reader, contrast audit | Developer, on a **preview URL** | **Yes** (QA gate) |
| **SEO and metadata** | Titles, descriptions, sitemap, robots, social, canonical, 404 | Per-page metadata; robots blocks all until `NJEN_ALLOW_INDEXING`; sitemap and canonical switch on with `NJEN_SITE_URL`; noindex on Early Access and hidden sections | Regression: robots, sitemap, canonical, noindex | Production domain (C13); 1200×630 social image (C12) | **NJEN** | Domain: yes |
| **Security and error handling** | Headers/CSP, rate limits, no secrets in browser, safe errors | CSP and baseline headers; error boundaries; rate limit (per instance); request size cap; server-only keys; status-only logs | Regression: exact CSP and headers on page, API and 404 | Patch approval (`docs/NJEN_SECURITY_PATCH_RECOMMENDATION.md`); headers on a real deployment; distributed rate limit (post-launch hardening) | **NJEN** approval; developer applies | Patch: recommended before launch |
| **Monitoring, analytics, backups** | Active monitoring, privacy-friendly analytics, backups with a restore test | Health endpoint only | `/api/health` regression | Sentry and Plausible accounts (D6); Supabase plan and backup decision (T8); restore test | **NJEN** accounts; developer integrates | **Yes** (launch acceptance rule) |
| **Legal pages** | Privacy, Terms, Accessibility, consent | None. Consent checkbox is built and switched off (`EARLY_ACCESS_CONSENT = null`) | Day 19 server enforcement test | Approved wording and URLs (B6). Not written by the developer | **NJEN / counsel** | **Yes** |
| **Deployment** | Official repository deployed; preview, then production | `vercel.json` is framework-only. The local Git remote is `NJentertainmentnetwork/njen-website` | `https://njen-website.vercel.app` (read-only, 13-10-2026) serves an **old build**. See note below | A Vercel project on the official repository; variables; domain | **NJEN** (account owner) | **Yes** |

**Note on the live URL:** checked read-only with plain GET requests on 13-10-2026.
- `/early-access` returns 404 (added on Day 15).
- `/api/health` returns 404 (added on Day 19).
- No `Content-Security-Policy` header is sent (added in `a16186f`).
- The homepage reported `Age: 1207480`, so Vercel's cache has served it for about 14 days, since about 29-09-2026.

This agrees with the screenshot evidence: the project behind that URL is not deploying the current official repository.

---

## 2. Business-rule check

| Rule | Status in code |
|---|---|
| Community, not a talent agency; no promised outcomes | No representation or guarantee language found on published pages. Industry and Membership wording awaits NJEN (B15, B14) |
| Job submissions never auto-publish | **Holds.** There is no submission endpoint, and the gate requires `status = published` |
| What's Filming public info only | Page unpublished; no data source yet (B5) |
| Internship Exchange not implied operational | Not claimed. "Internships" is mentioned generically on Career Center and Early Access (client wording) |
| Background Performer directory never public | **Holds.** Not built; probes 404 |
| No unconfirmed events, venues, dates or partners | **Holds.** Events unpublished; no event data |
| Contact form doesn't invite confidential production information | Form is preview-only and unpublished. A caution line is recommended for C8 approval, not added |
| Approved design unchanged | No design, asset, layout or navigation change on Day 22 |

---

## 3. Progress against the 30-day plan

**Method.**
- Each of the 33 bullet points in `30_DAY_LAUNCH_PLAN.md` is one item.
- Scoring: **Done = 1** (built and verified locally, or a delivered decision document); **Partial = 0.5** (some of it built or verified, or built but needing an external system); **Blocked or Not started = 0**.
- One item, "Implement authentication only if included in Day-30 scope", is **excluded** because NJEN deferred authentication (T2).
- The score measures **plan coverage, not effort or hours.** Nothing counts as fully done by the plan's own definition (deployed, monitored and so on), because nothing is deployed.

| Plan window | Items | Done | Partial | Blocked / not started | Score |
|---|---|---|---|---|---|
| Days 1–3 (repository, scope, environments) | 5 | 3: repository decision, KEEP/REFACTOR/REBUILD, stack decision | 2: scope lock (X3 open), environments (staging and production not established) | 0 | 4 / 5 |
| Days 4–10 (data, publishing foundation) | 5 | 1: structured validation | 3: migrations (written and tested, not applied), server-side authorization (route gating yes, RLS not live), demo data replaced (removed; DB reads blocked) | 1: admin/moderation (no CMS) | 2.5 / 5 |
| Days 11–17 (public features) | 5 | 2: filters, SEO/robots/errors | 1: jobs connected to approved records (gate built, no source) | 2: Career/Events/What's Filming content source; employer intake | 2.5 / 5 |
| Days 18–23 (operations) | 6 | 2: rate limiting, headers/CSP (locally) | 1: monitoring (health check only) | 3: backups + restore test, legal pages, analytics | 2.5 / 6 |
| Days 24–27 (QA) | 5 | 1: no demo content | 3: accessibility (partial), authorization tests (local and PGlite only), link/form/error checks (performance not measured) | 1: device testing | 2.5 / 5 |
| Days 28–30 (launch) | 6 | 0 | 1: post-launch backlog (`POST_LAUNCH_DEVELOPMENT_ASSESSMENT.md` exists) | 5 | 0.5 / 6 |
| **Total** | **32** | **9** | **11** | **12** | **14.5 / 32 ≈ 45%** |

**Of the 12 items at zero, all 12 wait on something only NJEN can provide:**
- Supabase access (D4);
- a Vercel project on the official repository (D2a);
- accounts (D6);
- wording (B6, C8);
- content (C-items);
- the backup decision (T8).

Today, the developer can't move any of them to Done without one of those.

---

## 4. Readiness by milestone (separate from the percentage)

| Milestone | Status |
|---|---|
| Code for everything buildable without accounts | Largely complete (above) |
| Local tests | Pass: typecheck, build, 90/90 regression, Early Access live-check against a mock |
| Developer-owned Supabase integration | **Verified 13-10-2026** on the developer's own test project: real signup stored, count query 1/1 (`DAY22_IMPLEMENTATION_REPORT.md` §3.3). Says nothing about NJEN's project |
| NJEN Supabase integration | **Not verified.** Inspection results and approval needed |
| Vercel preview | **Not available.** No project confirmed on the official repository |
| Production | **Not ready** |

The launch target is in `DAY22_IMPLEMENTATION_REPORT.md` §9.
