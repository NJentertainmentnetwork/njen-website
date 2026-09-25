# NJEN - Week 1 Day 5 Implementation Report

**Date:** 22-09-2026
**Type of work:** documentation, business-rule update, architecture validation and post-launch planning
**Final status:** COMPLETE WITH CLIENT DEPENDENCIES

This report records everything done on Day 5: what changed, why, what was verified, what remains pending, and whether any of it affects the 30-day public launch. It is based on an audit of the actual repository after the work was completed, not on memory. Figures are taken from the documents and checks named in each section.

---

## 1. Summary

On 22-09-2026 NJEN sent new business requirements covering:
- the Background Performer Directory (photo rules and pricing, directory privacy, free industry access);
- membership pricing (a 40% SAG-AFTRA discount);
- a list of future NJEN areas to preserve;
- an infrastructure and cost comparison;
- the final launch QA requirements.

Day 5 captured every one of these in the project's master documentation **without building any of them**, because they are post-launch systems. The current code was then reviewed to confirm it will not need rebuilding when those systems arrive. The review found no problem in the code. It found one configuration risk to settle before Week 2 (ARCH-1) and one wording ambiguity for NJEN to confirm (X3). Neither delays the launch.

**No application code, configuration or dependency was changed.** No GitHub, deployment, provider-account or credential activity took place.

---

## 2. Client feedback addressed on Day 5

### A. Background Performer Directory (POST-LAUNCH)
- Each performer profile includes **2 photos**.
- Additional photos cost **$25 per photo** (current value). **The price is Admin-configurable** and must not be hard-coded.
- Performers create and manage **only their own** profile.
- **Public users cannot** browse or search the full performer database. **Performers cannot** either.
- The full directory is **private**. Only **verified/approved industry users** can use it, through the protected **Industry/Production Portal**.
- Qualified studios, production companies, casting professionals and approved industry users get directory access with **no directory-access fee**.
- Verification, moderation, privacy and security controls are required.
- Future payments for additional photos must be **automated**.

### B. Membership (POST-LAUNCH)
- **Verified SAG-AFTRA members receive a 40% discount** from the comparable regular/non-union membership price.
- Membership price, discount percentage and eligibility rules are all **Admin-configurable**.
- SAG-AFTRA eligibility must be **verified**. A self-selected checkbox never qualifies anyone for the discount.

### C. Future requirements retained (POST-LAUNCH)
- Production Crew & Crafts Directory
- Studio Teachers / Set Teachers (new category)
- Unions & Guilds / Career Pathways (new named area)
- Internships / Career Launch
- Children & Parents
- Housing / Practical Resources
- Mental Health for Artists
- Social Media Safety / Consumer Protection
- Production Services / Catering
- Private Industry/Production Portal
- Community events / mixers
- Shortcuts to Hollywood as a membership benefit and a separate purchase
- Future CRM/admin, payments, secure storage, email, security, backups and maintenance

**All of the above are POST-LAUNCH.** The 30-day public launch was not expanded. See section 17 for how launch-approved information pages relate to this list.

---

## 3. Business rule change: $20 → $25 per additional photo

| | Before (v1.0) | Now (Addendum v1.1) |
|---|---|---|
| Source | *NJEN Developer Master Business Rules v1.0*, §7: "The previously discussed extra-photo concept is $20 per additional photo, but Viral must treat pricing as configurable rather than hard-coded." | NJEN instruction, 22-09-2026 |
| Additional photo price | $20 | **$25 per photo** |
| How the price is held | Configurable (already required by v1.0) | **Admin-configurable**; $25 is the current configured/business value |
| In application code | Never hard-coded | Never hard-coded |
| At purchase | — | The **actual price applied is snapshotted** on each purchase, so a later price change never alters past records |

**Why the new rule wins.** v1.0's own change-control rule says changes must be recorded as explicit decisions. NJEN's latest instruction is the newest business decision, so it supersedes v1.0 §7. It is recorded as change **1.1-A** in `MASTER_BUSINESS_RULES_ADDENDUM.md` and as confirmed decision **R7** in the register.

**Verified.** No active $20 photo rule remains in the repository. The only $20 photo references are:
- the change-log line in the addendum, which marks it **obsolete**;
- register item R7, which says it is **superseded**.

The client's v1.0 PDF still contains the original wording. It is NJEN's document and was not edited; the addendum overrides it. Other `$20` figures in the repository are unrelated provider prices (Vercel and Resend).

---

## 4. Complete inventory of files changed on Day 5

Evidence: file modification timestamps on 22-09-2026. The project folder is not a Git repository, so no `git diff` is available.

