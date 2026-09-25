# NJEN Release 1.3 — Developer Handoff

## Purpose
This is the post-audit / accelerated-launch handoff. Compare it with your technical audit and use it to lock the safest realistic initial public launch within approximately 30 days.

## Required response before substantial Phase 1 development
Return:
1. KEEP / REFACTOR / REBUILD classification for the existing foundation.
2. The canonical repository/source-of-truth decision.
3. Final recommended stack and any changes from your audit.
4. Exact Day-30 launch scope and explicitly deferred roadmap features.
5. Estimated hours, cost, timeline, milestones and dependencies.
6. Definition of done and launch-blocking security/QA gates.

## Non-negotiable product rules
- NJEN is the primary brand; “New Jersey's Entertainment Headquarters” is the mission/tagline.
- NJEN and Media Artists Group are separate companies and systems.
- NJEN is not a talent agency and should not be architected to procure principal acting employment.
- Ordinary principal acting breakdowns are excluded.
- Background performers may manage only their own profile; they may not browse other performers.
- Searchable performer and protected production-service directories are private industry tools for verified/authorized users only.
- iPhone-first and responsive; WCAG 2.2 AA target; comfortable interface text approximately 16px minimum.
- Rosie is a guide/ambassador, not the NJEN logo.
- Shortcuts to Hollywood belongs inside the Career Center.
- A feature deferred from Day 30 remains on the roadmap unless the owner explicitly removes it.

## Security rule
A deadline does not override server-side authorization, RLS/access-control testing, secrets management, validation, privacy, backups or launch monitoring. High-risk features should be deferred rather than launched insecurely.
