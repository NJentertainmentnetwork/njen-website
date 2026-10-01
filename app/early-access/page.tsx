import type { Metadata } from "next";
import Image from "next/image";
import { EarlyAccessForm } from "@/components/EarlyAccessForm";

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
 * HERO ARTWORK SLOT - NOT FINAL.
 *
 * The client is supplying the finished hero artwork separately. Until then the
 * hero is typographic, which stands on its own and avoids shipping an invented
 * or stock image.
 *
 * To drop the artwork in: put the file in `public/`, set `heroArtwork` below,
 * and write real alt text. No other change is needed - the layout already
 * reserves and crops the space at every breakpoint.
 */
const heroArtwork: { src: string; alt: string; width: number; height: number } | null = null;

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
};

export default function EarlyAccess() {
  return (
    <main className="ea">
      <section className="ea-hero">
        <div className="ea-shell">
          <Image
            className="ea-logo"
            src="/njen-logo.png"
            alt="New Jersey Entertainment Network"
            width={128}
            height={130}
            priority
          />
          <p className="ea-eyebrow">New Jersey · Film · Television · Entertainment</p>
          <h1 className="ea-title">New Jersey&apos;s entertainment headquarters is coming</h1>
          <p className="ea-lede">
            Hollywood is all over New Jersey. Now there&apos;s one place to find your way into it.
          </p>
          <a className="ea-cta" href="#signup">
            Join the NJEN early access list - free
          </a>

          {heroArtwork ? (
            <div className="ea-artwork">
              <Image
                src={heroArtwork.src}
                alt={heroArtwork.alt}
                width={heroArtwork.width}
                height={heroArtwork.height}
                sizes="(max-width: 860px) 100vw, 860px"
                priority
              />
            </div>
          ) : null}
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
          <EarlyAccessForm />
        </div>
      </section>

      <p className="ea-signoff">New Jersey&apos;s Entertainment Headquarters.</p>
    </main>
  );
}
