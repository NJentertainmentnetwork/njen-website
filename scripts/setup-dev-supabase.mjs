// Developer-owned Supabase test project: migration runner - LOCAL DEVELOPMENT ONLY.
//
// Applies db/migrations/0001 and 0002 to the developer's OWN test project and
// verifies the result, so the SQL does not have to be pasted into the SQL
// Editor by hand. Never point this at NJEN's project.
//
// HOW IT RUNS SQL
// Supabase's Data API (PostgREST) cannot run arbitrary SQL, and this repository
// has no PostgreSQL client package (adding one needs approval). The supported
// route that needs nothing new is the Supabase Management API,
//   POST https://api.supabase.com/v1/projects/<ref>/database/query
// which is what the dashboard's SQL Editor uses. It requires a personal access
// token (sbp_...) in SUPABASE_ACCESS_TOKEN in .env.local. A personal token can
// reach every project the account can, so every request here is pinned to the
// --project-ref given on the command line, and that ref must also match
// SUPABASE_URL. Create the token with a short expiry and revoke it afterwards.
//
// SAFETY
// - Read-only unless --apply is given. Without it, only checks run.
// - Stops unless: the ref matches SUPABASE_URL; the secret key is accepted by
//   that project; the project has no `early_access_leads`, no public tables,
//   and nothing in `app` other than this repository's own objects.
// - Never prints .env.local values, tokens, keys or connection strings. Error
//   text from Supabase is scrubbed of both credentials and truncated.
// - Never weakens RLS or grants. It runs the migration files exactly as they are
//   in the repository; verification failures stop the run.
// - Applies 0001 only if its objects are absent, and 0002 only if its table and
//   function are absent. Already-applied migrations are verified, not re-run.
//
// USAGE
//   node scripts/setup-dev-supabase.mjs --project-ref <ref>            (checks only)
//   node scripts/setup-dev-supabase.mjs --project-ref <ref> --apply    (apply + verify)
//
// Exit code 0 when everything requested succeeded and verified, 1 otherwise.

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const argv = process.argv.slice(2);
const apply = argv.includes("--apply");
const refIndex = argv.indexOf("--project-ref");
const expectedRef = refIndex >= 0 ? argv[refIndex + 1] : undefined;

function stop(message) {
  console.error(`STOP  ${message}`);
  process.exit(1);
}

if (!expectedRef || !/^[a-z0-9]{20}$/.test(expectedRef)) {
  stop("--project-ref <20-character ref of YOUR test project> is required.");
}

// ---------------------------------------------------------------------------
// Load .env.local without printing it. Simple KEY=VALUE lines, as Next.js reads.
// ---------------------------------------------------------------------------
const envPath = join(root, ".env.local");
if (!existsSync(envPath)) stop(".env.local not found in the project root.");

