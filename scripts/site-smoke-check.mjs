// Site smoke check - READ-ONLY. Safe against a local build or a deployed Preview.
//
// Automates the read-only rows of docs/NJEN_DAY24_PREVIEW_QA_CHECKLIST.md
// (A3, A4, B1-B8, C1): health, robots.txt, sitemap.xml, noindex, security
// headers, hidden sections, probe paths, the 404 page, internal links and the
// Early Access "Preview only" notice. It describes the PRE-LAUNCH state: robots
// closed, empty sitemap, no domain set.
//
// SAFETY
// - Sends GET requests only. It never submits the signup form, so it cannot
//   store anything, whatever storage the deployment has. That is why, unlike
//   the Early Access live and browser checks, it may run against a deployment.
// - A Vercel share link is used only to obtain the access cookie Vercel sets.
//   Cookie values are never printed.
// - Reads the section registry from lib/sections.ts, so the list of hidden
//   sections cannot drift from the code.
//
// USAGE
//   Local:   npm run build && npm run start    (in another terminal)
//            node scripts/site-smoke-check.mjs
//   Preview: node scripts/site-smoke-check.mjs --base https://<deployment>.vercel.app --share "<share link>"
//   Options: --base <url>          default http://localhost:3000
//            --share <url>         Vercel share link, for a protected deployment. Also checks
//                                  that the deployment refuses visitors without it (A3)
//            --storage off|on      what /early-access should show; default off ("Preview only")
//
// WHAT IT CANNOT TELL YOU
// Layout, keyboard, screen reader, real devices and the signup itself. Use the
// browser check (local) and the checklist's sections C-E by hand.
//
// Exit code 0 when every check passes, 1 otherwise.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) args.set(process.argv[i].replace(/^--/, ""), process.argv[i + 1]);

const base = (args.get("base") ?? "http://localhost:3000").replace(/\/+$/, "");
const shareUrl = args.get("share");
const storage = args.get("storage") ?? "off";

function usage(message) {
  console.error(`${message}\nSee the header of scripts/site-smoke-check.mjs for usage.`);
  process.exit(2);
}

let origin;
try {
  origin = new URL(base);
} catch {
  usage(`--base is not a URL: ${base}`);
}
if (!["off", "on"].includes(storage)) usage("--storage must be off or on");
const secure = origin.protocol === "https:";

// --- Section registry, read from the source -----------------------------------
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const registry = readFileSync(path.join(root, "lib/sections.ts"), "utf8");
const sections = [...registry.matchAll(/^\s*(\w+): \{ href: "([^"]+)".*published: (true|false) \}/gm)].map(
  ([, key, href, published]) => ({ key, href, published: published === "true" }),
);
if (sections.length === 0) usage("Could not read the section registry from lib/sections.ts.");

// --- HTTP: GET only, with an optional cookie jar --------------------------------
const jar = new Map();

function remember(response) {
  for (const line of response.headers.getSetCookie?.() ?? []) {
    const [pair] = line.split(";");
    const at = pair.indexOf("=");
    if (at > 0) jar.set(pair.slice(0, at).trim(), pair.slice(at + 1).trim());
  }
}

function cookieHeader() {
  return [...jar].map(([name, value]) => `${name}=${value}`).join("; ");
}

/**
 * GET without following redirects, so a redirect is seen, not hidden.
 *
 * Paths are appended to the base as text, not resolved: `new URL("//evil.example/", base)`
 * would turn a protocol-relative probe into a request to another host. Anything
 * that does not end up on the site under test is refused.
 */
async function get(path, { withCookies = true } = {}) {
  if (!path.startsWith("/")) throw new Error(`get() takes a site path, not ${path}`);
  const url = new URL(`${base}${path}`);
  if (url.origin !== origin.origin) throw new Error(`Refusing to request another site: ${url.origin}`);
  const headers = withCookies && jar.size > 0 ? { cookie: cookieHeader() } : {};
  const response = await fetch(url, { method: "GET", redirect: "manual", headers });
  const body = await response.text();
  return { status: response.status, headers: response.headers, body };
}

// --- Reporting -----------------------------------------------------------------
let failed = 0;
let passed = 0;
function check(ok, label) {
  if (ok) passed += 1;
  else failed += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
}