| File | Created / Modified | Purpose | Main changes | Why required | Affects |
|---|---|---|---|---|---|
| `MASTER_BUSINESS_RULES_ADDENDUM.md` | **Created** | Current business-rule record (v1.1) | Change log; performer photo and directory rules; SAG-AFTRA rule; open owner decisions; future requirements list; scope clarification X3 | The client's v1.0 PDF can't be edited; new rules need a versioned home | Post-launch rules; X3 touches launch wording only |
| `SUPABASE_PAYLOAD_RESPONSIBILITY_MODEL.md` | **Created** | Who owns which data | Ownership split; one database with two boundaries; migrations; ARCH-1; jobs ownership; staff vs member identity; pricing configuration | NJEN asked how the two systems work together without duplication | Launch setup (Week 2) and post-launch |
| `INFRASTRUCTURE_AND_COST_ASSESSMENT.md` | **Created** | Provider comparison, costs, ownership | 7 providers × 13 attributes; launch vs post-launch costs; ownership/access model; sources | Explicit client request | Launch and post-launch |
| `LAUNCH_QA_CHECKLIST.md` | **Created** | Launch QA requirements with honest status | Every client QA requirement, marked COMPLETE / PENDING / POST-INFRASTRUCTURE / FINAL PRE-LAUNCH | Explicit client request | Launch |
| `DAY5_IMPLEMENTATION_REPORT.md` | **Created** (this file; rewritten after the audit) | Day 5 record | This report | Required deliverable | — |
| `DATABASE_AND_ROLE_MODEL.md` | **Modified** | Data and permission model | Launch vs future data; jobs moved to Payload; performer photo, allowance and purchase records; membership, discount, eligibility and pricing records; roles and denial tests | New performer and membership rules; duplicate jobs ownership found | Post-launch (launch data section clarifies Week 2) |
| `FUTURE_PROOF_ARCHITECTURE.md` | **Modified** | Target architecture | Six new principles; payment-provider boundary; storage and route rules; risk register ARCH-1 to ARCH-8 | Architecture check requested | Week 2 setup and post-launch |
| `POST_LAUNCH_DEVELOPMENT_ASSESSMENT.md` | **Modified** | Post-launch roadmap | Restructured into Phases A–J with scope, dependencies, components, security, data, payments, verification, effort, costs | NJEN's new requirements and suggested order | Post-launch only |
| `TECHNICAL_RECOMMENDATIONS.md` | **Modified** | Why each provider was chosen | Pointer to the new cost document; staging-protection cost corrected (section 11) | Keep costs in one place; correct an outdated figure | Launch cost estimate |
| `WEEK1_CLIENT_INPUT_REGISTER.md` | **Modified** | Client dependencies | New X3 and T11 (P1); post-launch owner decisions listed separately; confirmed decisions R7–R10; staging protection note | Record new decisions without creating false blockers | Launch planning and post-launch |
| `README.md` | **Modified** (appended only) | Entry point | Documentation map | Growing document set needed a reading order | — |
| `tsconfig.tsbuildinfo` | Regenerated automatically | TypeScript build cache | Rewritten by `npm run typecheck`; no manual change | Side effect of running QA | — |

**Verified unchanged:**
- All application code under `app/`, `components/`, `lib/`, `data/`, `db/` and `public/`. The newest code timestamp is 21-09-2026 (Day 4), and `lib/jobs.ts` is byte-identical to its Day 4 backup.
- `package.json` and `package-lock.json` are byte-identical to the 17-09-2026 post-dependency-cleanup snapshot.
- `tsconfig.json`, `next-env.d.ts`, `.gitignore` and `.env.example` are unchanged since Day 4 or earlier.
- The client's PDF and DOCX documents are unchanged.

---

## 5. MASTER_BUSINESS_RULES_ADDENDUM.md in detail

**Why an addendum.** The *Master Business Rules v1.0* is NJEN's own signed-off PDF. Editing it would hide what changed. An addendum keeps v1.0 intact, lists every change with its source and date, and states that "where this addendum and v1.0 differ, this addendum is current". This follows v1.0's change-control rule.

**Contents:**
- **Change log (1.1-A to 1.1-E):**
  - A: the $20 → $25 change.
  - B: 2 included photos, and no directory-access fee for qualified industry users.
  - C: the 40% SAG-AFTRA discount.
  - D: Admin-configurable prices, discounts and eligibility, plus automated photo payments.
  - E: future requirements, including Studio Teachers / Set Teachers and Unions & Guilds.
- **§1 Performer Directory:**
  - 2 included photos.
  - "Additional photo price is Admin-configurable; $25 per photo is the current configured/business value."
  - Automated payment.
  - Own-profile-only ownership.
  - No public or performer browsing.
  - Private, portal-only directory for verified industry users with no access fee.
  - Verification, moderation (including photo review), privacy, consent and security controls, with minors gated by the guardian/consent model.
- **§1 open decisions:** base performer price; maximum additional photos; one-time vs recurring fee; free photo replacement; refunds; searchable fields; minimum age and guardian workflow; industry contact rule.
- **§2 Membership:**
  - "Verified SAG-AFTRA members receive a 40% discount from the comparable regular/non-union membership price."
  - "Membership price, discount percentage and eligibility rules are Admin-configurable."
  - "SAG-AFTRA eligibility must be verified rather than relying solely on user-selected discount claims."
  - Each eligibility check is recorded (status, method, reviewer/source, dates, expiry).
  - Billing uses the configured values and records the amounts charged.
