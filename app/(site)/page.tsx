import Image from "next/image";
import Link from "next/link";
import { JobCard } from "@/components/JobCard";
import { SampleContentNotice } from "@/components/SampleContentNotice";
import { JOBS_ARE_SAMPLE_DATA, getPublishedJobs } from "@/lib/jobs";
import { isSectionVisible, sections, type SectionKey } from "@/lib/sections";

const regions = ["North Jersey", "Central Jersey", "South Jersey", "The Shore"];

// The homepage only promotes published sections, so unpublished areas never
// leave dead links here. Copy below is the Release 1.3 client copy.
const quickLinks: { key: SectionKey; title: string; text: string }[] = [
  { key: "jobs", title: "Find entertainment work", text: "Studio, streamer, crew, theater and support jobs" },
  { key: "careers", title: "Build a career", text: "Clear pathways into every side of entertainment" },
  { key: "events", title: "Discover New Jersey", text: "Events, productions and local entertainment" },
];

const pathCards: { key: SectionKey; tone?: string; eyebrow: string; title: string; text: string; cta: string }[] = [
  {
    key: "careers",
    tone: "path-card-dark",
    eyebrow: "Career Center",
    title: "Learn how the business really works.",
    text: "Career profiles, internships, education partners, and practical guidance from Shortcuts to Hollywood.",
    cta: "Explore careers →",
  },
  {
    key: "events",
    eyebrow: "Events",
    title: "Find the people and places worth knowing.",
    text: "Festivals, theater, music, film, food, and local businesses from every corner of New Jersey.",
    cta: "See what’s happening →",
  },
  {
    key: "industry",
    eyebrow: "Industry / Production",
    title: "For production companies, studios and casting professionals.",
    text: "How NJEN works with the production and industry community.",
    cta: "Industry information →",
  },
  {
    key: "membership",
    tone: "path-card-accent",
    eyebrow: "Membership",
    title: "Turn information into momentum.",
    text: "Save jobs, receive alerts, build your profile, and get organized around your next career move.",
    cta: "About membership →",
  },
];

export default async function Home() {
  const featuredJobs = await getPublishedJobs(3);
  const visibleQuickLinks = quickLinks.filter((link) => isSectionVisible(link.key));
  const visiblePathCards = pathCards.filter((card) => isSectionVisible(card.key)).slice(0, 3);

  return (
    <>
      <section className="hero">
        <div className="hero-glow" />
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="eyebrow eyebrow-light">New Jersey Entertainment Network</div>
            <h1>
              Hollywood is <em>in</em> New Jersey.
            </h1>
            <p className="hero-intro">
              The statewide home for entertainment jobs, productions, events, career guidance, and the people building
              New Jersey’s creative economy.
            </p>
            <div className="actions">
              <Link className="button button-orange" href={sections.jobs.href}>
                Explore jobs
              </Link>
              {isSectionVisible("events") ? (
                <Link className="button button-ghost" href={sections.events.href}>
                  See what’s happening
                </Link>
              ) : null}
            </div>
            <div className="hero-proof" aria-label="NJEN platform highlights">
              <span>
                <b>Statewide</b> opportunities
              </span>
              <span>
                <b>Industry-focused</b> job board
              </span>
              <span>
                <b>Mobile-first</b> member tools
              </span>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-image-shell">
              <Image
                src="/whats-filming.jpg"
                alt="What's filming in New Jersey campaign artwork"
                width={1198}
                height={1182}
                sizes="(max-width: 760px) 100vw, (max-width: 1000px) 720px, 560px"
                priority
              />
            </div>
            <div className="floating-card">
              <span className="signal-dot" />
              <div>
                <small>Now building</small>
                <strong>New Jersey’s entertainment headquarters</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="quick-find" aria-label="Quick links">
        <div className={`container quick-find-grid quick-find-grid-${visibleQuickLinks.length}`}>
          <div>
            <span className="eyebrow">Start here</span>
            <h2>What brings you to NJEN?</h2>
          </div>
          {visibleQuickLinks.map((link, index) => (
            <Link className="quick-link" href={sections[link.key].href} key={link.key}>
              <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <strong>{link.title}</strong>
              <small>{link.text}</small>
            </Link>
          ))}
        </div>
      </section>

      {featuredJobs.length > 0 ? (
        <section className="section jobs-section">
          <div className="container">
            <div className="section-head">
              <div>
                <div className="eyebrow">Entertainment job board</div>
                <h2>Fresh opportunities across the state</h2>
                <p>Legitimate jobs beyond traditional acting breakdowns.</p>
              </div>
              <Link className="link-arrow" href={sections.jobs.href}>
                Browse all jobs <span aria-hidden="true">→</span>
              </Link>
            </div>
            {JOBS_ARE_SAMPLE_DATA ? <SampleContentNotice /> : null}
            <div className="jobs-grid">
              {featuredJobs.map((job, index) => (
                <JobCard key={job.slug} job={job} variant="grid" index={index} sample={JOBS_ARE_SAMPLE_DATA} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {isSectionVisible("whatsFilming") ? (
        <section className="section editorial-section">
          <div className="container editorial-grid">
            <div className="editorial-image">
              <Image src="/whats-filming.jpg" alt="" fill sizes="(max-width: 900px) 100vw, 50vw" />
            </div>
            <div className="editorial-copy">
              <div className="eyebrow">What’s filming in New Jersey</div>
              <h2>Know what’s happening before everyone else does.</h2>
              <p>
                NJEN connects production activity to useful information: where the industry is growing, what kinds of
                workers are needed, and how New Jersey residents can participate responsibly.
              </p>
              <div className="region-row">
                {regions.map((region) => (
                  <span key={region}>{region}</span>
                ))}
              </div>
              <Link className="button button-dark" href={sections.whatsFilming.href}>
                See what’s filming
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {visiblePathCards.length > 0 ? (
        <section className="section path-section">
          <div className="container">
            <div className="section-head compact-head">
              <div>
                <div className="eyebrow">More than a job board</div>
                <h2>A complete entertainment ecosystem</h2>
              </div>
            </div>
            <div className={`path-grid path-grid-${visiblePathCards.length}`}>
              {visiblePathCards.map((card) => (
                <Link
                  href={sections[card.key].href}
                  className={card.tone ? `path-card ${card.tone}` : "path-card"}
                  key={card.key}
                >
                  <small>{card.eyebrow}</small>
                  <h3>{card.title}</h3>
                  <p>{card.text}</p>
                  <span aria-hidden="true">{card.cta}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {isSectionVisible("contact") ? (
        <section className="cta-section">
          <div className="container cta-inner">
            <div>
              <div className="eyebrow eyebrow-light">For employers, schools and partners</div>
              <h2>Help build New Jersey’s entertainment workforce.</h2>
            </div>
            <div className="actions">
              <Link className="button button-orange" href={sections.contact.href}>
                Get in touch
              </Link>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
