# NJEN Early Access: Developer-Owned Supabase Test Setup

**Prepared 13-10-2026 (Day 22).** This guide is for **the developer's own test Supabase project**, under the developer's own account. It is **not** NJEN's database and proves nothing about NJEN's project, Vercel or production.

**Status when written:** the test project had not been created yet, `.env.local` did not exist, and no real write had been made. Steps 1–5 are for the developer to do. Steps 6–9 can then be run locally. **Update, 13-10-2026:** all steps through §7 have now passed on the developer's test project; see the table below.

---

## 0. The five separate milestones

These are separate milestones. Passing one says nothing about the next.

| # | Milestone | Proves | Status on 13-10-2026 |
|---|---|---|---|
| 1 | Local application | Code builds and behaves correctly. A mock stands in for Supabase | **Passed** (typecheck, build, 90/90 regression, live-check script against a mock) |
| 2 | **Developer-owned test Supabase** (this guide) | The real Supabase API accepts the call, and the row lands in `app.early_access_signups` | **Verified 13-10-2026** (migrations applied manually; live check 12/12; count query 1/1). See `DAY22_IMPLEMENTATION_REPORT.md` §3.3 |
| 3 | NJEN's Supabase | NJEN's project has the function and table, and its grants are safe | **Not verified.** Needs the read-only inspection and an approved change |
| 4 | Vercel preview | The current code is deployed from the official repository with the variables set | **Not verified.** No project is confirmed on `NJentertainmentnetwork/njen-website` |
| 5 | Production | A real signup on the live domain lands in NJEN's database | **Not verified** |

---

## 1. Safety rules

- Use **your own** Supabase account and a **new** project. Never NJEN's project, and never NJEN's keys.
- Free plan only; it costs $0. Don't add billing.
- Use **one test address you control**, such as `you+njen-test@your-domain`. Never a real person's address.
- Keys go in `.env.local` and nowhere else. They don't go in chat, email, screenshots, reports or the Loom.
- `.env.local` is already git-ignored (`.gitignore`: `.env.*` with only `.env.example` re-included). Don't change that.
- If a key is ever shown on screen or pasted anywhere, **delete or rotate it** in the Supabase dashboard straight away. It's a test project, so this is cheap.

---

## 2. Create the test project (your account)

1. In the Supabase dashboard, create a new project. Name it something clearly not production, such as `njen-dev-test`. Choose the Free plan and the region nearest you.
2. Store the database password in a password manager. This guide never needs it.
3. Open **Project Settings → Data API** (it may be labelled **API**) and check:
   - the Data API is **enabled**;
   - **Exposed schemas** includes `public`, because the website calls a function there;
   - **Exposed schemas** does **not** include `app`. The signups table lives in `app` and must stay hidden.

> **Known design conflict, recorded and not changed:** migration 0001's comment and decision ARCH-1 (register T11) recommend removing `public` from the exposed schemas, to protect future Payload CMS tables. The Early Access function also lives in `public` and is reached through that same API. **Removing `public` would break signups.** For this test project, keep `public` exposed. The long-term fix needs a decision before Payload is installed; see `DAY22_IMPLEMENTATION_REPORT.md` §6.

---

## 3. Apply the two migrations, in order

**Pre-flight: make sure this is your test project, not NJEN's.**
1. The project name at the top of the dashboard is your test project, such as `njen-dev-test`.
2. The project reference in the dashboard address (`supabase.com/dashboard/project/<ref>`) is the same `<ref>` as in the `SUPABASE_URL` you will use.
3. Run this read-only check in the SQL Editor:

```sql
select
  current_setting('server_version') as postgres_version,
  to_regclass('public.early_access_leads') is not null as has_njen_leads_table,
  to_regnamespace('app') is not null as app_schema_exists,
  (select count(*) from pg_tables where schemaname = 'public') as public_table_count;
```

A brand-new test project normally shows:
- `postgres_version` 15 or later;
- `has_njen_leads_table = false`;
- `app_schema_exists = false`;
- `public_table_count = 0`.

