import Link from "next/link";
import { PageHero } from "@/components/PageHero";

/**
 * The body of the 404 page.
 *
 * Shared by two entry points so they cannot drift apart:
 * `app/(site)/not-found.tsx` (reached by `notFound()` inside a site page, which
 * already has the site chrome from its layout) and `app/not-found.tsx` (reached
 * by a URL that matches no route at all, which has to supply its own chrome).
 */
export function NotFoundContent() {
  return (
    <>
      <PageHero title="Page not found" intro="The page you asked for does not exist or has moved." />
      <section className="section">
        <div className="container detail">
          <nav className="prep-links" aria-label="Suggested pages">
            <Link className="button button-primary" href="/">
              Home
            </Link>
            <Link className="button button-secondary" href="/jobs">
              Jobs
            </Link>
            <Link className="button button-secondary" href="/careers">
              Career Center
            </Link>
          </nav>
        </div>
      </section>
    </>
  );
}
