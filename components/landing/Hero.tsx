"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import * as Dialog from "@radix-ui/react-dialog";
import { ArkaAnimatedLogo } from "@/components/ArkaAnimatedLogo";
import { routes } from "@/lib/constants";
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

/** Subtle horizontal scan line that sweeps down the hero for ambient polish */
function HeroScanLine() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.06]"
      aria-hidden
    >
      <motion.div
        className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-arka-cyan to-transparent"
        initial={{ y: 0 }}
        animate={{ y: "100vh" }}
        transition={{
          duration: 8,
          repeat: Infinity,
          repeatDelay: 2,
          ease: "linear",
        }}
      />
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
                className="rounded-lg p-2 text-arka-text-soft transition hover:bg-arka-bg-dark hover:text-arka-text focus:outline-none focus-visible:ring-2 focus-visible:ring-arka-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-arka-bg-medium"
                aria-label="Close dialog"
              >
                <X className="h-5 w-5" aria-hidden />
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
  const [logoKey, setLogoKey] = useState(0);
  const particles = useParticles();

  const handleLogoMouseEnter = useCallback(() => {
    setLogoKey((k) => k + 1);
  }, []);

  return (
    <section
      className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-arka-navy via-arka-bg-medium/80 to-arka-navy px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
      aria-label="ARKA hero"
    >
      <HeroGridPattern />
      <HeroRadarRings />
      <HeroParticles particles={particles} />
      <HeroScanLine />

      <div className="relative z-10 flex w-full max-w-4xl flex-col items-center text-center px-2">
        <motion.div
          className="mb-6 sm:mb-8 md:mb-10 flex justify-center w-full"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" as const }}
          onMouseEnter={handleLogoMouseEnter}
        >
          <ArkaAnimatedLogo
            key={logoKey}
            width={800}
            height={900}
            animate={true}
            idleAnimations={true}
            className="w-full max-w-[440px] sm:max-w-[520px] md:max-w-[min(620px,60vw)] lg:max-w-[min(720px,58vw)] h-auto cursor-pointer"
          />
        </motion.div>

        <motion.p
          className="font-semibold text-arka-teal"
          style={{
            fontSize: "clamp(0.9rem, 1.6vw + 0.7rem, 1.15rem)",
            letterSpacing: "0.08em",
          }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" as const }}
        >
          CUTTING EDGE IMAGING DECISION SUPPORT
        </motion.p>

        <motion.div
          className="mt-6 sm:mt-8 flex w-full max-w-3xl flex-col gap-3 sm:items-center"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" as const }}
        >
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
            <Link
              href="#revenue"
              className="arka-button-primary inline-flex min-h-[44px] items-center justify-center px-6 py-3 text-base font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-arka-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-arka-bg-dark touch-manipulation"
            >
              See the revenue model
            </Link>
            <button
              type="button"
              onClick={() => setDemoOpen(true)}
              className="arka-button-secondary inline-flex min-h-[44px] items-center justify-center gap-2 px-6 py-3 text-base font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-arka-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-arka-bg-dark touch-manipulation"
            >
              <Play className="h-4 w-4 shrink-0" aria-hidden />
              Watch 90-sec demo
            </button>
          </div>
          <Link
            href={routes.cdsHooksDemo}
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-lg border border-arka-cyan bg-transparent px-6 py-3 text-base font-semibold text-arka-cyan transition hover:bg-arka-cyan/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-arka-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-arka-bg-dark touch-manipulation sm:w-auto"
          >
            See ARKA live inside an EHR (CDS Hooks demo)
          </Link>
          <p className="mt-2 max-w-2xl text-center text-xs text-arka-text-soft/70">
            Non-Device CDS · No FDA 510(k) · CMS-0057-F ready · the ordering clinician keeps the final
            call.
          </p>
        </motion.div>
      </div>

      <DemoModal open={demoOpen} onOpenChange={setDemoOpen} />
    </section>
  );
}