const robotsMeta = (html) => html.match(/<meta name="robots" content="([^"]*)"/)?.[1] ?? null;
const hrefs = (html) => [...html.matchAll(/<a\b[^>]*\bhref="([^"]*)"/g)].map(([, href]) => href.replace(/&amp;/g, "&"));
const subresources = (html) =>
  [
    ...html.matchAll(/<(?:script|img|source|iframe)\b[^>]*\b(?:src|srcset)="([^"]*)"/g),
    ...html.matchAll(/<link\b[^>]*\bhref="([^"]*)"/g),
  ].map(([, value]) => value);

function isOffSite(value) {
  try {
    return new URL(value, `${base}/`).origin !== origin.origin;
  } catch {
    return false;
  }
}

console.log(`Site smoke check: base=${base}, storage=${storage}${shareUrl ? ", using share link" : ""}\n`);

// --- A3: protected deployment ------------------------------------------------------
if (shareUrl) {
  const anonymous = await get("/", { withCookies: false });
  check(
    anonymous.status === 401 || anonymous.status === 403 || (anonymous.status >= 300 && anonymous.status < 400 && isOffSite(anonymous.headers.get("location") ?? "")),
    `A3 without the share link, / is refused (got ${anonymous.status})`,
  );

  let next = shareUrl;
  for (let hop = 0; hop < 5 && next; hop += 1) {
    const response = await fetch(next, { method: "GET", redirect: "manual", headers: jar.size ? { cookie: cookieHeader() } : {} });
    remember(response);
    await response.arrayBuffer();
    const location = response.headers.get("location");
    next = location && response.status >= 300 && response.status < 400 ? new URL(location, next).href : null;
  }
  if (jar.size === 0) console.log("NOTE  the share link set no cookie; continuing without one");
}

// --- A4: health ------------------------------------------------------------------
let health;
try {
  health = await get("/api/health");
} catch {
  console.error(`No server answering at ${base}. Start one with: npm run build && npm run start`);
  process.exit(1);
}
if (health.status === 401 || health.status === 403) {
  console.error(`${base} refused access (${health.status}). For a protected Preview, pass --share "<share link>".`);
  process.exit(1);
}
check(health.status === 200 && health.body === '{"status":"ok"}', `A4 /api/health -> 200 {"status":"ok"} (got ${health.status})`);
check(health.headers.get("cache-control") === "no-store", `A4 /api/health Cache-Control: no-store (got ${health.headers.get("cache-control")})`);

// --- B1, B2: robots and sitemap -------------------------------------------------------
const robotsTxt = await get("/robots.txt");
check(
  robotsTxt.status === 200 && /User-Agent: \*/i.test(robotsTxt.body) && /^Disallow: \/\s*$/im.test(robotsTxt.body) && !/^Allow:/im.test(robotsTxt.body),
  "B1 /robots.txt disallows all crawling",
);
const sitemapXml = await get("/sitemap.xml");
check(sitemapXml.status === 200 && sitemapXml.body.includes("<urlset") && !sitemapXml.body.includes("<url>"), "B2 /sitemap.xml is an empty <urlset>");

// --- B3, C1: Early Access ----------------------------------------------------------------
const earlyAccess = await get("/early-access");
check(earlyAccess.status === 200, `B3 /early-access -> 200 (got ${earlyAccess.status})`);
check(robotsMeta(earlyAccess.body) === "noindex, nofollow", `B3 /early-access robots meta "noindex, nofollow" (got ${robotsMeta(earlyAccess.body)})`);
const notice = earlyAccess.body.includes("Preview only.");
check(
  storage === "off" ? notice : !notice,
  storage === "off" ? 'C1 /early-access shows the "Preview only" notice' : 'C1 /early-access has no "Preview only" notice',
);

// --- B4: security headers, on a page, an API route, an error page and a 405 --------------
const notFound = await get("/this-does-not-exist");
const apiGet = await get("/api/early-access");
check(apiGet.status === 405, `B4 GET /api/early-access -> 405 (got ${apiGet.status}); this script never POSTs`);

