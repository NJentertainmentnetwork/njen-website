"use client";

import Link from "next/link";

/**
 * Error boundary for routes OUTSIDE the `(site)` group.
 *
 * Today that is exactly one route: `/early-access`. Error boundaries in the App
 * Router only cover their own segment and below, so `app/(site)/error.tsx`
 * protects the main site but stops at the group boundary. Until now an
 * unexpected render error on the Early Access page fell through to the Next.js
 * default screen - unstyled, unbranded, and reading "Application error: a
 * client-side exception has occurred".
 *
 * That page is the destination for paid and social traffic, so it is the single
 * worst place on the site to show that. This boundary catches it.
 *
 * Deliberately shows no error message, stack trace or digest to visitors.
 * Production error reporting is added with the approved monitoring provider
 * (Sentry, Days 18-23), not here.
 *
 * It renders no header or footer on purpose: the pages it covers have none, and
 * an error is not a reason to introduce navigation the visitor did not have a
 * moment earlier. `reset()` re-renders the route, which is what a visitor who
 * was halfway through signing up actually wants - it is listed first for that
 * reason. Styling reuses existing classes from globals.css, so no new CSS and
 * no design change.
 */
export default function RootError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main">
      <section className="page-hero">
        <div className="container">
          <h1 className="page-title">Something went wrong</h1>
          <p className="page-intro">This page could not be loaded. Please try again.</p>
        </div>
      </section>
      <section className="section">
        <div className="container detail">
          <div className="prep-links">
            <button type="button" className="button button-primary" onClick={() => reset()}>
              Try again
            </button>
            <Link className="button button-secondary" href="/">
              Home
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
