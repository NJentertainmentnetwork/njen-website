import { jobs as sampleJobs, type Job } from "@/data/jobs";

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

// Explicit field mapping: a future source record with extra (private) fields can
// never leak through to pages, props or API responses.
function toPublicJob(job: Job): PublicJob {
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
  const published = sampleJobs.map(toPublicJob);
  return typeof limit === "number" ? published.slice(0, limit) : published;
}

export async function getPublishedJobBySlug(slug: string): Promise<PublicJob | null> {
  const job = sampleJobs.find((candidate) => candidate.slug === slug);
  return job ? toPublicJob(job) : null;
}

export async function getPublishedJobSlugs(): Promise<string[]> {
  return sampleJobs.map((job) => job.slug);
}
