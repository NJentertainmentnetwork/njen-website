import type { PublicPublication, PublicationVisibility } from "@/lib/content-types";
import { publiclyVisible, type PublishGateFields } from "@/lib/publish-gate";

/**
 * Public publications service (Newsletter/Publications archive).
 *
 * Intentionally an empty local source until NJEN supplies approved issues. No
 * sample or placeholder issue is invented.
 *
 * FUTURE PAYLOAD IMPLEMENTATION must replace only this module. The two
 * server-side filters it must pass through are already applied below, so a CMS
 * adapter only has to supply the records:
 *   1. the publication gate (published, not scheduled ahead, not expired,
 *      not closed) — `lib/publish-gate.ts`;
 *   2. visibility === "public".
 *
 * MEMBERS-ONLY ISSUES ARE POST-LAUNCH. They require member authentication and
 * server-side authorization, which do not exist. Until they do, a members-only
 * record must never be returned, rendered, statically generated or indexed.
 * There is no member authorization in this codebase today.
 */

/**
 * Shape a raw source record may have before it is trusted. A CMS query is not
 * type-checked at runtime, so visibility and editorial state are verified here
 * rather than assumed. The gate fields are staff-side and are never mapped into
 * the returned `PublicPublication`.
 */
type SourcePublication = Omit<PublicPublication, "visibility"> &
  PublishGateFields & {
    visibility: PublicationVisibility;
  };

/** No approved issues yet. Publications are supplied by NJEN through the CMS. */
const sourcePublications: SourcePublication[] = [];

/**
 * Runtime guard: a record passes only if it is both publicly visible (published,
 * live now, not expired, not closed) and marked `public`. This is the last line
 * of defence if a future source returns drafts or mixed visibilities; the type
 * system is the first.
 *
 * The explicit field mapping is what keeps the staff-side gate fields out of the
 * returned object: `status`, `publishedAt`, `expiresAt` and `closed` decide
 * whether a record is returned, and are never part of what is returned.
 */
function publicOnly(records: SourcePublication[]): PublicPublication[] {
  return publiclyVisible(records)
    .filter((record) => record.visibility === "public")
    .map((record) => ({
      slug: record.slug,
      title: record.title,
      summary: record.summary,
      published: record.published,
      featured: record.featured,
      content: record.content,
      image: record.image,
      visibility: "public" as const,
    }));
}

export async function getPublicPublications(): Promise<PublicPublication[]> {
  return publicOnly(sourcePublications);
}

export async function getPublicPublicationBySlug(slug: string): Promise<PublicPublication | null> {
  return publicOnly(sourcePublications).find((publication) => publication.slug === slug) ?? null;
}

export async function getPublicPublicationSlugs(): Promise<string[]> {
  return publicOnly(sourcePublications).map((publication) => publication.slug);
}
