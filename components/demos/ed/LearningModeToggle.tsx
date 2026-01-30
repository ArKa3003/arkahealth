"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { BookOpen, GraduationCap } from "lucide-react";
import { clsx } from "clsx";
import type { CaseMode } from "@/lib/demos/ed/types";

export interface LearningModeToggleProps {
  mode: CaseMode;
  onModeChange: (mode: CaseMode) => void;
  disabled?: boolean;
  className?: string;
}

const STORAGE_KEY = "arka-ed-preferred-mode";

export function LearningModeToggle({
  mode,
  onModeChange,
  disabled = false,
  className,
}: LearningModeToggleProps) {
  const handleModeChange = (newMode: CaseMode) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, newMode);
    }
    onModeChange(newMode);
  };

  return (
    <div
      className={clsx(
        "relative flex items-center rounded-lg p-1 bg-arka-bg-medium/80 border border-arka-primary/20",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <motion.div
        layout
        className={clsx(
          "absolute inset-y-1 rounded-md",
          mode === "learning" ? "bg-arka-cyan/20" : "bg-amber-500/20"
        )}
        initial={false}
        animate={{
          left: mode === "learning" ? "4px" : "50%",
          right: mode === "learning" ? "50%" : "4px",
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      />

      <button
        type="button"
        onClick={() => !disabled && handleModeChange("learning")}
        disabled={disabled}
        className={clsx(
          "relative z-10 flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
          mode === "learning"
            ? "text-arka-cyan"
            : "text-arka-text-soft hover:text-arka-text"
        )}
      >
        <BookOpen className="w-4 h-4" />
        <span className="hidden sm:inline">Learning</span>
      </button>

      <button
        type="button"
        onClick={() => !disabled && handleModeChange("quiz")}
        disabled={disabled}
        className={clsx(
          "relative z-10 flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
          mode === "quiz"
            ? "text-amber-400"
            : "text-arka-text-soft hover:text-arka-text"
        )}
      >
        <GraduationCap className="w-4 h-4" />
        <span className="hidden sm:inline">Quiz</span>
      </button>
    </div>
  );
}
