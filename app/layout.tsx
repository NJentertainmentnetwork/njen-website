import type { Metadata } from "next";
import "./globals.css";

/**
 * Root layout: the document shell only.
 *
 * Site chrome (header, mobile bar, footer) lives in the `(site)` route group
 * layout, so standalone pages such as the Early Access campaign page can render
 * without the main navigation. Route groups do not affect URLs: every existing
 * path is unchanged.
 */

// metadataBase makes canonical and social URLs absolute. It stays unset until
// NJEN confirms the production domain (register C13); no domain is assumed.
const siteUrl = process.env.NJEN_SITE_URL?.replace(/\/+$/, "");

export const metadata: Metadata = {
  ...(siteUrl ? { metadataBase: new URL(siteUrl), alternates: { canonical: "/" } } : {}),
  title: {
    default: "NJEN | New Jersey's Entertainment Headquarters",
    template: "%s | NJEN",
  },
  description: "Entertainment jobs, events, careers, productions, and opportunities across New Jersey.",
  // Basic social/sharing metadata. No image is set: a share image needs the
  // production domain and an approved 1200x630 asset (register C12, C13).
  openGraph: {
    type: "website",
    siteName: "NJEN",
    title: "NJEN | New Jersey's Entertainment Headquarters",
    description: "Entertainment jobs, events, careers, productions, and opportunities across New Jersey.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
