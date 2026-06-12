"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
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

const INTRO_MS = 200;
const TYPING_START_MS = 600;
const CHAR_DELAY_MS = 45;
const SCORE_DELAY_MS = 200;
const EVIDENCE_DELAY_MS = 700;
const HOLD_MS = 2600;
const EXIT_MS = 600;
const REDUCED_STEP_MS = 400;
const REDUCED_HOLD_MS = 4000;

type SimPhase = "idle" | "intro" | "typing" | "score" | "evidence" | "hold" | "exit";

/** Phases where interrupting would visibly break the card — skip hard-reset during these. */
const MID_FLIGHT_PHASES: SimPhase[] = ["intro", "typing", "score", "evidence", "exit"];

/**
 * Derive full cycle duration from phase timings so copy changes cannot desync the loop.
 */
function computeCycleTiming(orderLength: number, reducedMotion: boolean) {
  const typingMs = TYPING_START_MS + orderLength * CHAR_DELAY_MS;
  const fullMotionMs =
    typingMs + SCORE_DELAY_MS + EVIDENCE_DELAY_MS + HOLD_MS + EXIT_MS;
  const reducedMotionMs = REDUCED_STEP_MS * 2 + REDUCED_HOLD_MS + EXIT_MS;
  return {
    typingMs,
    cycleDurationMs: reducedMotion ? reducedMotionMs : fullMotionMs,
  };
}

/** Full-cycle duration (ms) — derived from phase constants, not hard-coded. */
export const HERO_SIM_FULL_CYCLE_MS = computeCycleTiming(
  SIM_DATA.orderText.length,
  false,
).cycleDurationMs;

/** Abort-aware delay — rejects with AbortError when the signal fires. */
function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const id = window.setTimeout(() => resolve(), ms);
    const onAbort = () => {
      window.clearTimeout(id);
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

function isMidFlight(phase: SimPhase): boolean {
  return MID_FLIGHT_PHASES.includes(phase);
}

/**
 * Self-playing mini CDS card simulation for the landing hero.
 * Pure presentation — no API calls. Loops while visible; pauses when offscreen.
 */
export function HeroSimulation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isVisibleRef = useRef(false);
  const phaseRef = useRef<SimPhase>("idle");
  const abortRef = useRef<AbortController | null>(null);
  const wasIntersectingRef = useRef(false);
  const hasLeftViewportRef = useRef(false);

  const [isVisible, setIsVisible] = useState(false);
  const [runToken, setRunToken] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [phase, setPhase] = useState<SimPhase>("idle");
  const [typedChars, setTypedChars] = useState(0);
  const [announceLive, setAnnounceLive] = useState(true);
  const announceLiveRef = useRef(true);

  const prefersReducedMotion = useReducedMotion();
  const reducedMotion = prefersReducedMotion === true;

  const setPhaseSafe = useCallback((next: SimPhase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const hardRestart = useCallback(() => {
    abortRef.current?.abort();
    setRunToken((t) => t + 1);
  }, []);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    isVisibleRef.current = isVisible;
  }, [isVisible]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const intersecting = entry?.isIntersecting ?? false;

        if (intersecting) {
          if (hasLeftViewportRef.current && !isMidFlight(phaseRef.current)) {
            hardRestart();
          }
          wasIntersectingRef.current = true;
          hasLeftViewportRef.current = false;
          setIsVisible(true);
          return;
        }

        if (wasIntersectingRef.current) {
          hasLeftViewportRef.current = true;
        }
        setIsVisible(false);
        abortRef.current?.abort();
        setPhaseSafe("idle");
        setTypedChars(0);
      },
      { threshold: 0.15 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hardRestart, setPhaseSafe]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible" || !isVisibleRef.current) return;
      if (!isMidFlight(phaseRef.current)) {
        hardRestart();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [hardRestart]);

  useEffect(() => {
    if (!isVisible) return;

    const ac = new AbortController();
    abortRef.current = ac;
    const { signal } = ac;
    const orderLength = SIM_DATA.orderText.length;

    const runLoop = async () => {
      try {
        while (!signal.aborted && isVisibleRef.current) {
          setPhaseSafe("idle");
          setTypedChars(0);

          await sleep(INTRO_MS, signal);
          setPhaseSafe("intro");

          if (reducedMotion) {
            setPhaseSafe("typing");
            setTypedChars(orderLength);
            await sleep(REDUCED_STEP_MS, signal);
            setPhaseSafe("score");
            await sleep(REDUCED_STEP_MS, signal);
            setPhaseSafe("evidence");
            await sleep(REDUCED_HOLD_MS, signal);
          } else {
            await sleep(TYPING_START_MS - INTRO_MS, signal);
            setPhaseSafe("typing");

            for (let i = 1; i <= orderLength; i++) {
              await sleep(CHAR_DELAY_MS, signal);
              setTypedChars(i);
            }

            await sleep(SCORE_DELAY_MS, signal);
            setPhaseSafe("score");

            await sleep(EVIDENCE_DELAY_MS, signal);
            setPhaseSafe("evidence");

            await sleep(HOLD_MS, signal);
            setPhaseSafe("hold");
          }

          setPhaseSafe("exit");
          setCycle((c) => c + 1);
          if (announceLiveRef.current) {
            announceLiveRef.current = false;
            setAnnounceLive(false);
          }

          await sleep(EXIT_MS, signal);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        throw error;
      }
    };

    void runLoop();

    return () => {
      ac.abort();
    };
  }, [isVisible, runToken, reducedMotion, setPhaseSafe]);

  const typedOrder = SIM_DATA.orderText.slice(0, typedChars);
  const showScore = phase === "score" || phase === "evidence" || phase === "hold" || phase === "exit";
  const showEvidence =
    phase === "evidence" || phase === "hold" || phase === "exit";
  const panelVisible = phase !== "idle";
  const showCursor =
    !reducedMotion && phase === "typing" && typedChars < SIM_DATA.orderText.length;

  return (
    <div ref={containerRef} className="relative mx-auto w-full max-w-2xl">
      <p className="sr-only" aria-live={announceLive ? "polite" : "off"} aria-atomic="true">
        Simulated EHR order panel: {typedOrder || "waiting for order entry"}. AIIE score{" "}
        {showScore ? SIM_DATA.score : "pending"} out of 9.
        {showEvidence ? ` Evidence: ${SIM_DATA.evidenceLabel}.` : ""}
      </p>

      <AnimatePresence mode="wait">
        <motion.div
          key={cycle}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: EXIT_MS / 1000, ease: "easeOut" }}
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
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={panelVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
              transition={{
                duration: reducedMotion ? 0.2 : 0.45,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
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
                      {showCursor ? (
                        <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-arka-teal-400" />
                      ) : null}
                    </span>
                  </div>
                </div>

                <AnimatePresence>
                  {showEvidence ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{
                        duration: reducedMotion ? 0.2 : 0.4,
                        ease: [0.16, 1, 0.3, 1],
                      }}
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
                    key={`${cycle}-score`}
                    score={SIM_DATA.score}
                    size={100}
                    label="AIIE"
                    animate={!reducedMotion}
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
