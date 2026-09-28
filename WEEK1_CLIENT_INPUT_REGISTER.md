# NJEN — Client Input Register

Single prioritized list of everything NJEN must supply, decide or grant. Updated 25-09-2026 (Day 9). Current business rules: `MASTER_BUSINESS_RULES_ADDENDUM.md` (v1.1). Costs and ownership: `INFRASTRUCTURE_AND_COST_ASSESSMENT.md`. Launch QA: `LAUNCH_QA_CHECKLIST.md`.

- **Item IDs are stable.** Code comments cite them (for example "register C14"); IDs are never reused or renumbered.
- **Status labels:** **APPROVED**, **PENDING CLIENT**, **OPEN**, **BLOCKED**, **POST-LAUNCH**. Approved directions are not listed as awaiting approval.
- **Priority:**
  - **P0** — on the critical path for the 30-day launch; needed now or has long lead time.
  - **P1** — required for launch but later in the plan (Weeks 2–3).
  - **P2** — non-blocking; can follow.
- Development continues locally in the meantime. An item is a **blocker** only where noted, and "blocks publishing" does not mean "blocks development".

**Current client priority order (25-09-2026):** P0 NJEN-owned Supabase access · P1 approved Homepage/About copy, images and assets · P2 contact-form routing and approved wording · P3 production domain/DNS when ready to deploy.

GitHub access is **accepted and available**. The code is **confirmed pushed** to https://github.com/NJEnetwork/njen-website (branch `main`, commit `8bffc97`), verified 28-09-2026 from the local Git metadata; that repository is **private**. A second repository, https://github.com/NJentertainmentnetwork/njen-website, now exists, is **empty**, and is **public** — NJEN must confirm which repository is official, and make the new one private before any code is moved there (see A2a). Vercel is **reported as connected**; the developer has **not** been given Vercel access, so no dashboard or build log has been inspected and no deployment result is verified.

Only **Home, Jobs, Career Center, Industry / Production and Publications** are public today. Other launch sections are built but return 404 until approved content exists (decision R5).

---

## 1. Infrastructure / access

| ID | Priority | Requirement | Status | Needed from NJEN |
|---|---|---|---|---|
| A2 / D1 | — | NJEN GitHub organization and repository | **RESOLVED — CODE PUSHED** | Verified 28-09-2026: local `main` and `origin/main` both at commit `8bffc97`, reflog shows `update by push`. Repository https://github.com/NJEnetwork/njen-website is **private**. The client performs all Git operations. |
| A2a | **P1** | Which repository is official, and its visibility | **OPEN — CLIENT DECISION REQUIRED** | https://github.com/NJentertainmentnetwork/njen-website exists but is **empty and public**. Confirm which repository is official. If the new one is chosen, **make it private first** — the working tree contains business rules, cost assessments, the post-launch roadmap and NJEN's supplied documents. No migration until NJEN confirms and approves. |
| D7 | — | Developer repository access | **RESOLVED** | Invitation accepted. |
| A3 | **P3** | Protected, no-index staging environment | **PENDING VERIFICATION** | Needed for the Week 1 working staging demonstration. Depends on D2. Vercel Authentication protects staging at no extra cost (verified 22-09-2026); NJEN reviewers use free viewer seats. |

## 2. Technical provider access

All accounts must be NJEN-owned or fully recoverable by NJEN (Business Rules section 15). The developer is invited; no passwords are shared.

