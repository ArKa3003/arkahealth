"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  HeartPulse,
  Thermometer,
  Wind,
  Droplets,
  Stethoscope,
  FlaskConical,
  HelpCircle,
  AlertCircle,
} from "lucide-react";
import { PatientCard } from "./PatientCard";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/Card";
import { TableScrollWrapper } from "@/components/ui/TableScrollWrapper";
import { clsx } from "clsx";
import type { Case, VitalSigns, LabResult } from "@/lib/demos/ed/types";

export interface ClinicalVignetteProps {
  caseData: Case;
  mode: "learning" | "quiz";
  hintsRevealed?: number;
  onRevealHint?: () => void;
  className?: string;
}

export function ClinicalVignette({
  caseData,
  mode,
  hintsRevealed = 0,
  onRevealHint,
  className,
}: ClinicalVignetteProps) {
  const [showPhysicalExam, setShowPhysicalExam] = React.useState(false);
  const [showLabResults, setShowLabResults] = React.useState(false);

  return (
    <div className={clsx("space-y-6", className)}>
      <Card>
        <CardContent className="pt-6">
          <PatientCard
            age={caseData.patient_age}
            sex={caseData.patient_sex}
            chiefComplaint={caseData.chief_complaint}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-arka-cyan">
            <Stethoscope className="w-4 h-4" />
            History of Present Illness
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-arka-text-muted leading-relaxed whitespace-pre-wrap">
            {caseData.clinical_vignette}
          </p>
        </CardContent>
      </Card>

      {caseData.patient_history && caseData.patient_history.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Past Medical History</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1 text-arka-text-muted">
              {caseData.patient_history.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {caseData.vital_signs && (
        <VitalSignsDisplay vitals={caseData.vital_signs} />
      )}

      {caseData.physical_exam && (
        <CollapsibleSection
          title="Physical Examination"
          icon={<Stethoscope className="w-4 h-4 text-arka-cyan" />}
          isOpen={showPhysicalExam}
          onToggle={() => setShowPhysicalExam(!showPhysicalExam)}
        >
          <p className="text-arka-text-muted leading-relaxed whitespace-pre-wrap">
            {caseData.physical_exam}
          </p>
        </CollapsibleSection>
      )}

      {caseData.lab_results && caseData.lab_results.length > 0 && (
        <CollapsibleSection
          title="Laboratory Results"
          icon={<FlaskConical className="w-4 h-4 text-arka-cyan" />}
          isOpen={showLabResults}
          onToggle={() => setShowLabResults(!showLabResults)}
        >
          <LabResultsTable results={caseData.lab_results} />
        </CollapsibleSection>
      )}

      <Card variant="bordered" className="border-arka-cyan/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-arka-cyan">
            <HelpCircle className="w-4 h-4" />
            Clinical Question
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-arka-text font-medium">
            What is the most appropriate imaging study for this patient?
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function VitalSignsDisplay({ vitals }: { vitals: VitalSigns }) {
  const items = [
    {
      icon: HeartPulse,
      label: "HR",
      value: vitals.heart_rate,
      unit: "bpm",
      color: "text-red-400",
    },
    {
      icon: Droplets,
      label: "BP",
      value:
        vitals.blood_pressure_systolic != null && vitals.blood_pressure_diastolic != null
          ? `${vitals.blood_pressure_systolic}/${vitals.blood_pressure_diastolic}`
          : null,
      unit: "mmHg",
      color: "text-arka-primary",
    },
    {
      icon: Wind,
      label: "RR",
      value: vitals.respiratory_rate,
      unit: "/min",
      color: "text-arka-cyan",
    },
    {
      icon: Thermometer,
      label: "Temp",
      value: vitals.temperature,
      unit: vitals.temperature_unit === "celsius" ? "°C" : "°F",
      color: "text-amber-400",
    },
    {
      icon: Droplets,
      label: "SpO₂",
      value: vitals.oxygen_saturation,
      unit: "%",
      color: "text-emerald-400",
    },
  ].filter((item) => item.value != null);

  if (items.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Vital Signs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex flex-col items-center p-3 bg-arka-bg-medium/50 rounded-lg"
            >
              <item.icon className={clsx("w-5 h-5 mb-1", item.color)} />
              <span className="text-xs text-arka-text-soft">{item.label}</span>
              <span className="font-semibold text-arka-text">
                {item.value}
                <span className="text-xs font-normal text-arka-text-soft ml-0.5">
                  {item.unit}
                </span>
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function LabResultsTable({ results }: { results: LabResult[] }) {
  return (
    <TableScrollWrapper aria-label="Lab results table" className="rounded-lg border border-arka-primary/10">
      <table className="w-full min-w-[320px] text-sm">
        <thead>
          <tr className="border-b border-arka-primary/20">
            <th className="text-left py-2 px-3 font-medium text-arka-text-soft">Test</th>
            <th className="text-left py-2 px-3 font-medium text-arka-text-soft">Value</th>
            <th className="text-left py-2 px-3 font-medium text-arka-text-soft">Reference</th>
          </tr>
        </thead>
        <tbody>
          {results.map((result, index) => (
            <tr
              key={index}
              className={clsx(
                "border-b border-arka-primary/10 min-h-[44px]",
                result.is_abnormal && "bg-red-500/10"
              )}
            >
              <td className="py-2 px-3 text-arka-text-muted">{result.name}</td>
              <td
                className={clsx(
                  "py-2 px-3 font-medium",
                  result.is_abnormal ? "text-red-400" : "text-arka-text"
                )}
              >
                {result.value} {result.unit}
                {result.is_abnormal && (
                  <AlertCircle className="w-3.5 h-3.5 inline ml-1 text-red-400" />
                )}
              </td>
              <td className="py-2 px-3 text-arka-text-soft">{result.reference_range}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableScrollWrapper>
  );
}

function CollapsibleSection({
  title,
  icon,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-arka-bg-medium/30 transition-colors rounded-xl"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium text-arka-text">{title}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-arka-text-soft" />
        ) : (
          <ChevronDown className="w-5 h-5 text-arka-text-soft" />
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="pt-0">{children}</CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
