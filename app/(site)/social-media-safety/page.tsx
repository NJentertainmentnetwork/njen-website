import type { Metadata } from "next";
import { ContentRequired } from "@/components/ContentRequired";
import { PageHero } from "@/components/PageHero";
import { requireSection, sectionCanonical, sectionRobots } from "@/lib/sections";

// Business Rules section 11: a permanent, public, safety-first center. The
// emphasis is safety, not monetization or influencer income.
export const metadata: Metadata = {
  title: "Social Media Safety",
  description: "Social media safety information for children, teens, parents and grandparents.",
  robots: sectionRobots("socialMediaSafety"),
  alternates: sectionCanonical("socialMediaSafety"),
};

export default function SocialMediaSafety() {
  requireSection("socialMediaSafety");

  return (
    <>
      <PageHero eyebrow="Social Media Safety" title="Staying safe on social platforms" />
      <ContentRequired
        section="socialMediaSafety"
        outline={[
          "Privacy and account settings",
          "Location and geotagging",
          "DMs and stranger contact",
          "Grooming and predatory behavior awareness",
          "Scams and fake casting or brand opportunities",
          "Impersonation",
          "Inappropriate requests and content",
          "Reporting and blocking",
          "Parental controls",
        ]}
        needed={["Approved safety guidance for each topic above (register C7)"]}
      />
    </>
  );
}
