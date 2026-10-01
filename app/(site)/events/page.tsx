import type { Metadata } from "next";
import { ContentRequired } from "@/components/ContentRequired";
import { PageHero } from "@/components/PageHero";
import { requireSection, sectionRobots } from "@/lib/sections";

export const metadata: Metadata = {
  title: "Events",
  description: "Entertainment events across New Jersey.",
  robots: sectionRobots("events"),
};

export default function Events() {
  requireSection("events");

  return (
    <>
      <PageHero
        eyebrow="This Week in New Jersey"
        title="Entertainment and events across the state"
        intro="Festivals, theater, comedy, music, film, networking, education, and family entertainment."
      />
      <ContentRequired
        section="events"
        outline={[
          "Each event: title, category, date/time, location/region, description, link/registration information (Business Rules, section 12)",
        ]}
        needed={["Approved event listings and their source/moderation route (register C4)"]}
      />
    </>
  );
}
