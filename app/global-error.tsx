"use client";

/**
 * Last-resort boundary: an error thrown by the ROOT LAYOUT itself.
 *
 * This is the only error Next.js cannot route to a normal `error.tsx`, because
 * at that point the layout that would wrap one has already failed. It replaces
 * the whole document, so it must supply its own `<html>` and `<body>`.
 *
 * Every style here is inline, and that is not a style choice. `globals.css` is
 * imported by the root layout, which is precisely what has failed, so no class
 * from it is guaranteed to be available. Inline styles are the only ones that
 * cannot fail with it. For the same reason this file imports nothing - not
 * `next/link`, not a component - so the fallback has no dependency that could
 * be part of the failure it is reporting.
 *
 * Colours are the NJEN navy and orange from the design tokens, written as
 * literals for the reason above. No message, stack trace or digest is shown to
 * visitors; reporting is Sentry's job (Days 18-23).
 *
 * In practice this should never render. It exists so that if it ever does, a
 * visitor sees NJEN rather than a browser error page.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeContent: "center",
          gap: "20px",
          padding: "32px 16px",
          textAlign: "center",
          background: "#061727",
          color: "#fff",
          fontFamily: "Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          lineHeight: 1.5,
        }}
      >
        <h1 style={{ margin: 0, fontSize: "clamp(1.6rem, 6vw, 2.4rem)", letterSpacing: "-.02em" }}>
          Something went wrong
        </h1>
        <p style={{ margin: 0, color: "#d8e5f0", maxWidth: "46ch" }}>
          NJEN could not load this page. Please try again in a moment.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            justifySelf: "center",
            // 56px keeps the one control on this page above the 44px minimum
            // touch target, which is the whole interface at this point.
            minHeight: "56px",
            padding: "14px 32px",
            border: 0,
            borderRadius: "999px",
            background: "#c9460b",
            color: "#fff",
            font: "inherit",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
