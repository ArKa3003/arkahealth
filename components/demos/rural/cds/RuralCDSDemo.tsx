"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, MapPin, Building2 } from "lucide-react";
import { evaluateRAAS } from "@/lib/demos/rural/scoring/raas-engine";
import { evaluateRaasViaApi } from "@/lib/demos/rural/rural-api";
import { DEMO_FACILITIES } from "@/lib/demos/rural/facility-profiles";
import { useRuralStore, useSelectedFacility } from "@/lib/demos/rural/rural-store";
import { RuralDashboardPanel } from "@/components/demos/rural/shared/RuralDashboardPanel";
import { FacilityProfileForm } from "@/components/demos/rural/cds/FacilityProfileForm";
import { ResourceAwareScoring } from "@/components/demos/rural/cds/ResourceAwareScoring";
import { DualScoreDisplay } from "./DualScoreDisplay";
import { SmartTriagePathway } from "./SmartTriagePathway";
import { LocalFirstProtocol } from "./LocalFirstProtocol";
import { MobileUnitProtocol } from "./MobileUnitProtocol";
import { TransferProtocol } from "./TransferProtocol";
import type {
  RAASInput,
  RAASResult,
  ClinicalScenarioExtended,
  PatientRuralContext,
} from "@/lib/demos/rural/types";

// Pre-built demo scenarios for quick demonstration
const DEMO_SCENARIOS: {
  label: string;
  description: string;
  scenario: ClinicalScenarioExtended;
  patientContext: PatientRuralContext;
}[] = [
  {
    label: "Suspected Appendicitis — No CT",
    description: "35yo male with RLQ pain at a facility with only X-ray and ultrasound",
    scenario: {
      patientId: "demo-001",
      age: 35,
      sex: "male",
      chiefComplaint: "Right lower quadrant abdominal pain",
      clinicalHistory: "No significant past medical history. Pain started 18 hours ago, migrated from periumbilical region.",
      symptoms: ["RLQ pain", "Nausea", "Anorexia", "Low-grade fever"],
      duration: "18 hours",
      redFlags: [
        { flag: "Rebound tenderness", present: true },
        { flag: "Fever > 101°F", present: false },
        { flag: "Peritoneal signs", present: false },
      ],
      proposedImaging: {
        modality: "CT-with-contrast",
        bodyPart: "Abdomen/Pelvis",
        indication: "Suspected acute appendicitis",
        urgency: "urgent",
      },
    },
    patientContext: {
      distanceToFacilityMiles: 12,
      transportationAccess: "own-vehicle",
      employmentImpact: "full-day",
      childcareNeeded: false,
      insuranceType: "Commercial",
      preferredLanguage: "English",
      mobilityLimitations: false,
    },
  },
  {
    label: "Stroke Symptoms — STAT Transfer",
    description: "68yo female with acute left-sided weakness, slurred speech",
    scenario: {
      patientId: "demo-002",
      age: 68,
      sex: "female",
      chiefComplaint: "Acute left-sided weakness and slurred speech",
      clinicalHistory: "HTN, A-fib on warfarin. Symptoms onset 45 minutes ago per family.",
      symptoms: ["Left arm weakness", "Left leg weakness", "Slurred speech", "Facial droop"],
      duration: "45 minutes",
      redFlags: [
        { flag: "Acute neurological deficit", present: true },
        { flag: "Onset within tPA window", present: true },
        { flag: "Anticoagulation therapy", present: true },
      ],
      proposedImaging: {
        modality: "CT",
        bodyPart: "Head",
        indication: "Acute stroke evaluation — rule out hemorrhage before tPA consideration",
        urgency: "stat",
      },
    },
    patientContext: {
      distanceToFacilityMiles: 5,
      transportationAccess: "medical-transport",
      employmentImpact: "minimal",
      childcareNeeded: false,
      insuranceType: "Medicare",
      preferredLanguage: "English",
      mobilityLimitations: true,
    },
  },
  {
    label: "Chronic Knee Pain — Routine MRI",
    description: "52yo farmer with 3-month knee pain, failed conservative treatment",
    scenario: {
      patientId: "demo-003",
      age: 52,
      sex: "male",
      chiefComplaint: "Right knee pain, worsening over 3 months",
      clinicalHistory: "Farmer, active lifestyle. Physical therapy x 6 weeks with no improvement. NSAIDs ineffective. X-ray shows joint space narrowing.",
      symptoms: ["Right knee pain", "Swelling", "Locking sensation", "Limited ROM"],
      duration: "3 months",
      redFlags: [
        { flag: "Joint locking", present: true },
        { flag: "Constitutional symptoms", present: false },
        { flag: "Prior malignancy", present: false },
      ],
      proposedImaging: {
        modality: "MRI",
        bodyPart: "Right Knee",
        indication: "Evaluate for meniscal tear, ligament injury, or internal derangement",
        urgency: "routine",
      },
    },
    patientContext: {
      distanceToFacilityMiles: 45,
      transportationAccess: "own-vehicle",
      employmentImpact: "full-day",
      childcareNeeded: false,
      insuranceType: "Commercial",
      preferredLanguage: "English",
      mobilityLimitations: false,
    },
  },
  {
    label: "Pediatric Fall — X-ray Available",
    description: "8yo with wrist injury after fall, X-ray available on-site",
    scenario: {
      patientId: "demo-004",
      age: 8,
      sex: "female",
      chiefComplaint: "Left wrist pain after fall from monkey bars",
      clinicalHistory: "Otherwise healthy child. Fell approximately 4 feet onto outstretched hand 2 hours ago.",
      symptoms: ["Left wrist pain", "Swelling", "Deformity at wrist", "Refuses to use hand"],
      duration: "2 hours",
      redFlags: [
        { flag: "Visible deformity", present: true },
        { flag: "Neurovascular compromise", present: false },
        { flag: "Open fracture", present: false },
      ],
      proposedImaging: {
        modality: "X-ray",
        bodyPart: "Left Wrist",
        indication: "Evaluate for distal radius fracture",
        urgency: "urgent",
      },
    },
    patientContext: {
      distanceToFacilityMiles: 8,
      transportationAccess: "own-vehicle",
      employmentImpact: "half-day",
      childcareNeeded: true,
      insuranceType: "Medicaid",
      preferredLanguage: "English",
      mobilityLimitations: false,
    },
  },
  {
    label: "Chest Pain — POCUS First",
    description: "55yo with chest pain at REH — ultrasound and X-ray only",
    scenario: {
      patientId: "demo-005",
      age: 55,
      sex: "male",
      chiefComplaint: "Acute chest pain, shortness of breath",
      clinicalHistory: "HTN, DM type 2, smoker 30 pack-years. Pain radiating to left arm, onset 1 hour ago.",
      symptoms: ["Chest pain", "Dyspnea", "Diaphoresis", "Left arm radiation"],
      duration: "1 hour",
      redFlags: [
        { flag: "Cardiac risk factors", present: true },
        { flag: "Acute onset", present: true },
        { flag: "Radiation to arm", present: true },
      ],
      proposedImaging: {
        modality: "CT-with-contrast",
        bodyPart: "Chest",
        indication: "Rule out PE, aortic dissection, or acute coronary syndrome",
        urgency: "stat",
      },
    },
    patientContext: {
      distanceToFacilityMiles: 3,
      transportationAccess: "medical-transport",
      employmentImpact: "minimal",
      childcareNeeded: false,
      insuranceType: "Medicare-Advantage",
      preferredLanguage: "English",
      mobilityLimitations: false,
    },
  },
];

