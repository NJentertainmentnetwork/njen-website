import type { Metadata } from "next";
import { ContentRequired } from "@/components/ContentRequired";
import { PageHero } from "@/components/PageHero";
import { requireSection, sectionRobots } from "@/lib/sections";

// This area collects no data. Business Rules section 10: do not collect
// unnecessary data from minors during the public launch.
export const metadata: Metadata = {
  title: "Children & Parents",
  description: "Information for young performers and their parents or guardians.",
  robots: sectionRobots("childrenParents"),
};

export default function ChildrenParents() {
  requireSection("childrenParents");

  return (
    <>
      <PageHero eyebrow="Children & Parents" title="Information for young performers and their families" />
      <ContentRequired
        section="childrenParents"
        outline={[
          "New Jersey child-performer rules",
          "Permits",
          "Practical guidance",
          "Representation resources",
          "Parent and grandparent education",
        ]}
        needed={["Approved content for each area above (register C6)"]}
      />
    </>
  );
}
