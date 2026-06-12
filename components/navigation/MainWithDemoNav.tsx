"use client";

import { usePathname } from "next/navigation";
import { DemoBottomNav } from "./DemoBottomNav";
import { NavigationProgress } from "./NavigationProgress";
import { cn } from "@/lib/utils";

const DEMO_PATHS = ["/clin-suite", "/clin", "/ed", "/ins"];

export function MainWithDemoNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDemoPage = DEMO_PATHS.some((p) => pathname.startsWith(p));

  return (
    <>
      <NavigationProgress />
      <main
        id="main-content"
        className={cn("flex min-h-0 flex-1 flex-col", isDemoPage && "pb-20 md:pb-0")}
        tabIndex={-1}
      >
        {children}
      </main>
      <DemoBottomNav />
    </>
  );
}
