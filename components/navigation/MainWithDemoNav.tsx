"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { DemoBottomNav } from "./DemoBottomNav";
import { NavigationProgress } from "./NavigationProgress";
import { useClientMounted } from "@/lib/hooks/use-client-mounted";
import { cn } from "@/lib/utils";

const DEMO_PATHS = ["/clin-suite", "/clin", "/ed", "/ins"];

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};

export function MainWithDemoNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const mounted = useClientMounted();
  const isDemoPage = DEMO_PATHS.some((p) => pathname.startsWith(p));

  return (
    <>
      <NavigationProgress />
      <main
        id="main-content"
        className={cn(
          "flex-1 pt-16 min-h-[calc(100dvh-4rem)]",
          isDemoPage && "pb-20 md:pb-0"
        )}
        tabIndex={-1}
      >
        {mounted ? (
          <AnimatePresence mode="popLayout">
            <motion.div
              key={pathname}
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
              className="min-h-0 flex-1"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="min-h-0 flex-1">{children}</div>
        )}
      </main>
      <DemoBottomNav />
    </>
  );
}
