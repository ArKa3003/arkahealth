"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type BadgeStatus = "success" | "warning" | "error" | "info" | "neutral" | "processing";
export type BadgeVariant = "solid" | "outline" | "subtle";
export type BadgeSize = "sm" | "md" | "lg";

export interface InsBadgeProps {
  status?: BadgeStatus;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
  dot?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const statusColors: Record<BadgeStatus, Record<BadgeVariant, string>> = {
  success: { solid: "bg-emerald-600 text-white", outline: "bg-transparent text-emerald-400 border-2 border-emerald-500", subtle: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" },
  warning: { solid: "bg-amber-500 text-arka-bg-dark", outline: "bg-transparent text-amber-800 border-2 border-amber-500", subtle: "bg-amber-500/10 text-amber-800 border border-amber-500/20" },
  error: { solid: "bg-red-600 text-white", outline: "bg-transparent text-red-800 border-2 border-red-500", subtle: "bg-red-500/10 text-red-900 border border-red-500/20" },
  info: { solid: "bg-arka-deep text-white", outline: "bg-transparent text-arka-cyan border-2 border-arka-deep", subtle: "bg-arka-deep/10 text-arka-cyan border border-arka-deep/20" },
  neutral: { solid: "bg-arka-bg-medium text-arka-text-soft", outline: "bg-transparent text-arka-text-dark-soft border-2 border-arka-bg-medium", subtle: "bg-arka-pale/50 text-arka-text-dark-soft border border-arka-light" },
  processing: { solid: "bg-arka-cyan text-arka-bg-dark", outline: "bg-transparent text-arka-cyan border-2 border-arka-cyan", subtle: "bg-arka-cyan/10 text-arka-cyan border border-arka-cyan/20" },
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "text-[10px] px-1.5 py-0.5 gap-1",
  md: "text-xs px-2.5 py-1 gap-1.5",
  lg: "text-sm px-3 py-1.5 gap-2",
};

const dotSizes: Record<BadgeSize, string> = { sm: "h-1.5 w-1.5", md: "h-2 w-2", lg: "h-2.5 w-2.5" };

const Badge: React.FC<InsBadgeProps> = ({
  className,
  status = "neutral",
  variant = "solid",
  size = "md",
  icon,
  dot = false,
  children,
}) => {
  const isProcessing = status === "processing";
  return (
    <motion.span
      className={cn(
        "inline-flex items-center justify-center font-semibold rounded-full whitespace-nowrap transition-colors duration-200",
        statusColors[status][variant],
        sizeStyles[size],
        className
      )}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {dot && <span className={cn("rounded-full flex-shrink-0 bg-current opacity-80", dotSizes[size])} />}
      {isProcessing && !dot && (
        <motion.span
          className={cn("rounded-full flex-shrink-0 bg-current", dotSizes[size])}
          animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      {icon && !dot && !isProcessing && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </motion.span>
  );
};

export { Badge };
