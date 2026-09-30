NJEN - BACKEND ACCESS CHECKLIST
==============================

Date: 30-09-2026 (Day 12). Client-facing.
Companion to `GITHUB_ACCESS_CHECKLIST.md` (repository access) and
`ENVIRONMENT_VARIABLES.md` (the full variable matrix).

PURPOSE
This is the list of accounts and access NJEN needs to create or grant before the
database, CMS and email work can begin. Everything here is blocked on NJEN, not
on development. Each item says what it unblocks, so the order is clear.

HOW CREDENTIALS MUST BE SHARED
  - NEVER send a password, API key, service-role key or database connection
    string by email, WhatsApp, SMS, chat message or screenshot.
  - Preferred: NJEN creates the account, invites the developer as a team member,
    and the developer reads what they need from the dashboard. No secret changes
    hands at all.
  - Where a value genuinely must be transferred, use a one-time secret link
    (for example 1Password/Bitwarden sharing, or a self-destructing note) sent
    over a different channel than the one used to announce it.
  - Every account must be NJEN-OWNED and recoverable by NJEN (Business Rules
    §15). The developer should never be the account owner.
  - Real values are entered only in the provider dashboard and in Vercel's
    encrypted environment settings - never in the repository, a document or a
    message.

CURRENT STATE, STATED PLAINLY: none of the services below is installed or
connected. There is no Supabase package, no Payload package, no Resend package,
no Sentry and no Plausible in `package.json`. Nothing is half-wired and waiting
to break; the work simply has not started, because it cannot.


1. SUPABASE  (register D4 / T1)  -  TOP PRIORITY
=================================================

This single item unblocks the most work of anything on this list: Payload CMS,
real job listings, publications, events and What's Filming all depend on it.

  [ ] NJEN-owned Supabase organisation and project created
      - Region: US East is the sensible default for a New Jersey audience
      - Plan: the Free tier is enough for development. Production needs Pro
        (~$25/month) for daily backups and point-in-time recovery - see
        `INFRASTRUCTURE_AND_COST_ASSESSMENT.md`
  [ ] Developer invited to the organisation (Developer or Owner role)
  [ ] SEPARATE development and production projects, or at minimum separate
      databases - staging must never touch production data
  [ ] Database password recorded by NJEN in a password manager (NOT sent to the
      developer; it is embedded in the connection string the developer reads
      from the dashboard)
  [ ] Confirm which connection string to use: the POOLED connection string is
      required for serverless deployment on Vercel
  [ ] Backup retention decision (register T8) - retention period and whether
      point-in-time recovery is enabled

  Environment variables this produces (all SERVER-ONLY, all secret unless noted):
      DATABASE_URI                 - secret. Postgres connection string
      SUPABASE_URL                 - not secret (project identifier)
      SUPABASE_SERVICE_ROLE_KEY    - HIGHEST SENSITIVITY. Bypasses row-level
                                     security entirely. Never NEXT_PUBLIC_
  Deliberately NOT used at launch: NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY. Browser-side database access is not part of
      the launch design and adding it early would create an entry point for no
      benefit.

  Developer work that follows immediately (no client involvement needed):
  [ ] Apply migration `db/migrations/0001_init_app_schema.sql` to the
      DEVELOPMENT database first
  [ ] VERIFY THE ARCH-1 MITIGATION BEFORE ANY CONTENT IS ENTERED. Supabase
      exposes the `public` schema over HTTP by default, and Payload puts its
      tables in `public` by default. Left alone, those two defaults make the CMS
      tables reachable through the Supabase API. The fix is to remove `public`
      from the exposed schemas (or disable the Data API) and enable row-level
      security on anything that remains exposed. This is far easier at project
      creation than afterwards - see `SUPABASE_PAYLOAD_RESPONSIBILITY_MODEL.md` §3
  [ ] Row-level security policies on any table that is exposed
  [ ] Perform and DOCUMENT a restore test - configuring backups is not the same
      as knowing they work

  Blocks if missing: Payload CMS, real jobs, publications, events, What's
  Filming, the employer posting workflow. In short, most of the remaining build.


