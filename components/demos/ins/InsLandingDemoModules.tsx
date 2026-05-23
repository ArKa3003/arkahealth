"use client";

import * as React from "react";
import { motion, useInView } from "framer-motion";
import {
  Users,
  ClipboardList,
  Search,
  AlertTriangle,
  FileText,
  ListChecks,
  Award,
  Sparkles,
} from "lucide-react";
import { DEMO_STEPS_10 } from "@/lib/demos/ins/constants";
import { useInsDemoStore } from "@/lib/demos/ins/demo-store";
import { cn } from "@/lib/utils";

const STEP_ICONS = [Users, ClipboardList, Search, AlertTriangle, FileText, ListChecks, Award] as const;

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: "easeOut" },
};

const DEMO_MODULE_STEPS = DEMO_STEPS_10.slice(0, 7);

/**
 * Seven demo module cards for the ARKA-INS landing page; each jumps to the matching RBM demo step.
 */
export function InsLandingDemoModules() {
  const ref = React.useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const goToStep = useInsDemoStore((s) => s.goToStep);

  const handleJump = React.useCallback(
    (stepId: number) => {
      goToStep(stepId);
      window.requestAnimationFrame(() => {
        document.getElementById("demo-main")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    },
    [goToStep]
  );

  return (
    <section
      ref={ref}
      id="ins-demo-modules"
      className="mt-10 sm:mt-12 pt-10 sm:pt-12 border-t border-arka-light"
      aria-labelledby="ins-demo-modules-heading"
    >
      <motion.h2
        id="ins-demo-modules-heading"
        className="text-xl sm:text-2xl font-heading font-semibold text-arka-text-dark mb-2"
        initial={{ opacity: 0, y: 12 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.35 }}
      >
        RBM demo modules
      </motion.h2>
      <motion.p
        className="text-arka-text-dark-muted text-sm sm:text-base max-w-3xl mb-6"
        initial={{ opacity: 0, y: 8 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.35, delay: 0.05 }}
      >
        Jump to a step in the live demo above. These seven cards mirror the first seven steps of the sidebar.
      </motion.p>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        variants={{
          visible: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
          hidden: {},
        }}
      >
        {DEMO_MODULE_STEPS.map((step, i) => {
          const Icon = STEP_ICONS[i] ?? Users;
          return (
            <motion.div key={step.id} variants={fadeInUp} transition={{ duration: 0.35, ease: "easeOut" }}>
              <button
                type="button"
                onClick={() => handleJump(step.id)}
                className={cn(
                  "arka-card group w-full rounded-xl border border-arka-primary/20 p-4 sm:p-5 text-left",
                  "flex gap-3 transition-colors hover:border-arka-teal/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal focus-visible:ring-offset-2 focus-visible:ring-offset-arka-bg-light"
                )}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-arka-teal/15 text-arka-teal">
                  <Icon className="h-4 w-4" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-semibold text-arka-text-dark text-sm sm:text-base">{step.name}</span>
                    {step.isNew ? (
                      <span className="inline-flex items-center gap-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-900">
                        <Sparkles className="h-2.5 w-2.5" aria-hidden />
                        New
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-arka-text-dark-muted">
                    Step {step.id} — go to this step in the demo above
                  </p>
                </div>
              </button>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
