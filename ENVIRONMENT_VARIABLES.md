# NJEN — Environment Variables and Deployment Configuration

**Verified 28-09-2026 (Day 10) by reading the actual source code**, not by copying `.env.example`. Every entry below was checked against real `process.env` usage. **Re-verified 30-09-2026 (Day 12): unchanged** — the same three variables are read, and no new `process.env` reference or `NEXT_PUBLIC_` usage has appeared.

**Re-verified 09-10-2026 (Day 20): this document was out of date and is now corrected.** Since Day 15 the code reads **five** variables, not three: the two Supabase variables in section B are live in `lib/early-access-store.ts`. A `process.env` scan of `app/`, `lib/` and `components/` finds exactly `NJEN_SITE_URL`, `NJEN_ALLOW_INDEXING`, `NJEN_PREVIEW_UNPUBLISHED`, `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, and still no `NEXT_PUBLIC_` usage.

**No real secret value appears in this document, and none should be pasted into it.** Values are supplied by NJEN through a secure channel and entered directly in the provider dashboards.

---

## Headline finding

**The current public website needs no environment variables to build or run.** It builds and runs with none set. This was proven in a clean-room test: a fresh copy, `npm ci`, then `next build` with every variable unset — build succeeded, 24 routes. (Day 20 local build, also with no variables set: 23 entries in the build's route table, including `/api/health`. The route set has changed since Day 10 — for example the demo `/api/jobs` was removed and `/early-access` and `/api/health` were added — so the two counts are not directly comparable.)

All five variables the code reads are **optional switches**. With the two Supabase variables unset, the Early Access page says plainly that it cannot collect signups, and nothing is stored. Everything else in `.env.example` is for providers that are **not installed** (no Supabase SDK, Payload, Resend, Sentry or Plausible package exists in `package.json`; Supabase is reached over plain HTTPS).

---

## A. Required to build and deploy the current public website

**None.** The build has no required variables.

These three are optional and change behaviour only when set. All are **server-only** (no `NEXT_PUBLIC_` prefix, so they never reach the browser).

| Variable | Service | Required now? | Used in | Vercel environment | Value format / source | Sensitive? | Notes |
|---|---|---|---|---|---|---|---|
| `NJEN_SITE_URL` | Next.js | Optional now; **required at launch** | `app/layout.tsx`, `app/robots.ts`, `app/sitemap.ts` | Production (and Preview only if you want canonical URLs there) | Absolute URL, no trailing slash, e.g. `https://[DOMAIN]` — NJEN's confirmed production domain (register C13) | No — public by nature | Unset: no canonical URLs and an empty `sitemap.xml`. Set: canonical URLs, sitemap entries and the robots `Sitemap:` line switch on automatically. |
| `NJEN_ALLOW_INDEXING` | Next.js | Optional; **set only at launch** | `app/robots.ts` | **Production only** | `true` (any other value, or unset, means "do not index") | No | Unset = `robots.txt` says `Disallow: /`. **Leave unset on Preview/staging**, so staging is never indexed. Set `true` on Production at go-live. |
| `NJEN_PREVIEW_UNPUBLISHED` | Next.js | Optional; internal review only | `lib/sections.ts` | **Neither** by default | `true` to reveal unpublished sections | No, but it exposes unfinished pages | **Never set in Production.** Only for a protected internal preview. When unset, the 10 unpublished sections return 404. |

## B. Supabase / PostgreSQL

**Early Access signup storage reads two variables today (since Day 15).** No `@supabase/*` package is installed: `lib/early-access-store.ts` calls one database function over HTTPS. Payload's `DATABASE_URI` is still future work.

| Variable | Service | Required now? | Used in | Vercel environment | Value format / source | Sensitive? | Notes |
|---|---|---|---|---|---|---|---|
| `SUPABASE_URL` | Supabase | **Required to collect Early Access signups**; optional for the build | `lib/early-access-store.ts` | Production (Preview only if preview signups should land in the same list — usually not) | `https://<project-ref>.supabase.co` from Project Settings → API | No (identifier) | Server-only. Trailing slashes are stripped. |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase | **Required to collect Early Access signups**; optional for the build | `lib/early-access-store.ts` | Same as `SUPABASE_URL` | **Either** the legacy `service_role` key (a JWT, starts `eyJ`) **or** a new secret key (starts `sb_secret_`) | **YES — highest sensitivity** | Bypasses row-level security. **Server-only. Never `NEXT_PUBLIC_`.** Both key formats are handled (Day 20): a `sb_secret_` key is sent on the `apikey` header only, as Supabase documents; a legacy key on `apikey` and `Authorization`. Verified against a local mock only, not a live project. A publishable key (`sb_publishable_`) is the wrong key for this variable. Supabase is deprecating legacy keys by the end of 2026, so prefer a secret key. |
| `DATABASE_URI` | Supabase / PostgreSQL | **No — future** | Not referenced yet | Preview + Production (separate databases) | PostgreSQL connection string from the Supabase dashboard | **YES — secret** | Server-only. Needed when Payload is installed. Use the pooled connection string for serverless. |

**Both Supabase variables must be set together, and the site must be redeployed afterwards.** `/early-access` is statically generated, so whether it shows the "Preview only" notice is decided **at build time**. Verified locally on Day 20: a build with both variables set has no notice; a build without them does. Setting the variables without redeploying leaves the old page in place.

