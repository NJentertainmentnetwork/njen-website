import Link from "next/link";
import { getFooterGroups } from "@/lib/sections";

export function SiteFooter() {
  const footerGroups = getFooterGroups();

  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <strong>NJEN</strong>
          <span>New Jersey&apos;s Entertainment Headquarters</span>
          <p>Jobs, productions, events, careers, education, and opportunities across the Garden State.</p>
        </div>
        {footerGroups.map((group) => (
          <nav key={group.title} aria-label={group.title}>
            <h2>{group.title}</h2>
            <ul>
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="container footer-legal">
        <p>© {new Date().getFullYear()} New Jersey Entertainment Network</p>
      </div>
    </footer>
  );
}
