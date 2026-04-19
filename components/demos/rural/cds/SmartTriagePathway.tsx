"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  Truck,
  Calendar,
  Clock,
  Phone,
  FileText,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from "lucide-react";
import type {
  TriageRecommendation,
  AlternativePathway,
  CostEstimate,
} from "@/lib/demos/rural/types";

interface SmartTriagePathwayProps {
  recommendation: TriageRecommendation;
  alternatives: AlternativePathway[];
  costEstimate: CostEstimate;
  facilityName: string;
}

const tierConfig = {
  "local-first": {
    icon: CheckCircle2,
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200",
    label: "Local-First Protocol",
    tagline: "Imaging can be performed on-site",
  },
  "mobile-unit": {
    icon: Calendar,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    label: "Mobile Unit Protocol",
    tagline: "Schedule with visiting mobile unit",
  },
  transfer: {
    icon: Truck,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    label: "Transfer Protocol",
    tagline: "Patient transfer to hub facility recommended",
  },
  defer: {
    icon: Clock,
    color: "text-slate-600",
    bg: "bg-slate-50",
    border: "border-slate-200",
    label: "Defer & Monitor",
    tagline: "Clinical monitoring with planned reassessment",
  },
};

function availabilityBadge(availability: AlternativePathway["availability"]) {
  switch (availability) {
    case "local-now":
      return { className: "bg-green-100 text-green-700", label: "Available Now" };
    case "local-scheduled":
      return { className: "bg-emerald-100 text-emerald-800", label: "Local Scheduled" };
    case "mobile-unit":
      return { className: "bg-blue-100 text-blue-700", label: "Mobile Unit" };
    case "transfer-required":
      return { className: "bg-amber-100 text-amber-700", label: "Transfer" };
    default: {
      const _exhaustive: never = availability;
      return _exhaustive;
    }
  }
}

