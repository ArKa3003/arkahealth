"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function NavigationProgress() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setVisible(true);
    setProgress(0);

    const t1 = setTimeout(() => setProgress(70), 50);
    const t2 = setTimeout(() => setProgress(100), 400);
    const t3 = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [pathname]);

  return (
    <AnimatePresence>
      {visible && (
        <div
          className="fixed left-0 right-0 top-0 z-[100] h-0.5 overflow-hidden safe-area-left safe-area-right"
          role="progressbar"
          aria-hidden="true"
        >
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-arka-primary to-arka-cyan shadow-[0_0_12px_var(--arka-cyan)]"
          />
        </div>
      )}
    </AnimatePresence>
  );
}
