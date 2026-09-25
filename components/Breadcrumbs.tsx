import Link from "next/link";

export type Crumb = { href: string; label: string };

/**
 * Breadcrumb trail for nested pages. The current page is the last item and is
 * not a link. Only pass destinations that are published and reachable.
 */
export function Breadcrumbs({ trail, current }: { trail: Crumb[]; current: string }) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol>
        {trail.map((crumb) => (
          <li key={crumb.href}>
            <Link href={crumb.href}>{crumb.label}</Link>
          </li>
        ))}
        <li>
          <span aria-current="page">{current}</span>
        </li>
      </ol>
    </nav>
  );
}
