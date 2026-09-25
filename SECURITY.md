# Security Baseline — Required Before Production

This file is a requirements checklist, not a claim that the controls are already implemented.

1. Authentication: use a maintained identity provider; secure session handling; email verification; password reset; MFA capability for privileged accounts.
2. Authorization: enforce permissions server-side. Never rely on hidden UI. Define member, employer/production partner, moderator, and admin capabilities explicitly.
3. Database: enable Row Level Security where Supabase is used; deny by default; test policies for cross-account data access; keep service-role credentials server-only.
4. Employer/industry verification: separate verification workflow from content moderation; record reviewer, status, timestamps, and reason/history.
5. Input/API protection: schema-validate all writes; normalize and constrain values; rate-limit sensitive/public endpoints; protect against mass assignment and IDOR.
6. Uploads: allowlist file types/sizes; private storage by default; signed access URLs; malware/file scanning before release to recipients.
7. Privacy: collect minimum necessary data; protect minors; document retention/deletion; do not expose private performer-directory records to other performers or the public.
8. Auditability: record privileged actions and moderation/verification changes without storing secrets in logs.
9. Secrets: environment variables only; no credentials in source control; separate development/staging/production secrets; rotate compromised credentials.
10. Web security: HTTPS; secure cookies; CSRF protections where applicable; security headers/CSP; dependency review; safe redirects; output escaping.
11. Operations: error monitoring, health checks, database backups, restore test, incident-response contacts/process, and least-privilege production access.
12. Testing: authorization/RLS tests, abuse cases, accessibility checks, mobile testing, and a pre-launch security review.
