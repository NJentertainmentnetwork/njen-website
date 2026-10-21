# NJEN: Day 29 Implementation Report

**Date:** 21-10-2026 · **Starting point:** 1620afe - Apply approved Day 28 security dependency patch (local `main` = GitHub `main`, working tree clean).

**Nothing was staged, committed, pushed or deployed.** No Vercel project, Supabase project, database, domain, environment variable, permission or billing setting was read or changed. No SQL was run. `.env.local` was not opened. No signup was submitted anywhere.

**Status at a glance:**
- **Vercel and Supabase: not inspected.** No authorised access exists on this machine (§2, §3).
- **No application code was changed:** no defect was found. The only new file is this report.
- **PostCSS:** a fix that works on Next.js 15 was found in an isolated trial. It needs approval to apply (§5).

---

## 1. Code and dependency status (verified today)

| Item | Result |
|---|---|
| Installed versions | `next` **15.5.28**, `sharp` **0.35.5**, `source-map-js` **1.2.2** (`npm ls`; committed in `1620afe`) |
| Early Access code since the Day 25 review | Unchanged: 0 commits touch `app/`, `lib/`, `components/` or `db/` since `e824481` |
| Expected database interface | `public.record_early_access_signup(p_name, p_email, p_source, p_signed_up_at, p_consent_text)`, called over Supabase REST with a server-only key. Migration 0002 has it write to `app.early_access_signups` (unique on `lower(email)`). Nothing in the code reads or writes `early_access_leads` |
| New Next.js releases or advisories | None after 14-10-2026 (registry and GitHub advisories, checked today) |

**Checks run today** (storage off: `SUPABASE_URL=` and `SUPABASE_SERVICE_ROLE_KEY=` set empty, so nothing could be stored):

| Check | Result |
|---|---|
| `npm test` | **194 tests, 194 pass, 0 fail**, 18 suites |
| `npx tsc --noEmit` | **Pass** |
| `npm run build` | **Pass**, Next.js 15.5.28, 23 routes |
| Secret scan of `.next/static` | 0 matches |
| `node scripts/site-smoke-check.mjs` (local) | **40 passed, 0 failed** |
| `node scripts/early-access-live-check.mjs --mode unconfigured` | **11 passed, 0 failed** |
| `node scripts/early-access-browser-check.mjs` | **41 passed, 0 failed** |
| Server log scan (test names and emails, key prefixes) | 0 matches |

## 2. Vercel: access blocker

**Authorised Vercel access is not available, so no account, project or Git configuration was inspected.**
- No Vercel CLI is installed.
- There is no `.vercel` project link and no CLI login.
- No Vercel connector is available to this session.

Nothing is claimed about the existing projects beyond what earlier reports recorded from NJEN: three projects reported connected to the old repository `NJEnetwork/njen-website`.

**Not assessed:** whether an existing project could safely be reconnected to the official repository. That requires reading its Git, domain, environment-variable and deployment settings, which needs access. Reconnecting a project that serves a live domain would also change what that domain serves. **The safer route remains a separate new private project**, which can't affect anything already live.

**Minimal requirements for that project** (unchanged from `DAY28_IMPLEMENTATION_REPORT.md` §5):
- source: `NJentertainmentnetwork/njen-website`, branch `main`, framework Next.js, all build settings at their defaults;
- **Node.js 20 or newer** (needed by `sharp` 0.35.5);
- **no environment variables and no domain**;
- Deployment Protection with Vercel Authentication on All Deployments, plus a share link;
- **cost:** none expected for the project itself. Vercel's Hobby plan does not allow commercial use, and Pro may be required if the repository is made private.

**Exact missing action:** an NJEN Vercel owner creates the project (steps: `docs/NJEN_DAY23_NEXT_CLIENT_ACTION.md`) and sends the share link and deployment commit. Alternatively, they grant the developer a team role that can **read** project settings, if NJEN wants the existing projects assessed.

## 3. Supabase: access blocker

**Authorised read-only access is not available, so nothing in NJEN's project was inspected.**
- No Supabase CLI or `psql` is installed.
- No Supabase connector is available.
- The developer holds no credentials for NJEN's project.
- `.env.local` relates to the developer's own test project and was not used.

**Nothing is assumed about NJEN's database:**
- the function and the table may or may not exist;
- the project's status is unknown;
- whether registrations are already stored is unknown.

**Why the code can't be verified against NJEN's database:**
1. NJEN's schema is unknown, so it isn't known whether `record_early_access_signup` exists or what it would write.
2. No storage variables are set on any project connected to the official repository.
3. There is no deployment of the official repository to test through.

**What needs inspecting, and why** (queries already written in `docs/NJEN_SUPABASE_READ_ONLY_INSPECTION_GUIDE.md`; NJEN runs them, or grants read-only access):

