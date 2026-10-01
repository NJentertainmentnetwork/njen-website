import type { Metadata } from "next";
import { ContentRequired } from "@/components/ContentRequired";
import { PageHero } from "@/components/PageHero";
import { isSectionVisible, requireSection, sectionCanonical, sectionRobots, sections } from "@/lib/sections";

// CLIENT-CONFIRMED: Housing / Practical Resources is part of the initial public
// launch. No providers, listings or claims are included until NJEN supplies them.
export const metadata: Metadata = {
  title: "Housing & Practical Resources",
  description: "Housing, rental and practical resource information for entertainment workers in New Jersey.",
  robots: sectionRobots("housing"),
  alternates: sectionCanonical("housing"),
};

export default function HousingResources() {
  requireSection("housing");

  return (
    <>
      <PageHero
        eyebrow="Resources"
        breadcrumbs={[
          { href: "/", label: "Home" },
          // Only link the hub when it is reachable, so the trail never points at a 404.
          ...(isSectionVisible("resources") ? [{ href: sections.resources.href, label: sections.resources.label }] : []),
        ]}
        title="Housing & Practical Resources"
        intro="Housing and rental information, plus relevant public assistance and resource links for entertainment workers."
      />
      <ContentRequired
        section="housing"
        outline={[
          "Housing and rental information",
          "Public assistance and practical resource links",
          "Curated information only — not an unmoderated housing marketplace (Handoff Package, section 4)",
        ]}
        needed={[
          "Curated housing and practical resource entries, each with its source (register C14)",
          "Criteria for which housing and assistance resources are included (register B12)",
        ]}
      />
    </>
  );
}