| ID | Priority | Provider / decision | Status | Needed from NJEN |
|---|---|---|---|---|
| D2 / T4 | **P1** (raised 28-09-2026) | Vercel | **UNVERIFIED — DEVELOPER ACCESS NOT PROVIDED** | As of 28-09-2026 the developer has **no** Vercel access: no dashboard, no logs, no deployment URL. Needed: project name and team/scope; connected repository **and branch**; viewer access or an exported build log; the deployment URL; plan confirmation (**Hobby is non-commercial only**); Vercel Authentication enabled on Preview. Code-side causes are ruled out — a clean `npm ci` + `next build` with **zero** env vars passed (24 routes). Unverified hypothesis: the project may be connected to the **empty** new repository. See `DAY10_IMPLEMENTATION_REPORT.md` §4–§6. |
| D4 / T1 | **P0 — TOP PRIORITY** | Supabase / PostgreSQL | **APPROVED — ACCESS PENDING** | Create the NJEN-owned organization/project and invite the developer. This is the single blocker for Payload, real jobs, publications and all CMS content. Migrations (prepared in `db/migrations/`), RLS and the restore test are developer work. |
| T3 | **P0** | Payload CMS deployment context | **APPROVED — NOT IMPLEMENTED** | Runs inside the NJEN app; needs D2 and D4 first. |
| D5 / T5 | **P1** | Resend (transactional email) | **APPROVED — ACCESS PENDING** | NJEN-owned account; sending-domain DNS access (see D3). |
| T5a | **P1** | Newsletter CMS/archive | **APPROVED — LOCAL PREPARATION COMPLETE** | Public editorial archive is a launch requirement. External mass-email/newsletter provider is **NOT APPROVED / NOT REQUIRED**. Future public/member visibility uses one content system; member access is post-launch. |
| D6 / T7 | **P1** | Sentry (monitoring) | **APPROVED — ACCESS PENDING** | NJEN-owned account; developer invite. Active monitoring is a launch acceptance rule. |
| D6 / T6 | **P1** | Plausible (analytics) | **APPROVED — ACCESS PENDING** | NJEN-owned account; developer invite. |
| T8 | **P1** | Backup retention / point-in-time recovery | **OPEN — CLIENT DECISION REQUIRED** | A tested restore is required either way. |
| T11 | **P1** | Supabase Data API configuration for the CMS database (**ARCH-1**) | **DEVELOPER RECOMMENDATION — NJEN MAY OBJECT** | By default Supabase exposes the `public` schema through its Data API, which is also where Payload stores its tables. Recommended option A: remove `public` from the exposed schemas (or disable the Data API), plus RLS on Payload tables. No action needed unless NJEN objects before Week 2 setup. See `SUPABASE_PAYLOAD_RESPONSIBILITY_MODEL.md` §3. |
| T9 | **P2** | GitHub plan (Free or Team) | **OPEN — CLIENT DECISION REQUIRED** | Team adds protected branches on a private repository; Free is enough to start. |
| T2 | — | Authentication | **DEFERRED** | No member accounts at launch; staff login/MFA is configured with Payload (T3). |
| T10 | — | Payment provider | **POST-LAUNCH** | — |

## 3. Domain / DNS

| ID | Priority | Requirement | Status | Why |
|---|---|---|---|---|
| C13 / D3 | **P3** | Production domain name and DNS access | **PENDING CLIENT** | Canonical URLs, sitemap, social metadata, email sending domain (DNS changes have lead time), and launch. Canonical URLs and `sitemap.xml` were built on 23-09-2026 and switch on automatically once the domain is set as `NJEN_SITE_URL`; no domain is assumed meanwhile. |

## 4. Client content

Each item blocks **publishing** its section, not development. Sections stay hidden until their content is approved.

