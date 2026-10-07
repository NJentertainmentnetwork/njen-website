import type { NextConfig } from "next";

/**
 * Baseline security headers for the public launch.
 *
 * Deliberately conservative: these are safe for a static public site and will
 * not need unpicking when Payload, Sentry or Plausible are added.
 *
 * NOT set yet, by design:
 * - Strict-Transport-Security: a deployment-level decision, made with the real
 *   domain (register C13). Vercel already serves HTTPS.
 */

/**
 * Content-Security-Policy (30-Day Plan, days 18–23).
 *
 * Built from an inventory of what the site ACTUALLY loads, not from a template.
 * Every page of the current build was checked: zero external scripts, styles,
 * fonts, images or connections - every single subresource is same-origin. No
 * `<style>` blocks, no `data:` URIs. That is why almost everything below can be
 * plain `'self'`, and why no third-party origin is listed: there are none to
 * list. When Payload, Sentry or Plausible are connected, each adds its own
 * origin to the specific directive it needs (script-src and connect-src for
 * Sentry and Plausible; frame-ancestors/connect-src for a Payload preview).
 *
 * WHY 'unsafe-inline' APPEARS TWICE, and what it would take to remove it:
 *
 * - script-src: the App Router serves its hydration payload as ~12 inline
 *   `<script>` tags per page (`self.__next_f.push(...)`). The only ways to allow
 *   those are 'unsafe-inline', per-build hashes (which change every build), or a
 *   per-request nonce. A nonce is the right long-term answer, but in Next.js it
 *   REQUIRES middleware and forces every page to render dynamically - this site
 *   is currently 100% statically generated, so that trades the site's core
 *   performance characteristic for the upgrade. That is an architecture decision
 *   for NJEN, not one to make silently inside a hardening task. Flagged in the
 *   Day 18 report as the recommended next step for this header.
 *
 * - style-src: React writes CSS custom properties through `style` attributes -
 *   `--nav-count` on the mobile navigation sets its column count. Blocking them
 *   would silently regress the approved mobile layout. `style-src-attr` would be
 *   tighter (it would still forbid injected `<style>` blocks), but its browser
 *   support is narrower and a browser that ignores it falls back to `style-src`,
 *   which would break that nav. Compatibility wins here; the CSS-injection
 *   vector it leaves open is minor next to script execution.
 *
 * The directives that do the real work here need no nonce and are strict:
 * `object-src 'none'` (no plugins), `base-uri 'self'` (no base-tag hijack),
 * `form-action 'self'` (a form cannot be repointed at an attacker's server -
 * directly relevant to the Early Access signup), and `frame-ancestors 'self'`
 * (clickjacking; the modern replacement for X-Frame-Options, which is kept above
 * for older browsers).
 *
 * `img-src` deliberately omits `data:` because nothing emits one today. If blur
 * placeholders (`placeholder="blur"`) or inline SVG data URIs are ever used,
 * add `data:` here or the images will not render.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self'",
  "font-src 'self'",
  "connect-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "object-src 'none'",
  // No external subresource exists today, so this is a guard against one being
  // added over http later rather than something the current build needs.
  "upgrade-insecure-requests",
].join("; ");
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
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
];

const nextConfig: NextConfig = {
  // Do not advertise the framework version.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
