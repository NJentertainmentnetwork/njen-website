# NJEN Release 1.3 — Post-Audit Checklist

Please return a concise written recommendation before substantial implementation.

## Repository/build
- [ ] Identify canonical repository and eliminate parallel/conflicting implementations.
- [ ] Clean install succeeds in documented Node/npm environment.
- [ ] TypeScript check succeeds.
- [ ] Production build succeeds.
- [ ] Dependency/security review completed; material findings documented.

## KEEP / REFACTOR / REBUILD
- [ ] Front end/routing/components/CSS classified.
- [ ] Demo API and sample data classified.
- [ ] Schema/data model classified.
- [ ] Reusable work from other NJEN packages identified deliberately.

## Security/privacy
- [ ] Auth/session/provider selected if required for launch.
- [ ] Server-side authorization/capabilities defined.
- [ ] RLS strategy defined/tested if Supabase is used.
- [ ] Verification and moderation are separate workflows.
- [ ] Private performer-directory rules explicitly tested.
- [ ] Validation, rate limits, secrets, logs, backups and restore process defined.
- [ ] Minor data collection is deferred unless a specific compliant design is approved.

## Day-30 launch
- [ ] Exact public features locked.
- [ ] Deferred roadmap features listed (not deleted).
- [ ] Hours/cost/timeline/milestones supplied.
- [ ] Definition of done supplied.
- [ ] Staging, production, rollback, monitoring and post-launch ownership defined.
