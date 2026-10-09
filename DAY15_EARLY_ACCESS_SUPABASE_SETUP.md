# NJEN Early Access — Supabase connection checklist

**Prepared 02-10-2026 (Day 15). Nothing in this checklist has been done.** No
Supabase account, project, table, key or DNS record was created or changed. The
website code is finished and dormant: it switches itself on the moment the two
environment variables below are present.

> **The developer cannot complete this.** Every step needs NJEN-owned account
> access. Steps 1–4 take about fifteen minutes in total.

> **Day 20 update (09-10-2026) — read before Step 1.** NJEN reports that it
> already has a Supabase project with a table named `early_access_leads`. This
> checklist was written for a new project and does not know about that table:
> nothing in the website reads or writes `early_access_leads`. **Do not run
> Step 2 yet.** First run the read-only inspection queries in
> `DAY20_IMPLEMENTATION_REPORT.md` §3 and send back the results; the developer
> then proposes one exact database change for approval. Three corrections to
> the text below:
> - Step 1's "the free tier is sufficient" is true for **volume only**. Free
>   projects can be paused after a week of low activity and have no automatic
>   backups — see `DAY20_IMPLEMENTATION_REPORT.md` §4 before sending traffic.
> - Step 3: Supabase now issues **secret keys** (`sb_secret_...`) alongside the
>   legacy `service_role` key and is deprecating the legacy keys by the end of
>   2026. The code sends either format in `SUPABASE_SERVICE_ROLE_KEY` the way
>   Supabase documents (Day 20 code change; tested against a local mock only,
>   not a live project). Prefer the secret key.
> - Step 5 now has a fuller test list: `LAUNCH_QA_CHECKLIST.md` §6.

---

## What was built, so the setup is this short

| Piece | Where | State |
|---|---|---|
| Form UI (name, email) | `components/EarlyAccessForm.tsx` | Done |
| Browser validation | `lib/forms.ts` (`early-access`) | Done |
| **Server** validation, honeypot, timing guard, rate limit | `app/api/early-access/route.ts` | Done |
| Storage adapter | `lib/early-access-store.ts` | Done, dormant |
| Table, indexes, RLS, write function | `db/migrations/0002_early_access_signups.sql` | Written, **not applied** |

---

## Step 1 — Create the Supabase project (NJEN account)

Region: **East US (North Virginia)**, closest to New Jersey and to Vercel's
default region. The free tier is sufficient for lead capture; a landing-page
list does not approach its limits.

Save the database password NJEN sets. It is shown once and is not recoverable.

## Step 2 — Apply the migrations

Supabase dashboard → **SQL Editor** → run in this order, checking each succeeds:

1. `db/migrations/0001_init_app_schema.sql` — creates the `app` schema and its
   safe defaults. (If NJEN has already run it, skip.)
2. `db/migrations/0002_early_access_signups.sql` — creates the signups table,
   its row-level security, and the one function the website is allowed to call.

Nothing else needs running. Do **not** apply `db/schema.sql`; it is reference
material and is marked as such.

## Step 3 — Copy two values

Supabase dashboard → **Project Settings → API**:

| Value in Supabase | Environment variable |
|---|---|
| Project URL (`https://<ref>.supabase.co`) | `SUPABASE_URL` |
| `service_role` secret key | `SUPABASE_SERVICE_ROLE_KEY` |

> **The `service_role` key bypasses all row-level security.** Paste it only into
> Vercel's environment settings. Never into a file, a chat message, an email, a
> ticket, or any variable whose name starts `NEXT_PUBLIC_`. If it is ever
> exposed, rotate it immediately in the same screen.
>
> The **anon** key is not used and should not be set. The website never talks to
> Supabase from the browser.

## Step 4 — Set them in Vercel

Vercel project → **Settings → Environment Variables**. Add both, to
**Production** (and to Preview only if NJEN wants preview signups to go into the
same live list — usually it does not).

Redeploy. Next.js reads these at build time, so the change takes effect on the
next deployment, not immediately.

## Step 5 — Verify before sending any traffic

1. Open `/early-access`. The amber **"Preview only"** box above the form must be
   **gone**. If it is still there, the variables did not reach the build.
2. Submit a real test signup.
3. Supabase → **SQL Editor** → `select * from app.early_access_signups;` — the
   row must be there, with `signed_up_at` and `source` filled in.
4. Delete the test row:
   `delete from app.early_access_signups where email = '<the test address>';`

**Do not point Facebook traffic at the page until step 3 returns a row.** Until
then the page is honest about not saving anything, but it is still collecting
nothing.

---

## Exporting the leads

Supabase → **SQL Editor** → run, then **Download CSV**:

```sql
select name, email, signed_up_at, source
from app.early_access_signups
order by signed_up_at desc;
```

The **Table Editor will not show this table.** That is deliberate: the `app`
schema is kept out of Supabase's public Data API so the lead list is not one
misconfiguration away from the open internet. The SQL Editor runs with full
privileges and sees it.

Removing one person on request:

```sql
delete from app.early_access_signups where lower(email) = lower('<address>');
```

---

## What is stored, and what is not

**Stored:** name, email, signed-up timestamp, campaign source (e.g. `facebook`).
That is exactly the four things NJEN asked for.

**Not stored:** IP address, user agent, device, location, cookies, any tracking
identifier. The IP is used in memory for rate limiting and is never written
down. Data NJEN does not hold is data NJEN does not have to protect, explain in
a privacy policy, or produce on request.

There is a `consent_text` column, deliberately unused — see
"Privacy and consent" in `DAY15_IMPLEMENTATION_REPORT.md`.

---

## Resend is **not** required for this

Lead capture is `form → server → Supabase`. No email is sent at any point, so
Resend, a verified sending domain and DNS records are **not blockers** for
collecting signups.

Resend becomes necessary only for things NJEN has not asked for yet:

| Feature | Needs Resend? |
|---|---|
| Store the signup | **No** |
| Show "you're in" on screen | **No** |
| Export leads to CSV | **No** |
| Welcome / confirmation email | Yes |
| Double opt-in (confirm-your-address) | Yes |
| NJEN Insider sends | Yes — and probably a bulk sender, not Resend |

If NJEN later wants double opt-in, say so before launch: it changes what the
success screen is allowed to claim, and adds a `confirmed_at` column.

---

## Security summary

| Control | Status |
|---|---|
| Service-role key server-side only | Yes — no `NEXT_PUBLIC_` prefix; Next.js strips it from browser code |
| Browser can reach the database | **No** — the site never calls Supabase from the browser |
| `app` schema exposed to the Data API | **No** — revoked in migration 0001 |
| Row-level security on the table | Enabled and forced, with **no policy** (denies everything) |
| Write path | One `security definer` function, `service_role` execute only, pinned `search_path` |
| Server-side validation | Yes — the browser's result is never trusted |
| Honeypot + timing guard | Yes, re-checked server-side |
| Rate limit | Yes, in-memory per IP (see the caveat in the implementation report) |
| Secrets in the repository | None |
