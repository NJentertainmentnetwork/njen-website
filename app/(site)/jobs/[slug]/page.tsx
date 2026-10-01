import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/PageHero";
import { SampleContentNotice } from "@/components/SampleContentNotice";
import { JOBS_ARE_SAMPLE_DATA, getPublishedJobBySlug, getPublishedJobSlugs } from "@/lib/jobs";
import { canonicalFor, requireSection, sections } from "@/lib/sections";

export async function generateStaticParams() {
  const slugs = await getPublishedJobSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const job = await getPublishedJobBySlug(slug);

  return {
    title: job ? job.title : "Job not found",
    description: job?.summary,
    // Sample listings (and unknown slugs) stay out of search results.
    robots: JOBS_ARE_SAMPLE_DATA || !job ? { index: false, follow: true } : undefined,
    alternates: canonicalFor(`/jobs/${slug}`),
  };
}

// NOT IMPLEMENTED: applying and saving jobs. Applications are out of the 30-day
// launch (Business Rules section 3); live listings will instead direct users to
// the employer's own application method (section 4) once real jobs exist.
export default async function JobDetail({ params }: { params: Promise<{ slug: string }> }) {
  requireSection("jobs");
  const { slug } = await params;
  const job = await getPublishedJobBySlug(slug);

  if (!job) {
    notFound();
  }

  return (
    <>
      <PageHero
        eyebrow={job.category}
        title={job.title}
        breadcrumbs={[
          { href: "/", label: "Home" },
          { href: sections.jobs.href, label: sections.jobs.label },
        ]}
      >
        <p className="page-intro">
          <strong>{job.organization}</strong> · {job.location}
        </p>
        <div className="meta">
          <span>{job.type}</span>
          <span>{job.pay}</span>
          {job.region ? <span>{job.region}</span> : null}
          {job.closingDate ? <span>Closes {job.closingDate}</span> : null}
        </div>
      </PageHero>
      <section className="section">
        <div className="container detail">
          {JOBS_ARE_SAMPLE_DATA ? <SampleContentNotice /> : null}
          <section>
            <h2>About the opportunity</h2>
            <p>{job.description ?? job.summary}</p>
          </section>
          <section>
            <h2>Responsibilities</h2>
            <ul>
              {job.responsibilities.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
          <section>
            <h2>Qualifications</h2>
            <ul>
              {job.qualifications.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
          {job.applicationMethod || job.applicationUrl ? (
            <section>
              <h2>How to apply</h2>
              {job.applicationMethod ? <p>{job.applicationMethod}</p> : null}
              {job.applicationUrl ? (
                <p>
                  <a
                    className="button button-primary"
                    href={job.applicationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Apply on the employer&apos;s site<span aria-hidden="true"> ↗</span>
                  </a>
                </p>
              ) : null}
              <p className="text-muted">
                Applications are handled by the employer. NJEN does not receive or process applications.
              </p>
            </section>
          ) : null}
        </div>
      </section>
    </>
  );
}
