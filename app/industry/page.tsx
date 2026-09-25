import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { requireSection, sectionRobots } from "@/lib/sections";

/**
 * CLIENT-CONFIRMED: public, informational entry point for production companies,
 * studios, casting professionals and other legitimate industry stakeholders.
 *
 * SECURITY BOUNDARY: this page is static and informational only. It has no
 * forms, no data fetching, no client components and no links to protected
 * functionality. The Verified Industry/Production Portal is post-launch
 * (Business Rules, section 3) and must not be reachable from here.
 *
 * Every statement below restates an approved rule; sources are noted inline.
 * Public wording awaits NJEN approval (register B15).
 */
export const metadata: Metadata = {
  title: "Industry / Production",
  description:
    "Information for production companies, studios, streamers, producers, production managers and casting professionals.",
  robots: sectionRobots("industry"),
};

// Business Rules, section 8.
const audiences = [
  "Production companies",
  "Studios and streamers",
  "Producers and production managers",
  "Casting professionals",
  "Other legitimate industry stakeholders",
];

export default function Industry() {
  requireSection("industry");

  return (
    <>
      <PageHero
        eyebrow="Industry / Production"
        title="For production companies, studios and industry professionals"
        intro="Information for the production and industry community working with New Jersey's entertainment platform."
      />
      <section className="section">
        <div className="container detail">
          <section>
            <h2>Who this is for</h2>
            <ul>
              {audiences.map((audience) => (
                <li key={audience}>{audience}</li>
              ))}
            </ul>
          </section>

          {/* Business Rules, section 1: positioning, not a talent agency, not a producer/promoter. */}
          <section>
            <h2>What NJEN is</h2>
            <p>
              NJEN is New Jersey&apos;s Entertainment Headquarters: a statewide entertainment infrastructure, resource and
              community platform.
            </p>
            <p>
              NJEN is not a talent agency. It does not represent actors or procure principal acting work, and it does not
              produce the films, television programs, theatrical productions or events it reports on.
            </p>
          </section>

          {/* Business Rules, section 1 (not a public people-search site) and section 8 (verified, role-based access). */}
          <section>
            <h2>Protected industry access</h2>
            <p>
              NJEN does not offer public access to performer or industry directories. Any protected industry tools are
              limited to verified, authorized users. Access is role-based and is not granted by creating an account.
            </p>
          </section>
        </div>
      </section>
    </>
  );
}
