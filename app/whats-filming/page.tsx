import type { Metadata } from "next";
import { ContentRequired } from "@/components/ContentRequired";
import { PageHero } from "@/components/PageHero";
import { requireSection, sectionRobots } from "@/lib/sections";

export const metadata: Metadata = {
  title: "What's Filming",
  description: "Production activity across New Jersey.",
  robots: sectionRobots("whatsFilming"),
};

export default function WhatsFilming() {
  requireSection("whatsFilming");

  return (
    <>
      <PageHero
        eyebrow="What's filming in New Jersey"
        title="Production activity across the state"
        intro="Where the industry is growing, what kinds of workers are needed, and how New Jersey residents can participate responsibly."
      />
      <ContentRequired
        section="whatsFilming"
        outline={[
          "Each entry: title, type, location/region, status, source, source date, last-reviewed date, public notes (Business Rules, section 5)",
          "No sensitive production information, private addresses, call-sheet details or unverified rumors (section 5)",
          "Must not imply NJEN represents, produces, finances or is affiliated with a project it reports on (section 5)",
        ]}
        needed={[
          "Approved What's Filming entries (register C3)",
          "Approved source list, publication rights and sensitivity rules, and the NJEN update owner (register B5)",
        ]}
      />
    </>
  );
}