for (const [label, response] of [
  ["/", await get("/")],
  ["/early-access", earlyAccess],
  ["/api/health", health],
  ["404 page", notFound],
]) {
  const h = response.headers;
  const csp = h.get("content-security-policy") ?? "";
  const missing = [
    csp.includes("object-src 'none'") && csp.includes("frame-ancestors 'self'") && csp.includes("form-action 'self'") ? null : "CSP",
    h.get("x-content-type-options") === "nosniff" ? null : "X-Content-Type-Options",
    h.get("referrer-policy") ? null : "Referrer-Policy",
    h.get("x-frame-options") ? null : "X-Frame-Options",
    h.get("permissions-policy") ? null : "Permissions-Policy",
    h.get("x-powered-by") ? "no X-Powered-By" : null,
    secure && !h.get("strict-transport-security") ? "HSTS" : null,
  ].filter(Boolean);
  check(missing.length === 0, `B4 headers on ${label}${secure ? " (incl. HSTS)" : " (HSTS not expected over http)"}${missing.length ? `: missing/wrong ${missing.join(", ")}` : ""}`);
}

// --- B5: sections ------------------------------------------------------------------------------
for (const section of sections) {
  const response = await get(section.href);
  if (section.published) {
    check(response.status === 200, `B5 published ${section.href} -> 200 (got ${response.status})`);
  } else {
    check(
      response.status === 404 && robotsMeta(response.body)?.startsWith("noindex"),
      `B5 hidden ${section.href} -> 404, noindex (got ${response.status}, ${robotsMeta(response.body)})`,
    );
  }
}

// --- B6: no directory, portal, admin or demo API ------------------------------------------------
for (const probe of ["/directory", "/performers", "/background-performers", "/portal", "/admin", "/api/jobs", "/api/does-not-exist"]) {
  const response = await get(probe);
  check(response.status === 404, `B6 ${probe} -> 404 (got ${response.status})`);
}

// --- B7: the 404 page ----------------------------------------------------------------------------
const notFoundLinks = new Set(hrefs(notFound.body));
check(
  notFound.status === 404 && robotsMeta(notFound.body)?.startsWith("noindex") && ["/", "/jobs", "/careers"].every((href) => notFoundLinks.has(href)),
  `B7 unknown page -> 404, noindex, links to Home / Jobs / Career Center (got ${notFound.status})`,
);

// --- Redirects never leave the site -----------------------------------------------------------------
for (const probe of ["//evil.example/", "/%5Cevil.example", "/early-access?next=https://evil.example/&redirect=https://evil.example/"]) {
  const response = await get(probe);
  const location = response.headers.get("location");
  check(!location || !isOffSite(location), `redirect probe ${probe} stays on site (got ${response.status}${location ? ` -> ${location}` : ""})`);
}

// --- B8: internal links and third-party content --------------------------------------------------------
const startPages = ["/", "/early-access", ...sections.filter((section) => section.published).map((section) => section.href)];
const pages = new Map([["/this-does-not-exist", notFound], ["/early-access", earlyAccess]]);
for (const page of startPages) if (!pages.has(page)) pages.set(page, await get(page));

const internal = new Set();
let external = 0;
let thirdParty = 0;
for (const [, response] of pages) {
  for (const href of hrefs(response.body)) {
    if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) continue;
    if (isOffSite(href)) external += 1;
    else internal.add(new URL(href, `${base}/`).pathname);
  }
  thirdParty += subresources(response.body).filter((value) => value.split(",").some((part) => isOffSite(part.trim().split(/\s+/)[0]))).length;
}
const broken = [];
for (const href of internal) {
  const response = pages.get(href) ?? (await get(href));
  if (response.status !== 200) broken.push(`${href} (${response.status})`);
}
check(broken.length === 0, `B8 ${internal.size} internal links from ${pages.size} pages all -> 200${broken.length ? `; broken: ${broken.join(", ")}` : ""}`);
check(external === 0, `B8 no links leave the site (found ${external})`);
check(thirdParty === 0, `no third-party scripts, styles or images (found ${thirdParty})`);

console.log(`\n${passed} passed, ${failed} failed`);
console.log("Not covered here: layout, keyboard, screen readers, real devices and signups (checklist C-E).");
process.exit(failed === 0 ? 0 : 1);