| ID | Priority | Content | Section | Status |
|---|---|---|---|---|
| C11 | **P1** | Initial verified job listings, each with the employer's own application method or link (Business Rules section 4), **or** approval to launch with an empty board. The board now has a tested empty state. | `/jobs` | **PENDING CLIENT** |
| C1 | **P1** | About copy (first content batch, Business Rules section 16) | `/about` | **PENDING CLIENT** |
| C2 | **P1** | Homepage copy corrections and approved real photography (first content batch) | `/` | **PENDING CLIENT** |
| C3 | P1 | Approved What's Filming entries | `/whats-filming` | **PENDING CLIENT** |
| C4 | P1 | Event listings: title, category, date/time, location, description, registration link | `/events` | **PENDING CLIENT** |
| C5 | P1 | Resource and education listings | `/resources` | **PENDING CLIENT** |
| C6 | P1 | Children & Parents content | `/children-parents` | **PENDING CLIENT** |
| C7 | P1 | Social Media Safety guidance (nine approved topics) | `/social-media-safety` | **PENDING CLIENT** |
| C8 | **P2** | Official contact details, enquiry owners, and approved wording for the contact form (the form exists as preview-only and sends nothing) | `/contact` | **PENDING CLIENT** |
| C9 | P1 | Membership explanation copy | `/membership` | **PENDING CLIENT** |
| C10 | P1 | Career pathway guides and Internship Exchange structure | `/careers` (live) | **PENDING CLIENT** |
| C14 | P1 | Curated housing / practical resources, with sources | `/resources/housing` | **PENDING CLIENT** |
| C15 | P1 | Mental Health for Artists educational content and vetted external resources | `/resources/mental-health` | **PENDING CLIENT** |

## 5. Assets

See `ASSET_REQUIREMENTS.md` for formats and sizes.

| ID | Priority | Requirement | Status |
|---|---|---|---|
| B10 | P1 | Approval of the current hero artwork, which shows the domain **whatsfilminginnj.com**. Is the domain NJEN-owned, and should anything link to it? On desktop the "Now building" card intentionally overlaps its lower-left corner; on phones and tablets it now sits below the artwork. | **PENDING CLIENT** |
| C12 | P2 | Logo variants, final favicon source, social links, and a 1200×630 social-sharing image; asset inventory with usage rights. The current favicon is derived from the existing logo. | **PENDING CLIENT** |
| C16 | P2 | Approved brand typeface. The site requests Inter but loads no webfont, so system fonts are used. | **PENDING CLIENT** |
| B17 | P2 | Awareness of an accessibility colour adjustment: the orange CTA button now uses a darker orange (`#c9460b`) to meet WCAG AA contrast (was 3.3:1, now 4.8:1). The hero and decorative accents keep the original orange. | **PENDING CLIENT** (confirmation only) |

## 6. Legal approvals

| ID | Priority | Requirement | Status |
|---|---|---|---|
| B6 | P1 | Privacy, Terms, Accessibility, consent and disclaimer wording, including the mental-health "not a substitute for professional care" wording. Needed before forms (Week 3) and launch. | **PENDING CLIENT** |
| B13 | P1 | Whether Mental Health for Artists shows crisis/emergency information, and its approved wording. Decide before that section is published. | **PENDING CLIENT** |

## 7. Client business decisions

| ID | Priority | Decision | Status |
|---|---|---|---|
| X3 | P1 | **Launch-scope confirmation.** NJEN's 22-09-2026 list calls Children & Parents, Housing, Mental Health, Social Media Safety, Internships/Career Launch, Community events and Shortcuts "post-launch". Their *public information pages* are already approved for launch (Business Rules §3, R1, R2). Recommended reading: the launch keeps those information pages; the expanded functionality is post-launch. No delay either way — the pages stay hidden until content arrives. See `MASTER_BUSINESS_RULES_ADDENDUM.md` §5. | **OPEN — CLIENT CONFIRMATION REQUIRED** |
| B3 | P1 | Job moderation SOP; whether pay ranges must be displayed; default expiration when no closing date exists. Needed for the Week 2 jobs build. | **OPEN — CLIENT DECISION REQUIRED** |
| B7 | P1 | Initial admins/editors/moderators and approval levels. Needed for Payload roles. | **PENDING CLIENT** |
| B5 | P1 | What's Filming sources, rights/sensitivity rules, update owner | **OPEN — CLIENT DECISION REQUIRED** |
| B12 | P1 | Housing inclusion criteria | **PENDING CLIENT** |
| B15 | P1 | Industry / Production public wording (page is live; wording restates approved rules) | **PENDING CLIENT** |
| B16 | P1 | Homepage claims describing post-launch features ("Mobile-first member tools", "education partners", "Now building") | **PENDING CLIENT** |
| B14 | P2 | Membership public wording | **PENDING CLIENT** |
| B1 | P2 | Final public section names; current labels are usable meanwhile | **OPEN — CLIENT DECISION REQUIRED** |
| B11 | P2 | NJEN Singles Mixers membership claim; only matters once events content mentions it | **OPEN — CLIENT DECISION REQUIRED** |
| B2 | — | Membership tiers, pricing, billing, cancellation/refund, activation | **POST-LAUNCH** |
| B4 | — | Shortcuts to Hollywood price, entitlement, delivery, download/view rules | **POST-LAUNCH** |

