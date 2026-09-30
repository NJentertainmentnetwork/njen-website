# NJEN — Day 10 Implementation Report

**Date:** 28-09-2026
**Scope:** GitHub repository verification, Vercel deployment audit, complete environment-variable matrix, Supabase/Payload readiness assessment, local build and regression testing.
**Mode:** Read-only investigation plus documentation. **No Git write operation of any kind was performed.** No commit, push, pull, fetch, merge, branch change, remote change, clone or reset. No deployment, no provider account creation, no credential entry.

---

## 1. Objective

Establish, with evidence, where the NJEN project actually stands on hosting and infrastructure before Week 2 work begins:

1. Determine which GitHub repository holds the code, and whether the Day 9 push succeeded.
2. Compare the existing repository with the newly invited organization repository.
3. Audit the Vercel deployment — only if access exists.
4. Produce a complete, code-verified environment-variable matrix.
5. Assess Supabase and Payload readiness.
6. Re-verify the local build and route behaviour.
7. Record exactly what client approvals and access are still required.

---

## 2. Documents reviewed

| Document | Why |
|---|---|
| `WEEK1_CLIENT_INPUT_REGISTER.md` | Existing recorded status of GitHub (A2/D1/D7) and Vercel (D2/T4) |
| `GITHUB_ACCESS_CHECKLIST.md` | Repository expectations agreed on Day 6 |
| `INFRASTRUCTURE_AND_COST_ASSESSMENT.md` | Vercel plan, seats, staging protection |
| `SUPABASE_PAYLOAD_RESPONSIBILITY_MODEL.md` | ARCH-1 schema-exposure risk and ownership split |
| `PAYLOAD_CMS_PLAN.md`, `CONTENT_MAPPING.md` | Planned CMS collections and content seams |
| `LAUNCH_QA_CHECKLIST.md` | Launch requirements affected by hosting |
| `DAY9_IMPLEMENTATION_REPORT.md` | The exact state handed over for the client's push |
| `.env.example`, `next.config.ts`, `.gitignore` | Configuration surface |

---

## 3. GitHub repository comparison

Two repositories are in play. Both were checked; the local Git metadata was read directly from files inside `.git/` (no `git` command was run).

### 3.1 Existing repository — `NJEnetwork/njen-website`

| Check | Finding | Evidence |
|---|---|---|
| Configured remote | `origin` = `https://github.com/NJEnetwork/njen-website.git` | `.git/config` |
| Current branch | `main` | `.git/HEAD` to `refs/heads/main` |
| Local commit | `8bffc97471057064f88fba973ec77df3479cdd31` | `.git/refs/heads/main` |
| Remote-tracking commit | **Identical** — `8bffc97...` | `.git/refs/remotes/origin/main` |
| Push evidence | Reflog entry recorded as `update by push` | `.git/logs/refs/remotes/origin/main` |
| Commit | "Initial NJEN website foundation", author Viral, 25-09-2026 | commit object |
| Visibility | **Private** — returns 404 to an unauthenticated request | Anonymous HTTP fetch |

**Conclusion: the Day 9 push succeeded.** The code is on GitHub in the existing private repository, and local `main` and `origin/main` point at the same commit, so nothing is unpushed. All Day 9 fixes were confirmed present in this working copy (publications visibility contract, contact-form submit handler, Publications in navigation).

### 3.2 Newly invited repository — `NJentertainmentnetwork/njen-website`

| Check | Finding | Evidence |
|---|---|---|
| Exists | Yes | Anonymous HTTP fetch succeeded |
| Visibility | **PUBLIC** | Page is readable without authentication |
| Contents | **EMPTY** — "This repository is empty" | Same fetch |
| Commits | None | Same fetch |

### 3.3 Comparison and recommendation

| | `NJEnetwork/njen-website` | `NJentertainmentnetwork/njen-website` |
|---|---|---|
| Visibility | Private | **Public** |
| Code | Present, current | None |
| History | 1 commit, pushed 25-09-2026 | None |

