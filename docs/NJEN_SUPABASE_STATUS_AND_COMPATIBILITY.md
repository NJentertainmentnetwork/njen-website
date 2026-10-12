# NJEN Supabase — Status and Compatibility

**Prepared 12-10-2026 (Day 21). Baseline commit `e41b4f2`.**

**Bottom line:** the website's signup code is ready and tested locally. **No real signup has ever been saved to NJEN's database.** Whether it can be depends on facts about NJEN's Supabase project that nobody on the development side has seen yet.

How to gather those facts: `docs/NJEN_SUPABASE_READ_ONLY_INSPECTION_GUIDE.md`.

---

## 1. Evidence categories

| Category | Meaning |
|---|---|
| **Verified — code** | Read in this repository at `e41b4f2` plus the Day 21 working-tree change |
| **Verified — local test** | Observed on this machine: local `next start`, a mock HTTP endpoint, or a throwaway in-memory PostgreSQL (PGlite). **Never NJEN's database** |
| **Reported — not verified** | NJEN told us; no evidence seen |
| **Needs client confirmation** | Only NJEN can answer |
| **Needs written approval** | Will not be done without NJEN's written approval of the exact change |

---

## 2. The data flow the code implements (Verified — code)

```
Visitor fills the form on /early-access
  → components/EarlyAccessForm.tsx   browser checks (convenience only)
  → POST /api/early-access           app/api/early-access/route.ts
        rate limit: 5 per IP per 10 min, per server instance
        body ≤ 4,096 bytes, enforced on the bytes actually read (Day 21 fix)
        JSON only; name ≤ 120, email ≤ 254, email format
        honeypot field + minimum fill time
        consent: enforced only once approved wording exists (currently none)
  → lib/early-access-store.ts        only if SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set
        POST {SUPABASE_URL}/rest/v1/rpc/record_early_access_signup
        body: p_name, p_email, p_source, p_signed_up_at (server clock), p_consent_text
        headers: apikey (+ Authorization: Bearer for legacy JWT keys only)
        8-second timeout
  → public.record_early_access_signup()   database function (migration 0002)
  → app.early_access_signups               intended destination table (migration 0002)
```

Outcomes the visitor can see:

| Situation | API answer | Visitor sees | Saved? |
|---|---|---|---|
| Variables not set | 503 `not-configured` | "Preview only … not saved" | No |
| Database answers 2xx | 201 `stored` | "You're in" | **Only this case claims a save** |
| Function missing, key rejected, database error, timeout, network failure | 502 `error` | "your signup was not saved" | No |
| Invalid input / bot signals | 400 | Field errors or a generic message | No |
| Too large | 413 | Generic message | No |
| Rate limited | 429 | "Too many attempts…" | No |

Logs on failure contain only `[early-access] signup store failed: HTTP <status>` or `…: network or timeout`. No name, email, source, key or provider message is logged (Verified — local test, Days 20–21).

---

## 3. What is known about each piece

