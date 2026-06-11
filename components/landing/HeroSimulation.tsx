"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useAnimationControls,
  useReducedMotion,
} from "framer-motion";
import { BookOpen, FileText } from "lucide-react";

import { ScoreRing } from "@/components/ui/score-ring";
import { cn } from "@/lib/utils";

const SIM_DATA = {
  patientLabel: "Patient",
  patientValue: "58F · Acute low back pain, 6 weeks",
  orderLabel: "Imaging order",
  orderText: "MRI Lumbar Spine w/o contrast",
  score: 7,
  evidenceLabel: "ACR Appropriateness Criteria",
  evidenceDetail: "Usually appropriate for persistent radiculopathy",
  hookLabel: "CDS Hooks · order-select",
} as const;

const LOOP_MS = 9000;

/**
 * Self-playing mini CDS card simulation for the landing hero.
 * Pure presentation — no API calls. Pauses when offscreen.
 */
export function HeroSimulation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [cycle, setCycle] = useState(0);
  const [typedChars, setTypedChars] = useState(0);
  const [showScore, setShowScore] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);
  const [scoreKey, setScoreKey] = useState(0);
  const panelControls = useAnimationControls();
  const chipControls = useAnimationControls();
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry?.isIntersecting ?? false),
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const resetCycle = useCallback(() => {
    setTypedChars(0);
    setShowScore(false);
    setShowEvidence(false);
    setScoreKey((k) => k + 1);
    void panelControls.set({ opacity: 0, y: 12 });
    void chipControls.set({ opacity: 0, scale: 0.95 });
  }, [panelControls, chipControls]);

  useEffect(() => {
    if (!isVisible) return;

    let cancelled = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    const schedule = (fn: () => void, ms: number) => {
      timeouts.push(
        setTimeout(() => {
          if (!cancelled) fn();
        }, ms),
      );
    };

    const runCycle = () => {
      resetCycle();

      schedule(() => {
        void panelControls.start({
          opacity: 1,
          y: 0,
          transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
        });
      }, 200);

      if (prefersReducedMotion) {
        schedule(() => setTypedChars(SIM_DATA.orderText.length), 400);
        schedule(() => setShowScore(true), 700);
        schedule(() => setShowEvidence(true), 1000);
        schedule(() => {
          void chipControls.start({
            opacity: 1,
            scale: 1,
            transition: { duration: 0.3 },
          });
        }, 1000);
      } else {
        const charDelay = 45;
        for (let i = 1; i <= SIM_DATA.orderText.length; i++) {
          schedule(() => setTypedChars(i), 600 + i * charDelay);
        }
        const typingEnd = 600 + SIM_DATA.orderText.length * charDelay + 200;
        schedule(() => setShowScore(true), typingEnd);
        schedule(() => {
          setShowEvidence(true);
          void chipControls.start({
            opacity: 1,
            scale: 1,
            transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
          });
        }, typingEnd + 700);
      }

      schedule(() => setCycle((c) => c + 1), LOOP_MS);
    };

    runCycle();

    return () => {
      cancelled = true;
      timeouts.forEach(clearTimeout);
    };
  }, [isVisible, cycle, panelControls, chipControls, resetCycle, prefersReducedMotion]);

  const typedOrder = SIM_DATA.orderText.slice(0, typedChars);

  return (
    <div ref={containerRef} className="relative mx-auto w-full max-w-2xl">
      <p className="sr-only" aria-live="polite">
        Simulated EHR order panel: {typedOrder || "waiting for order entry"}. AIIE score{" "}
        {showScore ? SIM_DATA.score : "pending"} out of 9.
        {showEvidence ? ` Evidence: ${SIM_DATA.evidenceLabel}.` : ""}
      </p>

      <AnimatePresence mode="wait">
        <motion.div
          key={cycle}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="overflow-hidden rounded-radius-xl border border-white/10 bg-surface-dark-raised shadow-elevation-3"
          aria-hidden
        >
          {/* EHR chrome */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5 sm:px-5">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-arka-slate-600" />
              <span className="h-2.5 w-2.5 rounded-full bg-arka-slate-600" />
              <span className="h-2.5 w-2.5 rounded-full bg-arka-teal-500/60" />
            </div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-arka-slate-400">
              {SIM_DATA.hookLabel}
            </span>
          </div>

          <div className="grid gap-5 p-4 sm:grid-cols-[1fr_auto] sm:gap-6 sm:p-6">
            <motion.div animate={panelControls} initial={{ opacity: 0, y: 12 }}>
              <div className="space-y-4">
                <div>
                  <p className="text-caption font-medium text-arka-slate-400">
                    {SIM_DATA.patientLabel}
                  </p>
                  <p className="mt-1 text-sm text-white">{SIM_DATA.patientValue}</p>
                </div>

                <div>
                  <p className="text-caption font-medium text-arka-slate-400">
                    {SIM_DATA.orderLabel}
                  </p>
                  <div className="mt-1.5 flex min-h-[2.5rem] items-center rounded-radius-md border border-white/10 bg-arka-slate-900/60 px-3 py-2">
                    <FileText className="mr-2 h-4 w-4 shrink-0 text-arka-teal-400" aria-hidden />
                    <span className="font-mono text-sm text-white">
                      {typedOrder}
                      {!prefersReducedMotion && typedChars < SIM_DATA.orderText.length ? (
                        <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-arka-teal-400" />
                      ) : null}
                    </span>
                  </div>
                </div>

                <AnimatePresence>
                  {showEvidence ? (
                    <motion.div
                      animate={chipControls}
                      initial={{ opacity: 0, scale: 0.95 }}
                      className="inline-flex items-center gap-2 rounded-full border border-arka-teal-500/30 bg-arka-teal-500/10 px-3 py-1.5"
                    >
                      <BookOpen className="h-3.5 w-3.5 text-arka-teal-400" aria-hidden />
                      <span className="text-xs font-medium text-arka-teal-300">
                        {SIM_DATA.evidenceLabel}
                      </span>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </motion.div>

            <div
              className={cn(
                "flex flex-col items-center justify-center rounded-radius-lg border border-white/10 bg-arka-slate-900/50 px-4 py-5",
                "min-w-[140px]",
              )}
            >
              {showScore ? (
                <div className="rounded-full bg-white p-1 shadow-elevation-2">
                  <ScoreRing
                    key={scoreKey}
                    score={SIM_DATA.score}
                    size={100}
                    label="AIIE"
                    animate={!prefersReducedMotion}
                  />
                </div>
              ) : (
                <div className="flex h-[100px] w-[100px] items-center justify-center">
                  <span className="font-mono text-xs text-arka-slate-500">Scoring…</span>
                </div>
              )}
              {showEvidence ? (
                <p className="mt-3 max-w-[9rem] text-center text-[10px] leading-snug text-arka-slate-400">
                  {SIM_DATA.evidenceDetail}
                </p>
              ) : null}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
