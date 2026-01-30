"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { DemoBottomNav } from "./DemoBottomNav";
import { NavigationProgress } from "./NavigationProgress";
import { cn } from "@/lib/utils";

const DEMO_PATHS = ["/clin", "/ed", "/ins"];

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export function MainWithDemoNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDemoPage = DEMO_PATHS.some((p) => pathname.startsWith(p));

  return (
    <>
      <NavigationProgress />
      <main
        id="main-content"
        className={cn(
          "flex-1 pt-14",
          isDemoPage && "pb-20 md:pb-0"
        )}
        tabIndex={-1}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="min-h-0 flex-1"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      <DemoBottomNav />
    </>
  );
}
