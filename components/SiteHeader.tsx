import Image from "next/image";
import Link from "next/link";
import { NavLink } from "@/components/NavLink";
import { getMobileNav, getPrimaryNav } from "@/lib/sections";

export function SiteHeader() {
  const primaryNav = getPrimaryNav();
  const mobileNav = getMobileNav();

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <div className="container header-inner">
          <Link className="brand" href="/" aria-label="NJEN home">
            <Image src="/njen-logo.png" alt="" width={54} height={54} priority />
            <span className="brand-copy">
              <strong>NJEN</strong>
              <small>New Jersey Entertainment Network</small>
            </span>
          </Link>
          <nav className="desktop-nav" aria-label="Primary">
            {primaryNav.map((item) => (
              <NavLink key={item.href} href={item.href}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <nav
        className="mobile-nav"
        aria-label="Sections"
        style={{ "--nav-count": mobileNav.length } as React.CSSProperties}
      >
        {mobileNav.map((item) => (
          <NavLink key={item.href} href={item.href}>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
