# NJEN Early Access: Compatibility with `early_access_leads` (Day 23)

**Prepared 14-10-2026.** Based on the code in the working tree (baseline `9ed6930` plus Day 23's uncommitted changes), migrations 0001–0002, and the developer-owned test project results from Day 22.

**NJEN's Supabase database has not been inspected.** Nobody on the development side has connected to it, read its structure or seen a row. Everything below about `early_access_leads` is either what NJEN reported or an open question. **No database change will be made without NJEN's written approval of the exact SQL.**

This document adds a field-by-field comparison and a recommendation to `docs/NJEN_SUPABASE_STATUS_AND_COMPATIBILITY.md` (Day 21), which still holds for the data flow, outcomes and options.

---

## 1. Bottom line

1. The website talks to the database in **one place only**: a call to the function `public.record_early_access_signup` with five named values. It never touches a table by name.
2. That means **the website needs no code change to work with `early_access_leads`**. Whether NJEN keeps the prepared table (Option A) or keeps `early_access_leads` (Option B), the database just needs a function with that name and those five inputs. Only the inside of the function differs.
3. Which option is safe depends on facts only NJEN's project can show. The smallest set of read-only queries that decides it is listed in §5.

---

## 2. What the website sends (verified in code and by tests)

| Visitor / server value | Sent to the function as | Type | Rules applied before sending |
|---|---|---|---|
| Name typed by the visitor | `p_name` | text | Trimmed; required; 1–120 characters |
| Email typed by the visitor | `p_email` | text | Trimmed; required; ≤ 254 characters; basic format check. **Not** lower-cased by the website (the prepared function does that) |
| Campaign source (`?source=`, `?utm_source=`, `?ref=`, else the referring site's host name) | `p_source` | text or null | ≤ 64 characters; letters, digits, space and `. _ - : / +`, starting with a letter or digit. Anything else becomes null. **Tightened on Day 23** (§6) |
| Time of signup | `p_signed_up_at` | ISO 8601 timestamp | Always the **server's** clock; anything the browser sends is ignored |
| Consent wording | `p_consent_text` | text or null | Always null until NJEN approves wording (register B6) |

Nothing else is sent: no IP address, device, browser or tracking identifier. The test suite checks that exactly these five keys go out, and nothing a browser adds is passed through (`tests/early-access-route.test.mjs`, "sends exactly the five parameters").

**Credentials:** `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, read only on the server, never with a `NEXT_PUBLIC_` name. A `sb_secret_…` key goes in the `apikey` header only; a legacy service-role key also goes in `Authorization: Bearer`.

---

## 3. What the prepared function and table expect (migration 0002)

| Column in `app.early_access_signups` | Type | Null? | Rule | Filled from |
|---|---|---|---|---|
| `id` | uuid | no | default `gen_random_uuid()` | database |
| `name` | text | no | 1–120 characters | `p_name` |
| `email` | text | no | 3–254 characters; **unique on `lower(email)`** | `lower(p_email)` |
| `signed_up_at` | timestamptz | no | default `now()` | `p_signed_up_at` |
| `source` | text | yes | ≤ 64 characters | `p_source`; **the first source is kept** on a repeat signup |
| `consent_text` | text | yes | — | `p_consent_text` |
| `consent_given_at` | timestamptz | yes | — | set only when consent text exists |
| `created_at`, `updated_at` | timestamptz | no | defaults; trigger updates `updated_at` | database |

Security: RLS on and forced with no policy; the table is not reachable through the public API; the function runs as its owner with a pinned `search_path` and only `service_role` may call it. **Verified on 13-10-2026 in the developer-owned test project** (Day 22 report §3.3). Not on NJEN's.

---

## 4. `early_access_leads`: known and unknown

| Fact | Status |
|---|---|
| A table with this name exists in NJEN's project | **Reported by NJEN, not verified** |
| Its schema (`public` or another) | Unknown |
| Its columns, types, which are required, defaults | Unknown |
| Whether email is unique, and whether case-insensitively | Unknown |
| Whether it holds real people's details, and how many | Unknown |
| Whether something else writes to it (a site builder, Zapier/Make, a form tool, a database webhook) | Unknown |
| RLS on/off; policies; whether the public `anon` role can read or insert | Unknown. **If `anon` can read it, the existing list may already be publicly downloadable**; that would be reported to NJEN at once, before any other step |
| Whether `public.record_early_access_signup` already exists there | Unknown |
| Project active or paused; plan (Free or Pro); backups | Unknown (paused-and-restored was reported earlier; outcome unknown) |

### Conflicts to look for once the structure is known

| If `early_access_leads` has… | Effect on Option B | Handling |
|---|---|---|
| Different column names (for example `full_name`, `created_at`) | None for the website; the function maps them | Function body uses NJEN's names |
| A required column the website does not collect (for example `phone`) with no default | Every insert would fail, and visitors would see "not saved" | Needs NJEN's decision: a default, or Option A |
| No email uniqueness | Repeat signups would create extra rows | A unique index is a further change needing approval, and fails if duplicates already exist. Alternative: the function checks before inserting |
| Case-sensitive uniqueness only | `Ann@x.com` and `ann@x.com` become two rows | Same as above |
| A `source` column shorter than 64 or an enum | Long or unexpected labels would fail | Function trims or maps the label |
| `id` as an integer sequence | No effect | — |
| A policy letting `anon` insert | Any visitor could write to it directly, skipping the website's checks | Report to NJEN; tightening it is a separate approved change |
| A trigger or webhook (for example sending email) | Website signups would set it off too | NJEN decides whether that is wanted |

---

## 5. The minimum read-only check that decides the approach

All six are already written, with plain-English instructions, in `docs/NJEN_SUPABASE_READ_ONLY_INSPECTION_GUIDE.md`. They read structure and counts only and return no names or emails. If NJEN runs nothing else, these are enough to choose:

| Guide query | Answers |
|---|---|
| **Q0** | Is the database up? |
| **Q1** | Does the website's expected function or table already exist? |
| **Q3** | The columns of `early_access_leads`: names, types, required, defaults |
| **Q4** | How many rows, and when it was last written (counts only) |
| **Q9** | Can `anon` / `authenticated` read or write it? |
| **Q12** | Does anything else in the database refer to it? |

The rest of the guide (indexes, constraints, policies, triggers, exposed schemas, Q5–Q8, Q10–Q11, Q13–Q14) is needed before a change is *applied*, not to choose an option.

**Order matters:** the inspection comes after a working preview (see `docs/NJEN_DAY23_NEXT_CLIENT_ACTION.md`), because the preview is what everything else is tested on.

---

## 6. Minimum safe approach (recommendation, nothing applied)

| Inspection shows | Recommended option | Website code change | Database change |
|---|---|---|---|
| The function already exists, writes to a suitable table, `service_role` only | **0. No change** | None | None |
| `early_access_leads` is empty or unused, nothing else writes to it | **A. Apply 0001 + 0002 as tested** | None | New `app` schema, table and function. `early_access_leads` is left untouched |
| `early_access_leads` holds real leads, or another tool writes to it, and NJEN wants one list | **B. One function writing into `early_access_leads`** | None | One function, same name and five inputs, mapped to NJEN's columns. Possibly a unique index (separately approved) |
| NJEN refuses any database change | C. Website writes to the table directly | Yes | Table must be exposed to the API; weakest. Not recommended |

**None of these deletes, renames, empties or migrates `early_access_leads`.** The exact SQL for whichever option fits, with its reason, effect, cost ($0) and undo steps, will be written only after the inspection, and applied only after written approval. It would be tested first in the developer-owned project with a copy of the same structure (no real data).

### Day 23 code change relevant here

`source` is the only stored value a stranger can set just by editing a link. It is now restricted to a plain label shape (§2), so a value like `=HYPERLINK(…)` is dropped to null rather than stored. Names are not restricted; a name field must accept what people type. Names are handled at export time (§7).

---

## 7. How NJEN staff can see and export registrations

| Question | Answer |
|---|---|
| Who can see the list? | Only people with access to NJEN's Supabase project (organisation members), through the dashboard. The website has **no** page or endpoint that returns signups, and none is planned for launch |
| How to export (Option A) | Supabase → **SQL Editor** → run `select name, email, signed_up_at, source from app.early_access_signups order by signed_up_at desc;` → **Download CSV**. Option B uses NJEN's table and column names; the approved proposal will include the exact query |
| Table Editor? | Migration 0002 says the `app` table will not appear in the Table Editor. **Not verified**: the Table Editor may list other schemas. To be checked in the developer-owned project before it is stated to NJEN as fact |
| Opening the CSV safely | Import as text (Excel: **Data → From Text/CSV**, set columns to Text; Google Sheets: **File → Import**, untick "Convert text to numbers, dates and formulas"). A name starting with `=`, `+`, `-` or `@` could otherwise run as a formula |
| Removing one person on request | `delete from app.early_access_signups where lower(email) = lower('<address>');` (Option A), run by NJEN in the SQL Editor |
| Keys | The service-role or secret key stays in Vercel's environment settings only. Staff never need it to view or export |

---

## 8. Status

| Milestone | Status |
|---|---|
| Website code for storage | Ready; 126 automated tests pass (Day 23) |
| Developer-owned test Supabase | **Verified 13-10-2026** (real signup stored, count 1/1) |
| NJEN's Supabase | **Not verified**: not inspected, no write attempted |
| Database change for NJEN | **None proposed yet**; needs inspection, then written approval |
