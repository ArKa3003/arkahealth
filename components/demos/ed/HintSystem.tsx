"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, AlertCircle } from "lucide-react";
import { Button } from "./ui/Button";
import { Card, CardContent } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { clsx } from "clsx";

export interface HintSystemProps {
  hints: string[];
  maxHints?: number;
  hintsRevealed?: number;
  onRevealHint?: () => void;
  disabled?: boolean;
  className?: string;
}

export function HintSystem({
  hints,
  maxHints = 3,
  hintsRevealed = 0,
  onRevealHint,
  disabled = false,
  className,
}: HintSystemProps) {
  const effectiveMaxHints = maxHints ?? hints.length;
  const hintsAvailable = Math.min(hints.length, effectiveMaxHints);
  const canRevealMore = hintsRevealed < hintsAvailable && !disabled;

  if (hints.length === 0) return null;

  return (
    <div className={clsx("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-arka-cyan" />
          <h4 className="font-semibold text-slate-900">Hints</h4>
          <Badge variant="default" size="sm">
            {hintsRevealed}/{hintsAvailable}
          </Badge>
        </div>
      </div>

      <AnimatePresence>
        {hints.slice(0, hintsRevealed).map((hint, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-2">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {index + 1}
                </div>
                <p className="text-slate-800 text-sm flex-1">{hint}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {canRevealMore && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRevealHint}
          className="w-full justify-center gap-2"
        >
          <Lightbulb className="w-4 h-4" />
          {hintsRevealed === 0 ? "Need a hint?" : `Reveal Hint ${hintsRevealed + 1}`}
        </Button>
      )}

      {hintsRevealed >= hintsAvailable && hintsAvailable > 0 && (
        <p className="text-xs text-slate-600 text-center">All hints revealed</p>
      )}

      {disabled && (
        <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-100 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4" />
          Hints are not available in Quiz mode
        </div>
      )}
    </div>
  );
}

export interface HintButtonProps {
  hintsAvailable: number;
  hintsUsed: number;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export function HintButton({
  hintsAvailable,
  hintsUsed,
  onClick,
  disabled = false,
  className,
}: HintButtonProps) {
  const remaining = hintsAvailable - hintsUsed;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled || remaining <= 0}
      className={clsx("gap-1.5", className)}
    >
      <Lightbulb
        className={clsx(
          "w-4 h-4",
          remaining > 0 ? "text-arka-cyan" : "text-arka-text-soft"
        )}
      />
      {remaining > 0 ? (
        <>
          Hint
          <Badge variant="default" size="sm">
            {remaining}
          </Badge>
        </>
      ) : (
        "No hints left"
      )}
    </Button>
  );
}
