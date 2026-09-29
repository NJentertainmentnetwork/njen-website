import Link from "next/link";
import { JOB_FILTER_KEYS, type JobFilterOptions, type JobFilters as AppliedFilters } from "@/lib/jobs";

/**
 * Launch filters for the jobs index (30-Day Plan, Days 11-17).
 *
 * A plain GET form, rendered on the server. There is no client component and no
 * JavaScript behind it, which means:
 * - it works with JavaScript unavailable or still loading;
 * - each filtered view has its own shareable, bookmarkable URL;
 * - the filtering itself stays server-side (`lib/jobs.ts`), so a filter can only
 *   narrow what the publication gate already permitted.
 *
 * Only facets with more than one value are shown: a select offering a single
 * choice filters nothing and is noise. The whole bar is hidden when no facet is
 * worth showing, so an empty or one-job board does not display dead controls.
 */

const labels: Record<(typeof JOB_FILTER_KEYS)[number], string> = {
  category: "Category",
  location: "Location",
  type: "Employment type",
};

export function JobFilters({
  options,
  applied,
  isFiltered,
}: {
  options: JobFilterOptions;
  applied: AppliedFilters;
  isFiltered: boolean;
}) {
  const usable = JOB_FILTER_KEYS.filter((key) => options[key].length > 1);

  if (usable.length === 0) {
    return null;
  }

  return (
    <form className="filter-bar" method="get" action="/jobs" aria-labelledby="filter-heading">
      <h2 className="filter-heading" id="filter-heading">
        Filter listings
      </h2>
      <div className="filter-fields">
        {usable.map((key) => (
          <div className="form-field" key={key}>
            <label htmlFor={`filter-${key}`}>{labels[key]}</label>
            <select id={`filter-${key}`} name={key} defaultValue={applied[key] ?? ""}>
              <option value="">All</option>
              {options[key].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
      <div className="filter-actions">
        <button className="button button-primary" type="submit">
          Apply filters
        </button>
        {isFiltered ? (
          <Link className="button button-secondary" href="/jobs">
            Clear filters
          </Link>
        ) : null}
      </div>
    </form>
  );
}
