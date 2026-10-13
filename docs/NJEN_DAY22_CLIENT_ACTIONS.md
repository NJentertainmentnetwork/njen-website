# NJEN: Day 22 Client Actions

**Prepared 13-10-2026.** This replaces `docs/NJEN_DAY21_CLIENT_ACTIONS.md` as the current list. Nothing from Day 21 has been answered yet, so the items carry over, sharpened by Day 22's findings. **Nothing here has been approved.**

> **Please never send passwords, API keys, the service-role or secret key, database connection strings, or exports of real signups** by chat or email. Every action below returns names, settings, counts or yes/no answers only.

The developer is testing the code against **a separate Supabase project in the developer's own account**. That proves the code works against real Supabase. It does **not** touch NJEN's database, and it doesn't remove any item below.

---

## A. Needed first (each one blocks a real test on NJEN's side)

### 1. Confirm the official Vercel project and its repository connection
- **Why:** the three Vercel projects in the screenshot (`njen-website-live`, `njen-website`, `njen-website-production`) all show the **old** repository, `NJEnetwork/njen-website`. The code lives in `NJentertainmentnetwork/njen-website`. On 13-10-2026 the public URL `njen-website.vercel.app` was still serving a build from about 29-09-2026: the Early Access page and health check return "not found", and the newer security headers are missing. Until a project deploys the official repository, nothing built since then can be tested online.
- **What to do (look only, change nothing yet):** for each of the three projects, open **Settings → Git** and **Deployments**, and note:
  - connected repository;
  - production branch;
  - commit of the latest Production deployment;
  - domains;
  - environment variable **names** (not values).
- **Then decide:** reconnect one existing project to `NJentertainmentnetwork/njen-website` (branch `main`), or create a new one. NJEN, as account owner, makes this change, or authorises it in writing.
- **Return:** the table of the five facts for each project, plus which project is official.

### 2. Share a working preview URL
- **Why:** browser, iPhone and accessibility testing (plan Days 24–27) need a deployed copy of the current code.
- **What to do:** once item 1 is done, open the latest Preview or Production deployment of the official project and copy its URL. A preview without storage settings is fine for layout testing; the page will honestly say "Preview only".
- **Return:** the URL and the commit hash it shows.

### 3. Run the read-only Supabase inspection
- **Why:** the website writes signups through a function called `public.record_early_access_signup` into a table `app.early_access_signups`. NJEN reports a different table, `early_access_leads`, which nothing in the website uses. The developer can't propose a safe change without knowing what exists.
- **What to do:**
  1. Confirm the project is **active** (not paused).
  2. Follow `docs/NJEN_SUPABASE_READ_ONLY_INSPECTION_GUIDE.md`: queries 0–14 and dashboard checks D1–D6, one at a time. The queries only read structure and counts; they return no names or emails.
- **Return:** the results (CSV or screenshots of the result grids), plus the plan name (Free or Pro).

### 4. Explain `early_access_leads`
- **Why:** if a website builder, Zapier/Make, a CRM or an email tool already writes to it, the website must not take it over without a plan for both.
- **Return:** who created it and when; whether it holds real signups (a count is enough); what, if anything, writes to it.

---

## B. Needed once A is answered

### 5. Approve one specific database change (only if the inspection shows one is needed)
- **Why:** without the function, every signup fails safely ("not saved"), but nothing is collected.
- **What happens:** the developer sends the exact SQL, reason, impact and undo steps. Likely options:
  - no change;
  - a single function writing into the existing table;
  - applying the prepared migrations 0001 and 0002.

  The 0001/0002 route **has now been tested end to end on real Supabase**, in a developer-owned test project (13-10-2026): migrations applied, permissions verified, a real signup stored and confirmed by a count-only query. This was not NJEN's project; it shows the prepared migrations work, not that NJEN's database is ready.
- **Return:** written approval of that one change, or questions.

### 6. Set the two storage settings in the official Vercel project, then redeploy
- **Why:** this switches signup storage on. The developer never needs to see the key.
- **What to do:**
  1. In **Settings → Environment Variables (Production)**, add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. A secret key (`sb_secret_…`) is preferred. Never use a `NEXT_PUBLIC_` name.
  2. Redeploy.
  3. Do the controlled test signup in `docs/NJEN_EARLY_ACCESS_DEPLOYMENT_READINESS.md` §5.
- **Preview environment:** don't give Preview deployments the production values, or test signups from previews land in the real lead list. Either:
  - leave Preview unset (previews then honestly show "Preview only", which is enough for layout and QA testing); or
  - point Preview at a separate, non-production Supabase project.
- **Return:** "done", the deployment URL, and the count-only result of the test query. Never the key.

### 7. Provide the approved consent wording and Privacy Policy URL
- **Why:** the consent checkbox is built and switched off. The developer won't write legal text (register B6). Counsel may also confirm whether signups can be collected before this exists.
- **Return:** the exact wording, the URL, and whether ticking is required.

---

## C. Decisions

| # | Decision | Facts | Cost |
|---|---|---|---|
| 8 | **Security patch:** approve `next` 15.5.27, `sharp` 0.35.5 and `source-map-js` 1.2.2 as one separate change; accept the 4 PostCSS advisories until a later, separately approved Next.js 16 upgrade | `docs/NJEN_SECURITY_PATCH_RECOMMENDATION.md`. Clears 4 of 8 advisories. Tested in an isolated copy; revert is one commit. **Nothing applied** | $0 |
| 9 | **Supabase Free or Pro before real traffic** | Free projects pause after about a week of low activity and have no automatic backups. Pro is from $25/month, with daily backups kept 7 days | $0 or from $25/month |
| 10 | **Developer access** (optional) | Vercel Hobby can't add members; Pro Viewer is free, and a Developer seat is $20/month. Supabase's read-only role needs its Team plan, so NJEN running item 3 itself is recommended | $0 or $20/month |
| 11 | **Launch scope (X3)** | Several sections are built but hidden until content arrives. NJEN should confirm which ones must be live at launch and which can follow. This drives the launch date (Day 22 report §9) | — |
| 12 | **Payload CMS go-ahead** (after Supabase access) | CMS, staff roles and the review workflow can't start until NJEN's database exists and the Payload dependency addition is approved (T3). This is the largest remaining development item | Open-source; runs inside the existing hosting |

---

## D. Content still outstanding (unchanged from the register)

These have no deadline today, but each published section waits on its item:
- About (C1);
- homepage corrections and photos (C2);
- What's Filming (C3, B5);
- events (C4);
- resources (C5, C14, C15);
- Children and Parents (C6);
- Social Media Safety (C7);
- contact details and wording (C8);
- membership copy (C9);
- career guides and Internship Exchange structure (C10);
- first verified job listings (C11);
- production domain (C13).
