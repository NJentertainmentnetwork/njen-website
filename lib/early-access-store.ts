import type { EarlyAccessSignup } from "@/lib/early-access";

/**
 * Early Access storage - server-only Supabase adapter.
 *
 * NO CREDENTIALS ARE IN THIS FILE and none are invented. The adapter is dormant
 * until NJEN sets `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in its own
 * hosting environment; with them unset, `isSignupStorageConfigured()` is false
 * and nothing here is ever called.
 *
 * WHY HTTP AND NOT A SUPABASE SDK
 * Adding `@supabase/supabase-js` for one INSERT would pull a dependency into a
 * site that currently has four, for no capability we need. Supabase exposes
 * PostgREST over plain HTTPS; `fetch` is enough and is what the rest of this
 * codebase would use anyway.
 *
 * WHY AN RPC AND NOT A TABLE INSERT
 * `db/migrations/0001` puts application data in the `app` schema precisely so it
 * is NOT reachable through the Supabase Data API. Inserting into a table
 * directly would mean exposing `app` to PostgREST, which would put every future
 * application table one RLS mistake away from the public internet. Instead a
 * single `security definer` function in `public` is the only reachable surface,
 * and execute permission on it is granted to `service_role` alone. See
 * `db/migrations/0002_early_access_signups.sql`.
 *
 * SERVER-ONLY. Import this module from route handlers and server components
 * only. The `server-only` package would enforce that at build time, but adding
 * a dependency is a client decision, so the guarantee here is structural
 * instead: both variables lack the `NEXT_PUBLIC_` prefix, and Next.js replaces
 * every non-prefixed `process.env` reference with `undefined` in browser code.
 * The key is never passed to a client component and never logged.
 */

const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/+$/, "");
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** Postgres function that accepts a signup. Defined in migration 0002. */
const RPC = "record_early_access_signup";

/**
 * True only when a real, writable destination exists.
 *
 * The page and the route both branch on this. It must never be optimistic: if
 * it returns true and the write then fails, a visitor is told they signed up
 * when they did not.
 */
export function isSignupStorageConfigured(): boolean {
  return Boolean(SUPABASE_URL && SERVICE_ROLE_KEY);
}

export type StoreResult =
  | { ok: true }
  /** Configured, but the write failed. The visitor must not be told "you're in". */
  | { ok: false; reason: "provider-error" };

/**
 * Stores one signup. Call only when `isSignupStorageConfigured()` is true.
 *
 * Duplicate addresses are not an error: the signup is idempotent on email (the
 * function upserts), so a visitor who submits twice sees success both times and
 * NJEN still holds exactly one row.
 */
export async function storeSignup(signup: EarlyAccessSignup): Promise<StoreResult> {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return { ok: false, reason: "provider-error" };
  }

  try {
    // A signup that has not completed in 8 seconds is not going to; failing
    // fast keeps the serverless function from hanging on a provider outage.
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${RPC}`, {
      method: "POST",
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
      headers: {
        "Content-Type": "application/json",
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        p_name: signup.name,
        p_email: signup.email,
        p_source: signup.source,
        p_signed_up_at: signup.signedUpAt,
        p_consent_text: signup.consentText,
      }),
    });

    if (!response.ok) {
      // Provider error text can quote the payload, which is personal data, and
      // can name internal objects. Record the status only.
      console.error(`[early-access] signup store failed: HTTP ${response.status}`);
      return { ok: false, reason: "provider-error" };
    }

    return { ok: true };
  } catch {
    // Never log the caught value: it can carry the request body.
    console.error("[early-access] signup store failed: network or timeout");
    return { ok: false, reason: "provider-error" };
  }
}