## 8. Post-launch (planned, not implemented)

These are **not launch dependencies**. The owner decisions below are needed only before the related post-launch phase is built (see `POST_LAUNCH_DEVELOPMENT_ASSESSMENT.md`):

- **SAG-AFTRA discount (Phase A):** verification method; evidence retained and for how long; re-check interval; what happens when eligibility lapses; discount stacking, rounding and tax.
- **Additional photos (Phases B/E):** maximum number; one-time vs recurring fee; free photo replacement; refunds; base performer price.
- **Studio Teachers / Set Teachers (Phase F):** listing fields and any credential or licence details.
- **Payment provider (T10):** processor choice for membership, photos, Shortcuts and paid events.


Background performer program and directory; age and guardian model; industry verification and the protected Industry/Production Portal; member accounts, saved jobs, alerts and personalization; CRM/advanced admin; payments and Shortcuts purchase/delivery; crew, services and catering directories; referral/commission automation; ATS/applications; advanced AI. All are **POST-LAUNCH**. They are planned in `DATABASE_AND_ROLE_MODEL.md`, `FUTURE_PROOF_ARCHITECTURE.md` and `POST_LAUNCH_DEVELOPMENT_ASSESSMENT.md`.

## Confirmed decisions

| ID | Decision | Status |
|---|---|---|
| R1 | Housing / Practical Resources is in the initial public launch, within Resources | **APPROVED** |
| R2 | Mental Health for Artists is in the initial public launch, within Resources | **APPROVED** |
| R3 | Public informational Industry / Production entry point; protected portal remains post-launch | **APPROVED** |
| R4 | Shortcuts is a membership benefit and separately purchasable; payment/delivery are not approved | **APPROVED** |
| R5 | No empty "in preparation" or "coming soon" pages | **APPROVED** |
| R6 | Supabase/PostgreSQL, Payload, Vercel, Resend, Plausible and Sentry are approved technical directions | **APPROVED** |
| R11 | Newsletter/Publications CMS archive is a launch requirement. It supports public issues now and future members-only visibility later; no external mass-email platform, member authentication, or member-only access is in launch scope. | **APPROVED 24-09-2026** |
| R7 | Performer profiles include **2 photos**. Additional photos cost **$25 each** (Admin-configurable; **supersedes the $20 in Business Rules v1.0 §7**). Payment for additional photos is automated (post-launch). | **APPROVED 22-09-2026 — POST-LAUNCH** |
| R8 | **Verified SAG-AFTRA members receive 40% off** the comparable regular/non-union membership price. Price, discount % and eligibility are Admin-configurable, and eligibility must be verified, never self-declared. | **APPROVED 22-09-2026 — POST-LAUNCH** |
| R9 | Performer directory is private: portal-only, for verified/approved industry users, with **no directory-access fee** for qualified industry users. Public users and performers cannot browse it. | **APPROVED 22-09-2026 — POST-LAUNCH** |
| R10 | Future roadmap confirmed, including the new **Studio Teachers / Set Teachers** category and **Unions & Guilds / Career Pathways** | **APPROVED 22-09-2026 — POST-LAUNCH** |