**Configured is not the same as working.** Setting the variables only makes the site *attempt* storage. A real signup is collected only when the database function `public.record_early_access_signup` exists in NJEN's project and accepts the call. If it does not (for example, the migration was never applied), every signup fails safely: the visitor is told it was not saved, and the server logs `[early-access] signup store failed: HTTP <status>` with no personal data. See `DAY20_IMPLEMENTATION_REPORT.md` §3 for the compatibility check against NJEN's existing `early_access_leads` table.

| State | Page shows | API answer | Stored? |
|---|---|---|---|
| Variables unset | "Preview only" notice | `not-configured` (503) | No |
| Variables set, function missing or key rejected | Normal form | `error` (502); visitor told it was not saved | No |
| Variables set, function working | Normal form | `stored` (201) | **Yes** — the only case that shows "You're in" |

## C. Required to run Payload CMS and its admin interface

**None required today — Payload is not installed.** There is no Payload package, config file, collection, admin route or database adapter. The CMS exists as a written plan (`PAYLOAD_CMS_PLAN.md`) and typed contracts only.

| Variable | Service | Required now? | Used in | Vercel environment | Value format / source | Sensitive? | Notes |
|---|---|---|---|---|---|---|---|
| `PAYLOAD_SECRET` | Payload CMS | **No — future** | Not referenced yet | Preview + Production (different values) | Long random string, generated by the developer at setup | **YES — secret** | Signs sessions/tokens. Treat like a password. |
| `PAYLOAD_ADMIN_EMAIL` | Payload CMS | **No — future** | Not referenced yet | Production | NJEN's first staff admin address | No, but personal data | Used once to create the first staff account. Named staff users are register item B7. |

Payload also depends on `DATABASE_URI` from group B.

## D. Approved email, monitoring and analytics integrations

**None required today — none of these is installed or called.**

| Variable | Service | Required now? | Used in | Vercel environment | Value format / source | Sensitive? | Notes |
|---|---|---|---|---|---|---|---|
| `RESEND_API_KEY` | Resend | **No — future (Week 3 forms)** | Not referenced yet | Preview + Production | API key from NJEN's Resend account | **YES — secret** | Server-only. Contact delivery is blocked on register C8 and B6 anyway. |
| `NJEN_EMAIL_FROM` | Resend | **No — future** | Not referenced yet | Preview + Production | Verified sending address on NJEN's domain | No | Requires DNS records on the production domain. |
| `NJEN_EMAIL_TO` | Resend | **No — future** | Not referenced yet | Production | Where enquiries are delivered (register C8) | No, but internal | Recipients come from configuration, never from user input. |
| `SENTRY_DSN` | Sentry | **No — future** | Not referenced yet | Production | DSN from NJEN's Sentry project | No (send-only endpoint) | Server-side reporting. |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry | **No — future** | Not referenced yet | Production | Same DSN, browser-side | No — intentionally public | A DSN only permits sending events. |
| `SENTRY_AUTH_TOKEN` | Sentry | **No — future** | Not referenced yet | Build-time only | Token from Sentry | **YES — secret** | Used to upload source maps during the build. Never in client code. |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | Plausible | **No — future** | Not referenced yet | Production | The site domain | No — public | Depends on the production domain. |

## E. Optional or future-only — do not configure yet

| Variable | Why not now |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser-side Supabase access is **not used at launch**. Only add if NJEN later approves direct browser access, and only with row-level security in place. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same. Adding it early would expose a browser-side database entry point for no benefit. |

## F. Present in `.env.example` but not used by the current code

**All 12 of these** are documented placeholders for planned work, not current requirements (`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` left this list on Day 15):

`DATABASE_URI`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `PAYLOAD_SECRET`, `PAYLOAD_ADMIN_EMAIL`, `RESEND_API_KEY`, `NJEN_EMAIL_FROM`, `NJEN_EMAIL_TO`, `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`.

They are all commented out in `.env.example` and are kept deliberately, so setup is quick when each provider is connected. **Configuring them now would have no effect**, because no code reads them.

**No variable is referenced by the code but missing from `.env.example`.** The five live variables are all documented there.

---

## Vercel configuration expected for the current site

| Setting | Expected value | Notes |
|---|---|---|
| Framework preset | **Next.js** | Detected automatically |
| Root directory | Repository root | `package.json` is at the root |
| Install command | Default (`npm install` / `npm ci`) | `package-lock.json` is committed and valid — verified by a clean `npm ci` |
| Build command | Default (`next build`) | `npm run build` |
| Output | Default (`.next`) | No custom output configuration |
| Node.js version | Vercel default (20.x or 22.x) | No `engines` field is set; the code builds locally on Node v22.13.1 and (Day 19/20) v24.21.0. Set explicitly only if NJEN's Vercel default is older than 18.18. The proposed `sharp` 0.35.5 security patch needs Node ≥ 20.9.0 |
| `vercel.json` | **Present, one line:** `{"framework": "nextjs"}` | Corrected Day 20 (this row previously said "not present"). It only pins the framework preset; no other settings |
| Environment variables | **None required** for the build; **`SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` required to collect signups** | See groups A and B. Redeploy after setting them |
| Production branch | `main` | To be confirmed in the Vercel dashboard |

**Deployment protection:** enable **Vercel Authentication** on Preview so staging is never publicly reachable. It costs nothing extra.

## Secret-handling rules

- Real values are entered **only** in the provider dashboards and Vercel's encrypted environment settings, never in the repository, a document, a chat message or a screenshot.
- `.env` files are git-ignored; only `.env.example` (placeholders) is committed.
- Never put a secret behind `NEXT_PUBLIC_`: that prefix compiles the value into browser JavaScript.
- Preview and Production should use **separate** credentials and databases.
- If any credential is ever pasted into a message or commit, treat it as compromised and rotate it.
