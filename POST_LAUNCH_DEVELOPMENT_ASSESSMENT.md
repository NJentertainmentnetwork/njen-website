# NJEN Post-Launch Development Assessment

**Status:** High-level planning assessment. Created 18-09-2026; restructured 22-09-2026 for NJEN's latest requirements (Business Rules Addendum v1.1).

**This is not a quote or commitment.** Effort ranges exclude client review delays, content preparation, legal review, provider overages and third-party fees. Commercial cost is the agreed delivery rate applied to the approved scope.

**Every phase in this document is POST-LAUNCH — NOT PART OF THE 30-DAY PUBLIC LAUNCH.** Nothing here has been implemented. The 30-day launch scope is unchanged (see `WEEK1_CLIENT_INPUT_REGISTER.md` and `LAUNCH_QA_CHECKLIST.md`).

## Phase overview

The phases follow NJEN's latest suggested order (A–J), cross-checked against technical dependencies. Two foundations are needed early by several later phases:

1. **Accounts/authentication** — needed by B, C, D, E, I and J.
2. **Payments foundation** — needed by A if membership is paid at activation, and by E and the Shortcuts purchase.

For that reason both sit in Phase A.

| Phase | Outcome | Indicative effort | Depends on |
|---|---|---:|---|
| **A** | Membership + Authentication (incl. payments foundation, configurable pricing, SAG-AFTRA eligibility) | 6–10 weeks accounts/membership; payments foundation within the 6–12-week payments range below | Launch platform; payment provider choice (T10) |
| **B** | Background Performer Profiles (2 included photos, own-profile management, moderation, consent) | 10–16 weeks | A |
| **C** | Protected Industry/Production Portal (organization verification, scoped access) | 12–20 weeks for C + D together | A |
| **D** | Performer Directory + Verification + Privacy (search for verified industry users, no access fee) | Included in the C range above | B, C |
| **E** | Additional Photo Payments ($25 configurable) and Shortcuts separate purchase | Within the 6–12-week payments range; smaller once A's foundation exists | A (payments), B |
| **F** | Crew & Crafts Directory (incl. Studio/Set Teachers) + Production Services/Catering | 4–6 weeks (Implementation Plan §17 estimate for crew, services and partners) | A, C |
| **G** | Internships / Career Launch / Unions & Guilds / Career Pathways expansion | Scope before estimating | Launch CMS; A for partner accounts |
| **H** | Children & Parents, Housing, Mental Health, Social Safety / consumer-protection expansion | Scope before estimating (mostly content and CMS work) | Launch CMS |
| **I** | Community events / mixers (registration, member entitlements) | 4–8+ weeks (Implementation Plan §17 community estimate) | A; E if paid events |
| **J** | CRM / advanced admin, advanced member tools, personalization | 8–14 weeks CRM/admin; personalization 4–8+ weeks | A–D |

Where these ranges come from:
- A (accounts/membership), B, C + D, J (CRM) and the payments range: this assessment's 18-09-2026 figures.
- F and I: the Implementation Plan §17.
- G and H: no approved estimate exists, so they are not invented here.

The phases are not strictly sequential. Several can overlap once A is in place.

---

## Phase A — Membership + Authentication

- **Scope:**
  - Registration, sign-in, recovery, verified email, account area.
  - Membership plans and entitlements.
  - **Admin-configurable** membership prices, discounts and eligibility rules.
  - **SAG-AFTRA eligibility verification**, with a 40% configured discount off the comparable regular/non-union price.
  - Payments foundation: server-side checkout, webhooks, receipts.
  - Shortcuts to Hollywood as a membership entitlement.
- **Major components:**
  - Supabase Auth and an `app` schema (profiles, roles).
  - `membership_plans`, `discount_rules`, `pricing_config`, `eligibility_verifications`, `memberships`, `entitlements`.
  - Payment provider integration.
  - Resend account emails.
  - Admin configuration screen (location decided here — ARCH-5).
- **Security:** MFA for privileged users; server-only price calculation; audit of pricing changes. An account never unlocks directories.
- **Data:** union-membership evidence is sensitive. Store it in a private bucket, with minimum retention and counsel-reviewed rules.
- **Payments:** prices snapshotted per transaction; idempotent webhooks; no card data stored.
- **Verification:** the SAG-AFTRA **method is an OPEN owner decision** (for example staff review of evidence). The system records status, method, reviewer, dates and expiry. A checkbox never qualifies.
- **Cost factors:** payment processing fees; Supabase Auth monthly active users beyond the included allowance; email volume; staff time for manual verification.
- **Third-party services:** Supabase (Auth, database, storage), payment provider (not yet chosen), Resend.

## Phase B — Background Performer Profiles

- **Scope:**
  - Performer-owned profiles, with **2 included photos**.
  - Photo upload and moderation.
  - Consent and privacy status.
  - Guardian model for minors before minor profiles activate.
- **Major components:** `performer_profiles`, `performer_photos` (included vs additional slots), `performer_photo_allowance`, `performer_consents`, `performer_guardians`, private storage, a moderation queue.
- **Security:** server-side ownership checks. **Performers cannot browse or search other performers.** No public profile pages.
- **Data:** profile, photos, consent, verification and billing states kept separate. Final searchable fields are an OPEN decision.
- **Verification:** performer identity and moderation workflow; minors blocked until the guardian/consent model is approved.
- **Cost factors:** storage and image-transformation usage as photos grow; moderation staff time; possible file-scanning service.
- **Third-party services:** Supabase Storage (private buckets).

## Phase C — Protected Industry/Production Portal

