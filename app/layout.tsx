import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";
import { MainWithDemoNav } from "@/components/navigation/MainWithDemoNav";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { RouteAnnouncer } from "@/components/accessibility/RouteAnnouncer";
import { FeedbackWidget } from "@/components/FeedbackWidget";

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
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans min-h-screen antialiased overflow-x-hidden`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-arka-teal focus:px-4 focus:py-2 focus:text-white focus:outline-none focus:ring-2 focus:ring-arka-teal"
        >
          Skip to main content
        </a>
        <ThemeProvider>
          <RouteAnnouncer />
          <div className="flex min-h-screen min-h-dvh flex-col overflow-x-hidden">
            <Navbar />
            <MainWithDemoNav>{children}</MainWithDemoNav>
            <Footer />
            <FeedbackWidget />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
