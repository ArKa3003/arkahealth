"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { routes } from "@/lib/constants";

export function EcosystemDiagram() {
  return (
    <section className="border-t border-neutral-200 bg-neutral-50 px-4 py-16 dark:border-neutral-800 dark:bg-neutral-900/30 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-center text-2xl font-bold text-neutral-900 dark:text-white sm:text-3xl">
          One ecosystem
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-neutral-600 dark:text-neutral-400">
          ARKA-CLIN, ARKA-ED, and ARKA-INS share the same evidence base and design language.
        </p>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12 flex flex-wrap items-center justify-center gap-4"
        >
          <Link
            href={routes.clin}
            className="rounded-lg bg-white px-5 py-2.5 text-sm font-medium shadow ring-1 ring-neutral-200 transition hover:ring-primary/50 dark:bg-neutral-800 dark:ring-neutral-700"
          >
            ARKA-CLIN
          </Link>
          <span className="text-neutral-400" aria-hidden>+</span>
          <Link
            href={routes.ed}
            className="rounded-lg bg-white px-5 py-2.5 text-sm font-medium shadow ring-1 ring-neutral-200 transition hover:ring-primary/50 dark:bg-neutral-800 dark:ring-neutral-700"
          >
            ARKA-ED
          </Link>
          <span className="text-neutral-400" aria-hidden>+</span>
          <Link
            href={routes.ins}
            className="rounded-lg bg-white px-5 py-2.5 text-sm font-medium shadow ring-1 ring-neutral-200 transition hover:ring-primary/50 dark:bg-neutral-800 dark:ring-neutral-700"
          >
            ARKA-INS
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
