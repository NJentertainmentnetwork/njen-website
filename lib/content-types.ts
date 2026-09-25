/**
 * Public content contracts for the launch CMS collections.
 *
 * TYPES ONLY — no runtime code, no data source, nothing rendered yet. These are
 * the shapes the Payload-backed content services must return (Week 2), so pages
 * can be written against a stable contract and will not need rewriting when the
 * CMS is connected (`FUTURE_PROOF_ARCHITECTURE.md`, `PAYLOAD_CMS_PLAN.md`).
 *
 * Boundary rules:
 * - Payload owns this editorial content. Supabase owns future member, performer,
 *   industry, membership and payment data. Nothing here crosses that line.
 * - Every type below is what the PUBLIC may see. Staff-only editorial fields are
 *   listed in `EditorialFields` purely for documentation; they must never be
 *   mapped into a public DTO, page prop or API response.
 * - Jobs have their own service and DTO in `lib/jobs.ts` (the existing seam).
 */

/** Workflow states a staff member moves content through (Payload-side). */
export type ContentStatus = "draft" | "in-review" | "published" | "rejected" | "archived";

/**
 * Staff-only fields held on every CMS record. DOCUMENTATION ONLY.
 * These decide whether an item is returned publicly; they are never returned.
 */
export type EditorialFields = {
  status: ContentStatus;
  /** Publication timestamp; a future value means scheduled. */
  publishedAt?: string;
  /** Expiry/closing timestamp; past means expired and not public. */
  expiresAt?: string;
  /** Manually closed or withdrawn before expiry. */
  closed?: boolean;
  featured?: boolean;
  /** Where the item came from, and when its legitimacy was reviewed. */
  source?: string;
  sourceVerifiedAt?: string;
  /** Who submitted it, for moderated submissions. */
  submittedBy?: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * The rule every content service must apply before returning anything:
 * status === "published" AND publishedAt is not in the future AND
 * (no expiresAt OR expiresAt is in the future) AND closed !== true.
 */
export type PublicContentBase = {
  slug: string;
  title: string;
  /** Short summary used on cards and as the meta description. */
  summary?: string;
  /** Publication date, already formatted for display. */
  published?: string;
  featured?: boolean;
};

/** A public image from the Payload media library. Public editorial images only. */
export type PublicImage = {
  /** Served URL of the image. */
  url: string;
  /** Meaningful alternative text; empty string marks a decorative image. */
  alt: string;
  caption?: string;
  /** Photographer/owner credit, where required by the usage rights. */
  credit?: string;
  width?: number;
  height?: number;
};

/** Events (Business Rules §12). */
export type PublicEvent = PublicContentBase & {
  category: string;
  /** ISO start/end timestamps; formatting happens in the UI. */
  startsAt: string;
  endsAt?: string;
  venue?: string;
  location?: string;
  region?: string;
  description?: string;
  /** Registration or ticket link supplied by the organiser. */
  registrationUrl?: string;
  image?: PublicImage;
};

/**
 * What's Filming / Studio Watch (Business Rules §5).
 * Must never imply NJEN represents, produces, finances or is affiliated with a
 * project. No sensitive production details, private addresses or call-sheet data.
 */
export type PublicFilmingEntry = PublicContentBase & {
  productionType: string;
  location?: string;
  region?: string;
  /** Production status as approved for publication, e.g. "In production". */
  status: string;
  /** Public attribution for the information, where NJEN publishes one. */
  sourceName?: string;
  sourceDate?: string;
  /** Last date NJEN staff reviewed the entry. */
  lastReviewedAt?: string;
  publicNotes?: string;
};

/** Which launch information area a resource/article belongs to. */
export type ResourceArea =
  | "resources"
  | "housing"
  | "mental-health"
  | "children-parents"
  | "social-media-safety"
  | "career-center";

/** An external link inside a resource, with its provenance. */
export type PublicResourceLink = {
  label: string;
  url: string;
  /** Who publishes the linked material. */
  source?: string;
  /** When NJEN last checked the link and its content. */
  checkedAt?: string;
};

/** Resources and articles across the launch information sections. */
export type PublicResource = PublicContentBase & {
  area: ResourceArea;
  /** Rich text rendered as HTML by the content service. */
  body?: string;
  links?: PublicResourceLink[];
  lastReviewedAt?: string;
  image?: PublicImage;
};

/**
 * Who a publication issue is for. One editorial collection serves public issues
 * now and members-only issues later (register R11).
 *
 * `members-only` is a POST-LAUNCH concept: it requires member authentication and
 * server-side authorization, neither of which exists. Until then, no
 * members-only record may be queried, returned, rendered, statically generated
 * or indexed.
 */
export type PublicationVisibility = "public" | "members-only";

/**
 * A publication issue that may be served publicly.
 *
 * `visibility` is deliberately the literal `"public"`, not the wider
 * `PublicationVisibility` union: a members-only record cannot be typed as a
 * `PublicPublication`, so it cannot reach a public page by mistake. The service
 * also filters at runtime (`lib/publications.ts`) for sources that are not
 * type-checked, such as a future CMS query.
 */
export type PublicPublication = PublicContentBase & {
  visibility: "public";
  content?: string;
  image?: PublicImage;
};

/**
 * Shape every content service follows, so pages read content the same way
 * regardless of collection. Implemented per collection in Week 2, when the
 * CMS and its content exist.
 */
export type ContentService<T> = {
  /** Published, current items only. */
  list: (limit?: number) => Promise<T[]>;
  /** A single published, current item, or null. */
  bySlug: (slug: string) => Promise<T | null>;
  /** Slugs for static generation. */
  slugs: () => Promise<string[]>;
};
