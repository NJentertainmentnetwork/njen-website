import Link from "next/link";
import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
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
