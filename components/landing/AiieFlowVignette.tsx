"use client";

import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, ExternalLink, FileSearch, HelpCircle, MonitorOff } from "lucide-react";

import { ScoreRing } from "@/components/ui/score-ring";
import { timelineSleep, useLoopedTimeline } from "@/lib/hooks/use-looped-timeline";
import { cn } from "@/lib/utils";

const ORDER_TEXT = "MRI Lumbar Spine w/o contrast";
const AIIE_SCORE = 7;

const ACR_STEPS = [
  { label: "Leave EHR", icon: MonitorOff },
  { label: "Search PDF tables", icon: FileSearch },
  { label: "Generic rating", icon: HelpCircle },
] as const;

const ACR_STEP_MS = 900;
const ACR_SHRUG_MS = 1200;
const ACR_RESET_MS = 400;

const AIIE_INTRO_MS = 200;
const AIIE_TYPING_START_MS = 600;
const AIIE_CHAR_MS = 45;
const AIIE_SCORE_DELAY_MS = 200;
const AIIE_EVIDENCE_DELAY_MS = 700;
const AIIE_HOLD_MS = 2200;
const AIIE_EXIT_MS = 500;
const AIIE_REDUCED_STEP_MS = 350;
const AIIE_REDUCED_HOLD_MS = 2800;

type AcrPhase = "step-0" | "step-1" | "step-2" | "shrug" | "reset";
type AiiePhase = "idle" | "intro" | "typing" | "score" | "evidence" | "hold" | "exit";

const ACR_MID_FLIGHT: AcrPhase[] = ["step-0", "step-1", "step-2", "shrug"];
const AIIE_MID_FLIGHT: AiiePhase[] = ["intro", "typing", "score", "evidence", "exit"];

/**
 * Dual-path auto-playing vignette — grey ACR detour vs inline AIIE scoring.
 */
export function AiieFlowVignette() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <AcrPathPanel />
      <AiiePathPanel />
    </div>
  );
}

