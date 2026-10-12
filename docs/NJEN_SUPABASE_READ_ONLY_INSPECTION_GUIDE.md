# NJEN Supabase — Read-Only Inspection Guide

**Prepared 12-10-2026 (Day 21) for NJEN.** About 20–30 minutes. No database knowledge needed.

**Nothing in this guide has been run yet.** It does not claim the database is healthy, restored or compatible. It tells NJEN how to find out, safely.

Related documents:
- `docs/NJEN_SUPABASE_STATUS_AND_COMPATIBILITY.md` — what the answers mean and what is decided afterwards.
- `docs/NJEN_SUPABASE_DATA_PROTECTION_AND_ACCESS.md` — backups, plans and access.

These queries replace the earlier set in `DAY20_IMPLEMENTATION_REPORT.md` §3.5. They check the same things, plus restoration, activity and other users of the table. **This is the version to use.**

---

## 1. Purpose and safety

**Why:** the website saves Early Access signups through one database function. NJEN has reported an existing table called `early_access_leads`. Before anyone changes anything, we need to know what is actually in the project.

**What these queries do:** they only **read** the database's own description of itself: table names, column names, security settings and counts. Every query is a `select`.

**What they never do:**
- create, change or delete anything;
- show any person's name, email address or other personal data. Where records are involved, they return **counts and dates only**.

**Please do not:**
- run anything not in this guide, or edit a query except where step 6 says so;
- send passwords, API keys, the service-role or secret key, or a database connection string, to anyone, including the developer;
- send screenshots of the **API Keys** page or **Database → Connection** page.

If anything looks unexpected, stop and send what you have. There is no penalty for stopping.

---

## 2. Open the correct project and confirm its status

1. Sign in at **https://supabase.com/dashboard** with the NJEN account that owns the project.
2. Select the **organization**, then the **project** that should hold Early Access signups. Note its **name** and **region** (shown on the project home page). If there is more than one candidate, note all of them; the queries are run in each.
3. **Restoration status.** Look at the project card or project home page:
   - **Active / Healthy:** continue.
   - **Paused:** do not continue. Report "paused" and the date shown.
   - **Restoring / Coming up:** wait. Restoration can take a while. Refresh later, then continue once it is active.
   - **Any error message:** copy the exact text (it contains no secrets) and send it.
4. Step 5, query 0 below is the final confirmation: if it returns a row, the database is up and answering.

---

## 3. Open the SQL Editor

1. In the left sidebar of the project, click **SQL Editor**.
2. Click **New query** (or "+"). You get an empty editing box.
3. **Run one numbered query at a time.** Paste it, press **Run** (or Ctrl+Enter / Cmd+Enter). The editor shows the result of the **last** statement only, so pasting several at once hides results.
4. If Supabase shows a warning about a "destructive operation", **do not confirm it**. None of these queries should trigger one, so report it instead.

---

## 4. How to send results back

For each query:
- Use **Export → CSV** (or "Download CSV") under the result, **or** take a screenshot of the result grid.
- Name it by query number, e.g. `Q03_columns.csv`.
- **"Success. No rows returned" is a real answer.** Write it down, e.g. "Q09: no rows".
- **Before sending, glance at the output.** None of these queries returns an email address or a name. If you ever see one, do not send that file; tell us which query produced it.

Send the files, plus the answers to the questions in section 7, through the usual project channel.

---

## 5. The queries

### Query 0 — Is the database up?

```sql
select current_database() as database,
       now() as checked_at,
       pg_postmaster_start_time() as database_started_at,
       version() as postgres_version;
```
**Checks:** the database is running and answering. One row means the project is up. `database_started_at` shows when it last started; a recent time is consistent with a recent restore.

### Query 1 — Does the website's expected setup already exist?

```sql
select to_regnamespace('app') as app_schema,
       to_regclass('app.early_access_signups') as signups_table,
       to_regprocedure('public.record_early_access_signup(text,text,text,timestamptz,text)') as signup_function,
       to_regclass('supabase_migrations.schema_migrations') as migration_history_table;
```
**Checks:** whether the repository's migrations 0001/0002 appear to have been applied. A blank (`NULL`) cell means "does not exist". `signup_function` is the one function the website calls.

### Query 2 — Which signup-like tables exist, and where?

```sql
select table_schema, table_name, table_type
from information_schema.tables
where table_schema not in ('pg_catalog', 'information_schema')
  and (table_name ilike '%early_access%' or table_name ilike '%lead%' or table_name ilike '%signup%')
order by table_schema, table_name;
```
**Checks:** finds `early_access_leads`, `early_access_signups`, and any similarly named table, with the **schema** each lives in (usually `public` or `app`).

### Query 3 — Their columns

