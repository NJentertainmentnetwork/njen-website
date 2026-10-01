import type { Metadata } from "next";
import { ContentRequired } from "@/components/ContentRequired";
import { PageHero } from "@/components/PageHero";
import { requireSection, sectionCanonical, sectionRobots } from "@/lib/sections";

// Week 1 requirement: "Build/refine Homepage, About and main navigation"
// (Development Approach & Implementation Plan, section 3).
export const metadata: Metadata = {
  title: "About",
  description: "About the New Jersey Entertainment Network.",
  robots: sectionRobots("about"),
  alternates: sectionCanonical("about"),
};

export default function About() {
  requireSection("about");

  return (
    <>
      <PageHero eyebrow="About" title="About NJEN" />
      <ContentRequired section="about" needed={["About copy — part of NJEN's first content batch (register C1)"]} />
    </>
  );
}