export function RuralCDSDemo() {
  const selectedFacility = useSelectedFacility();
  const setStoreFacility = useRuralStore((s) => s.setSelectedFacility);
  const [selectedScenarioIdx, setSelectedScenarioIdx] = useState<number | null>(null);
  const [result, setResult] = useState<RAASResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalError, setEvalError] = useState<string | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);

  const handleEvaluate = useCallback(
    async (scenarioIdx: number) => {
      setSelectedScenarioIdx(scenarioIdx);
      setIsEvaluating(true);
      setResult(null);
      setEvalError(null);
      setUsedFallback(false);

      const demo = DEMO_SCENARIOS[scenarioIdx]!;
      const input: RAASInput = {
        clinicalScenario: demo.scenario,
        facilityProfile: selectedFacility,
        patientContext: demo.patientContext,
      };

      const apiResult = await evaluateRaasViaApi(input);

      if (apiResult.data) {
        setResult(apiResult.data);
        setIsEvaluating(false);
        return;
      }

      const local = evaluateRAAS(input);
      setResult(local);
      setUsedFallback(true);
      setEvalError(apiResult.error);
      setIsEvaluating(false);
    },
    [selectedFacility],
  );

  const handleFacilityChange = useCallback(
    (facilityId: string) => {
      const facility = DEMO_FACILITIES.find((f) => f.id === facilityId);
      if (facility) {
        setStoreFacility(facility);
        setResult(null);
        setSelectedScenarioIdx(null);
        setEvalError(null);
        setUsedFallback(false);
      }
    },
    [setStoreFacility],
  );

  return (
    <div className="space-y-8">
      <RuralDashboardPanel>
        <section
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-card"
          aria-labelledby="facility-selector-heading"
        >
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <h3
              id="facility-selector-heading"
              className="flex items-center gap-2 font-heading text-lg text-arka-text-dark"
            >
              <Building2 className="h-5 w-5 text-arka-teal" aria-hidden />
              Select facility profile
            </h3>
            <div className="w-full sm:max-w-xs">
              <FacilityProfileForm />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {DEMO_FACILITIES.map((facility) => (
              <button
                key={facility.id}
                type="button"
                onClick={() => handleFacilityChange(facility.id)}
                className={`min-h-[44px] rounded-lg border-2 p-4 text-left transition-all touch-manipulation ${
                  selectedFacility.id === facility.id
                    ? "border-arka-teal bg-arka-teal/5 shadow-glow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <p className="font-body-medium text-arka-text-dark">{facility.name}</p>
                <p className="mt-1 text-xs text-arka-text-dark-muted">
                  {facility.location.city}, {facility.location.state} ·{" "}
                  {facility.designation.join(", ") || "Regional Center"}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {facility.equipment.map((eq) => (
                    <span
                      key={eq.id}
                      className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                    >
                      {eq.modality}
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-xs text-arka-text-dark-soft">
                  <MapPin className="mr-1 inline h-3 w-3" aria-hidden />
                  {facility.location.distanceToUrbanCenter} mi to {facility.location.nearestUrbanCenter}
                </p>
              </button>
            ))}
          </div>
        </section>
      </RuralDashboardPanel>

      <RuralDashboardPanel delay={0.04}>
        <ResourceAwareScoring facility={selectedFacility} />
      </RuralDashboardPanel>

      <RuralDashboardPanel delay={0.05}>
        <section
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-card"
          aria-labelledby="scenario-selector-heading"
        >
          <h3 id="scenario-selector-heading" className="mb-4 font-heading text-lg text-arka-text-dark">
            Select clinical scenario
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {DEMO_SCENARIOS.map((demo, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => void handleEvaluate(idx)}
                disabled={isEvaluating}
                className={`min-h-[44px] rounded-lg border p-4 text-left transition-all touch-manipulation disabled:opacity-60 ${
                  selectedScenarioIdx === idx
                    ? "border-arka-teal bg-arka-teal/5"
                    : "border-slate-200 hover:border-arka-teal/50 hover:bg-slate-50"
                }`}
              >
                <p className="font-body-medium text-sm text-arka-text-dark">{demo.label}</p>
                <p className="mt-1 text-xs text-arka-text-dark-muted">{demo.description}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      demo.scenario.proposedImaging.urgency === "stat"
                        ? "bg-red-100 text-red-700"
                        : demo.scenario.proposedImaging.urgency === "urgent"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-green-100 text-green-700"
                    }`}
                  >
                    {demo.scenario.proposedImaging.urgency.toUpperCase()}
                  </span>
                  <span className="text-xs text-arka-text-dark-soft">
                    {demo.scenario.proposedImaging.modality}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>
      </RuralDashboardPanel>

      <AnimatePresence>
        {isEvaluating && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center py-12"
            role="status"
            aria-live="polite"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-arka-teal/20 border-t-arka-teal" />
              <p className="text-sm text-arka-text-dark-muted">
                Evaluating with resource-aware scoring engine...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {evalError ? (
        <div
          className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning-bg px-4 py-3 text-sm text-warning"
          role="alert"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>
            {usedFallback
              ? `API unavailable — showing local evaluation. ${evalError}`
              : evalError}
          </p>
        </div>
      ) : null}

      <AnimatePresence>
        {result && !isEvaluating && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            <RuralDashboardPanel>
              <DualScoreDisplay
                cas={result.clinicalAppropriatenessScore}
                raas={result.resourceAdjustedScore}
                resourceFactors={result.resourceFactors}
                urgency={result.urgencyClassification}
              />
            </RuralDashboardPanel>

            <RuralDashboardPanel delay={0.05}>
              <SmartTriagePathway
                recommendation={result.triageRecommendation}
                alternatives={result.alternativePathways}
                costEstimate={result.estimatedCost}
                facilityName={selectedFacility.name}
              />
            </RuralDashboardPanel>

            <RuralDashboardPanel delay={0.1}>
              {result.triageRecommendation.tier === "local-first" ? (
                <LocalFirstProtocol />
              ) : result.triageRecommendation.tier === "mobile-unit" ? (
                <MobileUnitProtocol />
              ) : result.triageRecommendation.tier === "transfer" ? (
                <TransferProtocol
                  facility={selectedFacility}
                  studyType={DEMO_SCENARIOS[selectedScenarioIdx ?? 0]?.scenario.proposedImaging.modality ?? "CT"}
                />
              ) : null}
            </RuralDashboardPanel>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
