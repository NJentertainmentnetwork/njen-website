import { NextResponse } from "next/server";

/**
 * GET /api/health - liveness check for uptime monitoring (30-Day Plan, days
 * 18-23: "Logging/error monitoring and health checks").
 *
 * Almost every page on this site is static, so a 200 from `/` proves only that
 * the CDN can serve a file. This route runs a server function on each request,
 * which is the same runtime the Early Access signup depends on.
 *
 * It deliberately reports NOTHING about configuration: not whether storage,
 * monitoring or any provider is set up, not a version, not an environment name.
 * A public endpoint that answered "storage: not configured" would be telling
 * strangers which parts of the site are not live yet. The monitoring provider
 * (Sentry's uptime check, once NJEN's account exists) only needs the status code.
 */

// Never prerendered or cached: a cached "ok" would hide an outage.
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    { status: "ok" },
    { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } },
  );
}