| Inspect | Query | Decides |
|---|---|---|
| Project status | Q0, D6 | Whether anything else can be checked |
| Does `record_early_access_signup` exist, and what does it write to? | Q1, Q10, Q11 | If yes and `service_role`-only: **no database change** |
| `early_access_leads` schema and columns | Q2, Q3 | Which columns take name, email, time and source |
| Rows stored; is anything still writing? | Q4 + §6 date query | Real leads must be preserved; a second writer must be agreed |
| Email uniqueness (case-insensitive?) | Q5, Q6 | Duplicate handling |
| RLS, policies, public-role grants | Q7, Q8, Q9 | If the public can read leads, that is an **existing exposure** to fix first |
| Dependents, triggers, webhooks | Q12, Q13, D4 | What a new writer would set off |
| Exposed schemas; API key types | D2, D3 | Which key goes in `SUPABASE_SERVICE_ROLE_KEY` (both kinds are supported) |

**Smallest safe option, once the facts are known:**
- (0) no change, if a suitable function exists;
- (B) one `service_role`-only function with the existing name and inputs, writing into `early_access_leads`, with no new table and no website change;
- (A) migration 0002, only if `early_access_leads` is unused.

The outline for B is in `DAY28_IMPLEMENTATION_REPORT.md` §4. It is a proposal only, not runnable as written, and needs written approval.

## 4. Registration functionality

| Area | Status |
|---|---|
| Name and email validation | **Done, verified locally.** Required, trimmed, ≤ 120 / ≤ 254 characters, email format; checked in the browser and again on the server |
| Abuse controls | **Done, verified locally.** 4 KB body cap, JSON only, honeypot, minimum fill time, 5 per IP per 10 minutes per server instance |
| Consent | **Correctly off; blocked on wording.** No approved wording or Privacy Policy URL (B6), so no checkbox is shown and nothing is recorded. One constant switches it on once approved |
| Storage | **Implemented, not verified against NJEN.** Verified only against a simulated Supabase, and once on the developer's own test project (13-10-2026) |
| Duplicates | **Database-side.** One row per email under migration 0002. **Unknown against `early_access_leads`** until Q5/Q6 |
| Source / Facebook | **Done, verified locally.** `?source=` / `?utm_source=` / `?ref=`, else the referring host (e.g. `l.facebook.com`); safe label shape, no spreadsheet formulas, `fbclid` never stored. Untagged in-app visits often carry no referrer and record no source, so campaign links need `?utm_source=facebook` |
| Messages | **Done, verified locally.** "You're in" only after the server confirms storage; every failure says nothing was saved. Public registration is **not active**: with storage off the page says "Preview only" |
| iPhone / Facebook in-app browser | **Code review only. Not tested on a device.** The browser-side code uses nothing newer than Unicode regular expressions (Safari 11.1+), within Next.js 15's default browser targets. Inputs are 16 px (no zoom on focus) with `type="email"`, `inputMode`, `autoComplete` and `enterKeyHint`. `AbortSignal.timeout` runs only on the server. **Real-device testing needs the Preview** |

## 5. PostCSS findings and recommendation

**What the audit reports** (`npm audit`, 21-10-2026): 2 entries.
- **`postcss` (high):** carries 4 advisories:
  - GHSA-qx2v-qp2m-jg93 (moderate, XSS in stringify output, < 8.5.10);
  - GHSA-6g55-p6wh-862q (high, file read via `sourceMappingURL`, ≤ 8.5.11);
  - GHSA-r28c-9q8g-f849 (high, `.map` path traversal, ≤ 8.5.17);
  - GHSA-fxqj-rqcc-2cmp (moderate, incomplete fix, ≤ 8.5.22).
- **`next` (moderate):** listed only because it bundles that `postcss`.
- npm's only offered fix is `next@16.4.2`, a major upgrade.

**Dependency path:** `next@15.5.28` → nested `postcss@8.4.31`. The project's own direct `postcss@8.5.28` is not affected. `next@15.5.28` pins 8.4.31 exactly.

**Relevance to Phase 1** (evidence, not assumption):
- The nested copy is loaded only by Next.js's **build-time** CSS pipeline (`dist/build/webpack/...`: CSS loaders, font loader, CSS minimiser).
- **0 references** to `postcss` in the server runtime output (`.next/server`), so it never runs while the site serves visitors.
- The only CSS it processes is the site's own `app/globals.css`, with no `sourceMappingURL`. There is no PostCSS config, and no user-supplied CSS anywhere.
- All four advisories require **attacker-controlled CSS**, which this site has no path for. Exploiting this would first require write access to the repository.

**Not resolved by assumption:** the advisories are still open in the installed tree.

