import type { Metadata } from "next";
import { NotFoundContent } from "@/components/NotFoundContent";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

/**
 * 404 for a URL that matches no route at all. It sits outside the `(site)`
 * group, so it renders the site chrome itself rather than inheriting it.
 */
export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <NotFoundContent />
      </main>
      <SiteFooter />
    </>
  );
}