> ### Risk to resolve before any migration
>
> The new repository is **public**. This project's working tree contains internal material that is not intended for public release: master business rules, cost and infrastructure assessments, the post-launch roadmap, the client input register, and NJEN's own supplied `.docx` and `.pdf` documents. Pushing the current tree to a public repository would **publish all of it**, and Git history keeps it recoverable even after a later deletion.
>
> **Recommendation:** before anything is pushed there, NJEN should either switch that repository to **private**, or decide that only application code — not the internal documentation — belongs in a public repository. This is a client decision, not a developer one.

**No migration has been performed and none will be** until NJEN explicitly confirms which repository is official and approves the move. Per instruction, all Git operations remain the client's.

---

## 4. Vercel access status

**Vercel access has NOT been provided.** No Vercel account, team invitation, project link, dashboard access, deployment URL or log excerpt was supplied to the developer.

Accordingly:

- The Vercel dashboard has **not** been inspected.
- Build logs have **not** been read.
- No deployment status, no success or failure, and no error message is being reported as fact.
- No Vercel project was created, linked or deployed.

Nothing in this report should be read as a verified statement about the live Vercel state.

### Exact access required

| # | What is needed | Why |
|---|---|---|
| V1 | Confirmation that a Vercel project exists, and its **project name and team/scope** | To know whether anything is deployed at all |
| V2 | Which **GitHub repository and branch** the Vercel project is connected to | This is the single most likely cause of a confusing deployment state (see §6) |
| V3 | **Viewer (or Member) access** to the Vercel team for the developer, or exported build logs of the most recent deployment | To diagnose a failed build |
| V4 | The current **deployment URL** (production and latest preview) | To verify routes, headers and `robots.txt` on real hosting |
| V5 | Whether **Vercel Authentication** is enabled on Preview | Staging must not be publicly reachable or indexable |
| V6 | The Vercel **plan** in use (Hobby / Pro) | Hobby is licensed for non-commercial use only; a commercial site needs Pro |

---

## 5. Connected repository and branch findings

**Not verifiable without Vercel access.** What *is* established:

- The code lives in `NJEnetwork/njen-website`, branch `main`, commit `8bffc97...`.
- The other repository, `NJentertainmentnetwork/njen-website`, is **empty**.
- Therefore a Vercel project connected to the second repository would have **nothing to build**.

Which repository the Vercel project points at is item V2 above and must be read from the dashboard by NJEN.

---

## 6. Deployment log findings

**None. No logs were accessible, and none are being invented.**

### Most probable hypothesis — clearly labelled UNVERIFIED

> If a Vercel deployment appears missing, empty or failing, the most probable explanation is that **the Vercel project is connected to the new, empty `NJentertainmentnetwork/njen-website` repository rather than to `NJEnetwork/njen-website`, which is where the code actually is.** A project pointed at an empty repository has no commit to deploy, so no build is produced.
>
> **This is a hypothesis, not a finding.** It is untested because Vercel access was not provided. It can be checked in under a minute: open the Vercel project, then Settings → Git, and read which repository and branch are connected (V2).

### What has been positively ruled out

These were *not* assumed — they were tested locally, so they can be eliminated as causes of any build failure:

| Candidate cause | Ruled out by |
|---|---|
| Missing environment variables | Clean-room `next build` with **every variable unset** succeeded (§13) |
| Broken or out-of-date lockfile | Clean `npm ci` succeeded from the committed `package-lock.json` |
| A TypeScript or lint error | `tsc --noEmit` passed; build completed with 0 warnings |
| Wrong build/output configuration | Standard Next.js defaults; no `vercel.json` needed |
| Case-sensitive import failure on Linux | All 15 `@/` imports audited for exact case — all correct |

So if a build is failing on Vercel, the cause is **in the Vercel project configuration or the repository connection, not in the code.**

---

## 7. Root cause

