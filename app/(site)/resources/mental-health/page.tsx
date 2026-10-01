import type { Metadata } from "next";
import { ContentRequired } from "@/components/ContentRequired";
import { PageHero } from "@/components/PageHero";
import { isSectionVisible, requireSection, sectionCanonical, sectionRobots, sections } from "@/lib/sections";

// CLIENT-CONFIRMED: Mental Health for Artists is part of the initial public
// launch, within Resources. No medical claims, providers or emergency/crisis
// information are included until NJEN supplies and approves them.
export const metadata: Metadata = {
  title: "Mental Health for Artists",
  description: "Educational support information and external resources for artists.",
  robots: sectionRobots("mentalHealth"),
  alternates: sectionCanonical("mentalHealth"),
};

export default function MentalHealthForArtists() {
  requireSection("mentalHealth");

  return (
    <>
      <PageHero
        eyebrow="Resources"
        breadcrumbs={[
          { href: "/", label: "Home" },
          // Only link the hub when it is reachable, so the trail never points at a 404.
          ...(isSectionVisible("resources") ? [{ href: sections.resources.href, label: sections.resources.label }] : []),
        ]}
        title="Mental Health for Artists"
        intro="Educational support information and external resources for artists."
      />
      <ContentRequired
        section="mentalHealth"
        outline={["Educational support information", "External support resources"]}
        needed={[
          "Approved educational content and external resources (register C15)",
          "Approved wording stating the section is not a substitute for professional medical care (register B6)",
          "Decision on whether crisis or emergency support information appears, and its approved wording (register B13)",
        ]}
      />
    </>
  );
}
