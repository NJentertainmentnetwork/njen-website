-- 0002_early_access_signups.sql
-- Early Access lead capture (Day 15).
--
-- STATUS: NOT APPLIED. No NJEN-owned Supabase project exists yet (register
-- D4/T1). This is reviewed SQL, ready to run once NJEN provides the project.
-- Nothing in this repository can apply it, and no credentials exist here.
--
-- Run against a development database first. Requires 0001 (it depends on the
-- `app` schema and on app.set_updated_at()).
--
-- WHAT THIS STORES, AND ONLY THIS
--   name, email, signed-up timestamp, campaign source.
-- That is exactly what NJEN asked to capture. No IP address, no user agent, no
-- tracking identifier: data nobody asked for is data NJEN has to protect, honour
-- deletion requests for, and explain in a privacy policy.
--
-- CONSENT: there is a column for it, deliberately left unused. NJEN has not
-- supplied approved consent wording (register B6), so the application does not
-- collect consent yet and must not pretend it did. When wording is approved it
-- goes into lib/early-access.ts and starts arriving in `consent_text`.

begin;

-- ---------------------------------------------------------------------------
-- 1. The table
-- Lives in `app`, which migration 0001 keeps out of the Supabase Data API.
-- Reachable only through the function in section 3.
-- ---------------------------------------------------------------------------
create table if not exists app.early_access_signups (
  id uuid primary key default gen_random_uuid(),

  -- Captured from the form.
  name text not null check (length(name) between 1 and 120),
  email text not null check (length(email) between 3 and 254),

  -- Recorded by the server, never by the browser.
  signed_up_at timestamptz not null default now(),

  -- Campaign attribution, e.g. 'facebook'. Null for direct arrivals.
  source text check (source is null or length(source) <= 64),

  -- The exact consent wording shown at the moment of signup, when NJEN has
  -- approved some. Stored verbatim rather than as a boolean: proving consent
  -- means proving WHAT was agreed to, and that wording changes over time.
  consent_text text,
  consent_given_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table app.early_access_signups is
  'NJEN Early Access leads. NJEN-owned. Not exposed through the Supabase Data API; written only by app.record_early_access_signup().';

-- One row per person. The signup is idempotent on the address, so a visitor who
-- submits twice is not two leads, and a resubmission refreshes nothing but the
-- name they gave.
create unique index if not exists early_access_signups_email_key
  on app.early_access_signups (lower(email));

-- Export and reporting both read newest-first.
create index if not exists early_access_signups_signed_up_at_idx
  on app.early_access_signups (signed_up_at desc);

create index if not exists early_access_signups_source_idx
  on app.early_access_signups (source)
  where source is not null;

drop trigger if exists early_access_signups_set_updated_at on app.early_access_signups;
create trigger early_access_signups_set_updated_at
  before update on app.early_access_signups
  for each row execute function app.set_updated_at();

-- ---------------------------------------------------------------------------
-- 2. Row level security
-- Enabled with NO policy, which denies everything. This is not an oversight:
-- the only writer is a `security definer` function, and `service_role` bypasses
-- RLS anyway. If the `app` schema is ever exposed by mistake, this table still
-- returns nothing to anon or authenticated.
-- ---------------------------------------------------------------------------
alter table app.early_access_signups enable row level security;
alter table app.early_access_signups force row level security;

revoke all on table app.early_access_signups from public;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on table app.early_access_signups from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on table app.early_access_signups from authenticated';
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- 3. The one reachable entry point
-- `public` is the schema Supabase exposes over PostgREST, so this function is
-- callable at POST /rest/v1/rpc/record_early_access_signup. It is the ONLY
-- thing the application can reach; the table behind it stays invisible.
--
-- Execute is granted to `service_role` alone. The website calls it server-side
-- with the service-role key, which never reaches the browser.
-- ---------------------------------------------------------------------------
create or replace function public.record_early_access_signup(
  p_name text,
  p_email text,
  p_source text default null,
  p_signed_up_at timestamptz default now(),
  p_consent_text text default null
) returns void
language plpgsql
security definer
-- Pinned search_path: a security definer function without one can be hijacked
-- by a caller-controlled path.
set search_path = app, pg_temp
as $$
begin
  if p_name is null or btrim(p_name) = '' then
    raise exception 'name is required';
  end if;
  if p_email is null or btrim(p_email) = '' then
    raise exception 'email is required';
  end if;

  insert into app.early_access_signups (name, email, source, signed_up_at, consent_text, consent_given_at)
  values (
    left(btrim(p_name), 120),
    lower(left(btrim(p_email), 254)),
    nullif(left(btrim(coalesce(p_source, '')), 64), ''),
    coalesce(p_signed_up_at, now()),
    p_consent_text,
    case when p_consent_text is not null then coalesce(p_signed_up_at, now()) end
  )
  on conflict (lower(email)) do update
    set name = excluded.name,
        -- The first signup is the one that counts: signed_up_at and source are
        -- not overwritten, so re-submitting does not rewrite attribution.
        consent_text = coalesce(excluded.consent_text, early_access_signups.consent_text),
        consent_given_at = coalesce(excluded.consent_given_at, early_access_signups.consent_given_at);
end;
$$;

comment on function public.record_early_access_signup is
  'Accepts one NJEN Early Access signup. Idempotent on email. service_role only.';

revoke all on function public.record_early_access_signup(text, text, text, timestamptz, text) from public;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on function public.record_early_access_signup(text, text, text, timestamptz, text) from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on function public.record_early_access_signup(text, text, text, timestamptz, text) from authenticated';
  end if;
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant execute on function public.record_early_access_signup(text, text, text, timestamptz, text) to service_role';
  end if;
end
$$;

commit;

-- ---------------------------------------------------------------------------
-- HOW NJEN EXPORTS THE LEADS
--
-- Supabase dashboard -> SQL Editor -> run, then "Download CSV":
--
--   select name, email, signed_up_at, source
--   from app.early_access_signups
--   order by signed_up_at desc;
--
-- The Table Editor will NOT show this table: the `app` schema is deliberately
-- hidden from the Data API. Use the SQL Editor, which runs as a superuser role.
--
-- DELETION REQUEST (one person asks to be removed):
--   delete from app.early_access_signups where lower(email) = lower('<address>');
-- ---------------------------------------------------------------------------
