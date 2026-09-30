NJEN - DAY 12 SECURITY AND PUBLIC EXPOSURE AUDIT
================================================

Date: 30-09-2026
Scope: Read-only audit of the local working tree and the full local Git history,
plus unauthenticated (anonymous) probes of the public internet.
Nothing was modified. No credential was rotated, created or printed.

Repository audited: https://github.com/NJentertainmentnetwork/njen-website
Branch: main


HEADLINE
========

Two findings, and they are very different in kind:

1. CREDENTIALS: CLEAN. No secret, key, token, password or connection string was
   found in the working tree or anywhere in the Git history. No credential
   rotation is required.

2. REPOSITORY VISIBILITY: THE OFFICIAL REPOSITORY IS CURRENTLY PUBLIC. This was
   verified, not assumed. The client's instruction is that it should be private.
   All source code and all internal planning documents - including the master
   business rules, the cost assessment and the client input register - are
   readable by anyone, with no GitHub account.

The second finding is the action item. Because the first finding is clean, the
exposure is of confidential business material, not of credentials, so the fix is
a visibility change and not an emergency credential rotation.


1. SECRET SCAN - CURRENT WORKING TREE
======================================

1.1 Environment files
----------------------

  File            | Present | Tracked by Git | Contents
  ----------------|---------|----------------|--------------------------------
  .env.example    | Yes     | Yes            | Placeholders only - see 1.2
  .env            | No      | -              | -
  .env.local      | No      | -              | -
  .env.production | No      | -              | -
  .env.development| No      | -              | -

Verified by directory listing and by `git ls-files`. `.env.example` is the only
environment file that exists anywhere in the project.

`.gitignore` ignores `.env` and `.env.*` and re-includes only `!.env.example`,
so a real environment file created locally in future cannot be committed by
accident. It also ignores `.vercel/`, which is where Vercel writes linked
project identifiers.

1.2 .env.example - confirmed placeholder-only
----------------------------------------------

Every variable in `.env.example` is COMMENTED OUT. A scan for any uncommented
assignment (`^[A-Z_]+=.`) returned nothing, and a scan for any non-comment,
non-blank line returned nothing at all.

This means the file is documentation: it names the 17 variables the project will
eventually need and explains each, and it supplies no value for any of them. The
one line that previously showed an illustrative PostgreSQL connection-string
shape was changed on Day 10 to use `[CLIENT TO PROVIDE SECURELY]`.

Classification: SAFE PUBLIC CONFIGURATION / PLACEHOLDERS. Not a secret.

1.3 Pattern scan of source, configuration and documentation
------------------------------------------------------------

Scanned `*.ts`, `*.tsx`, `*.js`, `*.json`, `*.sql`, `*.md` (excluding
`node_modules/` and `.next/`) for assignment-shaped credentials, i.e.
`password|passwd|api_key|apikey|secret|token` followed by a quoted value of
eight or more characters.

  Result: NO MATCHES.

1.4 Provider-specific credential formats
-----------------------------------------

Scanned for the literal formats real credentials take:

  Credential type                  | Pattern searched            | Found
  ---------------------------------|-----------------------------|-------
  JWT / Supabase anon+service keys | `eyJ...` (20+ chars)        | None
  Supabase secret / access token   | `sb_secret_`, `sbp_` + hex  | None
  Supabase service-role key        | `service_role` near `eyJ`   | None
  Resend API key                   | `re_` + 20 chars            | None
  Stripe keys                      | `sk_live_`, `sk_test_`      | None
  AWS access key ID                | `AKIA` + 16 chars           | None
  GitHub tokens                    | `ghp_`, `gho_`, `github_pat_`| None
  Private keys                     | `-----BEGIN ... PRIVATE KEY`| None
  Postgres/Mongo URLs with a       | `postgres://user:pass@`,    | None
  password embedded                | `mongodb+srv://user:pass@`  |
  Slack tokens                     | `xox[baprs]-`               | None
  Google API keys                  | `AIza` + 35 chars           | None

  Result: NO MATCHES in the working tree.

1.5 NEXT_PUBLIC_ exposure check
--------------------------------

A `NEXT_PUBLIC_` prefix compiles a value into browser JavaScript, so a secret
behind that prefix is published to every visitor.

  Occurrences of `NEXT_PUBLIC_` in application source: ONE, and it is a code
  comment in `lib/sections.ts:12` warning that the preview flag is server-only
  and must never be given that prefix.

