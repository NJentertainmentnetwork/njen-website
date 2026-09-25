# NJEN — Technical Recommendations

**Status: Approved technology direction, updated 18-09-2026.** Supabase/PostgreSQL, Payload CMS, Vercel, Resend, Plausible, and Sentry are approved directions. Newsletter provider remains open. Nothing in this document is implemented or connected in this workspace.

> **Cost figures updated 22-09-2026:** current, re-verified costs, the launch vs post-launch split and the ownership/access model are maintained in `INFRASTRUCTURE_AND_COST_ASSESSMENT.md`. Where figures differ, that document is current. Supabase/Payload data ownership is defined in `SUPABASE_PAYLOAD_RESPONSIBILITY_MODEL.md`.

Prepared 17-09-2026 for NJEN review. The Master Business Rules (section 15) ask
the developer to recommend the production stack "based on security,
maintainability, scalability, cost and fit". NJEN makes the final decision on
every item.

## Status key

| Label | Meaning |
|---|---|
| **APPROVED** | Confirmed in an approved NJEN document or by NJEN directly |
| **OPEN — CLIENT DECISION REQUIRED** | Needs NJEN's decision before any work starts |
| **RECOMMENDATION ONLY** | Developer advice; not a decision |
| **NOT IMPLEMENTED** | No code, account or integration exists for it |

## Pricing notice

Prices were read from each provider's official pricing page on 17-09-2026 (sources
at the end). **All prices are approximate, in USD, exclude tax, and are subject
to change by the provider.** Usage-based charges can exceed the base price.

---

## Summary

| Area | Recommendation | Approx. launch cost / month | Status |
|---|---|---|---|
| Application | Next.js + React + TypeScript (existing) | $0 | **APPROVED** (Business Rules 15) |
| Database | Supabase (managed PostgreSQL), Pro plan | $25 | APPROVED DIRECTION · NOT IMPLEMENTED |
| Authentication | Payload built-in auth for staff at launch; Supabase Auth for members post-launch | $0 extra | IMPLEMENTATION DEFERRED · MEMBERS POST-LAUNCH |
| CMS / Admin | Payload CMS 3, self-hosted inside the Next.js app | $0 licence | APPROVED DIRECTION · NOT IMPLEMENTED |
| Hosting / Staging | Vercel Pro | $20 per developer seat | APPROVED DIRECTION · ACCESS PENDING |
| Email / Newsletter | Resend (transactional); newsletter tool OPEN | $0–$20, plus newsletter | RESEND APPROVED · NEWSLETTER OPEN · NOT IMPLEMENTED |
| Analytics | Plausible Analytics | $9–$14 | APPROVED DIRECTION · ACCESS PENDING |
| Monitoring | Sentry | $0–$26 | APPROVED DIRECTION · ACCESS PENDING |
| Repository | NJEN-owned GitHub organization | $0–$8 | ACCESS PENDING — see `GITHUB_ACCESS_CHECKLIST.md` |

**Indicative total: roughly $54–$113 per month at launch** (re-verified 22-09-2026), before optional
add-ons: point-in-time database recovery ($100/month) and newsletter plans above 1,000 contacts
($40/month and up). Staging can be protected with Vercel Authentication at no extra cost, so the
$20/project/month Password Protection add-on is optional. A domain name is extra.

This matches the stack already recommended in the NJEN Development Approach &
Implementation Plan, with two additions found during research: Payload's managed
hosting (Payload Cloud) now limits new projects to Enterprise teams, and Payload
needs a plugin for administrator MFA.

---

## 1. Database — Supabase (managed PostgreSQL)

**Status:** APPROVED DIRECTION · NOT IMPLEMENTED