**A fix that works on Next.js 15, found today in an isolated copy (repository unchanged):**
- Day 20's attempt (an npm `overrides` entry) failed with `ELSPROBLEMS`, and an override alone still fails today. The lockfile pins the nested copy, so npm never re-resolves it.
- **Override plus removing that one nested lockfile entry works:**
  - `package.json`: `"overrides": { "next": { "postcss": "$postcss" } }` (points at the project's own 8.5.28);
  - remove `node_modules/next/node_modules/postcss` from `package-lock.json`, then `npm install`;
  - **lockfile effect:** exactly 1 entry removed; nothing else changes;
  - **`npm ls`:** `next` now uses `postcss@8.5.28` (deduplicated);
  - **`npm audit`: 0 vulnerabilities.**
- **Checks on that copy:**
  - `npm test` 194/194; typecheck pass; build pass, 23 routes;
  - **compiled CSS byte-for-byte identical** to the current build (same SHA-256);
  - smoke check 40/40; browser check 41/41.
- **Risk:** Next.js 15.5.28 was released and tested by its maintainers against PostCSS 8.4.31, not 8.5.28. The identical CSS output and all checks passing are strong evidence for **this** site's stylesheet, not a guarantee for every CSS feature.

**Recommendation:**
- **Not a launch blocker:** build-time only, own CSS only, the conditions are not met.
- **Preferred: approve the override** as a small, separate, reversible dependency change. It clears all audit findings without a major upgrade.
  - **Undo:** remove the `overrides` block and run `npm install`.
- **If not approved:** accept the risk temporarily, documented, until a separately approved Next.js 16 upgrade.
- **Either way, the Next.js 16 upgrade still needs scoping.** Next.js 15's security support is expected to end around **today, 21-10-2026**, so future Next.js advisories may get no 15.x fix.
- Running `npm audit fix --force` is **not** recommended: it would install Next.js 16 without review.

## 6. Exact client actions required

1. **Create the new private Vercel Preview** (§2) and send the share link and deployment commit. Don't reconnect an existing project.
2. **Run the read-only Supabase inspection** (§3) and send the results, or grant read-only access. No keys or personal data are to be sent.
3. **Decide on PostCSS** (§5): approve the override, or accept the documented risk until Next.js 16.
4. **Approve scoping a Next.js 16 upgrade** (assessment and isolated trial first).
5. After (2): **written approval of the exact SQL**, if any change is needed.
6. Then: **set `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`** on the official project (Production scope), redeploy, and **approve a controlled test signup** with an NJEN-controlled address.
7. **Consent wording and Privacy Policy URL** (B6), if consent must be recorded at launch.
8. **Tag campaign links** `?utm_source=facebook` (or `instagram`).
9. Domain/SSL, monitoring, backups + restore test, Vercel plan, repository visibility (still public).

## 7. Phase 1 status

| Category | Items |
|---|---|
| **Completed and verified (locally)** | Early Access form and API (validation, abuse controls, honest messages, focus/keyboard); source handling; consent kept off; secrets kept out of bundles and logs; site launch-gate tests; security patch applied (15.5.28 / 0.35.5 / 1.2.2) |
| **Implemented, needs testing on a deployment** | All of the above on a Preview; real iPhone Safari and Facebook in-app browser; headers with HSTS; rate limit on Vercel |
| **Blocked by client action** | Preview (no Vercel access); Supabase inspection (no access); SQL approval; storage variables; consent wording; PostCSS decision |
| **Remaining before launch** | One registration stored and verified in NJEN's database; export/view access for NJEN staff; deployed patch; domain, monitoring, backups |
| **Can follow launch** | Distributed rate limiter; CSP nonce; Next.js 16 if not done first |

**Remaining launch blockers:**
- no deployment of the official repository;
- no verified registration in NJEN's database;
- consent wording (if required);
- domain/SSL, monitoring and backups.

## 8. Phase 2 status

**Not started.** The roadmap in `POST_LAUNCH_DEVELOPMENT_ASSESSMENT.md` (Phases A–J) is unchanged, and no Phase 2 work was done.

## 9. Realistic timeline after access and approvals

Developer time below; **calendar time depends on NJEN's turnaround**, which is not estimated here.

| Step | Starts when | Developer time |
|---|---|---|
| Preview: smoke check + manual checklist (desktop) | Share link received | 2–3 hours |
| Real iPhone + Facebook in-app checks | Preview + a person with an iPhone | about 1 hour |
| PostCSS override in the repository + re-checks | Approval | 1–2 hours |
| Read inspection results, write exact SQL, test on developer's own project | Inspection results received | about 1 day |
| NJEN applies SQL, sets variables, redeploys | Written SQL approval | NJEN, about 30 minutes |
| Controlled test signup, count-only verification, duplicate test, log check, test-row removal | Variables live + test approved | 1–2 hours, with NJEN |

**Total developer time from complete inputs to a verified registration: about 2–3 working days.** Launch also needs the domain, monitoring, backups and consent decisions, which are outside the developer's control.