```sql
select table_schema, table_name, ordinal_position, column_name, data_type,
       is_nullable, column_default, character_maximum_length
from information_schema.columns
where table_schema not in ('pg_catalog', 'information_schema')
  and (table_name ilike '%early_access%' or table_name ilike '%lead%' or table_name ilike '%signup%')
order by table_schema, table_name, ordinal_position;
```
**Checks:** column names and types. This decides whether the existing table can hold name, email, signup time and source.

### Query 4 — How many records, and how active is each table? (counts only)

```sql
select s.schemaname as table_schema, s.relname as table_name,
       (xpath('/row/c/text()', query_to_xml(format('select count(*) as c from %I.%I', s.schemaname, s.relname), false, true, '')))[1]::text::bigint as exact_rows,
       s.n_tup_ins as inserts_since_stats_reset,
       s.n_tup_upd as updates_since_stats_reset,
       s.n_tup_del as deletes_since_stats_reset,
       s.last_autoanalyze, s.last_analyze
from pg_stat_user_tables s
where s.relname ilike '%early_access%' or s.relname ilike '%lead%' or s.relname ilike '%signup%'
order by 1, 2;
```
**Checks:** the number of records in each table (a count, no contents) and whether rows have been added recently. Non-zero `inserts_since_stats_reset` means something has been writing to the table since statistics were last reset. That is a sign that another form or tool may be using it (see section 7).

### Query 5 — Indexes (is each email stored once?)

```sql
select schemaname as table_schema, tablename as table_name, indexname, indexdef
from pg_indexes
where tablename ilike '%early_access%' or tablename ilike '%lead%' or tablename ilike '%signup%'
order by 1, 2, 3;
```
**Checks:** whether a unique rule on the email column exists, and whether it ignores capitalisation (`lower(email)`). This determines what happens when someone signs up twice.

### Query 6 — Constraints and links to other tables

```sql
select conrelid::regclass as table_name, conname as constraint_name, contype as type,
       pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid::regclass::text ilike '%early_access%'
   or conrelid::regclass::text ilike '%lead%'
   or conrelid::regclass::text ilike '%signup%'
   or confrelid::regclass::text ilike '%early_access%'
order by 1, 2;
```
**Checks:** required fields, length limits, unique rules, and whether any other table points at these tables (`type` = `f`). Type letters: `p` primary key, `u` unique, `c` check, `f` foreign key.

### Query 7 — Row Level Security on or off

```sql
select n.nspname as table_schema, c.relname as table_name,
       c.relrowsecurity as rls_enabled, c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where c.relkind = 'r'
  and (c.relname ilike '%early_access%' or c.relname ilike '%lead%' or c.relname ilike '%signup%')
order by 1, 2;
```
**Checks:** Row Level Security (RLS) is Supabase's per-row lock. For a table of leads, `rls_enabled` should be `true`.

### Query 8 — RLS policies

```sql
select schemaname as table_schema, tablename as table_name, policyname, roles, cmd, qual, with_check
from pg_policies
where tablename ilike '%early_access%' or tablename ilike '%lead%' or tablename ilike '%signup%'
order by 1, 2, 3;
```
**Checks:** the rules attached to RLS. A policy that lets `anon` or `authenticated` read rows would let the public read the lead list. "No rows" with RLS enabled means everything is locked, which is the intended state for leads.

### Query 9 — Can the public roles actually read or write these tables?

```sql
select n.nspname as table_schema, c.relname as table_name, r.rolname as role,
       has_table_privilege(r.oid, c.oid, 'SELECT') as can_select,
       has_table_privilege(r.oid, c.oid, 'INSERT') as can_insert,
       has_table_privilege(r.oid, c.oid, 'UPDATE') as can_update,
       has_table_privilege(r.oid, c.oid, 'DELETE') as can_delete
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
cross join pg_roles r
where c.relkind = 'r'
  and r.rolname in ('anon', 'authenticated', 'service_role')
  and (c.relname ilike '%early_access%' or c.relname ilike '%lead%' or c.relname ilike '%signup%')
order by 1, 2, 3;
```
**Checks:** the effective permissions of the three Supabase roles. `anon` is the public, `authenticated` is any logged-in user, and `service_role` is the server. For leads, `anon` and `authenticated` should be `false` everywhere, or protected by RLS (queries 7–8).

### Query 10 — Signup-related functions and who may run them

```sql
select n.nspname as schema, p.proname as function_name,
       pg_get_function_identity_arguments(p.oid) as arguments,
       p.prosecdef as security_definer,
       has_function_privilege('anon', p.oid, 'EXECUTE') as anon_can_execute,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_can_execute,
       has_function_privilege('service_role', p.oid, 'EXECUTE') as service_role_can_execute
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname not in ('pg_catalog', 'information_schema')
  and (p.proname ilike '%early_access%' or p.proname ilike '%lead%' or p.proname ilike '%signup%')
order by 1, 2;
```
**Checks:** whether `record_early_access_signup` (or any similar function) exists, and who may call it. The repository's design allows `service_role` only. If this returns an error mentioning a role "does not exist", report the error text; it is still useful.