| Fact | Status |
|---|---|
| The app writes only through `public.record_early_access_signup` | **Verified — code** |
| The app never reads leads and has no endpoint that returns them | **Verified — code** |
| Nothing in the repository reads or writes `early_access_leads` | **Verified — code** (search of all tracked files) |
| Migration 0002 defines `app.early_access_signups` + that function, `service_role`-only | **Verified — code** |
| Migrations 0001 and 0002 apply cleanly to PostgreSQL | **Verified — local test** (PGlite; the `pgcrypto` extension line was skipped because PGlite lacks it, and the migration notes it is optional on PostgreSQL 13+). **Not tested on Supabase** |
| The function stores one row per email regardless of capitalisation, updates the name on resubmission, keeps the first `source` | **Verified — local test** (PGlite) |
| A NJEN Supabase project exists | **Reported — not verified** |
| It contains a table `early_access_leads` | **Reported — not verified** |
| The project was paused and a restore was attempted; outcome unknown | **Reported — not verified** |
| Whether 0001/0002 were ever applied there | **Needs client confirmation** (guide, query 1) |
| Schema, columns, constraints, RLS, grants of `early_access_leads` | **Needs client confirmation** (queries 2–9) |
| Whether anything else writes to `early_access_leads` | **Needs client confirmation** (queries 4, 12, 13, D4, NJEN's knowledge) |
| Which API key types the project has | **Needs client confirmation** (D3; the code supports both) |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` set on the official Vercel project | **Not set as far as known.** `njen-website-live` showed no project variables. The other two projects are unchecked. None is confirmed as connected to the official repository |

---

## 4. The mismatch

The website expects **`public.record_early_access_signup`** writing to **`app.early_access_signups`**. NJEN reports **`early_access_leads`**. These are different names, possibly in different schemas, possibly with different columns. We do not yet know whether the expected function exists at all.

**If nothing changes**, and the variables are set against the project as it is reported: every signup gets a 404 from Supabase ("function not found"), the visitor is told "not saved", and nothing is stored. Safe, but useless.

---

## 5. What decides the solution

The table below lists each fact from the guide and how it affects the choice. No option is chosen yet.

| Question (guide query) | If the answer is… | Consequence |
|---|---|---|
| Project active? (§2, Q0) | Not active | Nothing else can be checked; resolve restoration first |
| Function already exists? (Q1, Q10, Q11) | Yes, and it writes to a suitable table, `service_role`-only | Possibly **no database change**: set the variables, redeploy, test |
| `early_access_leads` holds real records? (Q4, §6) | Yes | It must be **preserved**. Export it first (data protection doc) |
| Something else writes to it? (Q4, Q12, Q13, D4, NJEN) | Yes | Do **not** repurpose it without agreeing how both writers coexist |
| Columns can hold name, email, timestamp, source? (Q3) | Yes | A function writing into it (Option B) is feasible |
| Email unique, case-insensitive? (Q5, Q6) | No | Duplicates would create extra rows. Option B would need a unique index, which is itself a change needing approval and may fail if duplicates already exist |
| `anon`/`authenticated` can read it? (Q8, Q9) | Yes | **The existing lead list may already be publicly readable.** That is a separate, urgent issue. Report it before anything else |
| Exposed schemas include `app`? (D2) | Yes | Option A's protection depends on `app` *not* being exposed; that setting would need correcting |

### Options (each needs written approval; detail in `DAY20_IMPLEMENTATION_REPORT.md` §3.4)

| Option | Change | When it fits |
|---|---|---|
| **0. No change** | None. Variables only | The expected function already exists and is safe |
| **A. Apply 0001 + 0002 as written** | New `app` schema, table and function | `early_access_leads` is unused or NJEN wants a clean separate list |
| **B. One function onto `early_access_leads`** | One function (+ maybe a unique index) | The existing table is suitable and should remain the single list |
| C. App writes directly to the table | Code change; the table must be API-exposed | Only if NJEN refuses any database change. Weakest security |

**No option involves deleting, renaming or migrating `early_access_leads`, and none will be proposed** without evidence and NJEN's written approval.

Each eventual proposal will state: the exact SQL, why, what it touches, cost ($0 for all options above), and how to undo it. For example, `drop function` for B, and dropping the new schema for A, done only after the leads are exported.

---

## 6. Known risk to note now: spreadsheet formulas in exported leads

Lead lists are usually exported to CSV and opened in Excel or Google Sheets. A "name" that begins with `=`, `+`, `-` or `@` can be interpreted as a formula when the CSV is opened. This is the well-known CSV-injection risk. The form accepts any characters in the name (up to 120), as a name field reasonably should.

**Recommendation (no change made):** when exporting, open the CSV with "import as text", or review it before opening. If NJEN wants it handled in code, that is a small, separate change to propose: either a check in the form validation, or neutralising at export time.