**Not determined — access not available.** See §6 for the labelled hypothesis and §4 for the access needed to confirm or reject it.

What *is* determined with evidence: the GitHub push succeeded, and the codebase builds cleanly from scratch with no environment variables.

---

## 8. Complete environment-variable matrix

Produced by reading every `process.env` reference in the source, not by transcribing `.env.example`. The full matrix, with groups A–F, Vercel environment targeting, sensitivity and value formats, is in **`ENVIRONMENT_VARIABLES.md`** (created today). Summary:

| Group | Purpose | Count | Required now? |
|---|---|---|---|
| **A** | Current public website | 3 | **None required.** All three are optional switches |
| **B** | Supabase / PostgreSQL | 3 | No — Supabase is not integrated |
| **C** | Payload CMS | 2 | No — Payload is not installed |
| **D** | Email / monitoring / analytics | 7 | No — none installed |
| **E** | Browser-side Supabase | 2 | No — deliberately not used at launch |
| **F** | In `.env.example` but unused by code | 14 | No — documented placeholders |

### Group A — the only variables the code actually reads

| Variable | Used in | Server-only | Required | Effect |
|---|---|---|---|---|
| `NJEN_SITE_URL` | `app/layout.tsx`, `app/robots.ts`, `app/sitemap.ts` | Yes | Optional now; **needed at launch** | Enables canonical URLs and the sitemap. Unset means an empty sitemap and no canonicals |
| `NJEN_ALLOW_INDEXING` | `app/robots.ts` | Yes | Optional; **production only at go-live** | Unset means `robots.txt` = `Disallow: /`. `true` allows crawling |
| `NJEN_PREVIEW_UNPUBLISHED` | `lib/sections.ts` | Yes | Optional; internal review only | `true` reveals the 10 unpublished sections. **Never set in production** |

**Headline:** the current site needs **zero** environment variables to build and deploy. Every real secret placeholder uses `[CLIENT TO PROVIDE SECURELY]`; no real credential appears in any file or report.

Two checks worth stating explicitly:

- **No variable is used by code but missing from `.env.example`.** All three live variables are documented there.
- **No secret sits behind a `NEXT_PUBLIC_` prefix.** The only `NEXT_PUBLIC_` names are future, non-secret values (a Sentry DSN, the Plausible domain) plus two Supabase browser names that are deliberately left unused.

---

## 9. Supabase readiness

**Status: not started, and correctly so — this is blocked on NJEN, not on development.**

| Check | Finding |
|---|---|
| Supabase package installed | **No** — no `@supabase/*` dependency exists |
| Supabase client, connection or query in code | **None anywhere** |
| Project / credentials provided | **No** (register D4/T1) |
| Migration SQL prepared | **Yes** — `db/migrations/0001_init_app_schema.sql` with `db/migrations/README.md` |
| Role and data model documented | **Yes** — `DATABASE_AND_ROLE_MODEL.md` |
| Ownership split documented | **Yes** — `SUPABASE_PAYLOAD_RESPONSIBILITY_MODEL.md` |

### The one item that must not be missed (ARCH-1)

Supabase's Data API exposes the `public` schema over HTTP by default. Payload's Postgres adapter also creates its tables in `public` by default. If both defaults are left alone, **Payload's tables become reachable through the Supabase API.** The mitigation is documented and must be applied *at project creation*, before any data exists: keep application tables in a dedicated non-public schema, restrict what the Data API exposes, and enable row-level security on anything that remains exposed. Retrofitting this after content exists is considerably more disruptive.

**Required from NJEN:** an NJEN-owned Supabase project (D4/T1), with the connection string and service-role key delivered through a secure channel — never by email, chat or screenshot.

---

## 10. Payload CMS readiness

**Status: planned and prepared; deliberately not installed.**

