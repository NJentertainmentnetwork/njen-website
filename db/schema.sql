-- NJEN Release 1.3 relational schema foundation (PostgreSQL / Supabase oriented)
--
-- ***** REFERENCE ONLY — DO NOT APPLY THIS FILE TO ANY DATABASE. *****
-- It predates the approved architecture and is kept for its domain concepts.
-- The current model is DATABASE_AND_ROLE_MODEL.md; jobs and other editorial
-- content are owned by Payload CMS, not by tables here (ARCH-3). Reviewed,
-- versioned application migrations live in db/migrations/.
--
-- REVIEW + MIGRATION REQUIRED. This file is a domain foundation, not a production migration history.
-- RLS/authorization policies MUST be implemented and tested before private data is used in production.
create extension if not exists "pgcrypto";

create type user_role as enum ('member','student','professional','employer','production_partner','vendor','educator','moderator','admin');
create type moderation_status as enum ('draft','pending','approved','rejected','suspended','archived');
create type verification_status as enum ('unverified','pending','verified','rejected','suspended');
create type directory_profile_status as enum ('draft','pending','active','suspended','archived');

create table profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique not null,
  role user_role not null default 'member',
  display_name text not null,
  email text not null,
  city text,
  county text,
  bio text,
  profile_visibility boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table organizations (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid references profiles(id) on delete set null,
  name text not null,
  slug text unique not null,
  organization_type text not null,
  website text,
  description text,
  verification_status verification_status not null default 'pending',
  verified_at timestamptz,
  verified_by_profile_id uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table organization_members (
  organization_id uuid not null references organizations(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  organization_role text not null default 'member',
  created_at timestamptz not null default now(),
  primary key (organization_id, profile_id)
);

create table verification_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  status verification_status not null,
  reviewer_profile_id uuid references profiles(id) on delete set null,
  reason text,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete restrict,
  title text not null,
  slug text unique not null,
  category text not null,
  city text,
  county text,
  work_arrangement text,
  employment_type text,
  compensation_min numeric check (compensation_min is null or compensation_min >= 0),
  compensation_max numeric check (compensation_max is null or compensation_max >= 0),
  compensation_period text,
  compensation_note text,
  experience_level text,
  union_status text,
  description text not null,
  responsibilities text[],
  qualifications text[],
  application_method text not null,
  application_url text,
  deadline date,
  moderation_status moderation_status not null default 'draft',
  published_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (compensation_min is null or compensation_max is null or compensation_max >= compensation_min)
);

create table saved_jobs (
  profile_id uuid references profiles(id) on delete cascade,
  job_id uuid references jobs(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(profile_id,job_id)
);

create table applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete restrict,
  profile_id uuid not null references profiles(id) on delete restrict,
  stage text not null default 'new',
  resume_url text,
  cover_note text,
  answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(job_id,profile_id)
);

create table content_items (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  title text not null,
  slug text unique not null,
  summary text,
  body jsonb not null default '{}'::jsonb,
  moderation_status moderation_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  category text not null,
  region text not null,
  venue text,
  city text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  ticket_url text,
  description text,
  moderation_status moderation_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at >= starts_at)
);

-- PRIVATE DIRECTORY FOUNDATION.
-- A performer owns/manages their own record. This table is NOT a public/member-browsable directory.
-- Search access must be granted only through tested server-side authorization to verified/authorized industry users.
create table background_performer_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid unique not null references profiles(id) on delete cascade,
  status directory_profile_status not null default 'draft',
  professional_name text,
  home_region text,
  skills text[],
  profile_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table industry_access_grants (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  organization_id uuid references organizations(id) on delete cascade,
  access_scope text not null,
  granted_by_profile_id uuid references profiles(id) on delete set null,
  granted_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  reason text,
  unique(profile_id, organization_id, access_scope)
);

create table audit_records (
  id bigint generated always as identity primary key,
  actor_profile_id uuid references profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  prior_state jsonb,
  new_state jsonb,
  created_at timestamptz not null default now()
);

create or replace function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_set_updated_at before update on profiles for each row execute function set_updated_at();
create trigger organizations_set_updated_at before update on organizations for each row execute function set_updated_at();
create trigger jobs_set_updated_at before update on jobs for each row execute function set_updated_at();
create trigger applications_set_updated_at before update on applications for each row execute function set_updated_at();
create trigger content_items_set_updated_at before update on content_items for each row execute function set_updated_at();
create trigger events_set_updated_at before update on events for each row execute function set_updated_at();
create trigger background_performer_profiles_set_updated_at before update on background_performer_profiles for each row execute function set_updated_at();

create index jobs_search_idx on jobs using gin (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,'') || ' ' || coalesce(category,'')));
create index jobs_status_idx on jobs(moderation_status,published_at desc);
create index jobs_filters_idx on jobs(county,category,employment_type);
create index organizations_verification_idx on organizations(verification_status,created_at desc);
create index verification_records_org_idx on verification_records(organization_id,created_at desc);
create index applications_profile_idx on applications(profile_id,created_at desc);
create index applications_job_idx on applications(job_id,stage,created_at desc);
create index industry_access_profile_idx on industry_access_grants(profile_id,access_scope,revoked_at,expires_at);
create index background_performer_status_idx on background_performer_profiles(status,created_at desc);

-- REQUIRED NEXT STEP: convert this reviewed foundation into versioned migrations.
-- REQUIRED NEXT STEP: enable RLS on private/user tables and define deny-by-default policies after auth model is finalized.
-- REQUIRED NEXT STEP: test cross-account, performer-to-performer, unverified-industry and revoked-access denial cases.
