/**
 * Early Access signup - shared contract between the page, the form and the
 * server route.
 *
 * Nothing in this file is a secret and nothing here talks to a provider. It is
 * imported by the browser bundle, so it must stay free of credentials and of
 * any server-only module. Storage lives in `lib/early-access-store.ts`
 * (server-only); the HTTP boundary is `app/api/early-access/route.ts`.
 *
 * HOW THIS GOES LIVE
 * The page no longer hard-codes "not connected". It asks the server whether
 * storage is configured (`isSignupStorageConfigured`) and tells the visitor the
 * truth either way:
 *   - configured   -> the form posts, the row is stored, the success screen is
 *                     a real confirmation.
 *   - unconfigured -> the form still validates, but it says plainly, before and
 *                     after submission, that nothing was saved.
 * A landing page that silently discards email addresses is worse than no
 * landing page, so this page never claims a signup it did not store.
 */

/** One signup, as it is stored. NJEN-owned and exportable. */
export type EarlyAccessSignup = {
  name: string;
  email: string;
  /** ISO 8601 timestamp. Recorded on the SERVER, never from the browser. */
  signedUpAt: string;
  /** Campaign source, e.g. "facebook". Null when the visitor arrived directly. */
  source: string | null;
};

/** What the browser is allowed to send. The rest is derived server-side. */
export type EarlyAccessSubmission = {
  name: string;
  email: string;
  source: string | null;
  /** Hidden anti-bot field. Real people leave it empty. */
  company: string;
  /** Milliseconds between render and submit. */
  elapsedMs: number;
};

/** Outcome of a POST to /api/early-access, as the form understands it. */
export type EarlyAccessResponse =
  | { status: "stored" }
  /** Valid submission, but no storage is configured. Nothing was saved. */
  | { status: "not-configured" }
  | { status: "invalid"; errors: { field: string; message: string }[] }
  | { status: "rate-limited" }
  | { status: "error" };

/** Maximum signups accepted from one IP per window. */
export const SIGNUP_RATE_LIMIT = 5;

/** Rate-limit window, in milliseconds. */
export const SIGNUP_RATE_WINDOW_MS = 10 * 60 * 1000;

/**
 * CONSENT WORDING SLOT - NOT FILLED IN, BY DESIGN.
 *
 * NJEN has not supplied approved consent wording or a Privacy Policy URL
 * (register B6). No legal text is invented here.
 *
 * While this is null the form shows no consent control and the server requires
 * none. To switch consent on, replace null with the APPROVED wording and URL;
 * the checkbox, its label, its link, its validation and its stored column all
 * appear from that one change. `required: true` additionally blocks submission
 * until the box is ticked, and the server enforces it too.
 */
export const EARLY_ACCESS_CONSENT: {
  /** NJEN's approved wording. Shown as the checkbox label. */
  text: string;
  /** Approved Privacy Policy URL, linked after the wording. */
  privacyPolicyUrl: string;
  /** True when a signup cannot be accepted without the box ticked. */
  required: boolean;
} | null = null;

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
