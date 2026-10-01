import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

/**
 * Main site chrome. Everything under this group gets the header, the mobile
 * navigation bar and the footer. Standalone pages outside the group (the Early
 * Access campaign page) deliberately render without them.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
    </>
  );
}