### Query 11 — The signup function's exact definition (if it exists)

```sql
select n.nspname as schema, p.proname as function_name, pg_get_functiondef(p.oid) as definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where p.proname = 'record_early_access_signup';
```
**Checks:** if the function exists, which table it writes to and how it handles duplicates. "No rows" means it does not exist. Function definitions should not contain secrets, but **look before sending**: if you see anything resembling a key or password, do not send it and tell us.

### Query 12 — Anything else that refers to `early_access_leads`

```sql
select 'function' as kind, n.nspname || '.' || p.proname as name
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname not in ('pg_catalog', 'information_schema') and p.prosrc ilike '%early_access_leads%'
union all
select 'view', view_schema || '.' || view_name
from information_schema.view_table_usage
where table_name = 'early_access_leads'
union all
select 'foreign key from', conrelid::regclass::text
from pg_constraint
where contype = 'f' and confrelid::regclass::text ilike '%early_access_leads%'
order by 1, 2;
```
**Checks:** other functions, views or tables that depend on `early_access_leads`. Anything listed here would be affected by a change to that table.

### Query 13 — Triggers (including Database Webhooks)

```sql
select event_object_schema as table_schema, event_object_table as table_name,
       trigger_name, action_timing, event_manipulation, action_statement
from information_schema.triggers
where event_object_table ilike '%early_access%' or event_object_table ilike '%lead%' or event_object_table ilike '%signup%'
order by 1, 2, 3;
```
**Checks:** automatic actions when a row is added. Supabase **Database Webhooks** appear here (the `action_statement` mentions `supabase_functions.http_request`). A webhook means another service, for example an email tool or Zapier, receives each new lead.

### Query 14 — Which schemas the public API may expose (optional)

```sql
select rolname, rolconfig
from pg_roles
where rolname = 'authenticator';
```
**Checks:** sometimes shows `pgrst.db_schemas=...`, the schemas exposed through Supabase's API. If `rolconfig` is empty, use the dashboard check in section 7 instead; that is the authoritative place.

---

## 6. One follow-up query (only if useful)

**Migration history.** If query 1 showed a value (not blank) in `migration_history_table`, run:

```sql
select version, name
from supabase_migrations.schema_migrations
order by version;
```
Lists which migrations were applied with the Supabase CLI. If query 1 showed it blank, skip this; migrations may still have been run by hand in the SQL Editor.

**Signup dates (no personal data).** Using query 3's output, find the date/time column in `early_access_leads` (often `created_at`). Then run this with `<schema>` replaced by query 2's schema and `<date_column>` by that column name. Edit only those two placeholders:

```sql
select min(<date_column>) as first_record_at,
       max(<date_column>) as latest_record_at,
       count(*) as total_records
from <schema>.early_access_leads;
```
`latest_record_at` tells us whether something is still writing to the table.

---

## 7. Dashboard checks (no SQL)

Please answer each with a short note or screenshot of **that section only**:

| # | Where | What to report |
|---|---|---|
| D1 | Organization → **Billing** (or the plan badge) | Plan name (Free, Pro, Team…) |
| D2 | Project → **Settings → Data API** (may be labelled "API") | The list under **Exposed schemas** |
| D3 | Project → **Settings → API Keys** | **Only which key types exist:** "legacy anon/service_role", "publishable/secret", or both. **Do not copy or screenshot the keys** |
| D4 | Project → **Database → Webhooks** (or Integrations → Database Webhooks) | Any webhook on `early_access_leads` (name and target service; not secret headers) |
| D5 | Project → **Edge Functions** | Names of any functions listed |
| D6 | Project home / status | Active, paused or restoring, plus the date of the last restore if shown |

**Who else might use `early_access_leads`?** Answer from NJEN's own knowledge:
- Who created it, and when?
- Was it connected to a form, website builder, Zapier/Make, or an email or CRM tool?
- Does it hold real people's signups that must be kept?

The answers decide whether the website should write into it or leave it alone.

---

## 8. What to send

A short message with:
1. The project name and region, and its status (section 2).
2. Results of queries 0–14 (files or screenshots, or "no rows"), plus section 6 if run.
3. Answers D1–D6.
4. What NJEN knows about how `early_access_leads` was created and used.
5. Anything that looked unexpected, and any query that errored (with the error text).

The developer will then send back one specific proposal, with the exact change, reason, impact and how to undo it, for written approval. **No database change happens before that approval.**
