import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { SiteChrome } from "@/components/navigation/SiteChrome";
import { FDAComplianceProvider } from "@/components/shared/compliance/FDAComplianceProvider";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { RouteAnnouncer } from "@/components/accessibility/RouteAnnouncer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: true,
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://arkahealth.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ARKA Health | Imaging CDS",
    template: "%s | ARKA Health",
  },
  description:
    "Evidence-based clinical decision support for imaging appropriateness. Cutting-Edge CDS for radiologists and physicians.",
  keywords: ["imaging", "CDS", "clinical decision support", "radiology", "appropriateness", "ARKA"],
  authors: [{ name: "ARKA Health" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "ARKA Health",
    title: "ARKA Health | Imaging CDS",
    description: "Evidence-based clinical decision support for imaging appropriateness.",
    images: [{ url: "/arka-icon.svg", width: 40, height: 40, alt: "ARKA Health" }],
  },
  twitter: {
    card: "summary",
    title: "ARKA Health | Imaging CDS",
    description: "Evidence-based clinical decision support for imaging appropriateness.",
  },
  other: {
    "fda-compliance-mode": "non-device-cds",
    "cms-0057-f-compliant": "true",
    "arka-platform-version": "unified-2.0",
  },
  icons: {
    icon: [{ url: "/arka-icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/arka-icon.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="dark"
      suppressHydrationWarning
      data-fda-compliance-mode="non-device-cds"
      data-cms-0057-f-compliant="true"
      data-arka-platform-version="unified-2.0"
    >
      <body
        className={`${inter.variable} font-sans min-h-screen antialiased overflow-x-hidden text-arka-slate-900 bg-surface selection:bg-arka-teal-200 selection:text-arka-slate-900`}
      >
        <ThemeProvider>
          <FDAComplianceProvider>
            <RouteAnnouncer />
            <SiteChrome>{children}</SiteChrome>
          </FDAComplianceProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