function AcrPathPanel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [showShrug, setShowShrug] = useState(false);

  const runLoop = useCallback(
    async ({
      signal,
      setPhase,
      reducedMotion,
      incrementCycle,
    }: {
      signal: AbortSignal;
      setPhase: (phase: AcrPhase) => void;
      reducedMotion: boolean;
      incrementCycle: () => void;
    }) => {
      setShowShrug(false);
      setActiveStep(0);
      setPhase("step-0");

      if (reducedMotion) {
        setActiveStep(2);
        setShowShrug(true);
        setPhase("shrug");
        await timelineSleep(ACR_SHRUG_MS, signal);
      } else {
        for (let i = 0; i < ACR_STEPS.length; i++) {
          setActiveStep(i);
          setPhase(`step-${i}` as AcrPhase);
          await timelineSleep(ACR_STEP_MS, signal);
        }
        setShowShrug(true);
        setPhase("shrug");
        await timelineSleep(ACR_SHRUG_MS, signal);
      }

      setPhase("reset");
      incrementCycle();
      await timelineSleep(ACR_RESET_MS, signal);
    },
    [],
  );

  const { cycle, reducedMotion } = useLoopedTimeline<AcrPhase>({
    containerRef,
    initialPhase: "step-0",
    midFlightPhases: ACR_MID_FLIGHT,
    threshold: 0.2,
    runLoop,
  });

  return (
    <div
      ref={containerRef}
      className="rounded-radius-lg border border-border-subtle bg-arka-slate-100/80 p-4 sm:p-5"
      aria-label="Traditional ACR lookup path simulation"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-arka-slate-500">
        ACR path
      </p>
      <p className="mt-1 text-sm text-arka-slate-600">
        Lookup happens outside the workflow — generic, not patient-specific.
      </p>

      <ol className="mt-5 space-y-3" aria-hidden>
        {ACR_STEPS.map((step, index) => {
          const Icon = step.icon;
          const isActive = activeStep === index && !showShrug;
          const isPast = activeStep > index;

          return (
            <li
              key={step.label}
              className={cn(
                "flex items-center gap-3 rounded-radius-md border px-3 py-2.5 transition-colors duration-300 motion-reduce:transition-none",
                isActive
                  ? "border-arka-slate-300 bg-arka-slate-200/80"
                  : isPast
                    ? "border-arka-slate-200 bg-arka-slate-50 opacity-70"
                    : "border-transparent bg-transparent opacity-50",
              )}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-arka-slate-300/60 text-arka-slate-600">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <span className="text-sm font-medium text-arka-slate-700">{step.label}</span>
            </li>
          );
        })}
      </ol>

      <AnimatePresence mode="wait">
        {showShrug ? (
          <motion.div
            key={`shrug-${cycle}`}
            initial={reducedMotion ? false : { opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.35 }}
            className="mt-4 flex items-center justify-center gap-2 rounded-radius-md border border-dashed border-arka-slate-300 bg-arka-slate-50 py-4"
          >
            <span className="text-2xl" aria-hidden>
              🤷
            </span>
            <span className="text-sm text-arka-slate-600">No patient context applied</span>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <p className="sr-only" aria-live="polite">
        ACR path step {activeStep + 1} of {ACR_STEPS.length}.
        {showShrug ? " Generic rating with no patient-specific context." : ""}
      </p>
    </div>
  );
}

function AiiePathPanel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [typedChars, setTypedChars] = useState(0);
  const [announceLive, setAnnounceLive] = useState(true);
  const announceLiveRef = useRef(true);

  const runLoop = useCallback(
    async ({
      signal,
      setPhase,
      reducedMotion,
      incrementCycle,
    }: {
      signal: AbortSignal;
      setPhase: (phase: AiiePhase) => void;
      reducedMotion: boolean;
      incrementCycle: () => void;
    }) => {
      setPhase("idle");
      setTypedChars(0);

      await timelineSleep(AIIE_INTRO_MS, signal);
      setPhase("intro");

      if (reducedMotion) {
        setPhase("typing");
        setTypedChars(ORDER_TEXT.length);
        await timelineSleep(AIIE_REDUCED_STEP_MS, signal);
        setPhase("score");
        await timelineSleep(AIIE_REDUCED_STEP_MS, signal);
        setPhase("evidence");
        await timelineSleep(AIIE_REDUCED_HOLD_MS, signal);
      } else {
        await timelineSleep(AIIE_TYPING_START_MS - AIIE_INTRO_MS, signal);
        setPhase("typing");

        for (let i = 1; i <= ORDER_TEXT.length; i++) {
          await timelineSleep(AIIE_CHAR_MS, signal);
          setTypedChars(i);
        }

        await timelineSleep(AIIE_SCORE_DELAY_MS, signal);
        setPhase("score");

        await timelineSleep(AIIE_EVIDENCE_DELAY_MS, signal);
        setPhase("evidence");

        await timelineSleep(AIIE_HOLD_MS, signal);
        setPhase("hold");
      }

      setPhase("exit");
      incrementCycle();
      if (announceLiveRef.current) {
        announceLiveRef.current = false;
        setAnnounceLive(false);
      }

      await timelineSleep(AIIE_EXIT_MS, signal);
    },
    [],
  );

  const { phase, cycle, reducedMotion } = useLoopedTimeline<AiiePhase>({
    containerRef,
    initialPhase: "idle",
    midFlightPhases: AIIE_MID_FLIGHT,
    threshold: 0.2,
    runLoop,
  });

  const typedOrder = ORDER_TEXT.slice(0, typedChars);
  const showScore =
    phase === "score" || phase === "evidence" || phase === "hold" || phase === "exit";
  const showEvidence = phase === "evidence" || phase === "hold" || phase === "exit";
  const panelVisible = phase !== "idle";
  const showCursor =
    !reducedMotion && phase === "typing" && typedChars < ORDER_TEXT.length;

  return (
    <div ref={containerRef} className="relative">
      <p className="sr-only" aria-live={announceLive ? "polite" : "off"} aria-atomic="true">
        AIIE path: order {typedOrder || "pending"}. Score{" "}
        {showScore ? `${AIIE_SCORE} of 9` : "pending"}.
        {showEvidence ? " Evidence linked to library." : ""}
      </p>

      <div
        className="overflow-hidden rounded-radius-lg border border-arka-teal-500/40 bg-surface shadow-elevation-2 ring-1 ring-arka-teal-500/20"
        aria-label="AIIE in-workflow scoring simulation"
      >
        <div className="flex items-center justify-between border-b border-border-subtle bg-arka-teal-50/60 px-4 py-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-arka-teal-700">
            AIIE path
          </p>
          <span className="font-mono text-[10px] uppercase tracking-wider text-arka-teal-600">
            CDS Hooks · order-select
          </span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={cycle}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: AIIE_EXIT_MS / 1000, ease: "easeOut" }}
            className="grid gap-4 p-4 sm:grid-cols-[1fr_auto] sm:p-5"
            aria-hidden
          >
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={panelVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
              transition={{ duration: reducedMotion ? 0.2 : 0.4, ease: "easeOut" }}
            >
              <p className="text-caption font-medium text-arka-slate-500">Imaging order</p>
              <div className="mt-1.5 flex min-h-[2.25rem] items-center rounded-radius-md border border-border-subtle bg-surface-sunken px-3 py-2">
                <span className="font-mono text-sm text-arka-slate-900">
                  {typedOrder}
                  {showCursor ? (
                    <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-arka-teal-500" />
                  ) : null}
                </span>
              </div>

              {showEvidence ? (
                <motion.div
                  initial={reducedMotion ? false : { opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-3 inline-flex items-center gap-2 rounded-full border border-arka-teal-200 bg-arka-teal-50 px-3 py-1.5"
                >
                  <BookOpen className="h-3.5 w-3.5 text-arka-teal-600" aria-hidden />
                  <span className="text-xs font-medium text-arka-teal-800">
                    Evidence Library linked
                  </span>
                  <ExternalLink className="h-3 w-3 text-arka-teal-600" aria-hidden />
                </motion.div>
              ) : null}
            </motion.div>

            <div className="flex flex-col items-center justify-center rounded-radius-md border border-arka-teal-100 bg-arka-teal-50/50 px-3 py-4">
              {showScore ? (
                <div className="rounded-full bg-white p-0.5 shadow-elevation-1">
                  <ScoreRing
                    key={`${cycle}-mini`}
                    score={AIIE_SCORE}
                    size={72}
                    label="AIIE"
                    animate={!reducedMotion}
                  />
                </div>
              ) : (
                <div className="flex h-[72px] w-[72px] items-center justify-center">
                  <span className="font-mono text-xs text-arka-slate-500">Scoring…</span>
                </div>
              )}
              {showScore ? (
                <p className="mt-2 text-center text-[10px] leading-snug text-arka-slate-600">
                  SHAP factors shown per score
                </p>
              ) : null}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
