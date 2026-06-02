"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Stethoscope,
  FlaskConical,
  HelpCircle,
  AlertCircle,
  MapPin,
  Briefcase,
  Shield,
  Car,
} from "lucide-react";
import { PatientCard } from "@/components/demos/ed/PatientCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/demos/ed/ui/Card";
import { TableScrollWrapper } from "@/components/ui/TableScrollWrapper";
import { clsx } from "clsx";
import type { LabResult } from "@/lib/demos/ed/types";
import type { LabValue, RuralCase } from "@/lib/demos/rural/types";

function mapLabs(values: LabValue[]): LabResult[] {
  return values.map((lv) => ({
    name: lv.name,
    value: lv.value,
    unit: lv.unit,
    reference_range: lv.normalRange,
    is_abnormal: lv.isAbnormal,
  }));
}

function chiefComplaintFromVignette(vignette: string): string {
  const first = vignette.split(/\.(?=\s)/)[0]?.trim();
  return first && first.length > 0 ? first : vignette.slice(0, 120);
}

function mapSexForPatientCard(sex: string): "male" | "female" {
  return sex.toLowerCase().startsWith("m") ? "male" : "female";
}

export interface RuralClinicalVignetteProps {
  caseData: RuralCase;
  className?: string;
}

export function RuralClinicalVignette({ caseData, className }: RuralClinicalVignetteProps) {
  const [showPhysicalExam, setShowPhysicalExam] = React.useState(true);
  const [showLabResults, setShowLabResults] = React.useState(true);

  const labs = mapLabs(caseData.labResults);

  return (
    <div className={clsx("space-y-6", className)}>
      <Card>
        <CardContent className="pt-6">
          <PatientCard
            age={caseData.patientDemographics.age}
            sex={mapSexForPatientCard(caseData.patientDemographics.sex)}
            chiefComplaint={chiefComplaintFromVignette(caseData.patientVignette)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-slate-900">Demographics & access</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 text-sm text-slate-800 sm:grid-cols-2">
            <li className="flex items-start gap-2">
              <Briefcase className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" aria-hidden />
              <span>
                <span className="font-medium text-slate-900">Occupation: </span>
                {caseData.patientDemographics.occupation}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Shield className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" aria-hidden />
              <span>
                <span className="font-medium text-slate-900">Insurance: </span>
                {caseData.patientDemographics.insuranceType}
              </span>
            </li>
            <li className="flex items-start gap-2 sm:col-span-2">
              <Car className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" aria-hidden />
              <span>
                <span className="font-medium text-slate-900">Transport: </span>
                {caseData.patientDemographics.transportAccess}
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-teal-700">
            <MapPin className="h-4 w-4" />
            Setting
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-800 leading-relaxed">{caseData.setting}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-teal-700">
            <Stethoscope className="h-4 w-4" />
            History of Present Illness
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">
            {caseData.patientVignette}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-slate-900">Vital Signs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {Object.entries(caseData.vitalSigns).map(([label, value]) => (
              <div
                key={label}
                className="flex flex-col items-center rounded-lg border border-arka-light bg-arka-bg-alt p-3"
              >
                <span className="text-xs text-slate-500">{label}</span>
                <span className="text-center font-semibold text-slate-900">{value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {caseData.physicalExam && (
        <CollapsibleSection
          title="Physical Examination"
          icon={<Stethoscope className="h-4 w-4 text-arka-cyan" />}
          isOpen={showPhysicalExam}
          onToggle={() => setShowPhysicalExam(!showPhysicalExam)}
        >
          <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">
            {caseData.physicalExam}
          </p>
        </CollapsibleSection>
      )}

      {labs.length > 0 && (
        <CollapsibleSection
          title="Laboratory Results"
          icon={<FlaskConical className="h-4 w-4 text-arka-cyan" />}
          isOpen={showLabResults}
          onToggle={() => setShowLabResults(!showLabResults)}
        >
          <LabResultsTable results={labs} />
        </CollapsibleSection>
      )}

      <Card variant="bordered" className="border-arka-cyan/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-teal-700">
            <HelpCircle className="h-4 w-4" />
            Clinical Question
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-medium text-slate-800">{caseData.clinicalQuestion}</p>
        </CardContent>
      </Card>
    </div>
  );
}

function LabResultsTable({ results }: { results: LabResult[] }) {
  return (
    <TableScrollWrapper aria-label="Lab results table" className="rounded-lg border border-arka-primary/10">
      <table className="w-full min-w-[320px] text-sm">
        <thead>
          <tr className="border-b border-arka-primary/20">
            <th className="px-3 py-2 text-left font-medium text-slate-700">Test</th>
            <th className="px-3 py-2 text-left font-medium text-slate-700">Value</th>
            <th className="px-3 py-2 text-left font-medium text-slate-700">Reference</th>
          </tr>
        </thead>
        <tbody>
          {results.map((result, index) => (
            <tr
              key={index}
              className={clsx(
                "min-h-[44px] border-b border-arka-primary/10",
                result.is_abnormal && "bg-red-500/10"
              )}
            >
              <td className="px-3 py-2 text-slate-700">{result.name}</td>
              <td
                className={clsx(
                  "px-3 py-2 font-medium",
                  result.is_abnormal ? "text-red-600" : "text-slate-900"
                )}
              >
                {result.value} {result.unit}
                {result.is_abnormal && (
                  <AlertCircle className="ml-1 inline h-3.5 w-3.5 text-red-500" />
                )}
              </td>
              <td className="px-3 py-2 text-slate-600">{result.reference_range}</td>
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
        className="flex w-full items-center justify-between rounded-xl p-4 text-left transition-colors hover:bg-slate-50"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium text-slate-900">{title}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-slate-500" />
        ) : (
          <ChevronDown className="h-5 w-5 text-slate-500" />
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
