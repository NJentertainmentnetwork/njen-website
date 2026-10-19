// Tests for the site-wide launch gates that are not part of Early Access:
// the publication gate, the section registry, robots.txt, sitemap.xml, the
// health endpoint and the security headers.
//
// Until now these were checked only by one-off local crawls (Days 4, 19 and
// 24). These tests keep them from regressing silently. They run the real
// modules; nothing here makes a network request.
//
// Run with `npm test`.
import { afterEach, before, describe, it } from "node:test";
import assert from "node:assert/strict";

// The section registry reads NJEN_PREVIEW_UNPUBLISHED once, when it is first
// loaded. These tests describe production behaviour, so the staging preview
// switch must be off before the modules are imported.
delete process.env.NJEN_PREVIEW_UNPUBLISHED;

const { isPubliclyVisible, publiclyVisible } = await import("@/lib/publish-gate");
const sectionsModule = await import("@/lib/sections");
const { default: robots } = await import("@/app/robots");
const { default: sitemap } = await import("@/app/sitemap");
const { GET: health, dynamic: healthDynamic } = await import("@/app/api/health/route");
const { default: nextConfig } = await import("@/next.config.ts");

const { sections, getPrimaryNav, getMobileNav, getFooterGroups, sectionRobots, canonicalFor, isSectionVisible } =
  sectionsModule;

const savedEnv = {
  NJEN_ALLOW_INDEXING: process.env.NJEN_ALLOW_INDEXING,
  NJEN_SITE_URL: process.env.NJEN_SITE_URL,
};

function setEnv(name, value) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

afterEach(() => {
  for (const [name, value] of Object.entries(savedEnv)) setEnv(name, value);
});

before(() => {
  // A developer shell with these set would make the "pre-launch" cases lie.
  setEnv("NJEN_ALLOW_INDEXING", undefined);
  setEnv("NJEN_SITE_URL", undefined);
});

const NOW = new Date("2026-10-20T12:00:00.000Z");
const earlier = new Date(NOW.getTime() - 60_000).toISOString();
const later = new Date(NOW.getTime() + 60_000).toISOString();

describe("publication gate (fail-closed)", () => {
  it("shows a published record with no dates", () => {
    assert.equal(isPubliclyVisible({ status: "published" }, NOW), true);
  });

  for (const status of ["draft", "in-review", "rejected", "archived", "PUBLISHED", "Published", " published", "live", "true"]) {
    it(`hides status ${JSON.stringify(status)}`, () => {
      assert.equal(isPubliclyVisible({ status }, NOW), false);
    });
  }

  for (const [label, record] of [
    ["no status field", {}],
    ["empty status", { status: "" }],
    ["null status", { status: null }],
  ]) {
    it(`hides a record with ${label} by default`, () => {
      assert.equal(isPubliclyVisible(record, NOW), false);
    });
    it(`shows a record with ${label} only under the explicit sample-data policy`, () => {
      assert.equal(isPubliclyVisible(record, NOW, "allow"), true);
    });
  }

  it("a closed record stays hidden even when published and current", () => {
    assert.equal(isPubliclyVisible({ status: "published", closed: true, publishedAt: earlier, expiresAt: later }, NOW), false);
    assert.equal(isPubliclyVisible({ closed: true }, NOW, "allow"), false);
  });

  it("only `closed: true` closes a record", () => {
    assert.equal(isPubliclyVisible({ status: "published", closed: false }, NOW), true);
  });

  it("hides a record scheduled for the future, shows it once the time has passed", () => {
    assert.equal(isPubliclyVisible({ status: "published", publishedAt: later }, NOW), false);
    assert.equal(isPubliclyVisible({ status: "published", publishedAt: earlier }, NOW), true);
    assert.equal(isPubliclyVisible({ status: "published", publishedAt: NOW.toISOString() }, NOW), true);
  });

  it("hides an expired record, including one expiring at this exact moment", () => {
    assert.equal(isPubliclyVisible({ status: "published", expiresAt: earlier }, NOW), false);
    assert.equal(isPubliclyVisible({ status: "published", expiresAt: NOW.toISOString() }, NOW), false);
    assert.equal(isPubliclyVisible({ status: "published", expiresAt: later }, NOW), true);
  });

  for (const bad of ["", "   ", "not a date", "2026-13-45", "yesterday"]) {
    it(`treats an unusable date ${JSON.stringify(bad)} as a reason to hide`, () => {
      assert.equal(isPubliclyVisible({ status: "published", publishedAt: bad }, NOW), false);
      assert.equal(isPubliclyVisible({ status: "published", expiresAt: bad }, NOW), false);
    });
  }

  it("filters a list, keeping order and only the visible records", () => {
    const records = [
      { id: 1, status: "published" },
      { id: 2, status: "draft" },
      { id: 3, status: "published", expiresAt: earlier },
      { id: 4, status: "published", publishedAt: earlier },
      { id: 5 },
    ];
    assert.deepEqual(publiclyVisible(records, NOW).map((record) => record.id), [1, 4]);
  });
});