- **Scope:**
  - Organization and industry-user applications.
  - Verification lifecycle: review, approval, expiry, revocation.
  - Scoped access grants.
  - Protected portal route area (for example `/portal`), separate from the public `/industry` information page.
- **Major components:** `organizations`, `organization_members`, `verification_cases/evidence/decisions`, `industry_access_grants`, audit, and server-side authorization with RLS.
- **Security:** the highest authorization risk. Industry access is never a member feature, and admin and industry privileges stay separate.
- **Verification:** verification criteria and the review interval are OPEN owner decisions.
- **Cost factors:** staff verification time; abuse monitoring.
- **Third-party services:** Supabase.

## Phase D — Performer Directory + Verification + Privacy

- **Scope:**
  - Searchable performer directory **only** inside the portal, for verified/approved industry users with an active grant.
  - **No directory-access fee** for qualified studios, production companies, casting professionals and approved industry users.
  - Privacy-aware contact/request workflow (contact rule OPEN).
- **Major components:** protected search API with pagination and result limits; access logging; rate limiting; contact-request workflow.
- **Security:**
  - No public route, no public API, no autocomplete, no static data.
  - Nothing reveals that a record exists to unauthorized users.
  - Denial tests for guests, performers and unverified or expired industry users.
- **Data:** only approved searchable fields; no direct contact details by default.
- **Cost factors:** search performance at scale (PostgreSQL search first, per the Implementation Plan); audit storage.
- **Third-party services:** none beyond Supabase at first.

## Phase E — Additional Photo Payments (+ Shortcuts separate purchase)

- **Scope:**
  - **Automated** purchase of additional performer photos at the **Admin-configured price (currently $25 per photo)**. The allowance increases only after webhook-confirmed payment.
  - Receipts.
  - Refund handling (rules OPEN).
  - Shortcuts to Hollywood as a separate purchase with controlled delivery; the book is never at a public URL.
- **Major components:** `photo_purchases`, `payment_references`, `receipts`, entitlement updates, and delivery of the book through signed, entitlement-checked access.
- **Payments:** unit price snapshot per purchase; idempotency; reconciliation.
- **OPEN decisions:** maximum additional photos; one-time vs recurring fee; free photo replacement; refund policy; tax treatment; Shortcuts non-member price and download/view rules (B4).
- **Cost factors:** payment processing fees; tax handling; support time for refunds.
- **Third-party services:** payment provider (T10).

## Phase F — Crew & Crafts, Studio Teachers, Production Services

- **Scope:**
  - Production Crew & Crafts Directory, with union and non-union categories.
  - **Studio Teachers / Set Teachers** category (new).
  - Production Services resources and provider listings, including catering.
  - Providers maintain their own moderated listings.
  - The full industry-facing directory stays protected.
- **Components:** provider organizations, listing records, categories managed without code changes, moderation queues.
- **Security:** provider access never implies industry-directory access.
- **Data:** Studio/Set Teachers relate to child performers. Any credential or licensing fields need owner/legal review.
- **Payments:** the catering referral/commission model is **not** automated until its rules are approved.
- **Cost factors:** moderation staff time; verification of provider credentials.

## Phase G — Internships / Career Launch / Unions & Guilds

- **Scope:**
  - Internship Exchange and Career Launch Center expansion.
  - Education Partner Program workflows.
  - **Unions & Guilds / Career Pathways** content area (new as a named area).
  - Union and non-union pathway guidance.
- **Components:** mostly Payload content collections. Partner accounts, if needed, depend on A.
- **Cost factors:** partner onboarding and moderation time.

## Phase H — Children & Parents, Housing, Mental Health, Social Safety

- **Scope:** expand the launch information pages into full centers:
  - Children & Parents: child-performer rules and permits, parent/grandparent seminars.
  - Housing: curated practical resources, not a marketplace.
  - Mental Health for Artists: framed support resources, with crisis wording per B13.
  - Social Media Safety / **consumer protection**: tutorials, scam and fake-casting warnings, reporting guidance.
- **Components:** Payload collections and editorial workflow, which already exist from launch.
- **Security and data:** no data collection from minors without the approved guardian/consent model.
- **Cost factors:** mainly content creation and legal/clinical review. Little engineering once the launch CMS exists.

## Phase I — Community Events / Mixers

- **Scope:**
  - Event registration and ticketing if justified.
  - Member entitlements — for example, the working rule that **NJEN Singles Mixers are free to members** (confirmation pending, B11).
  - Seminars.
- **Components:** registrations, capacity, member entitlement checks, and payment if events are paid.
- **Cost factors:** payment fees for paid events; email volume.

## Phase J — CRM / Advanced Member Tools / Personalization

- **Scope:**
  - Operational queues, reporting and audit views.
  - Saved jobs, alerts, notifications.
  - Applications/ATS only if approved.
  - Referral/commission automation only after its rules are approved.
  - Member Success Coach and personalization.
- **Components:** reuse Payload staff tooling where it fits; avoid duplicating CMS and CRM (ARCH-4).
- **Cost factors:** email/notification volume; staff workflow design.

---

## Always-on platform work (every phase)

Secure storage, email systems, security reviews and authorization/RLS denial testing, backups with restore tests, monitoring, dependency updates and maintenance.

## Cost and planning notes

- These are effort ranges, not calendar promises. Client review, content and vendor setup can lengthen elapsed time.
- Labour cost is the agreed rate multiplied by approved effort/scope. It cannot be responsibly fixed before requirements are locked.
- Provider operating costs are separate and grow with usage. See `INFRASTRUCTURE_AND_COST_ASSESSMENT.md` for launch and post-launch cost factors.
- The current public foundation reduces rework — content service seam, section registry, protected-route boundary — but does not replace the security and product work in these phases.
