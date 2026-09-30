NJEN - DAY 12 VERCEL AND DEPLOYMENT REVIEW
==========================================

Date: 30-09-2026
Scope: Read-only review of deployment configuration IN THE CODEBASE, plus
read-only HTTP checks of the public deployment. The Vercel dashboard was NOT
accessed, because access has not been provided.

NOTHING WAS CHANGED: no Vercel project, setting, domain, DNS record or
environment variable was created, modified or deleted.


1. WHAT THE CODEBASE SPECIFIES
===============================

  Item              | Value found                       | File
  ------------------|-----------------------------------|------------------
  Framework         | `{"framework": "nextjs"}`          | vercel.json
  Build command     | `next build` (via `npm run build`) | package.json
  Dev command       | `next dev`                         | package.json
  Start command     | `next start`                       | package.json
  Typecheck         | `tsc --noEmit`                     | package.json
  Output directory  | default (`.next`)                  | not overridden
  Node version      | NOT PINNED - no `engines` field     | package.json
  Security headers  | 4, via `headers()`                 | next.config.ts
  poweredByHeader   | `false`                            | next.config.ts
  Redirects         | NONE                               | next.config.ts
  Rewrites          | NONE                               | next.config.ts
  basePath          | NOT SET                            | next.config.ts
  trailingSlash     | NOT SET                            | next.config.ts
  Middleware        | NONE - no middleware.ts exists      | -
  Route segment      | NONE - no `export const runtime`,   | -
  overrides         | `dynamic` or `revalidate` anywhere  |
  Env vars required | ZERO for the build to succeed       | verified Day 10

`vercel.json` contains only the framework declaration. It was added by the
developer to resolve the earlier 404 and, per instruction, has been LEFT
UNTOUCHED. It is the minimal correct configuration for this project - no build
command, output directory or install command override is needed, because the
project uses Next.js defaults throughout.

Route inventory produced by `next build` (30-09-2026): 24 routes.
  - 21 static (prerendered)
  - 2 SSG with `generateStaticParams` (`/jobs/[slug]`, `/publications/[slug]`)
  - 1 dynamic (`/jobs`, because it reads search parameters for the Day 11
    filters - this is expected and correct)


2. LIVE DEPLOYMENT - READ-ONLY HTTP EVIDENCE
=============================================

Verified against https://njen-website.vercel.app on 29-09-2026 and unchanged at
the time of this review. These are anonymous HTTP requests only.

  Check                                  | Result
  ---------------------------------------|----------------------------------
  `/`, `/jobs`, `/publications`           | 200
  `/events`, `/contact`                   | 404 (correct - unpublished)
  `/robots.txt`                           | 200, `User-Agent: *` `Disallow: /`
  X-Content-Type-Options                  | nosniff
  Referrer-Policy                         | strict-origin-when-cross-origin
  X-Frame-Options                         | SAMEORIGIN
  Permissions-Policy                      | present as configured
  X-Powered-By                            | absent
  Strict-Transport-Security               | present (added by Vercel)
  Redirects encountered                   | 0

Interpretation: a deployment exists, is healthy, and serves the expected build.
The section registry, the 404 behaviour for unpublished sections, the
default-deny robots policy and all four security headers behave in production
exactly as they do locally.

The Day 11 jobs filters are NOT yet live on that URL, which is expected: they
were committed as `efffa00` locally and the live build predates them, or the
deployment belongs to a different project. Which of those it is cannot be
determined without dashboard access.


3. THE THREE-PROJECT QUESTION - UNRESOLVED
===========================================

NJEN has reported three Vercel projects connected to the NJEN repository:

  - njen-website
  - njen-website-live
  - njen-website-production

NO CLAIM IS MADE HERE ABOUT WHICH IS OFFICIAL. There is no dashboard evidence,
and the client has stated that existing projects must be reviewed before that
decision is made. The only thing established is that
`njen-website.vercel.app` resolves and serves a healthy NJEN build; that URL
pattern suggests the `njen-website` project, but a URL alias is not proof of
which project owns it, so it is not treated as proof.

Why it matters in practice, stated plainly:

  - Three projects on one repository means every push produces up to three
    deployments of identical code. Harmless today; wasteful, and confusing once
    a domain is attached.
  - Environment variables are PER PROJECT. Setting `NJEN_SITE_URL` or
    `NJEN_ALLOW_INDEXING` on the wrong project has no visible effect and is
    unpleasant to diagnose - the symptom is simply that nothing changes.
  - `NJEN_ALLOW_INDEXING=true` on the wrong project at launch would leave the
    real production site unindexed while an unintended copy is indexed instead.
  - Deployment protection is per project too, so one unprotected project can
    expose work in progress even if the others are locked down.

