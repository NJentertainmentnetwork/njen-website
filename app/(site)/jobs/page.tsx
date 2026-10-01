import type { Metadata } from "next";
import { JobCard } from "@/components/JobCard";
import { JobFilters } from "@/components/JobFilters";
import { PageHero } from "@/components/PageHero";
import { SampleContentNotice } from "@/components/SampleContentNotice";
import { JOB_FILTER_KEYS, JOBS_ARE_SAMPLE_DATA, getJobsView } from "@/lib/jobs";
import { canonicalFor, requireSection } from "@/lib/sections";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

// While listings are sample data the page stays out of search results. This
// switches automatically once lib/jobs.ts serves real published jobs.
//
// A filtered view is also kept out of search results: the same listings under a
// query string are a duplicate of /jobs, and only the unfiltered index should
// ever be indexed. `follow: true` keeps the job links themselves crawlable.
export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const params = await searchParams;
  const isFiltered = JOB_FILTER_KEYS.some((key) => {
    const value = params[key];
    return typeof value === "string" ? value.trim() !== "" : Array.isArray(value) && value.length > 0;
  });

  return {
    title: "Jobs",
    description:
      "Entertainment work across New Jersey: studio, crew, theater, music, live event and support roles.",
    robots: JOBS_ARE_SAMPLE_DATA || isFiltered ? { index: false, follow: true } : undefined,
    // Always the unfiltered index: a filtered view is the same listings under a
    // query string, so it must point back at the one canonical jobs page.
    alternates: canonicalFor("/jobs"),
  };
}

// NOT IMPLEMENTED: keyword search. Launch filters below are category, location
// and employment type only, per the approved plan ("keep scope small"). The
// earlier non-functional search and filter controls were removed rather than
// left looking operational.
export default async function Jobs({ searchParams }: { searchParams: SearchParams }) {
  requireSection("jobs");
  const { jobs, total, options, applied, isFiltered, discarded } = await getJobsView(await searchParams);

  return (
    <>
      <PageHero
        eyebrow="Entertainment Job Board"
        title="Find entertainment work in New Jersey"
        intro="Studio, streamer, crew, theater, music, live-event, support-industry, internship, and entry-level opportunities."
      />
      <section className="section">
        <div className="container">
          {total > 0 ? (
            <>
              {JOBS_ARE_SAMPLE_DATA ? <SampleContentNotice /> : null}
              <JobFilters options={options} applied={applied} isFiltered={isFiltered} />
              <h2 className="section-title">{JOBS_ARE_SAMPLE_DATA ? "Example listings" : "Current listings"}</h2>
              <p className="result-count">
                {isFiltered
                  ? `Showing ${jobs.length} of ${total} ${total === 1 ? "listing" : "listings"}.`
                  : `${total} ${total === 1 ? "listing" : "listings"}.`}
                {discarded ? " Some filter values were not recognised and were ignored." : null}
              </p>
              {jobs.length > 0 ? (
                <div className="list">
                  {jobs.map((job) => (
                    <JobCard key={job.slug} job={job} variant="row" sample={JOBS_ARE_SAMPLE_DATA} />
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <h3 className="section-title">No listings match those filters</h3>
                  <p>Try a different combination, or clear the filters to see everything on the board.</p>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <h2 className="section-title">No current listings</h2>
              <p>There are no job listings on the board right now.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