**If `has_njen_leads_table` is `true`, or `public` already has tables you didn't create, stop.** You may be in NJEN's project. Don't run the migrations.

**Option A, automated (added Day 22): `scripts/setup-dev-supabase.mjs`.**

Supabase's Data API can't run SQL, and the repository has no PostgreSQL client package. The script therefore uses Supabase's **Management API**, the same mechanism the SQL Editor uses. That API needs a **personal access token**:
1. Supabase dashboard → **Account → Access Tokens**. Create a token with a short expiry.
2. Add `SUPABASE_ACCESS_TOKEN=sbp_…` to `.env.local` and nowhere else.
3. A personal token can reach **every project your account can**. The script pins every request to the `--project-ref` you give, and refuses to run if that ref doesn't match `SUPABASE_URL`. **Revoke the token when setup is done.**

```
node scripts/setup-dev-supabase.mjs --project-ref <your-test-ref>           # read-only checks
node scripts/setup-dev-supabase.mjs --project-ref <your-test-ref> --apply   # apply + verify
```

What the script does:
- **Checks the target first:** the ref matches, the secret key is accepted by that project, and the pre-flight passes. Pre-flight means no `early_access_leads`, no tables in `public`, and nothing in `app` except this repository's table.
- **Applies 0001 and 0002 only if absent**, runs each file exactly as written, and verifies after each one.
  - The 0002 checks are the §4 query.
  - It also checks that the signup table starts with zero rows.
  - It checks that the Data API lists the function and does not expose the table.
- **Prints `DATABASE SETUP VERIFIED`** only when every check passes.
- **Never prints** values, tokens or keys.

If you'd rather not create a token, use Option B.

**Option B, manual: SQL Editor → New query.** Paste the **whole** file, run it, and wait for "Success. No rows returned" before moving on.

| Order | File | Creates | Permissions it sets |
|---|---|---|---|
| 1 | `db/migrations/0001_init_app_schema.sql` | Schema `app`; trigger function `app.set_updated_at()` | Revokes all on schema `app` from `public`, `anon` and `authenticated`, plus default table privileges for `anon` and `authenticated` |
| 2 | `db/migrations/0002_early_access_signups.sql` | Table `app.early_access_signups`; unique index on `lower(email)`; two more indexes; `updated_at` trigger; function `public.record_early_access_signup(p_name, p_email, p_source, p_signed_up_at, p_consent_text)` | RLS **enabled and forced, with no policy**. Table revoked from `public`, `anon` and `authenticated`. The function is `security definer` with a pinned `search_path`. Execute is revoked from `public`, `anon` and `authenticated` and granted to `service_role` only |

- **0002 depends on 0001.** It needs the `app` schema and `app.set_updated_at()`.
- **Platform requirements:**
  - PostgreSQL 13 or later. Supabase meets this.
  - The line `create extension if not exists "pgcrypto"` does nothing on Supabase, because pgcrypto is already installed.
  - The roles `anon`, `authenticated` and `service_role` already exist on Supabase, so every permission block runs.
- **Do not run** `db/schema.sql`. It is reference material only.
- Both files were applied to an in-memory PostgreSQL (PGlite) on Day 21 and again on Day 22. In PGlite the `pgcrypto` line had to be skipped, because PGlite doesn't ship that extension. They have **not** been run on Supabase until you do this.

---

## 4. Verify the setup (read-only, one query)

Run this in the SQL Editor. It returns one row of yes/no answers and a count, and changes nothing.

