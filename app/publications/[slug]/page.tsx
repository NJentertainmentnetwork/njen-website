import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/PageHero";
import { getPublicPublicationBySlug, getPublicPublicationSlugs } from "@/lib/publications";
import { requireSection, sectionRobots, sections } from "@/lib/sections";

// Only public issues are ever generated or served. The service filters by
// visibility; members-only issues are post-launch and require authentication
// plus server-side authorization that do not exist yet.
export async function generateStaticParams() {
  return (await getPublicPublicationSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const publication = await getPublicPublicationBySlug((await params).slug);

  return {
    title: publication?.title ?? "Publication not found",
    description: publication?.summary,
    robots: publication ? sectionRobots("publications") : { index: false, follow: false },
  };
}

export default async function PublicationDetail({ params }: { params: Promise<{ slug: string }> }) {
  requireSection("publications");
  const publication = await getPublicPublicationBySlug((await params).slug);

  if (!publication) {
    notFound();
  }

  return (
    <>
      <PageHero
        eyebrow="NJEN Publication"
        title={publication.title}
        breadcrumbs={[
          { href: "/", label: "Home" },
          { href: sections.publications.href, label: sections.publications.label },
        ]}
      />
      <article className="section">
        <div className="container detail">
          {publication.published ? <p className="text-muted">Published {publication.published}</p> : null}
          {publication.summary ? <p className="page-intro">{publication.summary}</p> : null}
          {publication.content ? <p>{publication.content}</p> : null}
        </div>
      </article>
    </>
  );
}