| Check | Finding |
|---|---|
| Payload packages | **Not installed** — no `payload`, no `@payloadcms/*` |
| `payload.config.ts` | **Does not exist** |
| Admin route / collections / database adapter | **None** |
| Written plan | **Yes** — `PAYLOAD_CMS_PLAN.md` |
| Content mapping | **Yes** — `CONTENT_MAPPING.md` |
| Typed public contracts in place | **Yes** — `lib/content-types.ts` |
| Service seam in place | **Yes** — `lib/jobs.ts`, `lib/publications.ts` |

The application already reads content through a service layer that returns explicit public DTOs, so installing Payload means replacing the inside of those functions, not rewriting pages. The visibility contract is enforced twice — at the type level (`visibility: "public"`) and at runtime (`publicOnly()`) — so a members-only record cannot reach a public page by accident.

**Installation is blocked on Supabase**, because Payload needs `DATABASE_URI` to initialise. Installing it without a database would break the build, which is precisely the failure this project has avoided so far.

---

## 11. Security and credential checks

| Check | Result |
|---|---|
| Real `.env` file in the project | **None** — only `.env.example` with placeholders |
| `.gitignore` covers env files | **Yes** — `.env`, `.env.*`, with `!.env.example` |
| Secrets in the client bundle | **0 hits** across 8 sensitive patterns scanned in `.next/static` |
| Secret behind `NEXT_PUBLIC_` | **None** |
| Credentials printed in any report | **None.** `[CLIENT TO PROVIDE SECURELY]` used throughout |
| Security response headers | **4/4 present**; `x-powered-by` absent |
| `robots.txt` default | `Disallow: /` — cannot be indexed by accident |
| Public API routes | **None exist** |
| Protected/portal probe paths | All **404** |

One item was corrected today: `.env.example` contained an illustrative PostgreSQL connection-string shape. Although it was commented out and held no real credential, it was rewritten to use explicit placeholders so that no line in the repository resembles a real connection string.

---

## 12. Files changed today

| File | Change |
|---|---|
| `ENVIRONMENT_VARIABLES.md` | **New.** Complete code-verified environment-variable matrix, groups A–F, plus expected Vercel settings and secret-handling rules |
| `DAY10_IMPLEMENTATION_REPORT.md` | **New.** This report |
| `.env.example` | Connection-string example replaced with explicit `[CLIENT TO PROVIDE SECURELY]` placeholders |
| `WEEK1_CLIENT_INPUT_REGISTER.md` | Status updated where evidence supports: GitHub push **confirmed**; the new public repository added as an open decision; Vercel still **unverified** |
| `LAUNCH_QA_CHECKLIST.md` | Hosting-dependent items annotated with the Day 10 access position |

**No application code was changed.** No dependency was added, removed or upgraded.

---

## 13. Local build and test results

### Clean-room test (simulating what Vercel does)

A fresh copy of the tracked source, in a separate directory, with **no environment variables set at all**:

| Step | Result |
|---|---|
| `npm ci` from the committed lockfile | **PASS** — 29 packages, no integrity or resolution warnings |
| `next build` with zero environment variables | **PASS** — 24 routes generated |
| Import case-sensitivity audit (Linux builds are case-sensitive) | **PASS** — all 15 `@/` imports exact-case; no relative imports |

This is the most useful result of the day: **the codebase deploys cleanly from a bare checkout with no configuration.**

### Project-directory verification

| Check | Result |
|---|---|
| `tsc --noEmit` | **PASS** |
| `next build` | **PASS** — 24 routes, 0 warnings |
| Published routes | 8/8 → **200** |
| Utility routes (`robots.txt`, `sitemap.xml`, favicon) | 3/3 → **200** |
| Unpublished sections | 10/10 → **404** |
| Protected / portal / API probe paths | 12/12 → **404** |
| Security headers | **4/4** present; `x-powered-by` absent |
| `robots.txt` content | `Disallow: /` as expected with indexing off |
| Client-bundle secret scan | **0 hits** |

**Port 3000 is free.** The temporary local production server used for route verification was stopped and the port confirmed closed.

---

## 14. Tests not run, and why

