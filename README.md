# NJEN Release 1.3 — Post-Audit 30-Day Launch Foundation

Start with **RELEASE_1_3_READ_ME_FIRST.md**, then **30_DAY_LAUNCH_PLAN.md**, **KEEP_REFACTOR_REBUILD_BASELINE.md**, and **DECISIONS_REQUIRED.md**.

This package preserves the Release 1.2 mobile-first Next.js/React/TypeScript UI foundation while adding a clearer accelerated-launch plan, stricter product/access boundaries, and an expanded PostgreSQL/Supabase-oriented domain schema for developer review.

## Included public foundation
- Homepage
- Entertainment Jobs index/detail
- Events / What's Filming foundation
- Career Center foundation
- Membership foundation
- Shared responsive header/footer
- Sample/demo job data and demo API route (must be replaced for production)

## Important status
This is a **developer foundation, not a finished website**. Authentication, authorization/RLS, production database wiring, verification, admin/moderation, payments, email, secure uploads, monitoring, backups and production deployment require implementation/review according to the locked Day-30 scope.

## Local review
```bash
npm ci
npm run typecheck
npm run build
npm run dev
```

If clean installation fails, record the exact environment/runtime versions and error; do not work around dependency integrity problems silently.

## Project documentation map (updated 22-09-2026)

| Topic | Document |
|---|---|
| Business rules | *NJEN Developer Master Business Rules v1.0* (PDF), updated by `MASTER_BUSINESS_RULES_ADDENDUM.md` (v1.1 — current where they differ) |
| Client inputs, decisions and priorities | `WEEK1_CLIENT_INPUT_REGISTER.md` |
| Launch QA requirements and status | `LAUNCH_QA_CHECKLIST.md` |
| Architecture | `FUTURE_PROOF_ARCHITECTURE.md`, `SUPABASE_PAYLOAD_RESPONSIBILITY_MODEL.md`, `DATABASE_AND_ROLE_MODEL.md` |
| Providers, costs and ownership | `INFRASTRUCTURE_AND_COST_ASSESSMENT.md` (current costs); `TECHNICAL_RECOMMENDATIONS.md` (reasoning) |
| CMS plan (launch collections and workflow) | `PAYLOAD_CMS_PLAN.md` |
| Section, jobs and media content mapping | `CONTENT_MAPPING.md` |
| Database migrations (prepared, not applied) | `db/migrations/` |
| Post-launch roadmap | `POST_LAUNCH_DEVELOPMENT_ASSESSMENT.md` |
| Repository access | `GITHUB_ACCESS_CHECKLIST.md` |
| Assets | `ASSET_REQUIREMENTS.md` |
| Daily reports | `DAY4_IMPLEMENTATION_REPORT.md`, `DAY5_IMPLEMENTATION_REPORT.md`, `DAY6_IMPLEMENTATION_REPORT.md`, `DAY7_IMPLEMENTATION_REPORT.md` |
