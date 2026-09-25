import type { NextConfig } from "next";

/**
 * Baseline security headers for the public launch.
 *
 * Deliberately conservative: these are safe for a static public site and will
 * not need unpicking when Payload, Sentry or Plausible are added.
 *
 * NOT set yet, by design:
 * - Content-Security-Policy: needs the final Payload admin, Sentry and Plausible
 *   origins, so it is a Week 3 task once those are connected (30-Day Plan, days 18–23).
 * - Strict-Transport-Security: a deployment-level decision, made with the real
 *   domain (register C13). Vercel already serves HTTPS.
 */
const securityHeaders = [
  // Stop browsers guessing a different content type than the one sent.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Send the origin, but no path/query, to other sites.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Block framing by other origins (clickjacking). SAMEORIGIN keeps future
  // same-origin CMS preview panes working.
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // The public site needs none of these device APIs.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
];

const nextConfig: NextConfig = {
  // Do not advertise the framework version.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