| Not run | Why |
|---|---|
| Vercel dashboard inspection, build-log review | **No Vercel access provided** (§4) |
| Verification of the live deployment URL, headers and `robots.txt` on real hosting | No deployment URL available |
| Confirmation of which repository Vercel is connected to | Requires dashboard access (V2) |
| Any Supabase connection or query test | No Supabase project or credentials exist |
| Payload admin login, collection or migration test | Payload is not installed; blocked on the database |
| Email delivery test | Resend not installed; no account |
| Real-device iPhone and Safari testing | Needs physical devices against staging |
| Screen-reader testing (VoiceOver, NVDA) | Needs a real assistive-technology pass |
| Backup/restore and monitoring verification | Needs the database and Sentry to exist |
| Any Git write operation | **Prohibited** — the client performs all Git operations |

---

## 15. Client approvals and access still required

| # | Item | Blocking | Owner |
|---|---|---|---|
| 1 | **Which repository is official?** `NJEnetwork/njen-website` (has the code, private) or `NJentertainmentnetwork/njen-website` (empty, **public**) | Repository strategy; any migration | NJEN |
| 2 | If the new repository is chosen: **make it private**, or decide that internal documentation is excluded from it | Prevents publishing business rules, costs and the roadmap | NJEN |
| 3 | **Vercel project name, team/scope, and connected repository + branch** | Diagnosing deployment state | NJEN |
| 4 | **Vercel viewer access** for the developer, or exported build logs | Diagnosing any build failure | NJEN |
| 5 | **Vercel plan confirmation** (Hobby is non-commercial only) | Licensing compliance | NJEN |
| 6 | **Vercel Authentication enabled on Preview** | Staging must not be public or indexable | NJEN |
| 7 | **NJEN-owned Supabase project** plus credentials via a secure channel (D4/T1) | Payload install, all CMS work | NJEN |
| 8 | **Production domain** confirmation (C13) | Canonical URLs, sitemap, email sending domain | NJEN |
| 9 | **Legal/policy page wording** — Privacy, Terms, Accessibility (B6) | Launch requirement | NJEN |
| 10 | **Contact destination address** (C8) and Resend account | Week 3 form delivery | NJEN |
| 11 | **Real job content, or approval of an empty job board** (C11) | Removing sample data at launch | NJEN |
| 12 | **Named staff admin users** (B7) | First Payload accounts | NJEN |
| 13 | **GitHub plan decision** — Free or Team (T9) | Protected branches on a private repository | NJEN |

Items 1–4 unblock the most work per minute of client time.

---

## 16. Day 11 next steps

Ordered so that nothing waits on something avoidable:

1. **Resolve the repository question** (items 1–2). Until NJEN confirms which repository is official, no migration happens. If the new one is chosen, confirm its visibility first.
2. **Obtain the Vercel facts** (items 3–5) and check the hypothesis in §6 — which repository and branch the project is connected to. Expected to be a one-minute check.
3. **Once a deployment URL exists**, verify on real hosting: all 8 published routes 200, all 10 unpublished 404, security headers present, `robots.txt` disallowing everything, and Preview protected by Vercel Authentication.
4. **Enable Vercel Authentication on Preview** before sharing any staging link with reviewers.
5. **When the Supabase project is delivered**, apply the ARCH-1 mitigation *at creation* — non-public schema, restricted Data API exposure, row-level security — before any content is entered.
6. **Then, and only then, install Payload** against the real `DATABASE_URI`, and move `lib/jobs.ts` and `lib/publications.ts` from sample data to live CMS reads behind the existing typed contracts.
7. **Continue the content pipeline** in parallel, which needs no infrastructure: chase items 8–12 and keep `WEEK1_CLIENT_INPUT_REGISTER.md` current.

Nothing in Day 11 requires a Git write by the developer, and nothing requires spending money without NJEN's explicit approval.

---
---

# Remaining Day 10 Development — Final Audit

