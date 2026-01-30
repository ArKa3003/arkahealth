"use client";

import { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";
import * as Dialog from "@radix-ui/react-dialog";
import { Logo } from "@/components/shared/Logo";
import { Play, X } from "lucide-react";

const PARTICLE_ROWS = 12;
const PARTICLE_COLS = 20;
const PARTICLE_COUNT = PARTICLE_ROWS * PARTICLE_COLS;

function useParticles() {
  return useMemo(() => {
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
      const row = Math.floor(i / PARTICLE_COLS);
      const col = i % PARTICLE_COLS;
      return { id: i, row, col, delay: (row * 0.08 + col * 0.02) % 2 };
    });
  }, []);
}

function HeroGridPattern() {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-[0.04]"
      aria-hidden
    >
      <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern
            id="hero-grid"
            width="32"
            height="32"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 0 0 h 32 M 0 0 v 32"
              fill="none"
              stroke="var(--arka-cyan)"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hero-grid)" />
      </svg>
    </div>
  );
}

function HeroRadarRings() {
  return (
    <div
      className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center"
      aria-hidden
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <motion.div
          key={i}
          className="absolute h-32 w-32 rounded-full border border-arka-cyan/20 md:h-48 md:w-48 lg:h-64 lg:w-64"
          initial={false}
          animate={{
            scale: [0.5, 1.4],
            opacity: [0.35, 0],
          }}
          transition={{
            duration: 3,
            delay: i * 0.6,
            repeat: Infinity,
            repeatDelay: 0.5,
          }}
        />
      ))}
    </div>
  );
}

function HeroParticles({ particles }: { particles: { id: number; row: number; col: number; delay: number }[] }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 grid gap-[2px] px-4 py-8 sm:gap-[3px] md:gap-[4px]"
      style={{
        gridTemplateColumns: `repeat(${PARTICLE_COLS}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${PARTICLE_ROWS}, minmax(0, 1fr))`,
      }}
      aria-hidden
    >
      {particles.map(({ id, row, col, delay }) => (
        <motion.span
          key={id}
          className="h-0.5 w-0.5 rounded-full bg-arka-cyan sm:h-1 sm:w-1"
          initial={false}
          animate={{
            opacity: [0.12, 0.5, 0.12],
          }}
          transition={{
            duration: 2.5,
            delay: delay,
            repeat: Infinity,
          }}
          style={{
            gridRow: row + 1,
            gridColumn: col + 1,
          }}
        />
      ))}
    </div>
  );
}

function DemoModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-arka-bg-dark/90 backdrop-blur-sm opacity-0 transition-opacity duration-200 data-[state=open]:opacity-100 data-[state=closed]:opacity-0" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-xl border border-arka-deep/50 bg-arka-bg-medium p-4 shadow-2xl opacity-0 transition-all duration-200 focus:outline-none data-[state=open]:opacity-100 data-[state=closed]:opacity-0 data-[state=closed]:scale-95 data-[state=open]:scale-100 sm:p-6"
          onEscapeKeyDown={() => onOpenChange(false)}
          onPointerDownOutside={() => onOpenChange(false)}
        >
          <div className="flex items-center justify-between gap-4 pb-3 sm:pb-4">
            <Dialog.Title className="text-lg font-semibold text-arka-text sm:text-xl">
              Watch Demo
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-lg p-2 text-arka-text-soft transition hover:bg-arka-bg-dark hover:text-arka-text focus:outline-none focus:ring-2 focus:ring-arka-cyan focus:ring-offset-2 focus:ring-offset-arka-bg-medium"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>
          <div className="relative aspect-video overflow-hidden rounded-lg bg-arka-bg-dark">
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-arka-text-soft">
              <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-arka-cyan/50 bg-arka-cyan/10">
                <Play className="h-7 w-7 fill-arka-cyan text-arka-cyan" />
              </span>
              <span className="text-sm font-medium sm:text-base">
                Demo video placeholder
              </span>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function Hero() {
  const [demoOpen, setDemoOpen] = useState(false);
  const particles = useParticles();

  const scrollToSolutions = useCallback(() => {
    const el = document.getElementById("solutions");
    el?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <section
      className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-arka-bg-dark via-arka-bg-medium/80 to-arka-bg-dark px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
      aria-labelledby="hero-heading"
    >
      <HeroGridPattern />
      <HeroRadarRings />
      <HeroParticles particles={particles} />

      <div className="relative z-10 flex max-w-4xl flex-col items-center text-center">
        <motion.div
          className="mb-6 sm:mb-8"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" as const }}
        >
          <Logo
            size="lg"
            variant="full"
            hideTagline
            className="scale-90 sm:scale-100 md:scale-110 lg:scale-125"
          />
        </motion.div>

        <motion.h1
          id="hero-heading"
          className="font-heading font-bold tracking-tight text-arka-text"
          style={{
            fontSize: "clamp(1.75rem, 4vw + 1.5rem, 3.25rem)",
            lineHeight: 1.15,
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" as const }}
        >
          rem
          <span className="arka-gradient-text">ARKA</span>
          bly precise
        </motion.h1>

        <motion.p
          className="mt-3 font-medium text-arka-cyan"
          style={{
            fontSize: "clamp(0.8125rem, 1.5vw + 0.6rem, 1rem)",
            letterSpacing: "0.06em",
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25, ease: "easeOut" as const }}
        >
          Advanced Radio-imaging Knowledge Architecture
        </motion.p>

        <motion.p
          className="mt-2 max-w-2xl text-arka-text-soft"
          style={{
            fontSize: "clamp(0.9375rem, 1.2vw + 0.7rem, 1.125rem)",
            lineHeight: 1.5,
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35, ease: "easeOut" as const }}
        >
          AI-powered clinical decision support that never misses.
        </motion.p>

        <motion.div
          className="mt-8 flex w-full max-w-sm flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" as const }}
        >
          <button
            type="button"
            onClick={scrollToSolutions}
            className="arka-button-primary inline-flex items-center justify-center px-6 py-3 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-arka-cyan focus:ring-offset-2 focus:ring-offset-arka-bg-dark"
          >
            Explore the Ecosystem
          </button>
          <button
            type="button"
            onClick={() => setDemoOpen(true)}
            className="arka-button-secondary inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-arka-cyan focus:ring-offset-2 focus:ring-offset-arka-bg-dark"
          >
            <Play className="h-4 w-4" aria-hidden />
            Watch Demo
          </button>
        </motion.div>
      </div>

      <DemoModal open={demoOpen} onOpenChange={setDemoOpen} />
    </section>
  );
}
