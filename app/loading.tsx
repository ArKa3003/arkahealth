"use client";

import { motion } from "framer-motion";
import { ArkaSpinner } from "@/components/ui/ArkaSpinner";

export default function Loading() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: [0.22, 0.61, 0.36, 1] }}
      className="flex min-h-[50vh] flex-col items-center justify-center gap-4 py-16 opacity-90"
    >
      <ArkaSpinner size="lg" />
      <span className="text-sm font-medium text-arka-text-dark-muted">Loading…</span>
    </motion.div>
  );
}
