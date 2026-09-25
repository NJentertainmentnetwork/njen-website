import type { MetadataRoute } from "next";

/**
 * robots.txt. Default is to disallow all crawling, so local, preview and staging
 * builds are never indexed. Set NJEN_ALLOW_INDEXING=true only in the production
 * environment at launch (see .env.example).
 *
 * The sitemap is referenced only when NJEN_SITE_URL is set, because sitemap URLs
 * must be absolute and the production domain is not confirmed (register C13).
 */
export default function robots(): MetadataRoute.Robots {
  if (process.env.NJEN_ALLOW_INDEXING === "true") {
    const base = process.env.NJEN_SITE_URL?.replace(/\/+$/, "");
    return {
      rules: { userAgent: "*", allow: "/" },
      ...(base ? { sitemap: `${base}/sitemap.xml` } : {}),
    };
  }

  return { rules: { userAgent: "*", disallow: "/" } };
}
