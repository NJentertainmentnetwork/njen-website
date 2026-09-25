import { Breadcrumbs, type Crumb } from "@/components/Breadcrumbs";

/**
 * Standard hero block for public pages. Replaces the per-page inline
 * font-size overrides that were repeated across the Release 1.3 pages.
 * Nested pages pass `breadcrumbs` (the trail above the current page).
 */
export function PageHero({
  eyebrow,
  title,
  intro,
  breadcrumbs,
  children,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  breadcrumbs?: Crumb[];
  children?: React.ReactNode;
}) {
  return (
    <section className="page-hero">
      <div className="container">
        {breadcrumbs && breadcrumbs.length > 0 ? <Breadcrumbs trail={breadcrumbs} current={title} /> : null}
        {eyebrow ? <div className="eyebrow">{eyebrow}</div> : null}
        <h1 className="page-title">{title}</h1>
        {intro ? <p className="page-intro">{intro}</p> : null}
        {children}
      </div>
    </section>
  );
}
