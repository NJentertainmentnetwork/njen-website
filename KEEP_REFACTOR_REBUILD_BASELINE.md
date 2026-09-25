# Release 1.3 Baseline — KEEP / REFACTOR / REBUILD

This is the package author's baseline for the developer to challenge or confirm after the audit.

| Area | Baseline | Reason |
|---|---|---|
| Next.js App Router + TypeScript | KEEP, subject to audit | Appropriate maintainable foundation for a modular public/member platform. |
| Current public page structure | KEEP / REFACTOR | Useful information architecture and mobile-first starting point; connect to real data and improve states/SEO/accessibility. |
| Shared header/footer | KEEP / REFACTOR | Reusable shell; audit navigation/accessibility and future authenticated states. |
| Global CSS | REFACTOR | Useful visual foundation but should be normalized into maintainable tokens/components as implementation grows. |
| `data/jobs.ts` | REBUILD for production | Sample/demo data only. Keep only as fixtures if clearly separated from production. |
| `/api/jobs` demo route | REBUILD | Must use validated server-side database reads and publication rules. |
| PostgreSQL/Supabase-oriented schema | REFACTOR | Good domain starting point; Release 1.3 adds access, verification, moderation, and private-directory structure but still requires migrations/RLS review. |
| Authentication | REBUILD / implement | Not implemented in 1.2. Provider and session model must be explicitly selected. |
| Authorization/RLS | REBUILD / implement | Required server-side; deny by default for private resources. |
| Admin/moderation | REBUILD / implement | Required for credible publishing and verification workflows. |
| Private industry directories | DEFER + BUILD SECURELY | Preserve roadmap, but do not rush into public launch without verified-industry authorization. |
| Documentation | KEEP / UPDATE | Release 1.3 docs become the current launch handoff; developer should update decisions as implemented. |

## Rule
Do not rewrite working code merely because it was AI-assisted. Keep it when it passes maintainability, security, accessibility and architecture review. Rebuild only where the implementation or risk justifies the cost.
