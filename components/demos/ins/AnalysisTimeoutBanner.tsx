"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AnalysisTimeoutBannerProps {
  onDismiss?: () => void;
  className?: string;
}

export function AnalysisTimeoutBanner({ onDismiss, className }: AnalysisTimeoutBannerProps) {
  return (
    <motion.div
      className={cn(
        "flex items-center justify-between gap-3 px-4 py-3 rounded-lg",
        "border border-amber-500/40 bg-amber-500/10",
        "text-arka-text-dark",
        className
      )}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
    >
      <div className="flex items-center gap-2">
        <Clock className="h-5 w-5 text-amber-800 flex-shrink-0" />
        <span className="text-sm font-medium">
          Analysis taking longer than expected. You can wait or go back and try again.
        </span>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded hover:bg-arka-pale transition-colors text-arka-text-dark-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-cyan focus-visible:ring-offset-2 touch-manipulation"
          aria-label="Dismiss banner"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      )}
    </motion.div>
  );
}
