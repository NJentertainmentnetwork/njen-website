import type { ContentStatus } from "@/lib/content-types";

/**
 * The single implementation of the publication gate.
 *
 * 30-Day Plan, Days 4–10 gate: "unpublished content cannot be retrieved through
 * public endpoints." `lib/content-types.ts` states the rule every content service
 * must apply before returning anything; until now that rule existed only as a
 * comment. This module is that rule as executable code, so every content service
 * applies the same one and a future CMS adapter cannot quietly implement its own.
 *
 * The gate is deliberately FAIL-CLOSED: anything it cannot positively confirm as
 * published and current is withheld. A malformed date, an unknown status or a
 * missing status is a reason to hide a record, never a reason to show it.
 *
 * This decides only whether a record may be returned at all. It never appears in
 * a public DTO: the fields it reads are staff-side editorial fields, and mapping
 * them into a page prop or response is a separate, explicit step that must not
 * include them (see `EditorialFields` in `lib/content-types.ts`).
 */

/**
 * The editorial fields the gate reads. A subset of `EditorialFields`: these are
 * the only ones that affect public visibility.
 *
 * Every field is optional because a source record is not type-checked at
 * runtime. A CMS query returns whatever the CMS returns, so the gate validates
 * rather than assumes.
 */
export type PublishGateFields = {
  status?: ContentStatus | string;
  /** Publication timestamp. A future value means scheduled, so not yet public. */
  publishedAt?: string;
  /** Expiry/closing timestamp. A past value means expired, so no longer public. */
  expiresAt?: string;
  /** Manually closed or withdrawn before expiry. */
  closed?: boolean;
};

/**
 * How to treat a record that carries no `status` at all.
 *
 * - `"reject"` (the default) is correct for any real content source. A record
 *   with no workflow state has not been through moderation.
 * - `"allow"` exists for one narrow case: a local sample-data file that predates
 *   the CMS and has no editorial fields. It is only legitimate while the calling
 *   service is still serving labelled sample data, and the service must stop
 *   passing it in the same change that switches to the real source.
 */
export type MissingStatusPolicy = "reject" | "allow";

/** Parses a timestamp, returning null for anything unusable. */
function parseTimestamp(value: string | undefined): Date | null {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * True only when a record is published, live now, not expired and not closed.
 *
 * @param now Injected so the behaviour is deterministic and testable.
 */
export function isPubliclyVisible(
  record: PublishGateFields,
  now: Date = new Date(),
  missingStatus: MissingStatusPolicy = "reject",
): boolean {
  // Withdrawn by staff: nothing else matters.
  if (record.closed === true) {
    return false;
  }

  if (record.status === undefined || record.status === null || record.status === "") {
    if (missingStatus !== "allow") {
      return false;
    }
  } else if (record.status !== "published") {
    // Covers draft, in-review, rejected, archived, and any unrecognised value.
    return false;
  }

  // Scheduled ahead: not public yet. An unparseable date is not "published now".
  if (record.publishedAt !== undefined) {
    const publishedAt = parseTimestamp(record.publishedAt);
    if (publishedAt === null || publishedAt.getTime() > now.getTime()) {
      return false;
    }
  }

  // Expired: no longer public. An unparseable expiry is treated as expired.
  if (record.expiresAt !== undefined) {
    const expiresAt = parseTimestamp(record.expiresAt);
    if (expiresAt === null || expiresAt.getTime() <= now.getTime()) {
      return false;
    }
  }

  return true;
}

/** Filters a source list through the gate, preserving order. */
export function publiclyVisible<T extends PublishGateFields>(
  records: readonly T[],
  now: Date = new Date(),
  missingStatus: MissingStatusPolicy = "reject",
): T[] {
  return records.filter((record) => isPubliclyVisible(record, now, missingStatus));
}