- **Why it fits NJEN:** standard PostgreSQL, which Release 1.3's `db/schema.sql` already targets. Row Level Security supports the Business Rules requirement that protected data is enforced at the database layer, not the frontend. It also provides auth and file storage later, which reduces the number of vendors.
- **Approximate cost:** Free plan is **not suitable for production**: projects pause after one week of inactivity and include no backups. **Pro is $25/month** per organization, including 8 GB database, 100,000 auth monthly active users, 100 GB storage, 250 GB egress and daily backups kept 7 days. Point-in-time recovery is **$100/month** per 7 days of retention.
- **NJEN ownership/control:** NJEN should create the Supabase organization and add the developer as a member.
- **Data ownership:** data sits in standard PostgreSQL. NJEN can export it at any time with standard `pg_dump` tooling.
- **Account ownership:** NJEN owns the organization and billing; the developer has member access only.
- **Switching difficulty:** Low for the database — any PostgreSQL host works. Medium if Supabase Auth and Storage are also adopted.
- **Migration considerations:** `schema.sql` must first become versioned migrations. It isn't idempotent today and has no RLS policies.
- **Risks/tradeoffs:** Pro backups are daily only (7 days). The Business Rules require a *tested* restore procedure, so a restore test must be scheduled. SOC 2 reports need the Team plan ($599/month); not needed for launch.
- **Suitable for the 30-day launch:** Yes.
- **Alternatives considered:** Neon (serverless Postgres; no built-in auth or storage); AWS RDS (more control, more operational work).

## 2. Authentication

**Status:** IMPLEMENTATION DEFERRED · MEMBER AUTHENTICATION IS POST-LAUNCH

The Business Rules place member accounts, the performer program and the industry
portal **outside** the 4-week launch. At launch, only **NJEN staff** (Admin and
Editor/Moderator) need to sign in.

- **Recommendation:**
  - **Launch:** use Payload CMS's built-in authentication for staff accounts only.
  - **Post-launch:** add Supabase Auth when member accounts are approved.
- **Why it fits NJEN:** avoids building and securing a member login system that isn't in launch scope, and keeps staff access inside the CMS that staff will use.
- **Approximate cost:** $0 extra at launch. Supabase Auth is included in Supabase Pro up to 100,000 monthly active users, then about $0.00325 per user.
- **NJEN ownership/control:** user records live in NJEN's own database.
- **Data ownership:** NJEN.
- **Account ownership:** no separate vendor account at launch.
- **Switching difficulty:** Medium. Moving staff accounts later is straightforward; moving member accounts between providers is harder, which is why that choice is deferred.
- **Risks/tradeoffs:**
  - **Payload does not enforce MFA by default.** The Business Rules require MFA for administrators, so a community TOTP plugin would be needed. It must be reviewed before use, because it is not maintained by Payload.
  - Two auth systems will exist after launch (staff in Payload, members in Supabase). This needs a documented boundary.
- **Suitable for the 30-day launch:** Yes, provided the MFA plugin passes review.
- **Alternatives considered:**
  - Supabase Auth for staff too: built-in basic MFA, but more integration work with the CMS.
  - Clerk: fast to integrate, but a separate paid vendor holding user identities.

## 3. CMS / Content Management — Payload CMS 3

**Status:** APPROVED DIRECTION · NOT IMPLEMENTED

- **Why it fits NJEN:**
  - It installs inside the existing Next.js application, so there's no separate CMS server.
  - It stores content in PostgreSQL, so it can use the Supabase database.
  - It supports the Business Rules requirements: draft/review/publish, roles, scheduling, media with alt text, and audit-friendly access control.
  - Staff can manage jobs, events, What's Filming and resources without developer or database work.
- **Approximate cost:** **$0** — MIT open-source licence. Hosting and database costs are covered above.
- **NJEN ownership/control:** content models and CMS configuration live in NJEN's own repository.
- **Data ownership:** content is stored in NJEN's PostgreSQL database, not a vendor's cloud.
- **Account ownership:** no CMS vendor account required.
- **Switching difficulty:** Medium. Content is in NJEN's database and exportable, but admin screens and content models would need rebuilding in another CMS.
- **Migration considerations:** the jobs, events and content tables in `db/schema.sql` should be reconciled with Payload's collection definitions *before* migrations are written, to avoid maintaining two schemas.
- **Risks/tradeoffs:**
  - **Payload Cloud (managed hosting) currently states "Project creation is only available for Enterprise teams."** For NJEN, Payload would be self-hosted inside the Next.js app, which is how it would run on Vercel anyway.
  - Figma acquired Payload in June 2025. That adds some long-term roadmap uncertainty; the open-source licence limits lock-in.
  - Serverless hosting needs database connection pooling (Supabase provides a pooler).
  - Admin MFA needs a plugin (see Authentication).
