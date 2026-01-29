"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Stethoscope, Zap, Shield } from "lucide-react";
import { phaseCards } from "@/lib/constants";

const icons = { Stethoscope, Zap, Shield };

export function PhaseCards() {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-2xl font-bold text-neutral-900 dark:text-white sm:text-3xl">
          Explore the platform
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-neutral-600 dark:text-neutral-400">
          Three modules, one ecosystem. Click to open each demo.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {phaseCards.map((card, i) => {
            const Icon = icons[card.icon as keyof typeof icons];
            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <Link
                  href={card.href}
                  className="block rounded-xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:border-primary/30 hover:shadow-md dark:border-neutral-700 dark:bg-neutral-800/50 dark:hover:border-primary/40"
                >
                  {Icon && (
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                  )}
                  <h3 className="mt-4 text-lg font-semibold text-neutral-900 dark:text-white">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                    {card.description}
                  </p>
                  <span className="mt-4 inline-block text-sm font-medium text-primary">
                    Open demo →
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