```sql
select
  to_regclass('app.early_access_signups') is not null as table_exists,
  to_regprocedure('public.record_early_access_signup(text,text,text,timestamptz,text)') is not null as function_exists,
  (select relrowsecurity from pg_class where oid = to_regclass('app.early_access_signups')) as rls_enabled,
  (select relforcerowsecurity from pg_class where oid = to_regclass('app.early_access_signups')) as rls_forced,
  (select count(*) from pg_policies where schemaname = 'app' and tablename = 'early_access_signups') as policy_count,
  (select prosecdef from pg_proc where oid = to_regprocedure('public.record_early_access_signup(text,text,text,timestamptz,text)')) as security_definer,
  has_function_privilege('service_role', 'public.record_early_access_signup(text,text,text,timestamptz,text)', 'execute') as service_role_can_call,
  has_function_privilege('anon', 'public.record_early_access_signup(text,text,text,timestamptz,text)', 'execute') as anon_can_call,
  has_function_privilege('authenticated', 'public.record_early_access_signup(text,text,text,timestamptz,text)', 'execute') as authenticated_can_call,
  has_schema_privilege('anon', 'app', 'usage') as anon_can_use_app_schema,
  has_table_privilege('anon', 'app.early_access_signups', 'select') as anon_can_read,
  has_table_privilege('authenticated', 'app.early_access_signups', 'select') as authenticated_can_read,
  (select count(*) from app.early_access_signups) as row_count;
```

| Column | Must be |
|---|---|
| `table_exists`, `function_exists`, `rls_enabled`, `rls_forced`, `security_definer`, `service_role_can_call` | `true` |
| `anon_can_call`, `authenticated_can_call`, `anon_can_use_app_schema`, `anon_can_read`, `authenticated_can_read` | `false` |
| `policy_count`, `row_count` | `0` |

**If any value differs, stop.** Don't widen permissions or add a policy to make something pass. Record the row and raise it.

If the query itself errors (for example "function … does not exist"), a migration didn't apply. Re-run Step 3.

---

## 5. Configure `.env.local` (you do this; never paste values anywhere else)

The code reads exactly these two names (`lib/early-access-store.ts`, lines 34–35):

```
SUPABASE_URL=https://<your-test-project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your test project's secret key>
```

- **`SUPABASE_URL`:** the Project URL from the project's API or Data API settings. A trailing slash is fine; the code strips it.
- **`SUPABASE_SERVICE_ROLE_KEY`:** under **Project Settings → API Keys**, a **secret** key (`sb_secret_…`, preferred) or the legacy `service_role` key (starts `eyJ`).
  - **Not** the publishable key (`sb_publishable_…`) and **not** the anon key. Those are rejected, and every signup then fails with "not saved".
- **Never** use a `NEXT_PUBLIC_` name for either value. That would compile it into browser code.
- Create the file in the project root, `D:\teqtotasks\njen-website\.env.local`.

**Check the names without showing the values:**

PowerShell:
```
Get-Content .env.local | ForEach-Object { ($_ -split '=', 2)[0] }
```
Git Bash:
```
cut -d= -f1 .env.local
```
Expect exactly `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

---

## 6. Build, start and run the live check

`/early-access` is built statically, so whether it says "Preview only" is decided at **build** time. Always rebuild after changing `.env.local`.

```
npm run build
npm run start
```

In a **second** terminal, using your test address:

```
node scripts/early-access-live-check.mjs --mode configured --email you+njen-test@your-domain
```

The script:
- refuses any URL that isn't `localhost`;
- never reads `.env.local`;
- masks the address in its output.

It checks:
- the health endpoint;
- that the page is **not** in "Preview only" mode;
- a valid signup → **201 stored**;
- the same address in different capitals → **201 stored**;
- invalid email, missing name, honeypot, too-fast, malformed JSON → **400**;
- 5,000 bytes with a length header, and 4,097 bytes chunked → **413**;
- 4,096 bytes chunked → **accepted**.

Expected last line: `12 passed, 0 failed`.

> The script sends its own `X-Forwarded-For` header so the 5-per-10-minutes rate limit doesn't interfere. That only works locally; Vercel overwrites the header. If you re-run it several times within 10 minutes and see 429s, restart `npm run start`.

---

## 7. Prove the row exists (the real proof)

A 201 response is **not** proof on its own. In the SQL Editor of **your test project**:

```sql
select count(*) as rows_for_test_address,
       count(*) filter (where source = 'dev-test-day22') as with_test_source
