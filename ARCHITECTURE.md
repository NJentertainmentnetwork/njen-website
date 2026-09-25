# Architecture Notes — Release 1.3

## Preferred shape
Avoid premature microservices. Prefer one maintainable modular application with clear server-only data/access boundaries until scale or operations justify separation.

Logical surfaces:
- **Public web:** approved NJEN content, published jobs/resources/events.
- **Member account:** own profile, saved items/applications/account functions as launched.
- **Employer/production account:** organization workflows and authorized industry tools.
- **Private industry portal:** protected directories for verified/authorized production-industry personnel. Background performers manage their own record but do not browse the directory.
- **Admin/moderation:** verification, publishing, abuse handling, audit history and operational controls.

## Release 1.3 implementation principles
- Server-side authorization is authoritative; UI visibility is not security.
- Deny by default for private directory and account data.
- Public queries return only publishable/approved records.
- Use versioned database migrations; do not treat `db/schema.sql` as the migration history.
- Keep service-role/admin credentials server-only.
- Separate verification status from content moderation status.
- Keep production, staging and development secrets/data separated.
- Prefer PostgreSQL-native search for launch unless measured requirements justify another service.
- External services (auth, email, storage, payments) must be wrapped behind small application modules so providers can be changed without rewriting the product.

## Developer decision points
Confirm or replace: hosting/deployment, Supabase/database/auth choice, CMS/content approach, payment provider (if Day-30), transactional email, storage/scanning, observability, analytics, backup/restore and CI/CD.
