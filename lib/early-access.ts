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
  /**
   * The approved consent wording the visitor agreed to, verbatim. Null when no
   * wording is configured or the box was not ticked. Taken from the SERVER's
   * copy of `EARLY_ACCESS_CONSENT`, never from text the browser sent.
   */
  consentText: string | null;
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
  /** Whether the consent box was ticked. Always false while no wording is configured. */
  consent: boolean;
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
    const value = normaliseSignupSource(params.get(key)?.slice(0, 64));
    if (value) return value;
  }

  try {
    return referrer ? normaliseSignupSource(new URL(referrer).hostname) : null;
  } catch {
    return null;
  }
}

/** Longest campaign label kept. Matches the column check in migration 0002. */
export const MAX_SOURCE_LENGTH = 64;

/**
 * A campaign label is letters, digits and `. _ - : / +` or spaces, starting
 * with a letter or digit. That covers every realistic `utm_source` value
 * ("facebook", "fb_ads", "l.facebook.com", "spring-2027") and referrer hosts.
 *
 * The leading-character rule is the point: a label beginning with `=`, `+`,
 * `-` or `@` is read as a FORMULA when NJEN opens an exported CSV in Excel or
 * Google Sheets. `source` is the one stored field a stranger controls just by
 * editing a link, so it is held to a strict shape. Names are not: a name field
 * must accept what people type, and is handled at export time instead (see
 * docs/NJEN_SUPABASE_STATUS_AND_COMPATIBILITY.md §6).
 */
const SOURCE_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N} ._:/+-]*$/u;

/**
 * Returns a safe campaign label, or null. Used by the browser (to choose what
 * to send) and by the server (which never trusts what was sent). Anything that
 * does not fit is dropped, not rejected: a broken campaign link must not stop
 * a person signing up.
 */
export function normaliseSignupSource(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!text || text.length > MAX_SOURCE_LENGTH) return null;
  return SOURCE_PATTERN.test(text) ? text : null;
}

/** What the form shows after a submission. Pure, so every branch is testable. */
export type SignupOutcome =
  /** A row was stored. The only outcome that may say "you're in". */
  | { kind: "stored" }
  /** Valid, but storage is off. Must say nothing was saved. */
  | { kind: "preview" }
  /** The server rejected fields. `errors` may hold only a "form" entry. */
  | { kind: "invalid"; errors: { field: string; message: string }[] }
  /** Not saved, for any other reason. `message` is shown as-is. */
  | { kind: "failed"; message: string };

/** Visitor-facing failure messages. Each says plainly that nothing was saved. */
export const SIGNUP_FAILURE_MESSAGES = {
  rateLimited: "Too many attempts. Please wait a few minutes and try again.",
  serverError: "Something went wrong at our end and your signup was not saved. Please try again shortly.",
  network: "We could not reach the server, so your signup was not saved. Please check your connection and try again.",
} as const;

/**
 * Maps the API's JSON body to what the visitor sees.
 *
 * `body` is whatever `response.json()` produced, or null when the response was
 * not JSON at all (a platform error page, a proxy timeout). Anything that is
 * not a recognised, well-formed answer is a failure: the form must never fall
 * through to a success screen by accident.
 */
export function interpretSignupResponse(body: unknown): SignupOutcome {
  const status = typeof body === "object" && body !== null ? (body as { status?: unknown }).status : undefined;

  if (status === "stored") return { kind: "stored" };
  if (status === "not-configured") return { kind: "preview" };
  if (status === "rate-limited") return { kind: "failed", message: SIGNUP_FAILURE_MESSAGES.rateLimited };

  if (status === "invalid") {
    const raw = (body as { errors?: unknown }).errors;
    const errors = Array.isArray(raw)
      ? raw.filter(
          (error): error is { field: string; message: string } =>
            typeof error === "object" &&
            error !== null &&
            typeof (error as { field?: unknown }).field === "string" &&
            typeof (error as { message?: unknown }).message === "string",
        )
      : [];
    if (errors.length > 0) return { kind: "invalid", errors };
  }

  return { kind: "failed", message: SIGNUP_FAILURE_MESSAGES.serverError };
}
