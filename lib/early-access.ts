/**
 * Early Access signup - data contract and integration seam.
 *
 * NO PROVIDER IS CONNECTED. There is no database, no email platform, no API
 * route and no persistence of any kind, because the NJEN-owned Supabase and
 * Resend access does not exist yet (register D4/T1 and D5/T5). Nothing here
 * invents one.
 *
 * TO GO LIVE, three things happen in order:
 *   1. NJEN provides the approved provider access.
 *   2. A server route is added that validates the payload again on the server,
 *      rate-limits it, and stores `EarlyAccessSignup` somewhere NJEN owns and
 *      can export.
 *   3. `EARLY_ACCESS_SIGNUPS_ENABLED` is set to true in the same change.
 *
 * Until step 3, the page says plainly that it cannot collect signups yet. It
 * must not be advertised to Facebook traffic before then: a landing page that
 * silently discards email addresses is worse than no landing page.
 */

/** One signup, as it must be stored. NJEN-owned and exportable. */
export type EarlyAccessSignup = {
  email: string;
  /** ISO 8601 timestamp, recorded server-side when storage is added. */
  signedUpAt: string;
  /** Campaign source, e.g. "facebook". Null when the visitor arrived directly. */
  source: string | null;
};

/** False until an NJEN-owned storage/email provider is connected. */
export const EARLY_ACCESS_SIGNUPS_ENABLED = false;

/** Query keys checked for a campaign source, in priority order. */
const SOURCE_KEYS = ["source", "utm_source", "ref"] as const;

/**
 * Works out where a visitor came from, for the `source` field.
 *
 * An explicit campaign parameter wins; otherwise the referring host is used.
 * Only the host is kept - never the full referring URL, which can carry
 * personal information in its path or query.
 *
 * @param search  `location.search`, or any query string.
 * @param referrer `document.referrer`, or an empty string.
 */
export function readSignupSource(search: string, referrer: string): string | null {
  const params = new URLSearchParams(search);

  for (const key of SOURCE_KEYS) {
    const value = params.get(key)?.trim();
    if (value) return value.slice(0, 64);
  }

  try {
    return referrer ? new URL(referrer).hostname : null;
  } catch {
    return null;
  }
}
