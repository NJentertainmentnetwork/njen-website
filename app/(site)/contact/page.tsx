import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { ContentRequired } from "@/components/ContentRequired";
import { PageHero } from "@/components/PageHero";
import { requireSection, sectionCanonical, sectionRobots } from "@/lib/sections";

// This preview-only UI never sends or stores a submission. Delivery remains
// blocked on C8, B6, Resend access, server validation, and rate limiting.
export const metadata: Metadata = {
  title: "Contact",
  description: "How to contact NJEN.",
  robots: sectionRobots("contact"),
  alternates: sectionCanonical("contact"),
};

export default function Contact() {
  requireSection("contact");

  return (
    <>
      <PageHero eyebrow="Contact" title="Contact NJEN" />
      <section className="section">
        <div className="container detail">
          <ContactForm />
        </div>
      </section>
      <ContentRequired
        section="contact"
        needed={[
          "Official contact address(es) to publish, and who receives employer, partner and industry enquiries (register C8)",
          "Approved consent/legal wording (register B6), recipient routing (C8), and server-side delivery/rate limiting before contact can be enabled",
        ]}
      />
    </>
  );
}
