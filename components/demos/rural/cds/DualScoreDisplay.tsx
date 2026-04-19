"use client";

import { motion } from "framer-motion";
import { ArrowDown, ArrowUp, Minus, Info, Shield, Activity } from "lucide-react";
import type { CASScore, RAASScore, ResourceFactor, UrgencyClassification } from "@/lib/demos/rural/types";

interface DualScoreDisplayProps {
  cas: CASScore;
  raas: RAASScore;
  resourceFactors: ResourceFactor[];
  urgency: UrgencyClassification;
}

function ScoreRing({ score, label, color }: { score: number; label: string; color: string }) {
  const percentage = (score / 9) * 100;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-28 w-28">
        <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" stroke="#e2e8f0" strokeWidth="8" fill="none" />
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            stroke={color}
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{ strokeDasharray: circumference }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-heading-bold text-arka-text-dark">{score}</span>
          <span className="text-xs text-arka-text-dark-muted">/9</span>
        </div>
      </div>
      <p className="mt-2 text-sm font-body-medium text-arka-text-dark">{label}</p>
    </div>
  );
}

function UrgencyBadge({ urgency }: { urgency: UrgencyClassification }) {
  const config: Record<UrgencyClassification, { bg: string; text: string; label: string }> = {
    emergent: { bg: "bg-red-100", text: "text-red-700", label: "EMERGENT" },
    urgent: { bg: "bg-amber-100", text: "text-amber-700", label: "URGENT" },
    "semi-urgent": { bg: "bg-yellow-100", text: "text-yellow-700", label: "SEMI-URGENT" },
    routine: { bg: "bg-green-100", text: "text-green-700", label: "ROUTINE" },
    screening: { bg: "bg-blue-100", text: "text-blue-700", label: "SCREENING" },
  };
  const { bg, text, label } = config[urgency];

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${bg} ${text}`}>
      <Activity className="h-3 w-3" />
      {label}
    </span>
  );
}

export function DualScoreDisplay({ cas, raas, resourceFactors, urgency }: DualScoreDisplayProps) {
  const casColor =
    cas.category === "usually-appropriate"
      ? "#059669"
      : cas.category === "may-be-appropriate"
        ? "#d97706"
        : "#dc2626";

  const raasColor =
    raas.category === "usually-appropriate"
      ? "#059669"
      : raas.category === "may-be-appropriate"
        ? "#d97706"
        : "#dc2626";

  const scoreDiff = raas.value - cas.value;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-heading text-arka-text-dark flex items-center gap-2">
          <Shield className="h-5 w-5 text-arka-teal" />
          Dual Appropriateness Scores
        </h3>
        <UrgencyBadge urgency={urgency} />
      </div>

      {/* Score Comparison */}
      <div className="flex items-center justify-center gap-12 mb-6">
        <ScoreRing score={cas.value} label="Clinical (CAS)" color={casColor} />
        <div className="flex flex-col items-center gap-1">
          {scoreDiff < 0 ? (
            <ArrowDown className="h-6 w-6 text-amber-500" />
          ) : scoreDiff > 0 ? (
            <ArrowUp className="h-6 w-6 text-green-500" />
          ) : (
            <Minus className="h-6 w-6 text-slate-400" />
          )}
          <span className="text-xs text-arka-text-dark-muted">
            {scoreDiff === 0
              ? "No change"
              : `${scoreDiff > 0 ? "+" : ""}${scoreDiff} adjustment`}
          </span>
        </div>
        <ScoreRing score={raas.value} label="Resource-Adjusted (RAAS)" color={raasColor} />
      </div>

      {/* Adjustment Explanation */}
      {raas.adjustmentReason && (
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 mb-6">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-arka-teal mt-0.5 flex-shrink-0" />
            <p className="text-sm text-arka-text-dark-muted leading-relaxed">
              {raas.adjustmentReason}
            </p>
          </div>
        </div>
      )}

      {/* Resource Factors (SHAP-style) */}
      <div>
        <h4 className="text-sm font-body-medium text-arka-text-dark mb-3">
          Resource Context Factors
        </h4>
        <div className="space-y-2">
          {resourceFactors.map((factor, idx) => (
            <motion.div
              key={factor.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.08 }}
              className="flex items-center gap-3 rounded-lg bg-slate-50 px-4 py-2.5"
            >
              {/* Impact indicator */}
              <div
                className={`h-2 w-2 rounded-full flex-shrink-0 ${
                  factor.impact === "increases-score"
                    ? "bg-green-500"
                    : factor.impact === "decreases-score"
                      ? "bg-red-500"
                      : "bg-slate-400"
                }`}
              />
              {/* Factor bar */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-body-medium text-arka-text-dark truncate">
                    {factor.name}
                  </span>
                  <span className="text-xs text-arka-text-dark-soft ml-2 flex-shrink-0">
                    {factor.value}
                  </span>
                </div>
                {/* Weight bar */}
                <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${
                      factor.impact === "increases-score"
                        ? "bg-green-400"
                        : factor.impact === "decreases-score"
                          ? "bg-red-400"
                          : "bg-slate-400"
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${factor.weight * 100}%` }}
                    transition={{ duration: 0.6, delay: idx * 0.08 }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
