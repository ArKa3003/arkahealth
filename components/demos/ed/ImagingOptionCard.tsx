"use client";

import { motion } from "framer-motion";
import {
  Scan,
  Zap,
  Activity,
  Radio,
  Atom,
  LayoutGrid,
  CircleOff,
  DollarSign,
} from "lucide-react";
import { clsx } from "clsx";
import { RadiationBadge } from "./RadiationBadge";
import type { Modality } from "@/lib/demos/ed/types";

const MODALITY_CONFIG: Record<
  Modality | "none",
  { icon: React.ComponentType<{ className?: string }>; label: string; color: string; bgColor: string }
> = {
  xray: { icon: Zap, label: "X-ray", color: "text-arka-cyan", bgColor: "bg-arka-cyan/20" },
  ct: { icon: Scan, label: "CT", color: "text-arka-primary", bgColor: "bg-arka-primary/20" },
  mri: { icon: Activity, label: "MRI", color: "text-emerald-400", bgColor: "bg-emerald-500/20" },
  ultrasound: { icon: Radio, label: "US", color: "text-cyan-400", bgColor: "bg-cyan-500/20" },
  nuclear: { icon: Atom, label: "Nuclear", color: "text-amber-800", bgColor: "bg-amber-500/20" },
  fluoroscopy: { icon: Scan, label: "Fluoro", color: "text-rose-400", bgColor: "bg-rose-500/20" },
  mammography: { icon: Scan, label: "Mammo", color: "text-pink-400", bgColor: "bg-pink-500/20" },
  pet: { icon: Atom, label: "PET", color: "text-orange-400", bgColor: "bg-orange-500/20" },
  none: { icon: CircleOff, label: "None", color: "text-slate-600", bgColor: "bg-slate-100" },
};

export interface ImagingOptionCardProps {
  id: string;
  name: string;
  shortName?: string;
  modality: Modality | "none";
  costUsd: number;
  radiationMsv: number;
  description?: string;
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
  variant?: "default" | "special";
  index?: number;
  className?: string;
}

export function ImagingOptionCard({
  name,
  shortName,
  modality,
  costUsd,
  radiationMsv,
  description,
  isSelected,
  onSelect,
  disabled = false,
  variant = "default",
  index = 0,
  className,
}: ImagingOptionCardProps) {
  const config = MODALITY_CONFIG[modality] ?? MODALITY_CONFIG.xray;
  const Icon = config.icon;
  const isSpecial = variant === "special";

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      onClick={onSelect}
      disabled={disabled}
      className={clsx(
        "w-full text-left rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-arka-cyan focus:ring-offset-2 focus:ring-offset-white",
        isSelected
          ? isSpecial
            ? "border-teal-500 bg-teal-50 shadow-glow-sm"
            : "border-teal-500 bg-teal-50 shadow-glow-sm"
          : "border-slate-200 bg-white hover:border-teal-400",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <div className={clsx("p-4", isSpecial && "text-center py-6")}>
        {isSpecial ? (
          <div className="flex flex-col items-center gap-3">
<div
                className={clsx(
                  "w-12 h-12 rounded-full flex items-center justify-center",
                  isSelected ? "bg-teal-600" : "bg-slate-100"
                )}
              >
              <CircleOff
                className={clsx(
                  "w-6 h-6",
                  isSelected ? "text-white" : "text-slate-500"
                )}
              />
            </div>
            <div>
              <div className="font-semibold text-slate-900">{name}</div>
              <div className="text-sm text-slate-600">No radiation • No cost</div>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <div
              className={clsx(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors",
                isSelected ? "bg-teal-600 border-teal-600" : "border-slate-400"
              )}
            >
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="w-2.5 h-2.5 rounded-full bg-white"
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-slate-900 truncate">
                  {shortName ?? name}
                </span>
                <span
                  className={clsx(
                    "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium",
                    config.bgColor,
                    config.color
                  )}
                >
                  <Icon className="w-3 h-3" />
                  {config.label}
                </span>
              </div>
              {description && (
                <p className="text-xs text-slate-600 line-clamp-1 mb-2">{description}</p>
              )}
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-700 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5" />
                  ${costUsd.toLocaleString()}
                </span>
                <RadiationBadge doseMsv={radiationMsv} />
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.button>
  );
}

export function ImagingOptionCardSkeleton() {
  return (
    <div className="w-full rounded-xl border-2 border-arka-primary/20 bg-arka-bg-medium/30 p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-5 h-5 rounded bg-arka-primary/20" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-32 h-5 bg-arka-primary/20 rounded" />
            <div className="w-12 h-5 bg-arka-primary/20 rounded" />
          </div>
          <div className="w-full h-3 bg-arka-primary/20 rounded mb-2" />
          <div className="flex gap-4">
            <div className="w-16 h-4 bg-arka-primary/20 rounded" />
            <div className="w-24 h-4 bg-arka-primary/20 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
