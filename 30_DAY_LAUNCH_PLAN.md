# 30-Day Initial Public Launch Plan

This is an acceleration framework, not a substitute for the developer's estimate. Day numbers may shift after the audit, but security and authorization gates may not be skipped to meet a date.

## Days 1–3 — Repository decision and launch lock
- Confirm this repository or a deliberately migrated successor as the single source of truth.
- Return KEEP / REFACTOR / REBUILD table.
- Confirm production stack: hosting, database, auth, CMS/content approach, email, monitoring, analytics, backups, CI/CD.
- Lock the Day-30 scope and explicitly list deferred roadmap items.
- Establish development/staging/production environments and secret handling.

**Gate:** owner receives written scope, hours/cost range, milestones, dependencies, and definition of done before substantial implementation.

## Days 4–10 — Data, auth and publishing foundation
- Implement migrations from reviewed schema.
- Implement authentication only if included in Day-30 scope.
- Enforce server-side authorization; RLS where Supabase is used.
- Build admin/moderation path for jobs/content required at launch.
- Replace demo job API/data with validated database-backed reads.
- Add structured validation to all writes.

**Gate:** no client-only authorization; no service-role secret in browser; unpublished content cannot be retrieved through public endpoints.

## Days 11–17 — Public launch features
- Connect jobs index/detail to approved published records.
- Implement filters needed for launch (category/location/type; keep scope small).
- Connect Career Center and Events/What's Filming to chosen content source.
- Implement employer/partner intake or verified posting workflow according to locked scope.
- Add SEO metadata, sitemap/robots, social metadata, error/not-found states.

## Days 18–23 — Operations and hardening
- Rate limiting on sensitive/public write endpoints.
- Security headers/CSP appropriate to deployed services.
- Logging/error monitoring and health checks.
- Backup configuration and a documented restore test.
- Privacy/Terms/contact/abuse-reporting launch pages as approved by counsel/owner.
- Analytics with privacy-conscious configuration.

## Days 24–27 — QA
- iPhone-first device testing and responsive browser testing.
- Keyboard/screen-reader/accessibility review against WCAG 2.2 AA target.
- Authorization/RLS abuse tests and cross-account access tests.
- Broken-link, empty-state, form-validation, error-state and performance checks.
- Content review: no demo jobs represented as live jobs.

## Days 28–30 — Launch gate and release
- Staging acceptance review.
- Resolve launch-blocking defects.
- Production migration/deployment with rollback plan.
- Smoke test production.
- Confirm monitoring, backup, admin access, domain/SSL, analytics and contact flows.
- Produce post-launch backlog for deferred features.

## Day-30 definition of done
A feature counts as done only when it is deployed, responsive, accessible to the agreed target, validated, authorization-tested where applicable, monitored, documented enough for handoff, and free of placeholder/demo behavior that could mislead the public.
