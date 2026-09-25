-- 0001_init_app_schema.sql
-- NJEN application schema foundation.
--
-- STATUS: NOT APPLIED. No database exists yet (register D4). Reviewed SQL only.
--
-- Creates no tables on purpose: all 30-day launch data is editorial content
-- owned by Payload CMS, which manages its own tables through its own migrations.
-- This file establishes the boundary and the safe defaults that later
-- application tables (post-launch) depend on.
--
-- Run once, against a development database first.

begin;

-- ---------------------------------------------------------------------------
-- 1. Application schema
-- Post-launch application data (members, organizations, verification, performer
-- records, membership pricing, payments, audit) lives here — never mixed into
-- Payload's tables. See SUPABASE_PAYLOAD_RESPONSIBILITY_MODEL.md.
-- ---------------------------------------------------------------------------
create schema if not exists app;

comment on schema app is
  'NJEN application data. Payload CMS owns editorial content separately. Not exposed through the Supabase Data API.';

-- gen_random_uuid() for future primary keys (built into PostgreSQL 13+; the
-- extension call is harmless and keeps older setups working).
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- 2. Shared updated_at trigger function
-- Attach to every future table that has an updated_at column:
--   create trigger <table>_set_updated_at before update on app.<table>
--     for each row execute function app.set_updated_at();
-- ---------------------------------------------------------------------------
create or replace function app.set_updated_at() returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Data API exposure (decision ARCH-1)
-- Supabase exposes the `public` schema through its Data API, and a table in an
-- exposed schema without RLS is readable by any role holding a grant. The `app`
-- schema must never be reachable that way: all access is server-side, through
-- the application's own authorized services.
--
-- Also remove `public` from the project's "Exposed schemas" setting (or disable
-- the Data API) in the Supabase dashboard, so Payload's tables are not exposed.
-- That setting is not SQL and must be applied at setup.
-- ---------------------------------------------------------------------------
revoke all on schema app from public;

do $$
begin
  -- These roles exist on Supabase projects; skip silently elsewhere.
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on schema app from anon';
    execute 'alter default privileges in schema app revoke all on tables from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on schema app from authenticated';
    execute 'alter default privileges in schema app revoke all on tables from authenticated';
  end if;
end
$$;

commit;

-- Reminder for the next migration that adds a table:
--   * enable row level security;
--   * add no policy until it has been reviewed (deny by default);
--   * index the foreign keys;
--   * attach app.set_updated_at() where the table has updated_at.
