import { sections, type SectionKey } from "@/lib/sections";

/**
 * Staging-only marker describing what an unpublished section still needs.
 *
 * Unpublished sections return 404 publicly (see lib/sections.ts), so this block
 * is only ever seen with NJEN_PREVIEW_UNPUBLISHED=true. It also renders nothing
 * once a section is published, so it cannot leak onto a live page.
 */
export function ContentRequired({
  section,
  outline,
  needed,
}: {
  section: SectionKey;
  /** Approved content structure for the section, from the client documents. */
  outline?: string[];
  /** What NJEN must supply or decide, with register references. */
  needed: string[];
}) {
  if (sections[section].published) {
    return null;
  }

  return (
    <section className="section">
      <div className="container detail">
        <div className="content-required" role="note">
          <p className="content-required-label">Unpublished section — staging preview only</p>
          {outline && outline.length > 0 ? (
            <>
              <h2>Approved content structure</h2>
              <ul>
                {outline.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </>
          ) : null}
          <h2>Required before publishing</h2>
          <ul>
            {needed.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
