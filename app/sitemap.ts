import type { MetadataRoute } from "next";
import { getPublishedJobSlugs } from "@/lib/jobs";
import { getPublicPublicationSlugs } from "@/lib/publications";
import { sections, type SectionKey } from "@/lib/sections";

/**
 * sitemap.xml.
 *
 * Sitemap URLs must be absolute, and the production domain is not confirmed
 * (register C13), so nothing is listed until NJEN_SITE_URL is set. No domain is
 * assumed here.
 *
 * Only genuinely indexable pages are listed:
 * - published sections only (never unpublished ones, and never staging previews);
 * - the jobs index only once at least one job is published, and job pages only
 *   for jobs that exist. An empty board is noindex, so listing it would
 *   contradict the page's own robots directive.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NJEN_SITE_URL?.replace(/\/+$/, "");
  if (!base) {
    return [];
  }

  const now = new Date();
  const entries: MetadataRoute.Sitemap = [{ url: `${base}/`, lastModified: now }];
  const [publicationSlugs, jobSlugs] = await Promise.all([
    getPublicPublicationSlugs(),
    getPublishedJobSlugs(),
  ]);

  // `published` is used deliberately instead of the preview-aware helper, so a
  // staging preview build can never expose unpublished sections in a sitemap.
  for (const key of Object.keys(sections) as SectionKey[]) {
    const section = sections[key];
    if (!section.published) continue;
    if (key === "jobs" && jobSlugs.length === 0) continue;
    // An empty archive is not worth indexing; list it once issues exist.
    if (key === "publications" && publicationSlugs.length === 0) continue;
    entries.push({ url: `${base}${section.href}`, lastModified: now });
  }

  for (const slug of jobSlugs) {
    entries.push({ url: `${base}/jobs/${slug}`, lastModified: now });
  }

  // Public issues only: the service never returns members-only records.
  for (const slug of publicationSlugs) {
    entries.push({ url: `${base}/publications/${slug}`, lastModified: now });
  }

  return entries;
}