No `NEXT_PUBLIC_` variable is read by any code. The five `NEXT_PUBLIC_` names
documented in `.env.example` are all future, non-secret values (a Sentry DSN,
the Plausible domain) plus two Supabase browser names deliberately left unused.

  Result: NO SECRET IS EXPOSED TO THE BROWSER.

1.6 Personal data
------------------

Scanned every tracked file for email-shaped strings, excluding
`example.com`/`example.org` and framework noise.

  Result: NO real email addresses, phone numbers or postal addresses found in
  tracked files.

Note: Git commit metadata does contain the committer's name and email address,
which is normal and unavoidable for any Git repository. In a public repository
that metadata is visible. It is not a secret, but it is worth knowing.

1.7 Hardcoded credentials in database files
--------------------------------------------

`db/schema.sql` and `db/migrations/0001_init_app_schema.sql` were read in full.
They contain DDL only - schema, types, tables, triggers, indexes. No connection
string, no role password, no `CREATE ROLE ... PASSWORD`, no `ALTER USER`.


2. GIT HISTORY AUDIT
=====================

Method (all read-only; no history was rewritten and no destructive command was
run):

  - `git log --all --diff-filter=A --name-only` to list EVERY file ever added in
    ANY commit on ANY branch - 91 distinct paths.
  - `git log --all -p` to stream the full patch text of all history, scanned
    against the provider-credential patterns in 1.4 and the assignment-shaped
    patterns in 1.3.

History inspected: 5 commits on `main`.

  efffa00  Complete Day 11 jobs filters and launch foundation
  04703b7  Set vercel framework to nextjs
  990c37c  test
  68b2125  Complete Day 10 publishing and validation foundation
  8bffc97  Initial NJEN website foundation

2.1 Secret-shaped file paths ever committed
--------------------------------------------

Filtered the 91 historical paths for `.env`, `secret`, `credential`, `token`,
`.pem`, `.key`, `.pfx`, `.p12`, `id_rsa`, `.npmrc`, `.netrc`, `service account`,
`.vercel`.

  Result: exactly ONE match - `.env.example` - which is the intended,
  placeholder-only file. No real environment file has ever been committed.

2.2 Secret content ever committed
----------------------------------

  Result: NO MATCHES for any provider credential format, and no matches for
  assignment-shaped credentials, across the entire patch history.

2.3 Conclusion
---------------

BASED ON THE INSPECTED HISTORY (all 5 commits, all branches present locally),
THE AUDIT FOUND NO EVIDENCE OF ANY COMMITTED SECRET.

No history rewrite, no `git filter-repo`, and no credential rotation is required
on the evidence available.

Honest limitation: this covers the history present in the local clone. If
commits exist on the remote that were never fetched here - for example on a
branch that was pushed and deleted, or in a pull request from a fork - they were
not inspected. Given the project's history (one developer, one branch, five
commits) this is unlikely, but it is stated rather than glossed over. A
GitHub-side secret-scanning alert check would close it (see section 5).


3. REPOSITORY VISIBILITY - VERIFIED FINDING
============================================

3.1 What was verified, and how
-------------------------------

Queried the public GitHub API with NO authentication, and fetched files from
`raw.githubusercontent.com` with NO authentication:

  GET https://api.github.com/repos/NJentertainmentnetwork/njen-website

  full_name       : NJentertainmentnetwork/njen-website
  private         : FALSE
  visibility      : PUBLIC
  default_branch  : main
  pushed_at       : 2026-09-29T07:48:28Z
  fork            : false
  archived        : false

An unauthenticated request returning repository metadata is itself proof of
public visibility: a private repository returns HTTP 404 to an anonymous caller.

3.2 Files confirmed readable by anyone
---------------------------------------

Each of these returned HTTP 200 with real content to an anonymous request:

  Path                                              | Anonymous HTTP
  --------------------------------------------------|----------------
  package.json                                       | 200
  lib/sections.ts                                    | 200
  .env.example                                       | 200
  MASTER_BUSINESS_RULES_ADDENDUM.md                  | 200
  INFRASTRUCTURE_AND_COST_ASSESSMENT.md              | 200
  WEEK1_CLIENT_INPUT_REGISTER.md                     | 200
  NJEN_Developer_Master_Business_Rules_iPhone.pdf    | 200

