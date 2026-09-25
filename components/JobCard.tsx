import Link from "next/link";
import type { PublicJob } from "@/lib/jobs";
import { SampleBadge } from "@/components/SampleContentNotice";

/**
 * Job summary in the two layouts the site uses: the homepage grid and the
 * jobs index list. `sample` labels example data so it is never mistaken for a
 * live opportunity.
 */
export function JobCard({
  job,
  variant,
  index,
  sample,
}: {
  job: PublicJob;
  variant: "grid" | "row";
  index?: number;
  sample: boolean;
}) {
  if (variant === "grid") {
    return (
      <article className="job-card">
        <div className="job-card-top">
          {typeof index === "number" ? <span className="job-index">{String(index + 1).padStart(2, "0")}</span> : null}
          <span className="badge">{job.category}</span>
        </div>
        <h3>
          <Link href={`/jobs/${job.slug}`}>{job.title}</Link>
        </h3>
        <p className="company">{job.organization}</p>
        <div className="meta">
          <span>{job.location}</span>
          <span>{job.type}</span>
        </div>
        <p>{job.summary}</p>
        {sample ? <SampleBadge /> : null}
        <Link className="card-link" href={`/jobs/${job.slug}`}>
          View details <span aria-hidden="true">↗</span>
        </Link>
      </article>
    );
  }

  return (
    <article className="card job-row">
      <div>
        <div className="meta">
          <span className="badge">{job.category}</span>
          {sample ? <SampleBadge /> : null}
        </div>
        <h3>
          <Link href={`/jobs/${job.slug}`}>{job.title}</Link>
        </h3>
        <p>
          <strong>{job.organization}</strong> · {job.location}
        </p>
        <p>{job.summary}</p>
        <div className="meta">
          <span>{job.type}</span>
          <span>{job.pay}</span>
        </div>
      </div>
      <div>
        <Link className="button button-secondary" href={`/jobs/${job.slug}`}>
          View details
        </Link>
      </div>
    </article>
  );
}