describe("section registry", () => {
  const all = Object.entries(sections);
  const unpublished = all.filter(([, section]) => !section.published);
  const navHrefs = () => [
    ...getPrimaryNav().map((item) => item.href),
    ...getMobileNav().map((item) => item.href),
    ...getFooterGroups().flatMap((group) => group.items.map((item) => item.href)),
  ];

  it("has unpublished sections to protect (the tests below would be empty otherwise)", () => {
    assert.ok(unpublished.length > 0);
  });

  it("no unpublished section is visible or linked from any navigation", () => {
    const linked = new Set(navHrefs());
    for (const [key, section] of unpublished) {
      assert.equal(isSectionVisible(key), false, key);
      assert.ok(!linked.has(section.href), `${section.href} is linked`);
    }
  });

  it("navigation links only to published sections or home", () => {
    const allowed = new Set(["/", ...all.filter(([, section]) => section.published).map(([, section]) => section.href)]);
    for (const href of navHrefs()) assert.ok(allowed.has(href), `${href} is not a published section`);
  });

  it("the mobile bar is Home plus at most four sections", () => {
    const items = getMobileNav();
    assert.equal(items[0].href, "/");
    assert.ok(items.length <= 5);
  });

  it("the footer drops empty groups", () => {
    for (const group of getFooterGroups()) assert.ok(group.items.length > 0, group.title);
  });

  it("unpublished sections are noindex, nofollow; published ones set no robots override", () => {
    for (const [key, section] of all) {
      assert.deepEqual(sectionRobots(key), section.published ? undefined : { index: false, follow: false }, key);
    }
  });

  it("emits no canonical until the production domain is set", () => {
    assert.equal(canonicalFor("/jobs"), undefined);
    setEnv("NJEN_SITE_URL", "https://example.org");
    assert.deepEqual(canonicalFor("/jobs"), { canonical: "/jobs" });
  });

  it("every section href is a distinct same-site path", () => {
    const hrefs = all.map(([, section]) => section.href);
    assert.equal(new Set(hrefs).size, hrefs.length);
    for (const href of hrefs) assert.match(href, /^\/[a-z0-9/-]+$/);
  });
});

describe("robots.txt", () => {
  it("disallows everything by default (local, preview, staging)", () => {
    assert.deepEqual(robots(), { rules: { userAgent: "*", disallow: "/" } });
  });

  for (const value of ["TRUE", "1", "yes", "true ", ""]) {
    it(`stays closed for NJEN_ALLOW_INDEXING=${JSON.stringify(value)}`, () => {
      setEnv("NJEN_ALLOW_INDEXING", value);
      assert.deepEqual(robots(), { rules: { userAgent: "*", disallow: "/" } });
    });
  }

  it("opens only for exactly `true`, with no sitemap until the domain is set", () => {
    setEnv("NJEN_ALLOW_INDEXING", "true");
    assert.deepEqual(robots(), { rules: { userAgent: "*", allow: "/" } });
  });

  it("references the sitemap on the configured domain, without a doubled slash", () => {
    setEnv("NJEN_ALLOW_INDEXING", "true");
    setEnv("NJEN_SITE_URL", "https://example.org/");
    assert.equal(robots().sitemap, "https://example.org/sitemap.xml");
  });

  it("a site URL alone does not open indexing", () => {
    setEnv("NJEN_SITE_URL", "https://example.org");
    assert.deepEqual(robots(), { rules: { userAgent: "*", disallow: "/" } });
  });
});

