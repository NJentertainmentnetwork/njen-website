# NJEN Release 1.3 — Post-Audit 30-Day Launch Foundation

## What this package is
Release 1.3 is the developer handoff to use **after the technical audit** and before substantial Phase 1 coding. It preserves the useful Release 1.2 front-end foundation, but tightens the product boundaries, launch priorities, data model, security requirements, and definition of done for an accelerated initial public launch.

This is **not** a claim that NJEN can be production-complete in 30 days. The developer must validate the schedule after reviewing the repository and must identify what can safely launch in the 30-day window versus what moves to the next phase.

## The 30-day objective
Ship a secure, credible **initial public NJEN launch** that establishes the brand and provides real public value without prematurely exposing high-risk private-directory or minor-data workflows.

Target launch surface:
- Public NJEN homepage and navigation
- Public entertainment jobs board with real database-backed published jobs
- Job detail pages and safe outbound/application method
- Public Career Center foundation
- Public Events / What's Filming foundation
- Membership / account entry point if authentication is production-ready
- Employer/partner intake or interest workflow
- Admin-controlled publishing/moderation for launch content
- Production deployment, analytics, monitoring, backups, accessibility/mobile QA

Not required to force into Day 30 if it cannot be completed securely:
- Full searchable private Background Performer Directory
- Full production-services directory
- Complex employer applicant-tracking pipeline
- Paid membership/payment flows
- Advanced saved searches/alerts
- Large-scale CMS migration
- Minor profiles or child-performer data collection

Those features remain on the approved roadmap; postponement is not removal.

## First instruction to developer
Use this repository as the comparison baseline and return a written **KEEP / REFACTOR / REBUILD** decision against your audit findings. If your audit recommends a different implementation for a component, explain why and migrate deliberately rather than creating a parallel codebase.

## Non-negotiable product boundaries
1. NJEN is New Jersey Entertainment Network — “New Jersey's Entertainment Headquarters.”
2. NJEN and Media Artists Group (MAG) are separate companies and systems.
3. NJEN is not a talent agency and should not be designed to procure principal acting employment.
4. Ordinary principal acting breakdowns are outside the NJEN jobs product.
5. Background performers can manage their own paid profile when that feature launches, but cannot browse other performers.
6. The searchable Background Performer Directory is restricted to verified and authorized production-industry users.
7. Production-service directories use protected industry access where the product plan requires it.
8. No private directory should be made public merely to simplify development.
9. iPhone-first, responsive, WCAG 2.2 AA target, comfortable body/interface text approximately 16px minimum.
10. No approved roadmap feature is silently deleted because it is deferred from the first 30-day launch.
