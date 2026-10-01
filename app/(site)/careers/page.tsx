import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { requireSection, sectionRobots } from "@/lib/sections";

export const metadata: Metadata = {
  title: "Career Center",
  description: "Career pathways, internships, education, and guidance for entertainment work in New Jersey.",
  robots: sectionRobots("careers"),
};

// The three pathway cards describe areas named in the Release 1.3 documents.
// They are not links: the individual pathway guides are not supplied yet
// (register C10).
//
// Shortcuts to Hollywood: CLIENT-CONFIRMED as an NJEN membership benefit that
// will also be available for separate purchase. NOT IMPLEMENTED: pricing,
// checkout, payment, delivery/download or entitlement checks (register B4).
// Business Rules section 13: the digital book must never be at a public URL.
export default function Careers() {
  requireSection("careers");

  return (
    <>
      <PageHero
        eyebrow="NJEN Entertainment Career Center"
        title="Find your place in entertainment"
        intro="Explore career pathways, internships, education, and practical guidance from Shortcuts to Hollywood."
      />
      <section className="section">
        <div className="container">
          <h2 className="section-title">Career pathways</h2>
          <div className="grid grid-3">
            <article className="card">
              <h3>Set Designer</h3>
              <p>
                Learn the roles, departments, training, portfolio needs, and first steps toward a career in production
                design.
              </p>
            </article>
            <article className="card">
              <h3>Production Office</h3>
              <p>Understand coordinators, assistants, paperwork, scheduling, and the path into studio operations.</p>
            </article>
            <article className="card">
              <h3>Post-Production</h3>
              <p>Discover editing, sound, color, VFX, delivery, and entry-level opportunities.</p>
            </article>
          </div>
        </div>
      </section>
      <section className="section section-muted">
        <div className="container card">
          <div className="eyebrow">Shortcuts to Hollywood</div>
          <h2>Practical entertainment career guidance</h2>
          <p>
            Shortcuts to Hollywood is part of the NJEN Career Center. It will be an NJEN membership benefit, and will also
            be available for separate purchase.
          </p>
        </div>
      </section>
    </>
  );
}
