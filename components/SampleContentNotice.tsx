/**
 * Shown wherever sample job data is displayed.
 *
 * Release 1.3 ships sample listings only. The launch plan requires that demo
 * content is never presented as live production content, so every surface that
 * renders `data/jobs.ts` must label it.
 */
export function SampleContentNotice() {
  return (
    <p className="notice notice-sample" role="note">
      <strong>Example listings.</strong> These entries show how job listings are displayed. They are not live
      opportunities and cannot be applied to.
    </p>
  );
}

/** Compact inline version for individual cards and listings. */
export function SampleBadge() {
  return <span className="badge badge-sample">Example listing</span>;
}