- **§2 open decisions:** tier names and prices; billing interval; cancellations and refunds; **how SAG-AFTRA eligibility is verified**; re-check interval; what happens on lapse; evidence retention; combining with other offers; rounding and tax. Union-membership data is flagged as sensitive, needing counsel review.
- **§4 Future requirements:** all listed, each **POST-LAUNCH — NOT PART OF THE 30-DAY PUBLIC LAUNCH**.
- **§5 Launch-scope clarification (X3):** see section 17.

---

## 6. DATABASE_AND_ROLE_MODEL.md in detail

**Guiding principle added:** *"Business values are configuration, not code."*
- Current configured values: additional photo **$25**, included photos **2**, SAG-AFTRA discount **40%**.
- They are stored as Admin-editable configuration with audit history.
- Every transaction **snapshots** the values applied at that moment.

**CURRENT LAUNCH DATA — all Payload-owned editorial content:**
- **Jobs:** includes the application method/URL, source, moderation status, expiry/closing date, closed/archived state and featured flag.
- **Events.**
- **What's Filming:** with its source and last-reviewed fields.
- **Resources and articles:** covering Housing, Mental Health, Children & Parents, Social Media Safety and Career Center content.
- **Media:** public editorial images only.
- **Staff users:** Admin and Editor/Moderator, with MFA for admins.
- **Launch forms (Week 3):** contact, newsletter/waitlist and moderated job submission. Submitted jobs arrive as drafts; where other submissions are stored follows the newsletter decision (T5a).

**FUTURE APPLICATION DATA — Supabase, post-launch only:**
- Identity: users (Supabase Auth), profiles, role assignments.
- Organizations and organization members.
- Verification cases, evidence and decisions — covering industry organizations, industry users and **SAG-AFTRA eligibility**.
- Industry access grants.
- Performer profiles, profile fields, consents and guardians.
- **Performer photos:** included vs additional slot.
- **Photo allowance:** included count from configuration, plus purchased count.
- **Photo purchases:** unit price snapshot, currency, configuration version, payment reference, status.
- Membership plans, `pricing_config`, `discount_rules`, `eligibility_verifications`, memberships, entitlements and `pricing_audit`.
- Payment references (never card data), receipts, audit records and file references.
- Future saved jobs, applications, notifications and CRM records.

**Why future-only.** Member accounts, the performer program, the Industry Portal, payments and CRM are all outside the 30-day launch (Business Rules §3). The records are designed now so the launch foundation doesn't need rebuilding later, but **no table, migration or database has been created**.

**Key rules documented:**
- An additional photo can only be uploaded when the allowance permits.
- The allowance increases only after the payment provider **confirms** payment through a server-side webhook.
- The SAG-AFTRA discount applies only while the linked eligibility record is **verified and current**.
- Prices are computed on the server, never taken from the browser.

**Roles updated:**

| Role | Day 5 additions |
|---|---|
| Guest | Unchanged: published public content only |
| Registered Member | Sees own membership and eligibility status; an account alone grants no directory access |
| Background Performer | Owns own photos, allowance, purchases and receipts; **cannot see the performer directory** |
| Production/Industry User | Portal scopes **including the performer directory (no access fee)**; no payment records |
| Production Company/Organization | Can submit jobs **as drafts** |
| Service Provider | Unchanged: no automatic industry access |
| Editor/Moderator | Adds **photo review**; **no access to pricing configuration** or payments |
| Admin | Adds **pricing, discount and eligibility configuration** (audited, MFA) |
| Superadmin | Unchanged: emergency/system configuration under change control |

New denial tests were added for expired SAG-AFTRA eligibility and for uploading an unpaid additional photo.

---

## 7. SUPABASE_PAYLOAD_RESPONSIBILITY_MODEL.md in detail

**Status: PLANNED — NOT IMPLEMENTED.** No Supabase project, no Payload installation and no schema exist.

**Goal:** one source of truth for every kind of record, so data is never duplicated or kept in sync by hand.

| Supabase / PostgreSQL (application data, post-launch) | Payload CMS (editorial content, launch) |
|---|---|
| Member identity (Supabase Auth), profiles, roles | Jobs |
| Organizations and members | Events |
| Performer profiles, photo metadata, consents, guardians | What's Filming |
| Verification and SAG-AFTRA eligibility | Resources, articles, education content |
| Industry access grants | Children & Parents and Social Safety content |
| Membership plans, entitlements | Housing, Mental Health and Career Center content |
| **Pricing configuration, discount rules** | Featured content, drafts, review and publish workflow |
| Payment references, receipts | Public editorial media |
| Audit records, future CRM/application data | NJEN staff editorial accounts |

**Private files** — performer photos, verification and eligibility evidence, and the Shortcuts book — go in **private Supabase Storage** buckets. They never go in Payload media.

