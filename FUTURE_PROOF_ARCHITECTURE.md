# NJEN Future-Proof Architecture Assessment

**Status:** Approved technology direction documented on 18-09-2026; updated 22-09-2026 for Business Rules Addendum v1.1. This is a plan, not an implementation: no provider account, database, CMS, authentication, payments, analytics, monitoring or email integration has been added.

Related documents:
- `SUPABASE_PAYLOAD_RESPONSIBILITY_MODEL.md` — data ownership
- `DATABASE_AND_ROLE_MODEL.md` — records and permissions
- `MASTER_BUSINESS_RULES_ADDENDUM.md` — current business rules
- `INFRASTRUCTURE_AND_COST_ASSESSMENT.md` — providers, costs and ownership

## Target shape

One modular Next.js application continues to serve the public launch. Clear server-only modules avoid premature services, and let member, performer, industry, membership and payment features be added later without changing public routes or weakening their data boundary.

Newsletter/publication content uses one Payload collection: public issues are available through the public content service and archive, while future members-only issues remain excluded until post-launch authentication and server-side authorization exist. This is not a mass-email system.

| Layer | Approved direction | Responsibility and boundary |
|---|---|---|
| Application | Next.js, React, TypeScript | Public pages, server-rendered reads, route handlers and future protected modules. Provider SDKs stay out of UI components. |
| Database | Supabase / PostgreSQL | One NJEN-owned project. A Payload content boundary plus an application (`app`) schema. Versioned migrations, RLS on anything API-exposed, backups. Prefer portable PostgreSQL patterns. |
| CMS | Payload CMS | Staff-managed public content — jobs, events, What's Filming, resources, articles — plus editorial roles, drafts and publishing. Never holds protected or payment data. |
| Authentication | Launch: Payload staff login only. Post-launch: Supabase Auth for members, performers and industry users. | No public accounts at launch. Future auth needs sessions, MFA for privileged users, recovery and server-side identity resolution behind an auth module. |
| Authorization | Server capability checks plus database policies | Default-deny protected data. Roles, organization membership, verification, eligibility, ownership and grants are evaluated on every protected operation. |
| Storage | Private-by-default object storage (Supabase Storage) | Performer photos, verification and eligibility evidence, and the Shortcuts book go in **private** buckets with short-lived signed access. Payload media holds public editorial images only. |
| Payments (post-launch) | Provider not yet chosen (register T10) | Server-side checkout creation, signed webhook confirmation, idempotency, stored provider references only (no card data). |
| Email | Resend | A small server-only email module owns transactional templates and sending. Newsletter/Publications is CMS archive content at launch; no external mass-email provider is approved or required (T5a). |
| Analytics | Plausible | One adapter and environment setting; no tracking calls scattered through components. |
| Monitoring | Sentry | One integration, with PII scrubbing, source-map controls, alerts and named owners before production. |
| Deployment | Vercel | NJEN-owned development, protected staging and production environments. Previews must not make unpublished content public. |

## Principles for the future modules (added 22-09-2026)

1. **Configurable business values.** Membership prices, the SAG-AFTRA discount (currently 40%), eligibility rules, the included-photo count (currently 2) and the additional-photo price (currently $25) are Admin-editable configuration with audit history. They are never constants in code, environment variables or templates.
2. **Server-side pricing.** The browser never supplies a price. The server computes the amount from configuration and verified eligibility, then snapshots it on the transaction.
3. **Automated, verified payment flow.** Checkout is created on the server. Only a verified provider webhook marks a payment paid and unlocks the entitlement (for example, an extra photo slot or a membership). This is idempotent and audited.
4. **Eligibility is evidence-based.** Discounts that depend on status (SAG-AFTRA) require a verified, current eligibility record, never a self-declaration.
5. **Directory privacy.** The performer directory is reachable only inside the protected Industry/Production Portal, for verified users with an active grant. It has no public route, no public API, no autocomplete and no static data. Directory access carries no fee for qualified industry users.
6. **Separate route areas for protected features.** Future protected areas get their own route prefixes (for example `/account`, `/portal`) with server-side authentication in their layouts and handlers. They are not nested under public, statically generated pages such as `/industry`, which stays a public information page.

## Environment and security boundary

| Environment | Purpose | Requirements |
|---|---|---|
| Development | Local implementation | Test credentials and data only; never production secrets or private data. |
| Staging | Acceptance and integration QA | NJEN-controlled, access-protected (Vercel Authentication), not indexed, isolated credentials and data, and no public exposure of unpublished previews. |
| Production | Public launch | Least-privilege encrypted secrets, monitoring, backups, rollback plan, `NJEN_ALLOW_INDEXING=true`, and no `NJEN_PREVIEW_UNPUBLISHED`. |