- **Suitable for the 30-day launch:** Yes, but the CMS is the largest single piece of Week 2 work. The implementation plan already flags that it may take longer than planned.
- **Alternatives considered:**
  - Sanity: hosted and polished, but content lives in Sanity's cloud and paid tiers are usage-based.
  - Strapi or Directus: separate server to host and secure.

## 4. Hosting / Staging — Vercel Pro

**Status:** APPROVED DIRECTION · ACCESS PENDING

- **Why it fits NJEN:**
  - Vercel builds Next.js.
  - Every change gets a preview deployment, which gives a staging URL for the required weekly *working* demonstrations.
  - Production deploys are repeatable from the repository.
- **Approximate cost:**
  - **The free Hobby plan is for personal, non-commercial use only, so NJEN needs Pro.**
  - **Pro is $20/month per developer seat** and includes a $20 usage credit. Viewer seats are unlimited.
  - Password protection for deployments is listed at **$20/project/month**. It is optional: **Vercel Authentication protects staging/preview deployments with no paid add-on** (verified 22-09-2026), and NJEN reviewers can use free viewer seats.
- **NJEN ownership/control:** NJEN should own the Vercel team and billing, connect the NJEN GitHub repository, and invite the developer.
- **Data ownership:** Vercel hosts the application, not NJEN's database content.
- **Account ownership:** NJEN.
- **Switching difficulty:** Low to medium. Standard Next.js can run on Netlify, AWS or a Node server; some Vercel-specific settings would need replacing.
- **Migration considerations:** the domain and DNS must be NJEN-owned (register D3).
- **Risks/tradeoffs:**
  - **Staging must not be publicly indexable or open.** This matters because unpublished sections can be previewed there (`NJEN_PREVIEW_UNPUBLISHED`). Recommended: Vercel Authentication (no add-on cost); Vercel also marks preview deployments noindex, and the app's `robots.txt` disallows crawling by default.
  - Usage above the included credit is billed.
- **Suitable for the 30-day launch:** Yes.
- **Alternatives considered:** Netlify (similar model); AWS Amplify or a container host (more operational work).

## 5. Email / Newsletter — Resend (transactional); newsletter tool OPEN

**Status:** RESEND APPROVED · NEWSLETTER OPEN · NOT IMPLEMENTED

The launch needs **contact and submission notifications** (transactional) and a
**newsletter/waitlist** (marketing). These are different jobs.

- **Why Resend fits the transactional side:** simple API that works well with Next.js server code, domain authentication, and a free tier that covers launch volumes.
- **Approximate cost:**
  - **Transactional:** Free covers 3,000 emails/month (100/day). **Pro is $20/month** for 50,000 emails.
  - **Marketing (newsletter):** Free up to 1,000 contacts; paid from **$40/month** for 5,000 contacts.
- **NJEN ownership/control:** NJEN owns the account and the sending domain's DNS records.
- **Data ownership:** newsletter subscriber lists must be exportable. Confirm export before choosing a newsletter tool.
- **Account ownership:** NJEN.
- **Switching difficulty:** Low for transactional email (a small application module, as the Architecture notes require). Medium for newsletters (subscriber export and re-verification).
- **Risks/tradeoffs:**
  - **OPEN:** who writes and sends the newsletter. If NJEN staff need a visual editor, templates and campaign reporting, a dedicated newsletter tool may suit them better than Resend's broadcasts.
  - Sending-domain DNS must be set up correctly or email lands in spam.