2. PAYLOAD CMS  (register T3)
==============================

Payload runs inside the NJEN Next.js application - there is no separate CMS
hosting to buy and no separate vendor account to create. It is self-hosted and
open-source, so there is no licence cost.

  [ ] Confirm Payload is still the approved CMS (it is recorded as approved -
      decision R6)
  [ ] Confirm it may be installed into the existing application (no separate
      deployment)
  [ ] SUPABASE MUST EXIST FIRST - Payload cannot start without a live database
      connection, so installing it earlier would break the build
  [ ] Named staff who need CMS accounts, with their roles (register B7):
        - Admin      - full access, manages users
        - Editor     - creates and publishes content
        - Contributor- creates drafts only, cannot publish
      For each: full name, work email address, role
  [ ] First admin email address, for the initial account created at setup
  [ ] Two-factor authentication expectation for staff accounts confirmed
  [ ] Who approves content before it goes live (the moderation owner)

  Environment variables this produces (SERVER-ONLY):
      PAYLOAD_SECRET       - secret. Signs sessions and tokens. Generated by the
                             developer at setup; treat like a password. Use a
                             DIFFERENT value for Preview and Production
      PAYLOAD_ADMIN_EMAIL  - not secret, but personal data
      (also depends on DATABASE_URI from section 1)

  Already prepared, so this is wiring rather than design: `PAYLOAD_CMS_PLAN.md`
  (collection design), `CONTENT_MAPPING.md` (which page reads which collection),
  `lib/content-types.ts` (typed public contracts), `lib/publish-gate.ts` (the
  published/scheduled/expired/closed rule, already enforced) and the content
  service seam in `lib/jobs.ts` and `lib/publications.ts`.

  Blocks if missing: all editable content. Every unpublished section stays a 404
  until staff can enter approved content.


3. RESEND  (register D5 / T5)
==============================

Needed for the contact form and for notifying staff of moderated submissions.

  [ ] NJEN-owned Resend account created (free tier: 3,000 emails/month, ample)
  [ ] Developer invited to the team
  [ ] Sending domain decided - should match the production domain, e.g.
      `njen.org` (depends on register C13)
  [ ] DNS ACCESS CONFIRMED (register D3). Resend requires DKIM and SPF records
      on the sending domain. Whoever controls NJEN's DNS must be able to add
      them, or email will land in spam. Note: NO DNS CHANGE WILL BE MADE WITHOUT
      EXPLICIT APPROVAL
  [ ] Sending domain verified in Resend (after the DNS records propagate)
  [ ] From address decided, e.g. `no-reply@` or `hello@`
  [ ] RECIPIENT ADDRESSES DECIDED (register C8) - where contact enquiries go, and
      who owns employer, partner, press and accessibility enquiries. Recipients
      come from configuration, never from user input
  [ ] Approved consent, privacy and disclaimer wording for the form (register B6)

  Environment variables this produces:
      RESEND_API_KEY   - SECRET, server-only
      NJEN_EMAIL_FROM  - not secret. Must be a verified address on the domain
      NJEN_EMAIL_TO    - not secret, but internal

  Blocks if missing: contact form delivery. The form currently exists as
  preview-only - it validates input locally and sends, stores and emails
  nothing, and it says so on the page. `/contact` itself returns 404 until the
  section is published, which is deliberate (decision R5).


4. VERCEL  (register D2 / T4)
==============================

