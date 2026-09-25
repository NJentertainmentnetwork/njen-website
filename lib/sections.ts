import { notFound } from "next/navigation";

/**
 * Registry of public NJEN sections. Controls both navigation and whether a
 * section's route is reachable.
 *
 * CLIENT RULE: unfinished sections must not be publicly linked or reachable,
 * and no empty "in preparation" pages may be published. A section is marked
 * `published: true` only once its approved content exists.
 *
 * Unpublished routes return 404 and are left out of every navigation surface.
 * Setting NJEN_PREVIEW_UNPUBLISHED=true (server-only, never NEXT_PUBLIC_) shows
 * them for private staging review. It must never be enabled in production.
 *
 * LABELS PENDING CLIENT CONFIRMATION: final section names (register item B1).
 */

export type SectionKey =
  | "jobs"
  | "careers"
  | "industry"
  | "whatsFilming"
  | "events"
  | "resources"
  | "housing"
  | "mentalHealth"
  | "childrenParents"
  | "socialMediaSafety"
  | "membership"
  | "about"
  | "contact"
  | "publications";

export type Section = {
  href: string;
  label: string;
  /** Shorter label for the mobile bottom bar. */
  shortLabel?: string;
  published: boolean;
};

export const sections: Record<SectionKey, Section> = {
  jobs: { href: "/jobs", label: "Jobs", published: true },
  careers: { href: "/careers", label: "Career Center", shortLabel: "Careers", published: true },
  industry: { href: "/industry", label: "Industry / Production", shortLabel: "Industry", published: true },
  whatsFilming: { href: "/whats-filming", label: "What's Filming", shortLabel: "Filming", published: false },
  events: { href: "/events", label: "Events", published: false },
  resources: { href: "/resources", label: "Resources", published: false },
  housing: { href: "/resources/housing", label: "Housing & Practical Resources", published: false },
  mentalHealth: { href: "/resources/mental-health", label: "Mental Health for Artists", published: false },
  childrenParents: { href: "/children-parents", label: "Children & Parents", published: false },
  socialMediaSafety: { href: "/social-media-safety", label: "Social Media Safety", published: false },
  membership: { href: "/membership", label: "Membership", published: false },
  about: { href: "/about", label: "About", published: false },
  contact: { href: "/contact", label: "Contact", published: false },
  publications: { href: "/publications", label: "Publications", published: true },
};

const previewUnpublished = process.env.NJEN_PREVIEW_UNPUBLISHED === "true";

/** True when a section may be shown: published, or previewing on staging. */
export function isSectionVisible(key: SectionKey): boolean {
  return sections[key].published || previewUnpublished;
}

/**
 * Robots metadata for a section page: unpublished sections are never indexed,
 * even when shown through the staging preview.
 */
export function sectionRobots(key: SectionKey): { index: boolean; follow: boolean } | undefined {
  return sections[key].published ? undefined : { index: false, follow: false };
}

/** Call at the top of a section page. Returns 404 for unpublished sections. */
export function requireSection(key: SectionKey): void {
  if (!isSectionVisible(key)) {
    notFound();
  }
}

export type NavItem = { href: string; label: string };
export type NavGroup = { title: string; items: NavItem[] };

function toNavItems(keys: SectionKey[], useShortLabel = false): NavItem[] {
  return keys
    .filter(isSectionVisible)
    .map((key) => ({
      href: sections[key].href,
      label: (useShortLabel && sections[key].shortLabel) || sections[key].label,
    }));
}

/** Desktop header navigation. */
export function getPrimaryNav(): NavItem[] {
  return toNavItems(["jobs", "whatsFilming", "careers", "resources", "publications", "events", "industry", "membership"]);
}

/** Mobile bottom bar: Home plus up to four visible sections, kept tappable. */
export function getMobileNav(): NavItem[] {
  const items = toNavItems(["jobs", "whatsFilming", "careers", "publications", "events", "industry"], true).slice(0, 4);
  return [{ href: "/", label: "Home" }, ...items];
}

/** Footer navigation. Empty groups are dropped. */
export function getFooterGroups(): NavGroup[] {
  const groups: { title: string; keys: SectionKey[] }[] = [
    { title: "Explore", keys: ["jobs", "whatsFilming", "events", "careers"] },
    { title: "Resources", keys: ["resources", "housing", "mentalHealth", "childrenParents", "socialMediaSafety"] },
    { title: "For Industry", keys: ["industry"] },
    { title: "NJEN", keys: ["about", "membership", "contact", "publications"] },
  ];

  return groups
    .map((group) => ({ title: group.title, items: toNavItems(group.keys) }))
    .filter((group) => group.items.length > 0);
}
