"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";
import { ScrollProgressBar } from "@/components/navigation/ScrollProgressBar";
import { MainWithDemoNav } from "@/components/navigation/MainWithDemoNav";

const CommandMenu = dynamic(
  () => import("@/components/navigation/CommandMenu").then((m) => ({ default: m.CommandMenu })),
  { ssr: false },
);
const FeedbackWidget = dynamic(
  () => import("@/components/FeedbackWidget").then((m) => ({ default: m.FeedbackWidget })),
  { ssr: false },
);

/**
 * Wraps pages in the global marketing shell (navbar, footer, command menu).
 * The /ehr segment renders bare — it is embedded inside EHR sidebars/iframes
 * and must carry zero marketing chrome.
 */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname.startsWith("/ehr")) {
    return <>{children}</>;
  }

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-arka-teal focus:px-4 focus:py-2 focus:text-white focus:outline-none focus:ring-2 focus:ring-arka-teal"
      >
        Skip to main content
      </a>
      <ScrollProgressBar />
      <CommandMenu />
      <div className="flex min-h-screen min-h-dvh flex-col overflow-x-hidden">
        <Navbar />
        <MainWithDemoNav>{children}</MainWithDemoNav>
        <Footer />
        <FeedbackWidget />
      </div>
    </>
  );
}
