import { NextResponse } from "next/server";
import { validateSubmission } from "@/lib/forms";
import {
  EARLY_ACCESS_CONSENT,
  SIGNUP_RATE_LIMIT,
  SIGNUP_RATE_WINDOW_MS,
  type EarlyAccessResponse,
} from "@/lib/early-access";
import { isSignupStorageConfigured, storeSignup } from "@/lib/early-access-store";

/**
 * POST /api/early-access - the only way a signup is accepted.
 *
 * Everything the browser sends is re-validated here. Browser validation is a
 * courtesy to the visitor; this is the check that counts (Business Rules §5).
 *
 * The response never says "stored" unless a row was actually written. When no
 * storage is configured the route answers `not-configured` and the page tells
 * the visitor plainly that nothing was saved.
 */

// This route reads environment variables and must never be prerendered or
// cached: a cached signup response would be served to the next visitor.
export const dynamic = "force-dynamic";

/** Caps the request body. A signup is a few hundred bytes. */
const MAX_BODY_BYTES = 4096;

/**
 * Per-IP rate limit, in memory.
 *
 * DELIBERATELY MODEST. Serverless instances do not share memory, so the real
 * ceiling is `SIGNUP_RATE_LIMIT` per instance per window, not per site. That is
 * enough to stop a single browser or naive script hammering the form, and it
 * costs nothing. A distributed limiter (Upstash, or Postgres-side) is the Week
 * 3/4 hardening task once NJEN has the infrastructure; it is not a reason to
 * ship no limit at all today.
 */
const hits = new Map<string, number[]>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((at) => now - at < SIGNUP_RATE_WINDOW_MS);

  if (recent.length >= SIGNUP_RATE_LIMIT) {
    hits.set(key, recent);
    return true;
  }

  recent.push(now);
  hits.set(key, recent);

  // Keep the map from growing without bound on a long-lived instance.
  if (hits.size > 5000) {
    for (const [entry, times] of hits) {
      if (times.every((at) => now - at >= SIGNUP_RATE_WINDOW_MS)) hits.delete(entry);
    }
  }

  return false;
}

/**
 * Best-effort client identity for rate limiting only.
 *
 * The first `x-forwarded-for` entry is the client as the edge saw it. It is
 * used as a bucket key and is never stored with the signup: NJEN asked for
 * name, email, time and source, and an IP address is none of those.
 */
function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return first || request.headers.get("x-real-ip") || "unknown";
}

function json(body: EarlyAccessResponse, status: number) {
  return NextResponse.json(body, { status });
}

export async function POST(request: Request) {
  if (rateLimited(clientKey(request))) {
    return json({ status: "rate-limited" }, 429);
  }

  const length = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(length) && length > MAX_BODY_BYTES) {
    return json({ status: "invalid", errors: [{ field: "form", message: "Request too large." }] }, 413);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json({ status: "invalid", errors: [{ field: "form", message: "Invalid request." }] }, 400);
  }

  if (typeof payload !== "object" || payload === null) {
    return json({ status: "invalid", errors: [{ field: "form", message: "Invalid request." }] }, 400);
  }

  const body = payload as Record<string, unknown>;
  const elapsedMs = typeof body.elapsedMs === "number" ? body.elapsedMs : undefined;

  const result = validateSubmission(
    "early-access",
    { name: body.name, email: body.email },
    { honeypot: typeof body.company === "string" ? body.company : "", elapsedMs },
  );

  if (!result.ok) {
    return json({ status: "invalid", errors: result.errors }, 400);
  }

  // Consent is enforced here, not only in the browser. While NJEN has supplied
  // no wording (EARLY_ACCESS_CONSENT is null) this is inert: nothing is required
  // and nothing is recorded. The stored text is the server's own copy of the
  // approved wording, so a client cannot record consent to words it invented.
  const consented = body.consent === true;
  if (EARLY_ACCESS_CONSENT?.required && !consented) {
    return json({ status: "invalid", errors: [{ field: "consent", message: "Please tick the box to continue." }] }, 400);
  }
  const consentText = EARLY_ACCESS_CONSENT && consented ? EARLY_ACCESS_CONSENT.text : null;

  // `source` is a campaign label, not a field the visitor filled in, so it is
  // length-capped and otherwise taken as-is. Anything longer is a malformed or
  // hostile client and is simply dropped rather than rejected.
  const rawSource = typeof body.source === "string" ? body.source.trim() : "";
  const source = rawSource && rawSource.length <= 64 ? rawSource : null;

  if (!isSignupStorageConfigured()) {
    // Valid, but there is nowhere to put it. Say so; never pretend.
    return json({ status: "not-configured" }, 503);
  }

  const stored = await storeSignup({
    name: result.value.name,
    email: result.value.email,
    // Server clock. A browser-supplied timestamp can be anything.
    signedUpAt: new Date().toISOString(),
    source,
    consentText,
  });

  if (!stored.ok) {
    return json({ status: "error" }, 502);
  }

  return json({ status: "stored" }, 201);
}
