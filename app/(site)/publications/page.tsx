import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { getPublicPublications } from "@/lib/publications";
import { requireSection, sectionCanonical, sectionRobots } from "@/lib/sections";

// Public archive of NJEN-published issues. Members-only issues are post-launch
// and are never queried or rendered here (see lib/publications.ts).
export const metadata: Metadata = {
  title: "Publications",
  description: "NJEN public publications and updates.",
  robots: sectionRobots("publications"),
  alternates: sectionCanonical("publications"),
};

export default async function PublicationsPage() {
  requireSection("publications");
  const publications = await getPublicPublications();

  return (
    <>
      <PageHero
        eyebrow="NJEN Publications"
        title="Publications"
        intro="Public NJEN updates and editorial publications."
      />
      <section className="section">
        <div className="container detail">
          {publications.length === 0 ? (
            <div className="empty-state">
              <h2 className="section-title">No publications yet</h2>
              <p>Published NJEN issues will appear here.</p>
            </div>
          ) : (
            <div className="list">
              {publications.map((publication) => (
                <article className="card" key={publication.slug}>
                  <h2 className="section-title">
                    <Link href={`/publications/${publication.slug}`}>{publication.title}</Link>
                  </h2>
                  {publication.summary ? <p>{publication.summary}</p> : null}
                  {publication.published ? <p className="text-muted">Published {publication.published}</p> : null}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