export function SmartTriagePathway({
  recommendation,
  alternatives,
  costEstimate,
  facilityName,
}: SmartTriagePathwayProps) {
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [showCosts, setShowCosts] = useState(false);

  const config = tierConfig[recommendation.tier];
  const TierIcon = config.icon;
  const protocol = recommendation.protocol;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-card space-y-6">
      <div>
        <h3 className="text-lg font-heading text-arka-text-dark flex items-center gap-2">
          <MapPin className="h-5 w-5 text-arka-teal" />
          Smart Triage Pathway
        </h3>
        <p className="mt-1 text-sm text-arka-text-dark-muted">{facilityName}</p>
      </div>

      {/* Primary Recommendation */}
      <div className={`rounded-lg ${config.bg} ${config.border} border p-5`}>
        <div className="flex items-center gap-3 mb-3">
          <TierIcon className={`h-6 w-6 ${config.color}`} />
          <div>
            <p className={`font-heading ${config.color}`}>{config.label}</p>
            <p className="text-sm text-arka-text-dark-muted">{config.tagline}</p>
          </div>
        </div>

        <p className="text-sm text-arka-text-dark leading-relaxed mb-4">
          {recommendation.reasoning}
        </p>

        {/* Protocol details based on tier */}
        {protocol.type === "local-first" && (
          <div className="space-y-3">
            <div className="rounded-md bg-white/60 p-3">
              <p className="text-xs font-body-medium text-arka-text-dark mb-1">Recommended Study</p>
              <p className="text-sm text-arka-text-dark-muted">{protocol.recommendedStudy}</p>
            </div>
            <div className="rounded-md bg-white/60 p-3">
              <p className="text-xs font-body-medium text-arka-text-dark mb-1">Protocol Guidance</p>
              <ul className="space-y-1">
                {protocol.protocolGuidance.map((step, i) => (
                  <li key={i} className="text-sm text-arka-text-dark-muted flex items-start gap-2">
                    <span className="text-arka-teal mt-1">•</span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>
            {protocol.followUpRequired && (
              <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
                <p className="text-xs font-body-medium text-amber-700 mb-1">Follow-Up Required</p>
                <p className="text-sm text-amber-600">
                  {protocol.followUpStudy} — {protocol.followUpTimeframe}
                </p>
              </div>
            )}
          </div>
        )}

        {protocol.type === "mobile-unit" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md bg-white/60 p-3">
                <p className="text-xs font-body-medium text-arka-text-dark mb-1">Next Available</p>
                <p className="text-sm text-arka-text-dark-muted">{protocol.nextAvailableDate}</p>
              </div>
              <div className="rounded-md bg-white/60 p-3">
                <p className="text-xs font-body-medium text-arka-text-dark mb-1">Wait Time</p>
                <p className="text-sm text-arka-text-dark-muted">{protocol.waitTimeHours} hours</p>
              </div>
            </div>
            <div className="rounded-md bg-white/60 p-3">
              <p className="text-xs font-body-medium text-arka-text-dark mb-1">Safety of Wait</p>
              <p
                className={`text-sm ${
                  protocol.clinicalSafetyOfWait === "safe"
                    ? "text-green-600"
                    : protocol.clinicalSafetyOfWait === "acceptable-with-monitoring"
                      ? "text-amber-600"
                      : "text-red-600"
                }`}
              >
                {protocol.clinicalSafetyOfWait === "safe"
                  ? "Safe to wait for scheduled mobile unit visit"
                  : protocol.clinicalSafetyOfWait === "acceptable-with-monitoring"
                    ? "Acceptable with active clinical monitoring"
                    : "Not recommended — consider transfer"}
              </p>
            </div>
            <div className="rounded-md bg-white/60 p-3">
              <p className="text-xs font-body-medium text-arka-text-dark mb-1">Preparation Steps</p>
              <ul className="space-y-1">
                {protocol.preparationInstructions.map((step, i) => (
                  <li key={i} className="text-sm text-arka-text-dark-muted flex items-start gap-2">
                    <span className="text-arka-teal">{i + 1}.</span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {protocol.type === "transfer" && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-md bg-white/60 p-3">
                <p className="text-xs font-body-medium text-arka-text-dark mb-1">Receiving Facility</p>
                <p className="text-sm text-arka-text-dark-muted">{protocol.receivingFacility}</p>
              </div>
              <div className="rounded-md bg-white/60 p-3">
                <p className="text-xs font-body-medium text-arka-text-dark mb-1">Distance</p>
                <p className="text-sm text-arka-text-dark-muted">{protocol.distanceMiles} miles</p>
              </div>
              <div className="rounded-md bg-white/60 p-3">
                <p className="text-xs font-body-medium text-arka-text-dark mb-1">Est. Transfer Time</p>
                <p className="text-sm text-arka-text-dark-muted">{protocol.estimatedTransferMinutes} min</p>
              </div>
            </div>
            <div className="rounded-md bg-white/60 p-3">
              <p className="text-xs font-body-medium text-arka-text-dark mb-1">
                <Phone className="inline h-3 w-3 mr-1" />
                Contact
              </p>
              <p className="text-sm text-arka-text-dark-muted">{protocol.contactNumber}</p>
            </div>
            <div className="rounded-md bg-white/60 p-3">
              <p className="text-xs font-body-medium text-arka-text-dark mb-1">
                <FileText className="inline h-3 w-3 mr-1" />
                Pre-Notification Template
              </p>
              <p className="text-xs text-arka-text-dark-muted font-mono bg-slate-100 rounded p-2 whitespace-pre-wrap">
                {protocol.preNotificationTemplate}
              </p>
            </div>
          </div>
        )}

        {protocol.type === "defer" && (
          <div className="space-y-3">
            <div className="rounded-md bg-white/60 p-3">
              <p className="text-xs font-body-medium text-arka-text-dark mb-1">Rationale</p>
              <p className="text-sm text-arka-text-dark-muted">{protocol.reason}</p>
            </div>
            <div className="rounded-md bg-white/60 p-3">
              <p className="text-xs font-body-medium text-arka-text-dark mb-1">Monitoring Plan</p>
              <p className="text-sm text-arka-text-dark-muted">{protocol.monitoringPlan}</p>
            </div>
            <div className="rounded-md bg-white/60 p-3">
              <p className="text-xs font-body-medium text-arka-text-dark mb-1">Reassessment</p>
              <p className="text-sm text-arka-text-dark-muted">{protocol.reassessmentTimeframe}</p>
            </div>
            <div className="rounded-md bg-red-50 border border-red-200 p-3">
              <p className="text-xs font-body-medium text-red-700 mb-1">
                <AlertTriangle className="inline h-3 w-3 mr-1" />
                Red Flags Requiring Immediate Escalation
              </p>
              <ul className="space-y-1">
                {protocol.redFlagsTriggeringEscalation.map((flag, i) => (
                  <li key={i} className="text-sm text-red-600">
                    • {flag}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Safety Note */}
        <div className="mt-4 rounded-md bg-white/80 border border-slate-200 p-3">
          <p className="text-xs font-body-medium text-arka-text-dark mb-1">
            <AlertTriangle className="inline h-3 w-3 mr-1 text-amber-500" />
            Clinical Safety Note
          </p>
          <p className="text-xs text-arka-text-dark-muted">{recommendation.clinicalSafetyNote}</p>
        </div>
      </div>

      {/* Alternative Pathways (collapsible) */}
      {alternatives.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowAlternatives(!showAlternatives)}
            className="flex items-center gap-2 text-sm font-body-medium text-arka-teal hover:text-arka-teal/80 transition-colors"
          >
            {showAlternatives ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {showAlternatives ? "Hide" : "Show"} Alternative Imaging Pathways ({alternatives.length})
          </button>
          {showAlternatives && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-3 space-y-2"
            >
              {alternatives.map((alt, idx) => {
                const badge = availabilityBadge(alt.availability);
                return (
                  <div
                    key={`${alt.study}-${alt.modality}-${idx}`}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-body-medium text-arka-text-dark">{alt.study}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-1">
                        <span className={`text-xs rounded-full px-2 py-0.5 ${badge.className}`}>
                          {badge.label}
                        </span>
                        <span className="text-xs text-arka-text-dark-soft">
                          CAS: {alt.casScore} · RAAS: {alt.raasScore}
                        </span>
                        <span className="text-xs text-arka-text-dark-soft">~${alt.costEstimate}</span>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                  </div>
                );
              })}
            </motion.div>
          )}
        </div>
      )}

      {/* Cost Estimates (collapsible) */}
      <div>
        <button
          type="button"
          onClick={() => setShowCosts(!showCosts)}
          className="flex items-center gap-2 text-sm font-body-medium text-arka-teal hover:text-arka-teal/80 transition-colors"
        >
          <DollarSign className="h-4 w-4" aria-hidden />
          {showCosts ? "Hide" : "Show"} Cost Estimates
        </button>
        {showCosts && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3"
          >
            {costEstimate.localEstimate != null && (
              <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-center">
                <p className="text-xs text-green-600 mb-1">Local</p>
                <p className="text-lg font-heading text-green-700">
                  ${costEstimate.localEstimate.toLocaleString()}
                </p>
              </div>
            )}
            {costEstimate.mobileUnitEstimate != null && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-center">
                <p className="text-xs text-blue-600 mb-1">Mobile Unit</p>
                <p className="text-lg font-heading text-blue-700">
                  ${costEstimate.mobileUnitEstimate.toLocaleString()}
                </p>
              </div>
            )}
            {costEstimate.transferEstimate != null && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-center">
                <p className="text-xs text-amber-600 mb-1">Transfer Total</p>
                <p className="text-lg font-heading text-amber-700">
                  ${costEstimate.transferEstimate.toLocaleString()}
                </p>
              </div>
            )}
            {costEstimate.travelCost != null && (
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-center">
                <p className="text-xs text-slate-500 mb-1">Travel Cost</p>
                <p className="text-lg font-heading text-slate-700">
                  ${costEstimate.travelCost.toLocaleString()}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </section>
  );
}
