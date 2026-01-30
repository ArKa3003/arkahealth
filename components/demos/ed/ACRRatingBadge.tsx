"use client";

import { motion } from "framer-motion";
import { clsx } from "clsx";
import type { ACRCategory } from "@/lib/demos/ed/types";

export function getACRCategory(rating: number): ACRCategory {
  if (rating <= 3) return "usually-not-appropriate";
  if (rating <= 6) return "may-be-appropriate";
  return "usually-appropriate";
}

const RATING_CONFIG: Record<
  ACRCategory,
  { label: string; shortLabel: string; bgColor: string; textColor: string; borderColor: string }
> = {
  "usually-not-appropriate": {
    label: "Usually Not Appropriate",
    shortLabel: "Not Appropriate",
    bgColor: "bg-red-500/20",
    textColor: "text-red-300",
    borderColor: "border-red-500/40",
  },
  "may-be-appropriate": {
    label: "May Be Appropriate",
    shortLabel: "May Be Appropriate",
    bgColor: "bg-amber-500/20",
    textColor: "text-amber-300",
    borderColor: "border-amber-500/40",
  },
  "usually-appropriate": {
    label: "Usually Appropriate",
    shortLabel: "Appropriate",
    bgColor: "bg-arka-cyan/20",
    textColor: "text-arka-cyan",
    borderColor: "border-arka-cyan/40",
  },
};

export function getACRConfig(rating: number) {
  const category = getACRCategory(rating);
  return RATING_CONFIG[category];
}

export interface ACRRatingBadgeProps {
  rating: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function ACRRatingBadge({
  rating,
  size = "md",
  showLabel = false,
  className,
}: ACRRatingBadgeProps) {
  const config = getACRConfig(rating);
  const sizeClass =
    size === "sm" ? "w-7 h-7 text-xs" : size === "md" ? "w-10 h-10 text-sm" : "w-14 h-14 text-lg";

  return (
    <div className={clsx("flex flex-col items-center gap-1", className)}>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
        className={clsx(
          "rounded-full flex items-center justify-center font-bold border-2",
          config.bgColor,
          config.textColor,
          config.borderColor,
          sizeClass
        )}
        title={`ACR Rating: ${rating}/9 — ${config.label}`}
      >
        {rating}
      </motion.div>
      {showLabel && (
        <span className={clsx("font-medium text-center text-xs", config.textColor)}>
          {config.shortLabel}
        </span>
      )}
    </div>
  );
}

export interface ACRRatingLargeProps {
  rating: number;
  className?: string;
}

export function ACRRatingLarge({ rating, className }: ACRRatingLargeProps) {
  const config = getACRConfig(rating);

  return (
    <div className={clsx("text-center", className)}>
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className={clsx(
          "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-2 border-4 shadow-glow",
          config.bgColor,
          config.borderColor
        )}
      >
        <span className={clsx("text-3xl font-bold", config.textColor)}>{rating}</span>
      </motion.div>
      <p className={clsx("font-semibold", config.textColor)}>{config.label}</p>
      <p className="text-sm text-arka-text-soft">ACR Appropriateness Rating</p>
    </div>
  );
}

export interface ACRRatingScaleProps {
  userRating?: number;
  optimalRating?: number;
  showLegend?: boolean;
  showLabels?: boolean;
  className?: string;
}

export function ACRRatingScale({
  userRating,
  optimalRating,
  showLegend = true,
  showLabels = true,
  className,
}: ACRRatingScaleProps) {
  return (
    <div className={clsx("space-y-3", className)}>
      <div className="relative">
        <div className="h-8 rounded-full bg-gradient-to-r from-red-500/40 via-amber-500/40 to-arka-cyan/40 overflow-hidden flex">
          <div className="flex-1 border-r border-white/20" />
          <div className="flex-1 border-r border-white/20" />
          <div className="flex-1" />
        </div>
        <div className="absolute inset-0 flex items-center justify-between px-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <div
              key={num}
              className={clsx(
                "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                num <= 3 && "bg-red-500/30 text-red-200",
                num > 3 && num <= 6 && "bg-amber-500/30 text-amber-200",
                num > 6 && "bg-arka-cyan/30 text-arka-cyan"
              )}
            >
              {num}
            </div>
          ))}
        </div>
      </div>
      {userRating != null && (
        <div className="flex justify-between text-sm text-arka-text-soft">
          {showLabels && (
            <>
              <span>Your rating: {userRating}</span>
              {optimalRating != null && <span>Optimal: {optimalRating}</span>}
            </>
          )}
        </div>
      )}
    </div>
  );
}