The content of `package.json` was fetched and printed to confirm this is real
retrieval and not a caching artefact.

3.3 What is therefore publicly exposed
---------------------------------------

  Category                  | Exposed | Assessment
  --------------------------|---------|-----------------------------------------
  All application source     | Yes     | Low direct risk on its own. No secrets,
  code                       |         | no auth logic, no private data. Many
                             |         | companies open-source more than this.
                             |         | But it reveals the full structure,
                             |         | including which sections are hidden.
  Internal planning docs     | Yes     | THE REAL CONCERN. Business rules, the
  (Day 1-11 reports,         |         | post-launch roadmap, the pricing
  business rules addendum,   |         | decisions ($25 photo fee, 40%
  cost assessment,           |         | SAG-AFTRA discount), infrastructure
  post-launch assessment,    |         | costs, and the client input register
  client input register)     |         | naming every outstanding decision.
  Client-supplied PDF and    | Yes     | Client's own documents, republished
  DOCX documents             |         | publicly without that being the intent.
  Client message drafts      | Yes     | Internal drafts of messages to NJEN.
  Credentials                | NO      | None exist to expose (sections 1-2).
  Private performer or       | NO      | None exists in the codebase at all.
  member data                |         |
  Database contents          | NO      | No database exists yet.

3.4 Secondary observations
---------------------------

  - The previous repository, `NJEnetwork/njen-website`, returns HTTP 404 to an
    anonymous API request. That is consistent with either deletion or private
    visibility; the two cannot be distinguished without account access, and
    neither is claimed here.

  - The local clone has TWO remotes, `origin` and `official`, both pointing at
    the same URL (`NJentertainmentnetwork/njen-website.git`). Harmless, but a
    duplicate that is worth tidying to avoid confusion later. This is a local
    developer-machine matter, not a security issue.


4. RECOMMENDED REMEDIATION
===========================

  # | Action                                    | Urgency | Owner
  --|-------------------------------------------|---------|--------
  1 | Change the repository to PRIVATE           | HIGH    | NJEN
    | GitHub: repository > Settings > General >  |         |
    | Danger Zone > Change visibility > Private  |         |
  2 | Decide the documentation policy (below)    | MEDIUM  | NJEN
  3 | Check GitHub secret-scanning alerts        | LOW     | NJEN
  4 | Remove the duplicate local Git remote      | LOW     | Developer

On item 1: making the repository private stops future access immediately, but it
does not un-publish what has already been fetched, indexed or forked while it
was public. Because no credential was ever present, there is nothing to rotate -
the residual exposure is confidential business information, and the honest
position is that it may have been copied.

On item 2, there are two defensible options and this is NJEN's call:

  Option A (simplest): keep everything in one private repository. The documents
  live with the code, history stays intact, and nothing is lost. Recommended if
  the repository stays private.

  Option B: keep only application code in the repository and move internal
  planning documents, the cost assessment, the business rules and the
  client-supplied PDF/DOCX to a private document store. Slightly more work, but
  it means a future decision to open-source, or an accidental visibility flip,
  cannot expose business material. Removing them from the repository properly
  requires a history rewrite, which is disruptive and should only be done
  deliberately and with a fresh clone for everyone.

No credential rotation is recommended, because no credential was found. If NJEN
has separately shared any key with anyone by email or chat, that key should be
rotated on general principle - but that is outside what this audit can see.


5. WHAT COULD NOT BE VERIFIED
==============================

  - GitHub-side security settings: secret-scanning alerts, push protection,
    Dependabot alerts, branch protection, the collaborator list, fork count and
    whether the repository was forked or starred while public. All require
    authenticated repository access, which the developer does not have for this
    organisation.

    Manual check: repository > Settings > Code security, and the Insights >
    Forks tab.

  - Whether the old `NJEnetwork/njen-website` repository was deleted or made
    private (section 3.4).

  - Any Vercel-side exposure: environment variables set in the dashboard,
    deployment logs, or whether Preview deployments are publicly reachable.
    Covered in `DAY12_VERCEL_REVIEW.md`.

  - Commits that exist only on the remote and were never fetched locally
    (section 2.3).


6. WHAT WAS NOT DONE
=====================

No file was created, modified or deleted during this audit. No Git write
operation of any kind. No repository setting changed. No credential created,
rotated or printed. No production, DNS, domain, Vercel or GitHub setting
touched. No secret value appears anywhere in this document.
