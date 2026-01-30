"use client";

import * as React from "react";
import type { CaseMode } from "@/lib/demos/ed/types";

export type { CaseMode };

export interface LearningModeState {
  mode: CaseMode;
  hintsUsed: number;
  timeSpent: number;
  startTime: number | null;
  isTimerRunning: boolean;
  quizTimeRemaining: number | null;
  autoSaveEnabled: boolean;
  lastAutoSave: number | null;
}

export interface LearningModeActions {
  setMode: (mode: CaseMode) => void;
  toggleMode: () => void;
  revealHint: () => void;
  resetHints: () => void;
  startTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
  reset: () => void;
  setAutoSave: (enabled: boolean) => void;
  saveProgress: () => void;
}

export interface UseLearningModeOptions {
  initialMode?: CaseMode;
  maxHints?: number;
  quizDuration?: number;
  autoSaveInterval?: number;
  onTimeUp?: () => void;
  onAutoSave?: (state: LearningModeState) => void;
  persistMode?: boolean;
}

const STORAGE_KEY_MODE = "arka-ed-preferred-mode";
const DEFAULT_QUIZ_DURATION = 5 * 60;
const DEFAULT_AUTO_SAVE_INTERVAL = 30;

export function useLearningMode(
  options: UseLearningModeOptions = {}
): LearningModeState & LearningModeActions {
  const {
    initialMode = "learning",
    maxHints = 3,
    quizDuration = DEFAULT_QUIZ_DURATION,
    autoSaveInterval = DEFAULT_AUTO_SAVE_INTERVAL,
    onTimeUp,
    onAutoSave,
    persistMode = true,
  } = options;

  const [mode, setModeState] = React.useState<CaseMode>(initialMode);
  const [hintsUsed, setHintsUsed] = React.useState(0);
  const [timeSpent, setTimeSpent] = React.useState(0);
  const [startTime, setStartTime] = React.useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = React.useState(false);
  const [quizTimeRemaining, setQuizTimeRemaining] = React.useState<number | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = React.useState(true);
  const [lastAutoSave, setLastAutoSave] = React.useState<number | null>(null);

  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const autoSaveRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  React.useEffect(() => {
    if (persistMode && typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY_MODE) as CaseMode | null;
      if (saved && (saved === "learning" || saved === "quiz")) {
        setModeState(saved);
      }
    }
  }, [persistMode]);

  React.useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimeSpent((prev) => prev + 1);
        if (mode === "quiz" && quizTimeRemaining !== null) {
          setQuizTimeRemaining((prev) => {
            if (prev === null || prev <= 1) {
              onTimeUp?.();
              setIsTimerRunning(false);
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, mode, quizTimeRemaining, onTimeUp]);

  React.useEffect(() => {
    if (autoSaveEnabled && onAutoSave) {
      autoSaveRef.current = setInterval(() => {
        onAutoSave({
          mode,
          hintsUsed,
          timeSpent,
          startTime,
          isTimerRunning,
          quizTimeRemaining,
          autoSaveEnabled,
          lastAutoSave: Date.now(),
        });
        setLastAutoSave(Date.now());
      }, autoSaveInterval * 1000);
    }
    return () => {
      if (autoSaveRef.current) clearInterval(autoSaveRef.current);
    };
  }, [autoSaveEnabled, autoSaveInterval, mode, hintsUsed, timeSpent, startTime, isTimerRunning, quizTimeRemaining, onAutoSave]);

  const setMode = React.useCallback(
    (newMode: CaseMode) => {
      setModeState(newMode);
      if (persistMode && typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY_MODE, newMode);
      }
      if (newMode === "quiz") {
        setQuizTimeRemaining(quizDuration);
      } else {
        setQuizTimeRemaining(null);
      }
    },
    [persistMode, quizDuration]
  );

  const toggleMode = React.useCallback(() => {
    setMode(mode === "learning" ? "quiz" : "learning");
  }, [mode, setMode]);

  const revealHint = React.useCallback(() => {
    if (hintsUsed < maxHints && mode === "learning") {
      setHintsUsed((prev) => prev + 1);
    }
  }, [hintsUsed, maxHints, mode]);

  const resetHints = React.useCallback(() => setHintsUsed(0), []);
  const startTimer = React.useCallback(() => {
    if (!isTimerRunning) {
      setStartTime(Date.now());
      setIsTimerRunning(true);
      if (mode === "quiz" && quizTimeRemaining === null) {
        setQuizTimeRemaining(quizDuration);
      }
    }
  }, [isTimerRunning, mode, quizDuration, quizTimeRemaining]);
  const stopTimer = React.useCallback(() => setIsTimerRunning(false), []);
  const resetTimer = React.useCallback(() => {
    setIsTimerRunning(false);
    setTimeSpent(0);
    setStartTime(null);
    if (mode === "quiz") setQuizTimeRemaining(quizDuration);
  }, [mode, quizDuration]);
  const reset = React.useCallback(() => {
    setHintsUsed(0);
    setTimeSpent(0);
    setStartTime(null);
    setIsTimerRunning(false);
    setQuizTimeRemaining(mode === "quiz" ? quizDuration : null);
    setLastAutoSave(null);
  }, [mode, quizDuration]);
  const setAutoSave = React.useCallback((enabled: boolean) => setAutoSaveEnabled(enabled), []);
  const saveProgress = React.useCallback(() => {
    if (onAutoSave) {
      onAutoSave({
        mode,
        hintsUsed,
        timeSpent,
        startTime,
        isTimerRunning,
        quizTimeRemaining,
        autoSaveEnabled,
        lastAutoSave: Date.now(),
      });
      setLastAutoSave(Date.now());
    }
  }, [mode, hintsUsed, timeSpent, startTime, isTimerRunning, quizTimeRemaining, autoSaveEnabled, onAutoSave]);

  return {
    mode,
    hintsUsed,
    timeSpent,
    startTime,
    isTimerRunning,
    quizTimeRemaining,
    autoSaveEnabled,
    lastAutoSave,
    setMode,
    toggleMode,
    revealHint,
    resetHints,
    startTimer,
    stopTimer,
    resetTimer,
    reset,
    setAutoSave,
    saveProgress,
  };
}
