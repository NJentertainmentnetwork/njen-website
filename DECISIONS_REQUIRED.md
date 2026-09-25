# Decisions Required From Developer

Return these decisions in writing after reviewing the audit and Release 1.3.

1. **Single source of truth:** Which repository becomes canonical and what, if anything, is migrated into it?
2. **Hosting/deployment:** Recommended platform and why.
3. **Database:** PostgreSQL/Supabase or alternative; migration tooling and environment strategy.
4. **Authentication:** Provider, session strategy, email verification, password reset, MFA for privileged users.
5. **Authorization:** Role/capability model plus RLS strategy if Supabase is used.
6. **Admin/moderation:** How jobs, events/content, organizations and verification are reviewed and published.
7. **CMS/content:** What should be database-managed versus CMS-managed for launch.
8. **Email:** Transactional provider and templates needed for the locked launch scope.
9. **Uploads:** Storage, private-by-default access, scanning, size/type allowlists; defer if not needed at launch.
10. **Payments:** Whether payments are excluded from Day 30. If included, provider and webhook/security design.
11. **Monitoring:** Error monitoring, logs, uptime/health checks and alert ownership.
12. **Backups:** Frequency, retention and restore-test procedure.
13. **CI/CD:** Checks required before deploy: typecheck, build, tests, migrations, security/dependency checks.
14. **Search:** PostgreSQL search for launch versus external search later.
15. **30-day feasibility:** Exact features that can be safely live, features deferred, hours, cost and critical dependencies.
