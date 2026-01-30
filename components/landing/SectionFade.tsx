"use client";

import { motion } from "framer-motion";

const fadeIn = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

type SectionFadeProps = {
  id?: string;
  children: React.ReactNode;
  className?: string;
  as?: "section" | "div";
  "aria-labelledby"?: string;
};

export function SectionFade({
  id,
  children,
  className = "",
  as: Tag = "section",
  "aria-labelledby": ariaLabelledby,
}: SectionFadeProps) {
  const Component = Tag === "section" ? motion.section : motion.div;
  return (
    <Component
      id={id}
      initial={fadeIn.initial}
      whileInView={fadeIn.whileInView}
      viewport={fadeIn.viewport}
      transition={fadeIn.transition}
      className={className}
      aria-labelledby={ariaLabelledby}
    >
      {children}
    </Component>
  );
}