Recommendation (for NJEN to action, not the developer): confirm one project as
official, then pause or delete the other two. The developer will not modify any
Vercel project.


4. DASHBOARD VERIFICATION CHECKLIST
====================================

Everything below requires Vercel dashboard access and is therefore UNVERIFIED.
This is the list to walk through, in order. Read-only - nothing here asks for a
change except where explicitly marked.

4.1 Per project (repeat for all three)
---------------------------------------

  [ ] Project name                  - exact name as shown
  [ ] Team / scope                  - which Vercel team owns it; is it
                                      NJEN-owned, not personal?
  [ ] Connected Git repository      - EXPECT: NJentertainmentnetwork/njen-website
                                      (the old NJEnetwork/... repo is gone)
  [ ] Production branch             - EXPECT: main
  [ ] Root directory                - EXPECT: repository root (blank)
  [ ] Framework preset              - EXPECT: Next.js
  [ ] Build command                 - EXPECT: default (`next build`)
  [ ] Install command               - EXPECT: default
  [ ] Output directory              - EXPECT: default (`.next`)
  [ ] Node.js version               - any 18.18+ works; 20.x or 22.x preferred.
                                      No `engines` field is set, so Vercel's
                                      default applies
  [ ] Environment variables         - EXPECT: none set today. Confirm NO secret
                                      has been added prematurely, and that
                                      nothing sensitive sits behind a
                                      NEXT_PUBLIC_ name
  [ ] Latest deployment             - status, commit SHA, and timestamp. Compare
                                      the SHA against local `main` (`efffa00`)
  [ ] Build logs of the latest       - confirm success; note any warning
      deployment                    |
  [ ] Deployment Protection         - Vercel Authentication ENABLED on Preview?
                                      (free; this is the one recommended change)
  [ ] Production domain(s)          - what is attached, if anything. DO NOT
                                      CHANGE without explicit approval
  [ ] Which deployment is currently  - is the production alias pointing where it
      promoted to production        | should?

4.2 Account level
------------------

  [ ] Plan - Hobby or Pro?          - Vercel's Hobby plan is licensed for
                                      NON-COMMERCIAL use only. A commercial NJEN
                                      site needs Pro (~$20/month per seat)
  [ ] Team members and roles        - who has access; is the developer a viewer
                                      or member?
  [ ] Ownership / recovery          - confirm the account is NJEN-owned and
                                      recoverable by NJEN (Business Rules §15)

4.3 Settings that must NOT be changed without written approval
---------------------------------------------------------------

Recorded so there is no ambiguity: production domains, DNS records, billing,
ownership transfer, deleting any project, and promoting or rolling back a
production deployment.


5. WHAT TO SET, AND WHEN
=========================

For reference only - none of this is to be done now.

  Variable               | When                  | Which environment
  -----------------------|-----------------------|---------------------------
  NJEN_SITE_URL          | When the production   | Production (and Preview
                         | domain is confirmed   | only if canonical URLs are
                         | (register C13)        | wanted there)
  NJEN_ALLOW_INDEXING    | AT LAUNCH ONLY, set   | PRODUCTION ONLY - never on
                         | to `true`             | Preview
  NJEN_PREVIEW_UNPUBLISHED| Only for a protected | NEITHER by default. Never in
                         | internal review build | production
                         | (build-time flag)     |

Note on the preview flag: the section registry is read during static generation,
so `NJEN_PREVIEW_UNPUBLISHED` must be present AT BUILD TIME to have any effect.
Setting it at runtime alone does nothing. Full matrix in
`ENVIRONMENT_VARIABLES.md`.


6. LIMITATIONS
===============

  - The Vercel dashboard, project settings, build logs, environment variables,
    plan, team membership and deployment protection were NOT inspected. No
    access was provided. Nothing about them is claimed.
  - Which of the three projects is official is NOT determined.
  - Whether Preview deployments are protected is NOT determined.
  - Whether the live build corresponds to local `main` (`efffa00`) is NOT
    determined; the Day 11 filters are absent from the live site, which is
    consistent with either an older build or a different project.
  - All live evidence in section 2 comes from anonymous HTTP requests to a
    public URL. No authenticated call was made to any Vercel API.
