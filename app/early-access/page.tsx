import type { Metadata } from "next";
import { EarlyAccessForm } from "@/components/EarlyAccessForm";
import { isSignupStorageConfigured } from "@/lib/early-access-store";
import { canonicalFor } from "@/lib/sections";

/**
 * NJEN Early Access landing page.
 *
 * A single-purpose campaign page for inbound social traffic: one headline, one
 * reason to act, one form. It deliberately sits outside the `(site)` route
 * group, so it carries no site navigation, no mobile bar and no footer links -
 * every exit route is a lost signup.
 *
 * Nothing on this page claims a feature already exists. The benefits are what
 * early access unlocks as NJEN launches, which is how the client framed them.
 */

/**
 * APPROVED HERO ARTWORK (supplied by NJEN, Day 15).
 *
 * Two separately composed posters, not one image at two sizes: the mobile
 * version re-flows the studio logos and the cast into a tall portrait frame.
 * They are therefore served with `<picture>` and a `media` query rather than
 * `next/image`, which has no art-direction support and would also download
 * both files if they were toggled with CSS.
 *
 * The artwork is used exactly as delivered - not recropped, retouched or
 * overlaid. `object-fit` is never applied, so nothing in the composition can be
 * cut off at any viewport; the poster simply scales.
 */
const artwork = {
  mobile: { src: "/images/early-access/NJEN_Early_Access_Mobile_Hero.png", width: 404, height: 1024 },
  desktop: { src: "/images/early-access/NJEN_Early_Access_Desktop_Hero.png", width: 1118, height: 1024 },
  /** Viewport at which the desktop/tablet composition takes over. */
  desktopFrom: "(min-width: 700px)",
};

/**
 * Next.js image optimizer URL for a static asset.
 *
 * The approved PNGs are 0.8 MB and 2.2 MB. Routing them through the optimizer
 * serves AVIF/WebP at the requested width instead, which matters a great deal
 * on the mobile Facebook traffic this page is built for. `w` must be one of the
 * configured device sizes, and the optimizer never upscales past the source.
 */
function optimized(src: string, width: number): string {
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=72`;
}

/** The four strongest hooks, in the client's own words. */
const featured = [
  { label: "Free", title: "NY/NJ Casting Director Directory" },
  { label: "Free", title: "NY/NJ Talent Agency Directory" },
  { label: "Free", title: "Acting School & Training Directory" },
  { label: "Members", title: "NJEN Special Offers & Discounts" },
];

/** Everything else early access covers, unchanged from the client's list. */
const benefits = [
  "NJEN Singles Mixers & Social Events - advance notice and invitations",
  "Jobs & entertainment opportunities",
  "Background performer opportunities",
  "Internships & career opportunities",
  "What's filming and happening around New Jersey",
  "Resources for parents & child performers",
  "Education and industry resources",
  "Production, crew and industry resources",
  "NJEN Insider - opportunities, production news, resources, events and useful NJ entertainment updates",
];

export const metadata: Metadata = {
  title: "Early Access",
  description:
    "New Jersey's Entertainment Headquarters is coming. Join the NJEN early access list - free.",
  alternates: canonicalFor("/early-access"),
};

export default function EarlyAccess() {
  // Resolved on the server. The form must never guess whether a signup can be
  // kept; see lib/early-access.ts.
  const storageEnabled = isSignupStorageConfigured();

  return (
    <main className="ea">
      <section className="ea-hero">
        {/*
          The page's one H1. The approved artwork carries this wording as pixels,
          so it is repeated here as real text for screen readers, search engines
          and anyone browsing with images off. The artwork is marked decorative
          (alt="") precisely because this heading is its text equivalent -
          giving both would make a screen reader read the same sentence twice.
        */}
        <h1 className="ea-sr-only">
          Hollywood is all over New Jersey. NJEN - New Jersey&apos;s Entertainment Headquarters.
        </h1>

        <div className="ea-art">
          <picture>
            <source
              media={artwork.desktopFrom}
              srcSet={`${optimized(artwork.desktop.src, 1080)} 1080w, ${optimized(artwork.desktop.src, 1200)} 1200w`}
              // The poster is full-bleed from 700px up, so the slot is always
              // the whole viewport.
              sizes="100vw"
              width={artwork.desktop.width}
              height={artwork.desktop.height}
            />
            <img
              className="ea-art-img"
              src={optimized(artwork.mobile.src, 640)}
              alt=""
              width={artwork.mobile.width}
              height={artwork.mobile.height}
              // Above the fold on every viewport: fetch it first, never lazily.
              fetchPriority="high"
              decoding="async"
            />
          </picture>
        </div>

        <div className="ea-shell">
          <a className="ea-cta" href="#signup">
            Join the NJEN early access list - free
          </a>
        </div>
      </section>

      <section className="ea-value" aria-labelledby="value-heading">
        <div className="ea-shell">
          <h2 className="ea-heading" id="value-heading">
            What early access unlocks
          </h2>
          <p className="ea-sub">Early access members get these first, as NJEN launches them.</p>

          <ul className="ea-featured">
            {featured.map((item) => (
              <li key={item.title}>
                <span className="ea-tag">{item.label}</span>
                <strong>{item.title}</strong>
              </li>
            ))}
          </ul>

          <ul className="ea-list">
            {benefits.map((benefit) => (
              <li key={benefit}>{benefit}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="ea-signup" id="signup" aria-labelledby="signup-heading">
        <div className="ea-shell ea-shell-narrow">
          <h2 className="ea-heading" id="signup-heading">
            Join the NJEN early access list - free
          </h2>
          <EarlyAccessForm storageEnabled={storageEnabled} />
        </div>
      </section>

      <p className="ea-signoff">New Jersey&apos;s Entertainment Headquarters.</p>
    </main>
  );
}