**Added 28-09-2026, after the investigation above.** Everything in sections 1–16 stands unchanged: the GitHub findings, the Vercel pending-access position, the environment matrix and the client message draft are all still as recorded. This section covers only the **code-level** audit that followed, and the work done in it.

## A. The approved Day 10 development requirements

Day 10 is the last day of the plan's **"Days 4–10 — Data, auth and publishing foundation"** phase (`30_DAY_LAUNCH_PLAN.md`). There is no separate per-day list, so that phase's six requirements and its gate are the Day 10 scope. Each was audited against the actual source, not against an earlier report's claim.

| # | Requirement (verbatim from the plan) | Status | Evidence |
|---|---|---|---|
| 1 | Implement migrations from reviewed schema | **Complete to the extent possible / BLOCKED on applying** | `db/migrations/0001_init_app_schema.sql` + `README.md` exist and are reviewed. Applying needs a database (register D4/T1). `db/schema.sql` is correctly marked reference-only and is not applied. |
| 2 | Implement authentication only if included in Day-30 scope | **Not applicable** | Authentication is explicitly out of the 30-day scope (register T2: no member accounts at launch; staff login arrives with Payload). Nothing to build, and building it would be out of scope. |
| 3 | Enforce server-side authorization; RLS where Supabase is used | **Partially complete — remainder BLOCKED** | Server-side route gating is implemented and verified: `requireSection()` in `lib/sections.ts` calls `notFound()` for the 10 unpublished sections, in Server Components, so it cannot be bypassed from the browser. RLS needs a database; the ARCH-1 Data API mitigation is written into migration `0001`. |
| 4 | Build admin/moderation path for jobs/content required at launch | **BLOCKED** | This is Payload's admin UI. Payload cannot initialise without `DATABASE_URI`. |
| 5 | Replace demo job API/data with validated database-backed reads | **Was partially complete — the validation half was MISSING and is now implemented** | Demo API removed on 23-09-2026; the service seam is in place. "Database-backed" is blocked. **"Validated" was not implemented** — see B1. |
| 6 | Add structured validation to all writes | **Was partially complete — one declared check was MISSING and is now implemented** | `validateSubmission()` in `lib/forms.ts` covers required fields, trimming, length caps, email, URL and select-option checks. **The timing spam signal was accepted but never evaluated** — see B2. |
| Gate | No client-only authorization | **Satisfied** | All gating is in Server Components. No client-side authorization exists to bypass. |
| Gate | No service-role secret in browser | **Satisfied** | No provider packages, no secrets; the bundle scan found 0 hits across 8 sensitive patterns. |
| Gate | Unpublished content cannot be retrieved through public endpoints | **Satisfied, and now enforced in code rather than only documented** | 10 unpublished sections return 404; unknown slugs return 404; no public API routes exist. The publication-state rule itself is now executable — see B1. |

**Two requirements were genuinely unfinished.** The rest were either already satisfied by Days 1–9, blocked on client-provided infrastructure, or out of scope. No requirement was invented, and nothing scheduled for Days 11–17 was started.

## B. Code changes made in this continuation

### B1 — The publication gate existed only as a comment (requirement 5)

**The gap.** `lib/content-types.ts` states the rule every content service must apply: *"status === published AND publishedAt is not in the future AND (no expiresAt OR expiresAt is in the future) AND closed !== true."* That rule was **documentation only**. No function implemented it, and `lib/jobs.ts` described it in a comment addressed to a future developer. The Days 4–10 gate requires that unpublished content cannot be retrieved through public endpoints; that gate was being met only because no unpublished content exists yet. The moment a CMS supplies records, enforcement would have depended on whoever wrote the adapter reimplementing the rule correctly.

**The change.** A new `lib/publish-gate.ts` holds one implementation of the rule, used by both content services.

