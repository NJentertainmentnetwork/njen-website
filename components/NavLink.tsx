"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Navigation link that marks the current page for assistive technology
 * and for the active-state styling in globals.css.
 */
export function NavLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link href={href} className={className} aria-current={isActive ? "page" : undefined}>
      {children}
    </Link>
  );
}
