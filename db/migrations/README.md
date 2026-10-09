# NJEN database migrations

**Status: prepared locally, NOT APPLIED anywhere.** No Supabase project or database exists (register D4). These files are reviewed SQL waiting for the NJEN-owned database.

## Two migration systems, one database

`SUPABASE_PAYLOAD_RESPONSIBILITY_MODEL.md` fixes the boundary. One PostgreSQL database holds:

| Boundary | Owns | Migrations |
|---|---|---|
| **Payload** | Editorial content (jobs, events, What's Filming, resources, articles), media, staff accounts | **Payload generates and runs its own migrations.** Never hand-write them here. |
| **Application (`app` schema)** | Future members, organizations, verification, performer records, membership pricing and eligibility, payments, audit | **This folder.** |

Rules (ARCH-2):
1. Neither system alters the other's tables.
2. Files here never touch Payload tables.
3. On deploy, run Payload migrations and these migrations as separate, ordered steps.

## Naming and ordering

`NNNN_short_description.sql`, applied in ascending numeric order, each file applied once, never edited after it has been applied anywhere. Corrections go in a new file.

## How these will be applied (once the database exists)

Either the Supabase CLI (`supabase db push`) or `psql -f`, run from CI or locally against a **development** database first. Never against production before staging.

## Current contents

| File | Purpose | Applied? |
|---|---|---|
| `0001_init_app_schema.sql` | Creates the `app` schema, the shared `set_updated_at()` trigger function, and closes the Supabase Data API exposure (ARCH-1) | **No** (not verified against any live project) |
| `0002_early_access_signups.sql` | Early Access lead capture (Day 15): table `app.early_access_signups` and the one function the website calls, `public.record_early_access_signup(p_name, p_email, p_source, p_signed_up_at, p_consent_text)`, executable by `service_role` only | **No** (not verified against any live project) |

**Day 20 (09-10-2026) — do not apply 0002 to NJEN's existing project without approval.** NJEN reports that its Supabase project already has a table named `early_access_leads`, which nothing in this repository creates or reads. Run the read-only inspection in `DAY20_IMPLEMENTATION_REPORT.md` §3 first; the options there decide whether 0002 is applied as written or replaced by a smaller adapter.

**Apart from Early Access, there are no launch tables, and that is correct.** All other 30-day launch data is editorial content owned by Payload, which creates its own tables. Application tables arrive with the post-launch phases in `POST_LAUNCH_DEVELOPMENT_ASSESSMENT.md` and are **not** written now.

## Conventions for future application tables (from `DATABASE_AND_ROLE_MODEL.md`)

- `id uuid primary key default gen_random_uuid()`.
- Foreign keys always declared, with a deliberate `on delete` rule; referenced records are archived rather than hard-deleted where history matters.
- `created_at timestamptz not null default now()` and `updated_at timestamptz not null default now()`, with the `app.set_updated_at()` trigger on every table that has `updated_at`.
- Index every foreign key, plus the columns each screen actually filters on.
- **RLS enabled on every table, with deny-by-default and no policy until one is reviewed.**
- Money: store provider references only, never card data. Every transaction snapshots the price, discount and configuration version applied at that moment.
- Private files: store a storage reference, never a public URL.

## Jobs

Jobs are **Payload content**, not an application table (ARCH-3). Future application records (applications, saved jobs) reference the Payload job id. Do not create a jobs table here.