**Shared infrastructure:**
- One NJEN-owned Supabase project, with Payload's area and an application `app` schema in the same PostgreSQL database.
- One bill, one backup and one restore test.
- Each system runs its own migrations and never alters the other's tables.

**Service boundaries:**
- Public pages read content through content services that return explicit public DTOs. `lib/jobs.ts` already does this today using sample data.
- UI components never call provider SDKs directly.
- Protected features will go through application services with server-side authorization and RLS.

---

## 8. Architecture risk register

The Day 1–4 code was checked against every future requirement. **No implemented code creates a rebuild risk.** These are the planning items found:

| ID | Issue and why it matters | Mitigation | Status | Blocks launch? |
|---|---|---|---|---|
| **ARCH-1** | Supabase automatically exposes the `public` schema through its Data API, and Payload stores its tables in `public` by default. Both facts were verified in official documentation on 22-09-2026. With default settings, CMS tables (staff users with password hashes, drafts, moderation notes) could be read through Supabase's API, **breaking the public/protected boundary**. | Recommended Option A: remove `public` from the exposed schemas (or disable the Data API while no browser code uses Supabase); enable RLS on Payload tables as a second layer; keep application tables in an unexposed `app` schema. Alternatives B (Payload's experimental `schemaName`) and C (separate projects) are documented. | Decision before Week 2 setup; register **T11** (P1, no action unless NJEN objects) | **No** — nothing is connected yet. It must be applied when Supabase is set up. |
| ARCH-2 | Payload's migrations and the application's SQL migrations share one database; uncoordinated changes could collide | Separate ownership boundaries; neither system alters the other's tables; ordered deploy steps | Documented | No |
| ARCH-3 | Jobs appeared both as Payload content and as application tables: **two sources of truth** | Jobs are **Payload-only**. Future applications and saved jobs reference the Payload job ID. Employer submissions arrive as Payload drafts. | **Resolved** in documentation | No |
| ARCH-4 | Staff sign in through Payload; future members will sign in through Supabase Auth | Deliberately separate: staff privilege must stay separate from member/industry access. Possible unification decided in Phase A. | Planned decision | No |
| ARCH-5 | Where Admin-configurable prices live. Putting money values in the editorial CMS would tie billing integrity to content tooling. | Configuration table in the app schema, editable by Admin only, with audit history; server-side calculation; snapshot per transaction | Recommendation (Phase A) | No |
| ARCH-6 | Performer photos or evidence could end up in the public CMS media library by mistake: a privacy breach and a costly clean-up | Rule: private Supabase Storage only. Payload media is for public editorial images only. | Documented rule | No |
| ARCH-7 | Post-launch order differs between documents (Implementation Plan §17 puts the performer program first; NJEN's latest list puts membership first). Paid membership, paid photos and the Shortcuts purchase all need accounts **and** a payments foundation. | Phase A = accounts + payments foundation + membership | Confirm when post-launch planning starts | No (post-launch only) |
| ARCH-8 | `/api/jobs` is a public demo endpoint that no page uses (returns sample data) | Week 2: rebuild on the Payload source, or remove | Week 2 technical decision | No |

---

## 9. FUTURE_PROOF_ARCHITECTURE.md in detail

**Target architecture:**
- One modular **Next.js** application.
- **Supabase/PostgreSQL** with a Payload boundary and an `app` schema.
- **Payload CMS** for staff-managed content.
- **Payload staff login** at launch; **Supabase Auth** for members post-launch.
- **Server-side authorization plus RLS**.
- **Private storage**.
- A server-only **payments** module (provider not chosen).
- **Resend** email module, **Plausible** analytics adapter, **Sentry** monitoring.
- **Vercel** deployment with separate development, staging and production environments.

**Six new principles:**
1. **Configurable business values:** prices, discounts, eligibility, photo counts.
2. **Server-side pricing:** the browser never supplies a price.
3. **Automated, verified payment flow:** only a verified webhook marks a payment paid and unlocks an entitlement; idempotent and audited.
4. **Evidence-based eligibility:** no self-declared discounts.
5. **Directory privacy:** portal-only; no public route, API, autocomplete or static data; no access fee.
6. **Separate protected route areas:** e.g. `/account`, `/portal`. The public `/industry` page stays informational.

**Environment rules restated:**
- Staging is access-protected and **not indexed**.
- Production is **indexable** (`NJEN_ALLOW_INDEXING=true`) with no preview flag.
- Secrets and service-role keys stay **server-only**.
- Public data leaves the server only as **explicit DTOs**.
- A **backup restore must be proven** before launch.

---

## 10. Post-launch roadmap (POST_LAUNCH_DEVELOPMENT_ASSESSMENT.md)

**These are high-level planning estimates and not a final commercial quote.** Effort ranges come from the 18-09-2026 assessment or the Implementation Plan §17. Where no approved estimate exists, the phase says "scope before estimating".

| Phase | Includes | Depends on | Key technical components | Security / verification | Payments | Effort (planning only) | Still OPEN |
|---|---|---|---|---|---|---|---|
| **A** Membership + Authentication + payments foundation | Accounts, membership plans, configurable pricing, **SAG-AFTRA eligibility (40%)**, Shortcuts entitlement | Launch platform; payment provider (T10) | Supabase Auth, `app` schema, pricing/discount/eligibility tables, payment integration, Resend | MFA for privileged users; eligibility verified with expiry; sensitive evidence private | Server-side prices, snapshots, idempotent webhooks, no card data | 6–10 weeks accounts/membership; payments foundation within the 6–12-week payments range | Tiers/prices, verification method, re-check interval, refunds, provider |
| **B** Background Performer Profiles | Own-profile management, **2 included photos**, moderation, consent, guardians | A | Performer tables, private storage, moderation queue | Ownership checks; performers can't see others; minors gated | — | 10–16 weeks | Profile fields, age/guardian rules |
| **C** Protected Industry/Production Portal | Organization/user verification, scoped access, portal area | A | Organizations, verification, access grants, audit, RLS | Highest authorization risk; admin ≠ industry privileges | — | 12–20 weeks (C + D together) | Verification criteria, review interval |
| **D** Performer Directory + Verification + Privacy | Search for verified industry users; **no access fee**; contact workflow | B, C | Protected search API, pagination, access logs, rate limits | No public route/API/autocomplete; denial tests | — | Included in C | Contact rule, searchable fields |
| **E** Additional Photo Payments + Shortcuts purchase | **Automated** purchase at the **configured price (currently $25)**; receipts; Shortcuts delivery | A, B | Photo purchases, payment references, receipts, signed delivery | Allowance unlocked only by a verified webhook | Price snapshot, reconciliation, refunds | Within the 6–12-week payments range | Max photos, one-time vs recurring, refunds, tax, Shortcuts price |
| **F** Crew & Crafts + **Studio Teachers** + Production Services/Catering | Union/non-union directory, new teacher category, provider listings | A, C | Provider organizations, listings, categories, moderation | Provider access never implies directory access | Catering commission not automated | 4–6 weeks (Implementation Plan §17) | Teacher credential fields, commission rules |
| **G** Internships / Career Launch / **Unions & Guilds** | Internship Exchange, education partners, pathways | Launch CMS; A for partners | Payload collections, optional partner accounts | Partner moderation | — | Scope before estimating | Partner rules |
| **H** Children & Parents / Housing / Mental Health / Social Safety & consumer protection | Expanding the launch information pages into full centers | Launch CMS | Payload collections | No data from minors without an approved model | — | Scope before estimating (mostly content) | Crisis wording (B13), inclusion criteria (B12) |
| **I** Community events / mixers | Registration, member entitlements (Singles Mixers free to members — pending B11) | A; E if paid | Registrations, capacity, entitlement checks | Member-only checks server-side | Paid events via the payment module | 4–8+ weeks (Implementation Plan §17) | B11, ticketing need |
| **J** CRM / advanced member tools / personalization | Operational queues, saved jobs, alerts, applications if approved, referral automation after rules | A–D | Reuse Payload staff tools; avoid CMS/CRM duplication | Least-privilege staff roles | Referral payouts only after approval | 8–14 weeks CRM; 4–8+ weeks personalization | ATS approval, referral rules |

Always-on work across every phase: secure storage, email, security reviews and denial testing, backups with restore tests, monitoring and maintenance.

---

## 11. Infrastructure and cost assessment (INFRASTRUCTURE_AND_COST_ASSESSMENT.md)

**Prices were re-verified on each provider's official pricing page on 22-09-2026.** The exception is Payload's hosted-service note, from its official site on 17-09-2026. All figures are **approximate estimates**, exclude tax, and are **not a quote**.

| Provider | Purpose | Needed | Recommended plan | Base price | Main usage cost factors | Optional features | Alternative | Lock-in |
|---|---|---|---|---|---|---|---|---|
| GitHub | Code, history, review | Now (P0) | Free → Team for branch protection | Free $0; Team **$4/user/month "for the first 12 months"** (later price *not verified*) | Users; Actions beyond 2,000 min/month | — | Stay on Free | Low |
| Vercel | Hosting, staging, production | Launch (P0) | **Pro** (Hobby is non-commercial only) | **$20 per developer seat/month**, $20 usage credit included; viewers free | Extra seats; usage above credit | Password Protection **$20/project/month** — optional | Netlify / other Node host | Low–medium |
| Supabase | PostgreSQL; later auth and private storage | Launch (P0) | **Pro** (Free pauses after 1 week and has no backups) | **$25/month**, including $10 compute credit, 8 GB disk, 100,000 auth users, 100 GB storage, 250 GB egress, 100 image-transformation origins, daily backups kept 7 days; spend caps on by default | Disk $0.125/GB; storage $0.0213/GB; egress $0.09/GB; auth $0.00325/user; image transforms $5 per 1,000 | Point-in-time recovery **$100/month per 7 days**; Team plan $599/month for compliance reports | Neon (database only) | Low for data; medium with Auth/Storage |
| Payload | CMS and staff admin | Launch (P0) | Self-hosted, **MIT licence** | **$0** | Only indirect (database/storage/compute) | Hosted Payload Cloud is Enterprise-only | — (hosted CMSs add a vendor) | Medium |
| Resend | Transactional email | Launch (P1, Week 3) | **Free** | $0 (3,000/month, 100/day); Pro **$20/month** (50,000); Scale from **$90/month** | Email volume | Newsletter: free to 1,000 contacts, from **$40/month** for 5,000 (provider OPEN) | Postmark, Amazon SES | Low |
| Sentry | Error monitoring | Launch (P1) | **Team** once NJEN needs access | Developer $0 (1 user); Team **$26/month billed annually** | Error volume; $1.00 per extra uptime alert | Business $80/month | Stay on Developer; self-hosted | Low |
| Plausible | Privacy-friendly analytics | Recommended at launch (P1) | **Starter** | **$9/month** (10,000 pageviews, 1 site); Growth $14; Business $19 | Pageview tier | Annual billing: 2 months free | Vercel Web Analytics; self-hosted | Low |

**30-day launch estimate: ≈ $54–$113 per month:**
- GitHub $0–8
- Vercel $20
- Supabase $25
- Payload $0
- Resend $0–20
- Sentry $0–26
- Plausible $9–14

Excluded: domain registration and optional add-ons. No one-time setup fees were listed.

**Post-launch costs** are documented as cost factors, not estimates:
- **Payment processing fees:** provider not chosen (T10), so not priced.
- Photo storage and image transformations.
- Auth user volume.
- Email volume.
- Point-in-time recovery.
- Verification staff time.
- More seats.

**Correction made to TECHNICAL_RECOMMENDATIONS.md.** The earlier text listed staging "password protection ($20/project/month)" among likely add-ons. Vercel's documentation (read 22-09-2026) states that Vercel Authentication protects preview/staging deployments **with no paid add-on**. The document now says so: Password Protection is optional, and the launch estimate was updated from ≈ $55–$115 to ≈ $54–$113.

---

## 12. Ownership and access

**NJEN owns:**
- the GitHub organization and repository;
- Vercel;
- Supabase;
- the Payload configuration (inside NJEN's repository);
- the domain and DNS;
- all data, production infrastructure and credentials;
- email infrastructure, analytics, monitoring and backups.

**The developer receives only the access needed:**
- GitHub **Write** on the one repository (cannot delete, transfer, change visibility or manage access);
- non-Owner team membership on the other services.

Secrets live only in the hosting provider's encrypted environment settings, never in Git.

**Confirmed for Day 5:**
- No passwords were shared or requested.
- No production credentials were used.
- No GitHub operation (push, repository creation or other) was performed.
- No deployment was performed.
- No provider account was created.

---

## 13. Launch QA checklist (LAUNCH_QA_CHECKLIST.md)

Nothing is marked complete unless it was actually tested.

- **CURRENTLY COMPLETE:** verified on the local build during Days 2–5; must be re-run at final pre-launch.
  - Responsive layout at 7 widths (Chrome **emulation only**).
  - Automated accessibility scan (axe-core: 0 violations in 16 runs).
  - Keyboard: partial — homepage tab order and visible focus.
  - Colour contrast.
  - Unique titles and descriptions.
  - Unpublished sections return 404.
  - Sample jobs `noindex`.
  - No placeholder or inert controls.
  - No client-side secrets or API keys in current bundles.
  - No protected data in public APIs (current code).
  - No public performer or industry data (none exists).
  - Error pages leak no details.
- **PENDING:**
  - **Real iPhone testing.**
  - **Safari testing.**
  - **Screen-reader testing** (VoiceOver, NVDA).
  - Full-site keyboard pass with final content.
- **POST-INFRASTRUCTURE:**
  - **Staging no-index** verified on real Vercel staging (the mechanism is complete and tested locally).
  - **Canonical URLs**, **sitemap** and **Open Graph/social metadata** (need the domain).
  - **Final security review after database/CMS connection**, including ARCH-1.
  - Form validation and rate limits.
  - **Backup/restore** test.
  - **Monitoring** and **error reporting** verification.
  - Analytics.
  - Email deliverability.
- **FINAL PRE-LAUNCH:**
  - **Production indexable** (`NJEN_ALLOW_INDEXING=true` in production only).
  - **No sample/demo jobs** in production.
  - Broken-link crawl.
  - Final secret and bundle scan.
  - Final protected-route tests.
  - Rollback plan, domain/SSL, NJEN account ownership.
- **POST-LAUNCH (per phase):** final authentication/authorization denial tests before each future system goes live.

---

## 14. Client dependency register (WEEK1_CLIENT_INPUT_REGISTER.md)

**P0 — launch blockers (exact items in the register):**
- A2/D1 GitHub organization and empty private repository.
- D7 developer invited with Write.
- A3 protected, no-index staging.
- D2/T4 Vercel.
- D4/T1 Supabase.
- T3 Payload deployment context.
- C13/D3 production domain and DNS.
- C11 verified job listings (with application method) or approval of an empty board.
- C1 About copy.
- C2 Homepage copy and approved photography.

**P1 — important (new today):**
- **X3**, launch-scope confirmation (section 17).
- **T11 / ARCH-1**, Supabase Data API configuration. This is a developer recommendation, so no action is needed unless NJEN objects before Week 2.
- **Neither blocks the launch.**

**P1/P2 otherwise unchanged:** section content, legal wording, moderation and staff decisions, Resend/Sentry/Plausible access, assets, naming.

**Confirmed decisions added:**
- R7: 2 photos; $25 configurable; supersedes $20.
- R8: 40% SAG-AFTRA, configurable and verified.
- R9: private directory with no access fee.
- R10: future roadmap, including Studio Teachers and Unions & Guilds.

**Future features were not turned into launch dependencies.** New owner decisions — the SAG-AFTRA verification method, photo limits, refunds, Studio Teacher fields, the payment provider — are listed in the register's post-launch section. The final audit confirmed **no P0 row concerns a future system**. An automated search flagged C2 only because "photography" contains the word "photo"; C2 is current homepage content.

---

## 15. README documentation map

A "Project documentation map" table was **appended** to `README.md`; the original Release 1.3 text is unchanged. It tells developers and NJEN where to find:
- the business rules (v1.0 PDF plus the v1.1 addendum);
- client inputs and priorities;
- launch QA;
- architecture;
- the database and role model;
- the Supabase/Payload responsibilities;
- providers, costs and ownership;
- the post-launch roadmap;
- GitHub access;
- assets;
- the daily reports.

---

## 16. Consistency sweep (performed on the final repository state)

| Check | Result |
|---|---|
| No active $20 additional-photo rule | **PASS**: 0 active; the 2 historical mentions are marked obsolete/superseded |
| $25 is the current value and always configurable | **PASS**: 1 automated flag was a heading whose next line says configurable (reviewed manually) |
| 2 included photos current | **PASS**: in the addendum, data model, architecture, roadmap and register |
| 40% SAG-AFTRA discount current and configurable | **PASS**: 1 automated flag was the addendum line "40% is the current configured/business value" (reviewed manually) |
| Eligibility must be verified; a checkbox never qualifies | **PASS**: every checkbox/self-declaration mention is negated |
| Performer directory protected | **PASS**: 1 automated flag was a report heading whose bullets say private/portal-only (reviewed manually) |
| No directory-access fee for qualified industry users | **PASS**: in the addendum, data model, roadmap and register |
| Future photo payments automated and post-launch | **PASS** |
| All future systems post-launch; roadmap states so explicitly | **PASS** |
| Jobs single source of truth | **PASS**: old table names appear only in the explanatory note |
| Register IDs cited in code still resolve | **PASS**: 21 of 21 |
| Launch scope unchanged | **PASS**: no P0 row concerns a future system |

**Sweep result: PASS. No genuine contradiction remains.** The only unresolved item is a scope *wording* question for NJEN (X3), not a contradiction between documents.

---

## 17. Launch-scope clarification (X3)

NJEN's list describes Children & Parents, Housing, Mental Health, Social Media Safety, Internships/Career Launch, Community events and Shortcuts as post-launch. Their **public information pages** are already approved for launch:
- Business Rules §3.
- Register R1 (Housing) and R2 (Mental Health), 17-09-2026.
- Shortcuts at launch is architecture only.

**Recommended reading:** keep those information pages in the launch; the **expanded functionality** (directories, registrations, mixers, partner workflows, purchases) is post-launch.

**Launch impact: none either way.** Those pages are already built but hidden (404) until NJEN supplies content. Recorded as **X3 (P1)**.

---

## 18. Code / implementation check

The audit found no code or implementation work on Day 5:
- **No** application code changed; the newest code file is dated 21-09-2026 (Day 4).
- **No** dependency or package change; both package files are byte-identical to the 17-09-2026 snapshot.
- **No** database, Supabase project or Payload project was created.
- **No** Supabase, Payload or payment packages or code exist in the repository.
- **No** authentication, payments, performer system, membership system or Industry Portal was implemented.
- **No** GitHub operation or deployment was performed. The folder is not a Git repository; evidence is file timestamps and hashes.

---

## 19. QA / verification results (final run, 22-09-2026, production build on localhost)

| Check | Result |
|---|---|
| TypeScript (`npm run typecheck`) | **PASS** |
| Production build (`npm run build`) | **PASS**: 23 pages, 0 warnings |
| Published pages | **7 of 7 → 200** (`/`, `/jobs`, 3 job details, `/careers`, `/industry`) |
| Public utility files | **2 of 2 → 200** (`/robots.txt`, `/favicon.ico`) |
| Hidden (unpublished) sections | **10 of 10 → 404** |
| Protected/admin/portal probes | **19 of 19 → 404** (incl. `/admin`, `/login`, `/portal`, `/industry/portal`, `/directory`, `/api/performers`, `/.env`) |
| Day 5 future-feature probes | **14 of 14 → 404** (`/performer`, `/performers/search`, `/membership/pricing`, `/pricing`, `/checkout`, `/api/checkout`, `/api/payments`, `/photos`, `/api/photos`, `/sag-aftra`, `/api/eligibility`, `/crew`, `/production-services`, `/studio-teachers`) |
| `robots.txt` | `User-Agent: * / Disallow: /` (safe default; production switch documented) |
| Public pricing / SAG-AFTRA / performer / signup text on the 7 public pages | **0 occurrences** |
| Browser bundles (`.next/static`) | **0 files** containing any of 13 sensitive patterns (SAG, pricing/discount names, Supabase/service-role, `process.env`, internal flags, token/key signatures) |
| Source secret scan | **None found**; only env file is `.env.example` (placeholders) |
| `/api/jobs` response | Only the 11 public job fields; still labelled `sample-data` (ARCH-8) |
| Server shutdown / port cleanup | Server stopped; port 3000 free |

An earlier Day 5 run probed 28 protected/future paths with a different mix. The final audit probed 33 (19 + 14). All returned 404 in both runs.

Real iPhone, Safari and screen-reader testing were **not** performed. They remain PENDING.

---

## 20. 30-day public launch impact

- The 30-day public launch scope was **not expanded**.
- **No future feature was implemented.**
- The current public site was **not changed or replaced**: the same 7 published pages, same navigation, same hidden sections.
- Day 5 was documentation and architecture validation. Future requirements were preserved **without delaying** current development.
- Remaining launch dependencies are **client and infrastructure related**, not caused by Day 5.

**Current launch status: AT RISK.** This is based on repository evidence, not on Day 5 work:
- Register items A2/D1, D7 and A3 are **BLOCKED**, and D2/T4, D4/T1 and C13/D3 are **access pending**. No GitHub repository, Vercel project, Supabase project or domain has been provided.
- The Week 1 deliverable (a working staging demonstration) and all of Week 2's core work (Payload collections, real database-backed jobs) cannot start until that access exists.
- Launch content (C1, C2, C11 and the P1 section content) is also pending. Under decision R5, sections stay hidden until their content arrives.
- **Local development is not blocked.** The code is launch-ready at the foundation level and verified. The risk is elapsed time on the critical path: the longer access is delayed, the less time remains for Weeks 2–4.

---

## 21. What remains pending

**A. Current launch work**
- Week 1 working staging demonstration.
- Week 2: Payload set-up and collections (jobs, events, What's Filming, resources); switch `lib/jobs.ts` to Payload; Supabase with the ARCH-1 configuration; first migrations.
- Week 3: forms, Resend, SEO (canonical URLs, sitemap, social metadata), Sentry, Plausible.
- Week 4: final QA, including real iPhone/Safari and screen readers, and deployment.
- Can start locally now: draft Payload collection definitions and application migrations from the Day 5 documents.

**B. Client dependencies**
- P0: as listed in section 14.
- P1: X3 confirmation; section content; legal wording (B6, B13); moderation SOP (B3); staff users (B7); newsletter provider (T5a); backup level (T8).

**C. Infrastructure dependencies**
- NJEN-owned GitHub, Vercel, Supabase, Resend, Sentry and Plausible accounts, with developer invitations.
- Domain and DNS.

**D. Week 2 technical decisions**
- ARCH-1: Supabase Data API configuration (Option A recommended).
- ARCH-8: rebuild or remove `/api/jobs`.
- Confirm the migration ordering (ARCH-2) at set-up.

**E. Post-launch work**
- Phases A–J (section 10).
- Their owner decisions: SAG-AFTRA verification method, photo limits and refunds, payment provider, Studio Teacher fields, verification criteria, contact rule, minors model.

---

## 22. Final Day 5 status

```
DAY 5 STATUS
================================

Documentation updates        DONE
Business rules update        DONE
Architecture review          DONE
Database/role model update   DONE
Payload/Supabase model       DONE
Post-launch roadmap          DONE
Infrastructure assessment    DONE
Launch QA checklist          DONE
Dependency register          DONE
Consistency sweep            PASS
TypeScript                   PASS
Production build             PASS
Application code changes     NONE
GitHub operations            NONE
Deployment                   NONE
```

**Final status: COMPLETE WITH CLIENT DEPENDENCIES.**

Day 5's documentation and architecture work is complete and verified. The next implementation steps — staging, Supabase and Payload set-up — depend on NJEN providing the P0 access items. The 30-day launch is at risk because of that access dependency, not because of any Day 5 change.