const env = {};
for (const raw of readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const line = raw.trim();
  if (!line || line.startsWith("#")) continue;
  const at = line.indexOf("=");
  if (at < 1) continue;
  env[line.slice(0, at).trim()] = line.slice(at + 1).trim().replace(/^(['"])(.*)\1$/, "$2");
}

const url = env.SUPABASE_URL?.replace(/\/+$/, "");
const key = env.SUPABASE_SERVICE_ROLE_KEY;
const token = env.SUPABASE_ACCESS_TOKEN;
const secrets = [key, token].filter(Boolean);

/** Removes credentials from any text before it is printed, then truncates. */
function scrub(text) {
  let out = String(text);
  for (const secret of secrets) out = out.split(secret).join("[REDACTED]");
  return out.replace(/postgres(ql)?:\/\/\S+/gi, "[CONNECTION STRING]").slice(0, 300);
}

let failures = 0;
function check(ok, label) {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
  return ok;
}

console.log(`Developer test project setup: ref ${expectedRef.slice(0, 4)}...${expectedRef.slice(-2)}, mode ${apply ? "APPLY" : "checks only"}\n`);

// ---------------------------------------------------------------------------
// 1. Identity: names, formats, ref match, key accepted by that project.
// ---------------------------------------------------------------------------
if (!check(Boolean(url && key), "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY present in .env.local")) process.exit(1);

const urlRef = url.match(/^https:\/\/([a-z0-9]{20})\.supabase\.co$/)?.[1];
if (!check(urlRef === expectedRef, "SUPABASE_URL points at the --project-ref given")) {
  stop("The configured URL is not the project you named. Nothing was done.");
}

for (const name of ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]) {
  if (process.env[name] && process.env[name] !== env[name]) {
    stop(`${name} is also set in this shell with a different value; Next.js would use the shell one. Clear it first.`);
  }
}

check(key.startsWith("sb_secret_") || key.startsWith("eyJ"), "key is a secret/service key format (not publishable)");

const rest = await fetch(`${url}/rest/v1/`, {
  headers: { apikey: key, Accept: "application/openapi+json" },
  signal: AbortSignal.timeout(15000),
}).catch(() => null);
if (!check(rest?.ok === true, `secret key accepted by this project's Data API (HTTP ${rest?.status ?? "no answer"})`)) {
  stop("The key does not belong to this project, or the project is paused.");
}
const openapi = await rest.json();

if (!token) {
  console.log(`
Management API token not configured, so no SQL can be run from here.
Remaining steps, either:
  A) Automated: create a personal access token (Supabase dashboard -> Account
     -> Access Tokens), short expiry, add it to .env.local as
       SUPABASE_ACCESS_TOKEN=sbp_...
     never paste it anywhere else, then re-run this script; or
  B) Manual: run 0001, then 0002, then the verification query in the SQL
     Editor, per docs/NJEN_DEV_SUPABASE_TEST_SETUP.md sections 3 and 4.`);
  process.exit(failures === 0 ? 0 : 1);
}

// ---------------------------------------------------------------------------
// Management API: SQL, pinned to the expected ref.
// ---------------------------------------------------------------------------
async function sql(query) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${expectedRef}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
    signal: AbortSignal.timeout(60000),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${scrub(text)}`);
  return text ? JSON.parse(text) : [];
}

// ---------------------------------------------------------------------------
// 2. Read-only pre-flight.
// ---------------------------------------------------------------------------
let pre;
try {
  [pre] = await sql(`
    select
      current_setting('server_version') as postgres_version,
      to_regclass('public.early_access_leads') is not null as has_njen_leads_table,
      to_regnamespace('app') is not null as app_schema_exists,
      (select count(*)::int from pg_tables where schemaname = 'public') as public_table_count,
      (select coalesce(array_agg(tablename::text order by tablename), '{}') from pg_tables where schemaname = 'app') as app_tables,
      to_regprocedure('app.set_updated_at()') is not null as has_set_updated_at,
      to_regclass('app.early_access_signups') is not null as has_signups_table,
      to_regprocedure('public.record_early_access_signup(text,text,text,timestamptz,text)') is not null as has_signup_function;`);
} catch (error) {
  stop(`Management API query failed: ${scrub(error.message)}. Check the token and that it belongs to the account owning this project.`);
}

console.log(`INFO  PostgreSQL ${pre.postgres_version}`);
check(Number.parseInt(pre.postgres_version, 10) >= 13, "PostgreSQL 13 or later");
const notNjen = check(pre.has_njen_leads_table === false, "no early_access_leads table (not NJEN's project)");
const publicEmpty = check(pre.public_table_count === 0, `public schema has no tables (found ${pre.public_table_count})`);
const appTables = pre.app_tables ?? [];
const appClean = check(
  appTables.every((name) => name === "early_access_signups"),
  `app schema holds nothing but this repository's table (found: ${appTables.length ? appTables.join(", ") : "none"})`,
);
if (!(notNjen && publicEmpty && appClean)) {
  stop("The project does not look like an empty developer test project. Nothing was applied. Ask before proceeding.");
}
if (failures) stop("Pre-flight failed. Nothing was applied.");

const need0001 = !(pre.app_schema_exists && pre.has_set_updated_at);
const need0002 = !(pre.has_signups_table && pre.has_signup_function);
if (pre.has_signups_table !== pre.has_signup_function) {
  stop("Migration 0002 looks half-applied (table and function disagree). Not re-running it blindly; inspect in the SQL Editor.");
}
console.log(`INFO  0001 ${need0001 ? "not applied" : "already applied"}; 0002 ${need0002 ? "not applied" : "already applied"}`);

if (!apply) {
  console.log(`\nChecks only. Re-run with --apply to ${need0001 || need0002 ? "apply the missing migration(s) and " : ""}verify.`);
  process.exit(failures === 0 ? 0 : 1);
}

// ---------------------------------------------------------------------------
// 3. Apply 0001, verify; apply 0002, verify. Files are run exactly as written.
// ---------------------------------------------------------------------------
async function runMigration(file) {
  const body = readFileSync(join(root, "db", "migrations", file), "utf8");
  try {
    await sql(body);
    console.log(`INFO  ${file}: executed`);
  } catch (error) {
    stop(`${file} failed: ${scrub(error.message)}`);
  }
}

if (need0001) await runMigration("0001_init_app_schema.sql");

const [v1] = await sql(`
  select
    to_regnamespace('app') is not null as app_schema_exists,
    to_regprocedure('app.set_updated_at()') is not null as has_set_updated_at,
    has_schema_privilege('anon', 'app', 'usage') as anon_app_usage,
    has_schema_privilege('authenticated', 'app', 'usage') as authenticated_app_usage;`);
check(v1.app_schema_exists && v1.has_set_updated_at, "0001: schema app and app.set_updated_at() exist");
check(v1.anon_app_usage === false && v1.authenticated_app_usage === false, "0001: anon/authenticated have no usage on schema app");
if (failures) stop("Migration 0001 did not verify. 0002 was not applied.");

if (need0002) await runMigration("0002_early_access_signups.sql");

// Same query as docs/NJEN_DEV_SUPABASE_TEST_SETUP.md section 4.
const [v2] = await sql(`
  select
    to_regclass('app.early_access_signups') is not null as table_exists,
    to_regprocedure('public.record_early_access_signup(text,text,text,timestamptz,text)') is not null as function_exists,
    (select relrowsecurity from pg_class where oid = to_regclass('app.early_access_signups')) as rls_enabled,
    (select relforcerowsecurity from pg_class where oid = to_regclass('app.early_access_signups')) as rls_forced,
    (select count(*)::int from pg_policies where schemaname = 'app' and tablename = 'early_access_signups') as policy_count,
    (select prosecdef from pg_proc where oid = to_regprocedure('public.record_early_access_signup(text,text,text,timestamptz,text)')) as security_definer,
    has_function_privilege('service_role', 'public.record_early_access_signup(text,text,text,timestamptz,text)', 'execute') as service_role_can_call,
    has_function_privilege('anon', 'public.record_early_access_signup(text,text,text,timestamptz,text)', 'execute') as anon_can_call,
    has_function_privilege('authenticated', 'public.record_early_access_signup(text,text,text,timestamptz,text)', 'execute') as authenticated_can_call,
    has_schema_privilege('anon', 'app', 'usage') as anon_can_use_app_schema,
    has_table_privilege('anon', 'app.early_access_signups', 'select') as anon_can_read,
    has_table_privilege('authenticated', 'app.early_access_signups', 'select') as authenticated_can_read,
    (select count(*)::int from app.early_access_signups) as row_count;`);

const expectTrue = ["table_exists", "function_exists", "rls_enabled", "rls_forced", "security_definer", "service_role_can_call"];
const expectFalse = ["anon_can_call", "authenticated_can_call", "anon_can_use_app_schema", "anon_can_read", "authenticated_can_read"];
for (const column of expectTrue) check(v2[column] === true, `0002: ${column} = true`);
for (const column of expectFalse) check(v2[column] === false, `0002: ${column} = false`);
check(v2.policy_count === 0, `0002: policy_count = 0 (got ${v2.policy_count})`);
check(v2.row_count === 0, `0002: signup table starts empty (row_count ${v2.row_count})`);

// The website reaches the function through the Data API; confirm it is listed
// there and that the table is not. Supabase reloads the API schema on DDL;
// give it a few seconds before concluding anything.
let listed = false;
let tableExposed = true;
for (let attempt = 0; attempt < 5 && !listed; attempt++) {
  if (attempt) await new Promise((resolve) => setTimeout(resolve, 2000));
  const listing = await fetch(`${url}/rest/v1/`, { headers: { apikey: key, Accept: "application/openapi+json" } });
  const paths = Object.keys((await listing.json()).paths ?? {});
  listed = paths.includes("/rpc/record_early_access_signup");
  tableExposed = paths.some((path) => path.includes("early_access_signups"));
}
check(listed, "Data API lists /rpc/record_early_access_signup");
check(!tableExposed, "Data API does not expose app.early_access_signups");

console.log(`\n${failures === 0 ? "DATABASE SETUP VERIFIED" : `${failures} check(s) FAILED - do not run the signup test`}`);
process.exit(failures === 0 ? 0 : 1);
