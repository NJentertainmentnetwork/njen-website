import { jobs as sampleJobs, type Job } from "@/data/jobs";
import { publiclyVisible, type PublishGateFields } from "@/lib/publish-gate";

/**
 * Public jobs service — the only way pages read jobs.
 *
 * FUTURE_PROOF_ARCHITECTURE.md: "Content service returns public DTOs, not direct
 * CMS calls in pages." Today the source is the sample data in data/jobs.ts. When
 * the approved Payload source is connected (Week 2), only this module changes.
 *
 * WHAT THE PAYLOAD-BACKED VERSION MUST DO (Business Rules §4, §14):
 *   1. Return a job only when moderation status is "published".
 *   2. Exclude expired jobs (expiry/closing date in the past) and closed or
 *      archived jobs. Expired jobs must never appear active.
 *   3. Map CMS records to `PublicJob` with explicit fields, so internal fields
 *      (source, moderation notes, reviewer, submitter) never reach the browser.
 *   4. Keep sorting and any future filtering server-side.
 *
 * Rules 1 and 2 are now enforced here rather than merely described: every read
 * below passes the source through the shared publication gate in
 * `lib/publish-gate.ts`, which is fail-closed. A CMS adapter therefore only has
 * to supply records; it must not reimplement the gate. Rule 3 is `toPublicJob`.
 *
 * Fields such as moderation state, publish state, expiry, closed/archived state
 * and the listing source live in the CMS record, not in `PublicJob`: they decide
 * whether a job is returned at all, and are not shown to the public.
 *
 * The functions are async so callers do not change when the source becomes a
 * database or CMS query.
 */

/**
 * Fields that may be shown publicly. Never add private, moderation or
 * submitter fields.
 *
 * Optional fields are not present in the Release 1.3 sample data. They are part
 * of the approved launch job model and will be populated from the CMS.
 */
export type PublicJob = {
  slug: string;
  title: string;
  organization: string;
  /** Display location, e.g. "Jersey City, NJ". */
  location: string;
  /** Employment type, e.g. "Full-time". */
  type: string;
  category: string;
  /** Display compensation, e.g. "$58,000–$68,000". Rules pending register B3. */
  pay: string;
  /** Display posted date. */
  posted: string;
  summary: string;
  responsibilities: string[];
  qualifications: string[];
  /** Full description, where the CMS record has more than the summary. */
  description?: string;
  /** NJEN region, e.g. "North Jersey". */
  region?: string;
  /** How to apply, in the employer's own words. NJEN does not accept applications. */
  applicationMethod?: string;
  /** The employer's own application link (Business Rules §4). */
  applicationUrl?: string;
  /** Closing date, shown only when the employer supplies one. */
  closingDate?: string;
};

/**
 * True while listings come from sample data. Drives the "Example listings"
 * labelling and the `noindex` on jobs pages, so both disappear automatically
 * once real published jobs are used. Set to false in the same change that
 * switches this module to the CMS source.
 */
export const JOBS_ARE_SAMPLE_DATA = true;

/**
 * A source record as it may arrive before it is trusted, with the staff-side
 * editorial fields the gate reads. The local sample file carries none of them.
 */
type SourceJob = Job & PublishGateFields;

/**
 * The sample file in `data/jobs.ts` predates the CMS and has no moderation
 * state, so while it is the source the gate is told to accept a missing
 * `status`. That allowance is tied to `JOBS_ARE_SAMPLE_DATA`: the moment this
 * module serves real records, a job with no moderation state is rejected, which
 * is the fail-closed behaviour the launch gate requires.
 */
const missingStatusPolicy = JOBS_ARE_SAMPLE_DATA ? "allow" : "reject";

function gated(records: readonly SourceJob[]): SourceJob[] {
  return publiclyVisible(records, new Date(), missingStatusPolicy);
}

// Explicit field mapping: a future source record with extra (private) fields can
// never leak through to pages, props or API responses. The gate fields above are
// deliberately absent from `PublicJob`.
function toPublicJob(job: SourceJob): PublicJob {
  return {
    slug: job.slug,
    title: job.title,
    organization: job.organization,
    location: job.location,
    type: job.type,
    category: job.category,
    pay: job.pay,
    posted: job.posted,
    summary: job.summary,
    responsibilities: [...job.responsibilities],
    qualifications: [...job.qualifications],
  };
}

