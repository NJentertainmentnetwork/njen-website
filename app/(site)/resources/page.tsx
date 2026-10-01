import type { Metadata } from "next";
import Link from "next/link";
import { ContentRequired } from "@/components/ContentRequired";
import { PageHero } from "@/components/PageHero";
import { isSectionVisible, requireSection, sectionRobots, sections, type SectionKey } from "@/lib/sections";

export const metadata: Metadata = {
  title: "Resources",
  description: "Education and practical resources for New Jersey's entertainment community.",
  robots: sectionRobots("resources"),
};

// Resource areas confirmed for the initial public launch. Descriptions follow
// the approved wording in the NJEN Developer Handoff Package, section 4.
const resourceAreas: { key: SectionKey; description: string }[] = [
  {
    key: "housing",
    description: "Housing and rental information, plus relevant public assistance and resource links for entertainment workers.",
  },
  {
    key: "mentalHealth",
    description: "Educational support information and external resources for artists.",
  },
];

export default function Resources() {
  requireSection("resources");
  const visibleAreas = resourceAreas.filter((area) => isSectionVisible(area.key));

  return (
    <>
      <PageHero eyebrow="Resources" title="Education and resources" />
      {visibleAreas.length > 0 ? (
        <section className="section">
          <div className="container">
            <h2 className="section-title">Resource areas</h2>
            <div className="grid grid-3">
              {visibleAreas.map((area) => (
                <article className="card" key={area.key}>
                  <h3>
                    <Link href={sections[area.key].href}>{sections[area.key].label}</Link>
                  </h3>
                  <p>{area.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}
      <ContentRequired
        section="resources"
        needed={[
          "Resource and education listings (register C5)",
          "Published content in at least one resource area before this hub goes live",
        ]}
      />
    </>
  );
}