A deployment already exists and is working. What is missing is access and a
decision.

  [ ] CONFIRM WHICH OF THE THREE PROJECTS IS OFFICIAL:
        njen-website / njen-website-live / njen-website-production
      Then pause or delete the other two. The developer will not modify any
      Vercel project
  [ ] Confirm the team is NJEN-OWNED, not a personal account
  [ ] Developer invited (Viewer is enough to read logs and settings; Member is
      needed to change settings)
  [ ] Confirm the connected repository is `NJentertainmentnetwork/njen-website`
      on branch `main`
  [ ] PLAN CONFIRMATION: Vercel's free Hobby plan is licensed for NON-COMMERCIAL
      use only. A commercial NJEN site needs Pro (~$20/month per seat)
  [ ] ENABLE VERCEL AUTHENTICATION ON PREVIEW - free, and it keeps staging off
      the public internet. This is the one change recommended now
  [ ] Production domain and DNS plan (register C13) - NO CHANGE WITHOUT EXPLICIT
      APPROVAL
  [ ] Environment variables: none are required today. `NJEN_SITE_URL` and
      `NJEN_ALLOW_INDEXING` are set at launch, on the official project only

  Full dashboard walkthrough: `DAY12_VERCEL_REVIEW.md` section 4.


5. GITHUB  (register A2 / D1 / D7 / T9)
========================================

  [ ] MAKE THE REPOSITORY PRIVATE. `NJentertainmentnetwork/njen-website` was
      verified PUBLIC on 30-09-2026. NJEN's stated intention is private. See
      `DAY12_SECURITY_AUDIT.md` section 3 - no credentials are exposed, but all
      internal planning documents are
  [ ] Confirm the organisation is NJEN-owned with a named recovery owner
  [ ] Developer access confirmed on the new repository (push access already
      works - commits are present)
  [ ] GitHub plan decision (register T9): Free is enough to start; Team adds
      protected branches on a private repository
  [ ] Review Settings > Code security: secret scanning, push protection,
      Dependabot alerts
  [ ] Confirm whether the old `NJEnetwork/njen-website` was deleted or made
      private, so there is one unambiguous source of truth


6. OTHER SERVICES REFERENCED BY THE PROJECT
============================================

These are named in `.env.example` and in the approved technical direction, but
NO CODE CALLS THEM and no package is installed. They are Week 3-4 items.

  Service   | Register | Purpose            | Cost        | Needed when
  ----------|----------|--------------------|-------------|-----------------
  Sentry    | D6 / T7  | Error monitoring.  | Free tier   | Days 18-23.
            |          | Active monitoring  | sufficient  | Needs an
            |          | is a launch        | to start    | NJEN-owned account
            |          | acceptance rule    |             | and a developer
            |          |                    |             | invite
  Plausible | D6 / T6  | Privacy-friendly   | ~$9/month   | Days 18-23.
            |          | analytics, no      |             | NJEN-owned account
            |          | cookies            |             | + developer invite
  Newsletter| T5a      | NOT APPROVED and   | -           | No variables, no
  provider  |          | NOT REQUIRED. The  |             | account, nothing to
            |          | public archive is  |             | do
            |          | CMS content        |             |
  Payment   | T10      | POST-LAUNCH only   | -           | Not at launch
  provider  |          |                    |             |

  Environment variables for Sentry and Plausible, when the time comes:
      SENTRY_DSN                   - not secret (send-only endpoint)
      NEXT_PUBLIC_SENTRY_DSN       - intentionally public
      SENTRY_AUTH_TOKEN            - SECRET, build-time only
      NEXT_PUBLIC_PLAUSIBLE_DOMAIN - not secret

  No other external service is referenced anywhere in the code. There is no
  third-party script, font CDN, analytics tag, map embed, chat widget or tracker
  on any page - verified by inspection of the application source.


7. PRIORITY ORDER
==================

  1. Make the GitHub repository private (section 5) - minutes, and it is the
     open exposure
  2. Confirm the official Vercel project and enable Preview protection
     (section 4) - minutes
  3. Create the Supabase project and invite the developer (section 1) - this is
     the real unblocker for the remaining build
  4. Provide the named staff CMS users (section 2) and the production domain
     (register C13)
  5. Resend account plus DNS access, alongside the C8 recipients and B6 wording
     (section 3)
  6. Sentry and Plausible (section 6), in time for Days 18-23

Items 1 and 2 cost nothing and take minutes. Item 3 is the one that determines
whether the remaining roadmap can start.