- It is **fail-closed**: an unknown status, an absent status, an unparseable `publishedAt` or `expiresAt`, a future `publishedAt`, a past `expiresAt`, or `closed: true` all mean *withhold*. Nothing is shown unless it can be positively confirmed as published and current.
- Every gate field is optional in the type, because a CMS query is not type-checked at runtime. The gate validates rather than assumes.
- `now` is injected, so the time-dependent behaviour is deterministic and testable.
- The gate fields are staff-side and are **never** returned. `lib/publications.ts` now maps its output field by field, so `status`, `publishedAt`, `expiresAt` and `closed` cannot reach a page prop even by spreading a source record.

**The sample-data question, handled explicitly.** `data/jobs.ts` predates the CMS and carries no moderation state, so a fail-closed gate would reject all three sample listings and silently empty the jobs board. Rather than weaken the gate, the allowance is made explicit and temporary: `lib/jobs.ts` passes `missingStatus: "allow"` **only while `JOBS_ARE_SAMPLE_DATA` is true**. When that flag is set to false in the same change that connects the real source, a record with no moderation state is rejected — exactly the behaviour the launch gate requires, active at the moment it starts to matter. A draft, expired or closed record is rejected either way; the allowance covers a missing status and nothing else.

`getPublishedJobBySlug()` now gates **before** matching the slug, so a direct URL cannot reach a record the listing would not show.

**Behaviour today is unchanged:** the same 3 sample job pages build, and the publications archive is still correctly empty.

### B2 — A declared spam signal was collected and ignored (requirement 6)

**The gap.** `SpamSignals.elapsedMs` was documented as *"Milliseconds between form render and submit; near-zero implies a bot"*, and `ContactForm.tsx` measured and passed it on every submission. `validateSubmission()` accepted it and **never looked at it**. The honeypot was enforced; the timing check was not. A declared anti-abuse control that does nothing is worse than none, because it reads as covered.

**The change.** `lib/forms.ts` now enforces it, with `MIN_SUBMISSION_MS = 900` exported as a named constant rather than buried as a literal.

Two deliberate design decisions:

1. **The check runs last, and only on an otherwise complete submission.** A complete payload filled in under 900 ms is the automated case worth stopping. An *incomplete* form submitted quickly is a person who clicked too early and needs to see which fields are missing — they still get field errors, not a dead end. Checking timing first would have turned an empty instant click into an unexplained "could not be accepted".
2. **The rejection is generic and identical to the honeypot rejection** — `{ field: "form", message: "This submission could not be accepted." }` — so it never reveals which check was tripped. Both paths now return the same object.

Rate limiting remains a separate control, correctly scheduled for Days 18–23 and belonging on the server route, not in this function.

**Still preview-only.** This form sends, stores and emails nothing. Enabling delivery still needs C8 recipients, B6 wording and Resend access.

### What was deliberately NOT changed

- **No Supabase or Payload integration**, no connection attempt, no fabricated credential, no table created, no migration run.
- **No job filters or search** — Days 11–17.
- **No email delivery, no route handler, no server action, no persistence** of visitor input.
- **No new dependency**; `package.json` and `package-lock.json` are untouched.
- **No change to `data/jobs.ts`, `db/schema.sql`, `next.config.ts`** or any page component.
- **No git operation.** Working-tree state was read only.

## C. Files created, modified, deleted

| File | Change | Approx. size of change |
|---|---|---|
| `lib/publish-gate.ts` | **Created** — the single fail-closed publication gate | +118 lines |
| `lib/jobs.ts` | Modified — gates every read; documents the sample-data allowance; gates before the slug match | ~+30 lines |
| `lib/publications.ts` | Modified — gate applied ahead of the visibility filter; explicit field mapping so staff fields cannot leak | ~+25 lines |
| `lib/forms.ts` | Modified — timing signal enforced; shared generic rejection; `MIN_SUBMISSION_MS` exported | ~+25 lines |

**Deleted: none.** No application page, component or configuration file was touched.

## D. Tests actually run, and their results