- **Suitable for the 30-day launch:** Yes for transactional email. The newsletter tool choice should be made by Week 2, because the forms ship in Week 3.
- **Alternatives considered:** Postmark (transactional); Mailchimp, Kit or Buttondown (newsletter-focused).

## 6. Analytics — Plausible Analytics

**Status:** APPROVED DIRECTION · ACCESS PENDING

- **Why it fits NJEN:**
  - Cookieless, and processes no personal data, so no cookie banner is needed. That suits the 30-day plan's "privacy-conscious analytics" requirement and a site used by families and minors.
  - Simple dashboards staff can read.
- **Approximate cost:** **Starter $9/month** (up to 10,000 pageviews, 1 site); **Growth $14/month**; **Business $19/month** (adds a Stats API). Annual billing gives two months free.
- **NJEN ownership/control:** NJEN owns the account.
- **Data ownership:** aggregate data is hosted in the EU. API export needs the Business tier; the open-source code can also be self-hosted.
- **Account ownership:** NJEN.
- **Switching difficulty:** Low — one script tag. Historical data doesn't transfer automatically.
- **Risks/tradeoffs:** less detail than Google Analytics (no individual user tracking, by design). Pageview limits must match real traffic.
- **Suitable for the 30-day launch:** Yes.
- **Alternatives considered:**
  - Vercel Web Analytics: included in Pro up to 50,000 events/month, but the data stays inside Vercel.
  - Google Analytics 4: free and detailed, but typically needs cookie-consent handling, and data is used under Google's terms.

## 7. Monitoring — Sentry

**Status:** APPROVED DIRECTION · ACCESS PENDING

- **Why it fits NJEN:** production error tracking with first-class Next.js support. It meets the Business Rules requirement for active monitoring/error reporting at launch.
- **Approximate cost:**
  - **Developer (free):** 1 user, 5,000 errors, 30-day history.
  - **Team $26/month** (billed annually): unlimited users, 50,000 errors, up to 90-day history.
  - Each plan includes one uptime monitor.
- **NJEN ownership/control:** NJEN should own the organization so NJEN staff can see production errors.
- **Data ownership:** error events can contain request data. Configure it to strip personal data and secrets before sending.
- **Account ownership:** NJEN.
- **Switching difficulty:** Low — an SDK swap.
- **Risks/tradeoffs:** the free plan's single user would lock NJEN out of its own error data, so **Team is recommended once NJEN wants access**. Health checks beyond one uptime monitor may need another tool.
- **Suitable for the 30-day launch:** Yes.
- **Alternatives considered:** Better Stack (logs plus uptime); Axiom (logs).

---

## Decisions NJEN needs to make

1. Approve, change or reject each recommendation in sections 1–7.
2. Confirm who creates each vendor account. Recommendation: NJEN creates every account, owns billing, and invites the developer.
3. Choose between Supabase point-in-time recovery ($100/month) or daily backups only, given the tested-restore requirement.
4. Choose the newsletter tool and who operates it.
5. Confirm staging protection: Vercel Authentication, at no extra cost, is recommended.
6. Confirm whether administrator MFA through a reviewed Payload plugin is acceptable.

The approved directions above still require NJEN-owned account access, backup/staging choices, and implementation. None of these services has been installed, connected, or configured.

## Sources (read 17-09-2026)

- Supabase pricing — https://supabase.com/pricing
- Vercel pricing — https://vercel.com/pricing
- Resend pricing — https://resend.com/pricing
- Sentry pricing — https://sentry.io/pricing/
- Plausible Analytics — https://plausible.io/
- Payload joins Figma (Figma blog) — https://www.figma.com/blog/payload-joins-figma/
- Payload acquisition announcement (Payload GitHub, 17-06-2025) — https://github.com/payloadcms/payload/discussions/12843
- Payload Cloud new project page — https://payloadcms.com/new
- Payload 2FA plugin example (community) — https://github.com/GeorgeHulpoi/payload-totp
- GitHub plans — https://docs.github.com/en/get-started/learning-about-github/githubs-plans
