import type { Metadata } from "next";
import { JobCard } from "@/components/JobCard";
import { PageHero } from "@/components/PageHero";
import { SampleContentNotice } from "@/components/SampleContentNotice";
import { JOBS_ARE_SAMPLE_DATA, getPublishedJobs } from "@/lib/jobs";
import { requireSection } from "@/lib/sections";

// While listings are sample data the page stays out of search results. This
// switches automatically once lib/jobs.ts serves real published jobs.
export const metadata: Metadata = {
  title: "Jobs",
  description: "Entertainment work across New Jersey: studio, crew, theater, music, live event and support roles.",
  robots: JOBS_ARE_SAMPLE_DATA ? { index: false, follow: true } : undefined,
};

// NOT IMPLEMENTED: keyword search and category/location/type filters. These
// need the published-jobs data source (Week 2). The previous non-functional
// search and filter controls were removed rather than left looking operational.
export default async function Jobs() {
  requireSection("jobs");
  const jobs = await getPublishedJobs();

  return (
    <>
      <PageHero
        eyebrow="Entertainment Job Board"
        title="Find entertainment work in New Jersey"
        intro="Studio, streamer, crew, theater, music, live-event, support-industry, internship, and entry-level opportunities."
      />
      <section className="section">
        <div className="container">
          {jobs.length > 0 ? (
            <>
              {JOBS_ARE_SAMPLE_DATA ? <SampleContentNotice /> : null}
              <h2 className="section-title">{JOBS_ARE_SAMPLE_DATA ? "Example listings" : "Current listings"}</h2>
              <div className="list">
                {jobs.map((job) => (
                  <JobCard key={job.slug} job={job} variant="row" sample={JOBS_ARE_SAMPLE_DATA} />
                ))}
              </div>
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
