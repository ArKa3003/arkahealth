"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

/** Abort-aware delay — rejects with AbortError when the signal fires. */
export function timelineSleep(ms: number, signal: AbortSignal): Promise<void> {
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

type LoopedTimelineContext<TPhase extends string> = {
  signal: AbortSignal;
  setPhase: (phase: TPhase) => void;
  reducedMotion: boolean;
  incrementCycle: () => void;
};

type UseLoopedTimelineOptions<TPhase extends string> = {
  /** Ref attached to the observed container. */
  containerRef: React.RefObject<HTMLElement | null>;
  /** Initial phase when idle or offscreen. */
  initialPhase: TPhase;
  /** Phases where a hard restart would visibly break the animation. */
  midFlightPhases?: readonly TPhase[];
  /** IntersectionObserver threshold (0–1). */
  threshold?: number;
  /** Async loop body — runs repeatedly while visible. */
  runLoop: (ctx: LoopedTimelineContext<TPhase>) => Promise<void>;
};

type UseLoopedTimelineResult<TPhase extends string> = {
  phase: TPhase;
  cycle: number;
  isVisible: boolean;
  reducedMotion: boolean;
  hardRestart: () => void;
};

/**
 * Visibility-gated infinite timeline loop with reduced-motion support.
 * Pauses when offscreen; restarts cleanly on re-entry unless mid-flight.
 */
export function useLoopedTimeline<TPhase extends string>({
  containerRef,
  initialPhase,
  midFlightPhases = [],
  threshold = 0.15,
  runLoop,
}: UseLoopedTimelineOptions<TPhase>): UseLoopedTimelineResult<TPhase> {
  const prefersReducedMotion = useReducedMotion();
  const reducedMotion = prefersReducedMotion === true;

  const isVisibleRef = useRef(false);
  const phaseRef = useRef<TPhase>(initialPhase);
  const abortRef = useRef<AbortController | null>(null);
  const wasIntersectingRef = useRef(false);
  const hasLeftViewportRef = useRef(false);

  const [isVisible, setIsVisible] = useState(false);
  const [runToken, setRunToken] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [phase, setPhaseState] = useState<TPhase>(initialPhase);

  const setPhase = useCallback((next: TPhase) => {
    phaseRef.current = next;
    setPhaseState(next);
  }, []);

  const incrementCycle = useCallback(() => {
    setCycle((c) => c + 1);
  }, []);

  const hardRestart = useCallback(() => {
    abortRef.current?.abort();
    setRunToken((t) => t + 1);
  }, []);

  const isMidFlight = useCallback(
    (current: TPhase) => midFlightPhases.includes(current),
    [midFlightPhases],
  );

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
        setPhase(initialPhase);
      },
      { threshold },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [containerRef, hardRestart, initialPhase, isMidFlight, setPhase, threshold]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible" || !isVisibleRef.current) return;
      if (!isMidFlight(phaseRef.current)) {
        hardRestart();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [hardRestart, isMidFlight]);

  useEffect(() => {
    if (!isVisible) return;

    const ac = new AbortController();
    abortRef.current = ac;
    const { signal } = ac;

    const execute = async () => {
      try {
        while (!signal.aborted && isVisibleRef.current) {
          await runLoop({
            signal,
            setPhase,
            reducedMotion,
            incrementCycle,
          });
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        throw error;
      }
    };

    void execute();

    return () => {
      ac.abort();
    };
  }, [isVisible, runToken, reducedMotion, runLoop, setPhase, incrementCycle]);

  return { phase, cycle, isVisible, reducedMotion, hardRestart };
}