- Service-role keys, database connection strings and provider secrets stay server-only.
- Supabase Data API exposure is configured deliberately (decision ARCH-1).
- Validate writes, rate-limit public submissions, and audit security-relevant staff actions.
- Use explicit public DTOs and field selection; never serialize private records to client props.
- Prove a restore before launch; backup configuration alone is insufficient.

## Provider portability and coupling

| Provider | NJEN controls / portable data | Coupling and migration | Application boundary |
|---|---|---|---|
| Supabase / PostgreSQL | NJEN-owned organization, database, schema and exportable PostgreSQL data | Low for PostgreSQL; medium once Auth, Storage and RLS-specific features are adopted | Repositories/service modules and versioned SQL migrations; no UI SDK calls |
| Payload CMS | NJEN-owned repository configuration and PostgreSQL-held content | Medium: collections, admin UI and rich-text format would need translation | Content services return public DTOs; pages never call the CMS directly |
| Vercel | NJEN-owned project, domains, environment configuration, build settings | Low–medium: standard Next.js is portable; Vercel deployment features would need replacing | Document runtime assumptions and deployment settings |
| Resend | NJEN-owned sending domain, templates, logs, contact/export policy | Low for transactional email; API and templates need replacing | Server-only `email` module with application message types |
| Plausible | NJEN-owned site and aggregate analytics access | Low; history may not transfer | One analytics adapter and configuration switch |
| Sentry | NJEN-owned project, alert rules, issue data, release metadata | Low; historical issues do not transfer automatically | One monitoring initializer and reporting wrapper |
| Payment provider (post-launch) | NJEN-owned merchant account, customer and transaction records | Medium: provider customer/subscription ids | One server-only `payments` module; the application stores references and snapshots only |

## Architecture risk register (compatibility audit, 22-09-2026)

The Day 1–4 implementation and the documentation were reviewed against every future requirement: performer directory and photos, paid additional photos, membership pricing and SAG-AFTRA verification, Industry Portal, directories, CRM, payments and storage.

**No implemented code creates a rebuild risk.** The items below are planning decisions to settle at the right time.

| ID | Issue | Why it matters | Smallest safe adjustment | Status |
|---|---|---|---|---|
| ARCH-1 | Supabase auto-exposes the `public` schema through its Data API, and Payload uses `public` by default | CMS tables (staff users, drafts) could become API-reachable, breaking the public/protected boundary | Option A: remove `public` from exposed schemas (or disable the Data API), RLS on Payload tables, application tables in an unexposed `app` schema | **Decision before Week 2 setup** — recommended option A; see responsibility model §3 |
| ARCH-2 | Payload migrations and application SQL migrations share one database | Uncoordinated migrations could collide | Separate boundaries; neither alters the other's tables; ordered deploy steps | Documented; no client action |
| ARCH-3 | Jobs were documented both as Payload content and as app tables | Two sources of truth → sync bugs and rework | Jobs are a Payload collection only; app records reference job ids | **Resolved** in documentation (22-09-2026) |
| ARCH-4 | Staff identity (Payload) and member identity (Supabase Auth) are separate stores | Possible duplication when CRM/admin grows | Keep separate by design (staff ≠ member privilege); decide on unification in Phase A | Planned decision (post-launch) |
| ARCH-5 | Where Admin-configurable prices and discounts live | Pricing in the editorial CMS would couple billing integrity to content tooling | App-schema configuration with audit and transaction snapshots; admin screen chosen in Phase A | Recommendation (post-launch) |
| ARCH-6 | Performer photos and evidence could be put in the public CMS media library by mistake | Privacy breach and costly migration | Rule: private Supabase Storage buckets only; Payload media is public editorial only | Documented rule |
| ARCH-7 | Post-launch order differs between documents (Implementation Plan §17 puts the performer program before membership; the assessment and NJEN's latest list put membership first) | Paid performer features and paid membership both need accounts **and** a payments foundation | Roadmap now starts with accounts + payments foundation + membership, then performers | Order to be confirmed when post-launch planning starts; no launch impact |
| ARCH-8 | `/api/jobs` demo endpoint was public and unused | Unfinished public surface | **Removed 23-09-2026** (Day 6). Nothing referenced it. A public jobs API can be reintroduced from the Payload source if NJEN ever needs one. | **Resolved** |

## Incremental delivery path

1. Preserve the public site, and replace demo jobs/content only with approved, server-side published reads (`lib/jobs.ts` is the seam).
2. Add Payload and PostgreSQL with the ARCH-1 decision applied, reviewed migrations, and a staff-only editorial workflow.
3. Add protected staging, monitoring, analytics, transactional email, backups and restore validation.
4. **Post-launch:** add accounts, payments foundation, membership (with configurable pricing and SAG-AFTRA eligibility), performer profiles (with configurable photo pricing), the Industry Portal and directory, further directories, CRM and personalization. Each phase goes ahead only after its requirements and authorization tests are approved.

This avoids a public-site rebuild. Stable content and job services serve the public routes, while later work adds protected routes, application services and capabilities inside the same application boundary.