export async function getPublishedJobs(limit?: number): Promise<PublicJob[]> {
  const published = gated(sampleJobs).map(toPublicJob);
  return typeof limit === "number" ? published.slice(0, limit) : published;
}

/* ---------------------------------------------------------------------------
 * Launch filters (30-Day Plan, Days 11-17: "filters needed for launch
 * (category/location/type; keep scope small)").
 *
 * Deliberate boundaries:
 * - Filtering happens HERE, on the server, never in the browser. A filtered
 *   list is produced by the same gated read as an unfiltered one, so a filter
 *   can only ever narrow what the publication gate already allowed. It can
 *   never widen it, and it is not a way to reach an unpublished record.
 * - Only three facets, all drawn from fields already public on `PublicJob`.
 *   No keyword search, no salary or date facets: keep scope small.
 * - A filter value is accepted ONLY if it exactly matches an option derived
 *   from the currently published jobs. Anything else is discarded, so an
 *   arbitrary query string can never be echoed back into the page.
 * ------------------------------------------------------------------------- */

export const JOB_FILTER_KEYS = ["category", "location", "type"] as const;

export type JobFilterKey = (typeof JOB_FILTER_KEYS)[number];

/** The filters actually applied. A key is absent when it is not in use. */
export type JobFilters = Partial<Record<JobFilterKey, string>>;

/** Available values per facet, derived from the published jobs themselves. */
export type JobFilterOptions = Record<JobFilterKey, string[]>;

export type JobsView = {
  /** Published jobs matching the applied filters. */
  jobs: PublicJob[];
  /** Total published jobs before filtering, for "showing X of Y". */
  total: number;
  options: JobFilterOptions;
  applied: JobFilters;
  /** True when at least one filter is in use. */
  isFiltered: boolean;
  /**
   * True when a supplied value was not a known option and was discarded.
   * The page uses this to explain the result rather than silently ignoring it.
   */
  discarded: boolean;
};

/** Guard against absurd query values before any comparison. */
const MAX_FILTER_VALUE_LENGTH = 120;

/** A query parameter may arrive as a string, a repeated array, or absent. */
type RawParam = string | string[] | undefined;

function firstValue(raw: RawParam): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return typeof value === "string" ? value.trim() : "";
}

function optionsFrom(jobs: readonly PublicJob[]): JobFilterOptions {
  const collect = (pick: (job: PublicJob) => string) =>
    Array.from(new Set(jobs.map(pick).filter((value) => value !== ""))).sort((a, b) =>
      a.localeCompare(b),
    );

  return {
    category: collect((job) => job.category),
    location: collect((job) => job.location),
    type: collect((job) => job.type),
  };
}

/**
 * Builds the jobs index view: the gated job list, the facet options, and the
 * validated filters, in one server-side read.
 *
 * @param params The page's search parameters, unvalidated.
 */
export async function getJobsView(params: Record<string, RawParam> = {}): Promise<JobsView> {
  const published = gated(sampleJobs).map(toPublicJob);
  const options = optionsFrom(published);

  const applied: JobFilters = {};
  let discarded = false;

  for (const key of JOB_FILTER_KEYS) {
    const value = firstValue(params[key]);
    if (value === "") continue;
    // Allow-list check: the value must be one this data actually offers.
    if (value.length > MAX_FILTER_VALUE_LENGTH || !options[key].includes(value)) {
      discarded = true;
      continue;
    }
    applied[key] = value;
  }

  const jobs = published.filter((job) =>
    JOB_FILTER_KEYS.every((key) => {
      const wanted = applied[key];
      return wanted === undefined || job[key] === wanted;
    }),
  );

  return {
    jobs,
    total: published.length,
    options,
    applied,
    isFiltered: Object.keys(applied).length > 0,
    discarded,
  };
}

export async function getPublishedJobBySlug(slug: string): Promise<PublicJob | null> {
  // Gate first, then match: a slug must not be able to reach a record that the
  // listing would not show.
  const job = gated(sampleJobs).find((candidate) => candidate.slug === slug);
  return job ? toPublicJob(job) : null;
}

export async function getPublishedJobSlugs(): Promise<string[]> {
  return gated(sampleJobs).map((job) => job.slug);
}