from app.early_access_signups
where lower(email) = lower('<your test address>');
```

**Expected: `1` and `1`.** One row only, even though the script stored the address three times in different forms. That proves the function and the case-insensitive duplicate handling.

The query returns counts only, so it's safe on camera.

**Optional: confirm the server called the expected function.** Go to Supabase → **Logs** (API / API Gateway) and filter for `record_early_access_signup`. Expect `POST /rest/v1/rpc/record_early_access_signup` with status 200 or 204. **Don't record this screen.** Log detail views can show request headers.

**Optional: confirm `anon` can't call the function.** Section 4 already proves this at the database level (`anon_can_call = false`). Prefer that over an extra HTTP test.

---

## 8. Failure handling and logs (optional, recommended)

**A rejected write must not look like a signup.**
1. Stop the server.
2. Start it with a deliberately wrong key. A variable set in the shell takes precedence over `.env.local`: Next.js only fills in names that aren't already set (checked in `node_modules/@next/env`).
3. Run the failure check, then clear the override.

PowerShell:
```
$env:SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_deliberately_wrong'
npm run start
# second terminal:
node scripts/early-access-live-check.mjs --mode failure --email you+njen-test@your-domain
# afterwards, in the first terminal:
Remove-Item Env:SUPABASE_SERVICE_ROLE_KEY
```

Expected:
- a valid signup → **502 error** ("not saved");
- `11 passed, 0 failed`;
- the server log shows only `[early-access] signup store failed: HTTP 401`.

**Missing configuration** is covered without credentials:
1. Rename `.env.local` temporarily.
2. Rebuild and start.
3. Run:
```
node scripts/early-access-live-check.mjs --mode unconfigured
```
Expected: the page shows "Preview only", a valid signup → **503 not-configured**, `11 passed, 0 failed`.

This passed locally on Day 22.

**Logs contain no secrets or personal data.**
1. Send the server output to a file outside the repository:
```
npm run start *> $env:TEMP\njen-server.log
```
2. After running the checks:
```
Select-String -Path $env:TEMP\njen-server.log -SimpleMatch -Pattern 'sb_secret_','eyJ','<your test address>','<your test domain>' | Measure-Object
```
Expect `Count : 0`. Don't search for a bare `@`: npm's own startup banner contains one.

3. Delete the file afterwards.

---

## 9. Clean up (your test project only)

Keeping the test row in your own test project is harmless. To remove it:

```sql
delete from app.early_access_signups
where lower(email) = lower('<your test address>') and source = 'dev-test-day22';
```

Then re-run Step 7's count; expect `0` and `0`. **Never run a delete against NJEN's project.**

---

## 10. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| "Preview only" still shown | The build ran before `.env.local` existed, or a name is misspelt | Check the names (Step 5), then `npm run build` again |
| Valid signup → 503 `not-configured` | One of the two variables is missing or empty at runtime | Same as above |
| 502, server log `HTTP 401` | Wrong key, publishable or anon key, or a key from another project | Use the test project's secret key |
| 502, server log `HTTP 404` | Function missing, or the API hasn't picked it up yet | Re-run Step 4. If it shows `function_exists = true`, run `notify pgrst, 'reload schema';` in the SQL Editor (test project only) and retry |
| 502, server log `HTTP 403` | Execute not granted to `service_role` | Re-run Step 4 and look at `service_role_can_call`. Don't grant to `anon` |
| 502, server log `network or timeout` | Wrong URL, or project paused or still starting | Check the URL; resume the project in the dashboard |
| 429 `rate-limited` | More than 5 requests from one key within 10 minutes | Restart `npm run start` |

---

## 11. What a pass here does and does not prove

**Proves:**
- The code's request format matches real Supabase.
- Both key-header styles reach Supabase correctly; the `sb_secret_` style is proven only if you used a secret key.
- Migrations 0001 and 0002 apply on Supabase.
- The function writes one row per address, and the grants are as designed.

**Does not prove:**
- anything about NJEN's Supabase project or its `early_access_leads` table;
- any Vercel deployment;
- that the official repository is connected anywhere;
- production behaviour.

Report it as: **"Verified against a developer-owned test Supabase project."**
