"use client";

import { motion } from "framer-motion";
import { Timer } from "lucide-react";
import { clsx } from "clsx";
import { Button } from "./ui/Button";

export interface TimerBadgeProps {
  remaining: number;
  className?: string;
}

export function TimerBadge({ remaining, className }: TimerBadgeProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const isDanger = remaining <= 30;
  const isWarning = remaining <= 60 && remaining > 30;

  return (
    <motion.span
      animate={isDanger ? { scale: [1, 1.05, 1] } : {}}
      transition={{ repeat: Infinity, duration: 0.5 }}
      className={clsx(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono font-semibold",
        isDanger && "bg-red-500/20 text-red-300 border border-red-500/40",
        isWarning && "bg-amber-500/20 text-amber-300 border border-amber-500/40",
        !isDanger && !isWarning && "bg-arka-bg-medium text-arka-text-soft border border-arka-primary/20",
        className
      )}
    >
      <Timer className="w-3 h-3" />
      {formatTime(remaining)}
    </motion.span>
  );
}

export interface TimeUpModalProps {
  isOpen: boolean;
  onSubmit: () => void;
  className?: string;
}

export function TimeUpModal({ isOpen, onSubmit }: TimeUpModalProps) {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="arka-card border-arka-cyan/30 rounded-2xl p-8 text-center max-w-sm mx-4 shadow-glow"
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 0.5 }}
          className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/40"
        >
          <Timer className="w-8 h-8 text-red-400" />
        </motion.div>

        <h3 className="text-xl font-bold text-arka-text mb-2">Time&apos;s Up!</h3>
        <p className="text-arka-text-muted mb-6">
          Your quiz time has expired. Your current selection will be submitted.
        </p>

        <Button onClick={onSubmit} className="w-full">
          Submit Answers
        </Button>
      </motion.div>
    </motion.div>
  );
}