describe("sitemap.xml", () => {
  it("is empty until the production domain is set", async () => {
    assert.deepEqual(await sitemap(), []);
  });

  it("lists home and published sections only, never unpublished ones", async () => {
    setEnv("NJEN_SITE_URL", "https://example.org/");
    const urls = (await sitemap()).map((entry) => entry.url);
    assert.equal(urls[0], "https://example.org/");
    for (const url of urls) assert.ok(url.startsWith("https://example.org/") && !url.includes("//", 8), url);
    for (const [, section] of Object.entries(sections)) {
      if (!section.published) assert.ok(!urls.includes(`https://example.org${section.href}`), section.href);
    }
  });

  it("leaves out the jobs board and the publications archive while they are empty", async () => {
    setEnv("NJEN_SITE_URL", "https://example.org");
    const urls = (await sitemap()).map((entry) => entry.url);
    // Both sources are empty today (no approved jobs or issues). An empty board
    // is noindex, so listing it would contradict the page's own directive.
    assert.ok(!urls.includes("https://example.org/jobs"));
    assert.ok(!urls.includes("https://example.org/publications"));
    assert.ok(!urls.some((url) => url.includes("/jobs/") || url.includes("/publications/")));
  });
});

describe("GET /api/health", () => {
  it("answers exactly {status: ok}, uncached and noindex", async () => {
    const response = health();
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: "ok" });
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(response.headers.get("x-robots-tag"), "noindex");
  });

  it("is never prerendered", () => {
    assert.equal(healthDynamic, "force-dynamic");
  });

  it("reveals nothing about configuration, even when storage is set", async () => {
    const saved = { url: process.env.SUPABASE_URL, key: process.env.SUPABASE_SERVICE_ROLE_KEY };
    process.env.SUPABASE_URL = "https://abcdefghijklmnopqrst.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "sb_secret_FAKE_TEST_VALUE_not_a_real_key";
    try {
      const text = await health().text();
      assert.equal(text, '{"status":"ok"}');
    } finally {
      setEnv("SUPABASE_URL", saved.url);
      setEnv("SUPABASE_SERVICE_ROLE_KEY", saved.key);
    }
  });
});

describe("security headers (next.config.ts)", () => {
  let headers;
  let csp;

  before(async () => {
    const rules = await nextConfig.headers();
    assert.equal(rules.length, 1);
    assert.equal(rules[0].source, "/:path*", "headers must apply to every path, including API routes");
    headers = new Map(rules[0].headers.map((header) => [header.key.toLowerCase(), header.value]));
    csp = new Map(
      headers
        .get("content-security-policy")
        .split(";")
        .map((part) => part.trim().split(/\s+/))
        .map(([name, ...values]) => [name, values]),
    );
  });

  it("does not advertise the framework", () => {
    assert.equal(nextConfig.poweredByHeader, false);
  });

  it("sends the baseline headers", () => {
    assert.equal(headers.get("x-content-type-options"), "nosniff");
    assert.equal(headers.get("referrer-policy"), "strict-origin-when-cross-origin");
    assert.equal(headers.get("x-frame-options"), "SAMEORIGIN");
    for (const feature of ["camera=()", "microphone=()", "geolocation=()"]) {
      assert.ok(headers.get("permissions-policy").includes(feature), feature);
    }
  });

  it("CSP keeps every fetch directive same-origin, with no third-party origin", () => {
    for (const directive of ["default-src", "img-src", "font-src", "connect-src", "base-uri", "form-action", "frame-ancestors"]) {
      assert.deepEqual(csp.get(directive), ["'self'"], directive);
    }
    assert.deepEqual(csp.get("script-src"), ["'self'", "'unsafe-inline'"]);
    assert.deepEqual(csp.get("style-src"), ["'self'", "'unsafe-inline'"]);
  });

  it("CSP blocks plugins, base-tag hijack, off-site form posts and framing", () => {
    assert.deepEqual(csp.get("object-src"), ["'none'"]);
    assert.deepEqual(csp.get("base-uri"), ["'self'"]);
    assert.deepEqual(csp.get("form-action"), ["'self'"]);
    assert.deepEqual(csp.get("frame-ancestors"), ["'self'"]);
    assert.ok(csp.has("upgrade-insecure-requests"));
  });

  it("CSP allows no eval, wildcard, data: or plain-http source", () => {
    for (const [directive, values] of csp) {
      for (const value of values) {
        assert.ok(!["'unsafe-eval'", "*", "data:", "http:", "https:", "blob:"].includes(value), `${directive} ${value}`);
        assert.ok(!value.startsWith("http"), `${directive} ${value}`);
      }
    }
  });
});
