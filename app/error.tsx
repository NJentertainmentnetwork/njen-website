"use client";

import Link from "next/link";

/**
 * Fallback for unexpected errors while rendering a page. Deliberately shows no
 * error message, stack trace or digest to visitors. Production error reporting
 * is added with the approved monitoring provider (Sentry), not here.
 */
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <>
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
    </>
  );
}
