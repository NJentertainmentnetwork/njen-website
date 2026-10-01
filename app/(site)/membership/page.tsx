import type { Metadata } from "next";
import { ContentRequired } from "@/components/ContentRequired";
import { PageHero } from "@/components/PageHero";
import { requireSection, sectionCanonical, sectionRobots } from "@/lib/sections";

// NOT IMPLEMENTED: accounts, sign-in, paid membership and checkout. Tier names,
// pricing, billing and refund rules are owner decisions (Business Rules 6, 19).
export const metadata: Metadata = {
  title: "Membership",
  description: "NJEN membership information.",
  robots: sectionRobots("membership"),
  alternates: sectionCanonical("membership"),
};

export default function Membership() {
  requireSection("membership");

  return (
    <>
      <PageHero
        eyebrow="Membership"
        title="Build your NJEN profile and stay connected"
        intro="Save opportunities, manage alerts, access benefits, and prepare for future personalized career tools."
      />
      <ContentRequired
        section="membership"
        outline={[
          "Explanation of NJEN membership (Business Rules, section 6)",
          "Shortcuts to Hollywood as a membership benefit (client-confirmed)",
          "Waitlist/newsletter sign-up once the approved form ships (Week 3)",
        ]}
        needed={[
          "Membership explanation copy (register C9)",
          "Tier names, pricing, billing and refund rules (register B2)",
          "Revised hero wording: it mentions saving opportunities and alerts, which are post-launch (register B14)",
        ]}
      />
    </>
  );
}
