import type { PublicPublication, PublicationVisibility } from "@/lib/content-types";

/**
 * Public publications service (Newsletter/Publications archive).
 *
 * Intentionally an empty local source until NJEN supplies approved issues. No
 * sample or placeholder issue is invented.
 *
 * FUTURE PAYLOAD IMPLEMENTATION must replace only this module and must filter
 * server-side for records that are:
 *   published, not scheduled ahead, not expired/archived, AND
 *   visibility === "public".
 *
 * MEMBERS-ONLY ISSUES ARE POST-LAUNCH. They require member authentication and
 * server-side authorization, which do not exist. Until they do, a members-only
 * record must never be returned, rendered, statically generated or indexed.
 * There is no member authorization in this codebase today.
 */

/**
 * Shape a raw source record may have before it is trusted. A CMS query is not
 * type-checked at runtime, so visibility is verified here rather than assumed.
 */
type SourcePublication = Omit<PublicPublication, "visibility"> & {
  visibility: PublicationVisibility;
};

/** No approved issues yet. Publications are supplied by NJEN through the CMS. */
const sourcePublications: SourcePublication[] = [];

/**
 * Runtime guard: only `public` records pass. This is the last line of defence
 * if a future source returns mixed visibilities; the type system is the first.
 */
function publicOnly(records: SourcePublication[]): PublicPublication[] {
  return records
    .filter((record) => record.visibility === "public")
    .map((record) => ({ ...record, visibility: "public" as const }));
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
