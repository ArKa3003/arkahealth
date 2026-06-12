"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

type RuralDashboardPanelProps = {
  children: React.ReactNode;
  /** Stagger delay in seconds */
  delay?: number;
  className?: string;
};

/**
 * Scroll-reveal wrapper for rural dashboard sections — matches landing Testimonials pattern.
 */
export function RuralDashboardPanel({ children, delay = 0, className }: RuralDashboardPanelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={cn(className)}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  );
}