| Test | Result |
|---|---|
| `npm run typecheck` (`tsc --noEmit`, strict) | **PASS** — no errors |
| `npm run build` | **PASS** — compiled in 2.7 s, 24/24 routes generated, **0 warnings**, all 3 sample job pages still generated |
| **Behavioural tests of the changed logic — 37 assertions** (Node 22 native TypeScript execution against the real modules) | **37 passed, 0 failed** |
| Route status codes on a local production server | **PASS** — 8 published 200; 10 unpublished 404; unknown job slug, unknown publication slug, `/api/jobs`, `/directory`, `/performers`, `/portal`, `/admin` all 404 |
| Security response headers | **PASS** — 4/4 present; `x-powered-by` absent |
| `robots.txt` | **PASS** — `User-Agent: *` / `Disallow: /` |
| `sitemap.xml` | **PASS** — empty `urlset` (no `NJEN_SITE_URL`), as designed |
| Client-bundle secret scan (`.next/static`, 8 patterns) | **PASS** — 0 hits |
| Contact form render in preview mode (`next dev` with `NJEN_PREVIEW_UNPUBLISHED=true`) | **PASS** — 200; preview notice, all fields, topic select, honeypot and submit button all render intact |

The 37 assertions covered: published, draft, in-review, rejected, archived, unrecognised, absent and empty status; `closed` overriding everything; past, future and unparseable `publishedAt`; future, past, exactly-now and unparseable `expiresAt`; a valid publish window; list filtering with order preserved; the sample-data allowance accepting a missing status while still rejecting drafts, closed and expired records; and for the form — valid submissions with and without a timing signal, honeypot rejection, missing required fields, invalid email, an option outside the allowed list, over-length input, the exact threshold boundary at 899 and 900 ms, a generic rejection naming no field, an incomplete fast submission still receiving field errors, and `NaN` being ignored.

**Not run, and why:** no Vercel or production verification of any kind (no access — see §4); no Supabase or Payload test (neither exists); no email delivery test; no real-device iPhone or Safari test; no screen-reader test. The changes are server-side logic in three library modules and add no new UI, so no new axe or viewport pass was warranted — the Day 9 results stand.

**Ports 3000, 3001 and 3002 are free.** All temporary servers were stopped.

## E. Remaining code-level Day 10 tasks

**None.** Every Days 4–10 requirement is now either complete, not applicable to the approved scope, or blocked on client-provided infrastructure. No code-level work in this phase is waiting on the developer.

## F. Blocked by client access or approval

| Requirement | Blocked by |
|---|---|
| Apply migration `0001` (requirement 1) | NJEN-owned Supabase project (D4/T1) |
| RLS policies and ARCH-1 verification (requirement 3) | Same |
| Payload admin / moderation path (requirement 4) | Same — Payload needs `DATABASE_URI` |
| Database-backed job reads (requirement 5) | Same, plus real listings or approval of an empty board (C11) |
| Contact form delivery (requirement 6, beyond validation) | C8 recipients, B6 wording, Resend access (D5/T5) |
| Any deployment verification | Vercel access (§4, items V1–V6) |

## G. Belongs to Day 11 or later

- Jobs filters and keyword search (category / location / type) — **Days 11–17**, and dependent on the real data source.
- Connecting Career Center, Events and What's Filming to the content source — **Days 11–17**, dependent on NJEN content.
- Rate limiting, CSP, logging, health checks, backups and a restore test — **Days 18–23**.
- Device, Safari, screen-reader and abuse testing — **Days 24–27**.

## H. First development task for Day 11

**Resolve the repository question and obtain the Vercel facts (§15 items 1–4), then verify the live deployment.** These are client-side actions that unblock everything else and require no code.

The first *coding* task, the moment the Supabase project exists: **apply migration `0001` to a development database and verify the ARCH-1 mitigation** — confirm the `public` schema is not exposed through the Data API before any content is entered — then install Payload against the real `DATABASE_URI`. The publication gate that requirement 5 needed is now in place, so the CMS adapter only has to supply records; it must not reimplement the gate.
