"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, FileText, Zap } from "lucide-react";
import { AITriagePrioritizer } from "@/components/demos/rural/tele/AITriagePrioritizer";
import { ClinicalContextPackager } from "@/components/demos/rural/tele/ClinicalContextPackager";
import { MultiProviderRouter } from "@/components/demos/rural/tele/MultiProviderRouter";
import { QualityAssuranceDashboard } from "@/components/demos/rural/tele/QualityAssuranceDashboard";
import { StoreAndForwardManager } from "@/components/demos/rural/tele/StoreAndForwardManager";
import { TeleSiteFlow } from "@/components/demos/rural/tele/TeleSiteFlow";
import { RuralDashboardPanel } from "@/components/demos/rural/shared/RuralDashboardPanel";
import { RuralStatBanner } from "@/components/demos/rural/shared/RuralStatBanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { TableScrollWrapper } from "@/components/ui/TableScrollWrapper";
import { DEMO_FACILITIES } from "@/lib/demos/rural/facility-profiles";
import type { TeleStudy, TeleStudyStatus, QualityMetrics } from "@/lib/demos/rural/types";
import { cn } from "@/lib/utils";

// Mock teleradiology studies for the demo queue
const MOCK_TELE_STUDIES: TeleStudy[] = [
  {
    id: "ts-001",
    facilityId: "fac-001",
    patientId: "p-001",
    modality: "X-ray",
    bodyPart: "Chest PA/Lateral",
    studyDate: "2026-03-28T08:15:00",
    clinicalContextPackage: {
      orderingIndication: "Cough and fever x 5 days, rule out pneumonia",
      relevantHistory: ["COPD", "Former smoker 20 pack-years"],
      labValues: [
        {
          name: "WBC",
          value: "14.2",
          unit: "K/uL",
          normalRange: "4.5-11.0",
          isAbnormal: true,
          date: "2026-03-28",
        },
      ],
      priorImagingFindings: ["Prior CXR 6 months ago: hyperinflated lungs, no acute infiltrate"],
      arkaClnScore: 8,
      arkaClnCategory: "usually-appropriate",
      redFlags: ["Fever > 101°F", "Elevated WBC"],
      medications: ["Albuterol", "Tiotropium"],
      allergies: ["Penicillin"],
      clinicalQuestion: "New infiltrate or consolidation suggesting community-acquired pneumonia?",
    },
    aiTriageResult: {
      algorithmName: "ChestXR-AI Triage",
      vendor: "Lunit",
      priority: "urgent",
      findings: ["Possible right lower lobe consolidation detected"],
      confidence: 0.87,
      processingTimeMs: 340,
      flaggedForImmediateReview: false,
      suggestedAction: "Prioritize for radiology read — possible pneumonia",
    },
    assignedProvider: DEMO_FACILITIES[0]!.teleradiologyProviders[1],
    routingDecision: {
      selectedProvider: "Virtual Radiologic",
      reason: "24/7 availability with AI triage integration and 94/100 quality score",
      factors: {
        studyComplexity: "simple",
        subspecialtyNeeded: null,
        estimatedTurnaround: 25,
        costPerRead: 65,
        qualityScore: 94,
      },
      alternativeProviders: ["NightHawk Radiology"],
    },
    status: "in-progress",
    submittedAt: "2026-03-28T08:18:00",
  },
  {
    id: "ts-002",
    facilityId: "fac-001",
    patientId: "p-002",
    modality: "CT",
    bodyPart: "Head without contrast",
    studyDate: "2026-03-28T07:30:00",
    clinicalContextPackage: {
      orderingIndication: "Fall with loss of consciousness, rule out intracranial hemorrhage",
      relevantHistory: ["Atrial fibrillation", "On warfarin", "Age 78"],
      labValues: [
        {
          name: "INR",
          value: "3.8",
          unit: "",
          normalRange: "2.0-3.0",
          isAbnormal: true,
          date: "2026-03-28",
        },
      ],
      priorImagingFindings: [],
      arkaClnScore: 9,
      arkaClnCategory: "usually-appropriate",
      redFlags: ["LOC after trauma", "On anticoagulation", "Supratherapeutic INR"],
      medications: ["Warfarin", "Metoprolol", "Lisinopril"],
      allergies: [],
      clinicalQuestion: "Acute intracranial hemorrhage? Skull fracture?",
    },
    aiTriageResult: {
      algorithmName: "AI CT Brain Triage",
      vendor: "Aidoc",
      priority: "critical",
      findings: ["CRITICAL: Possible acute subdural hemorrhage detected — right convexity"],
      confidence: 0.92,
      processingTimeMs: 520,
      flaggedForImmediateReview: true,
      suggestedAction: "IMMEDIATE radiologist review — possible acute subdural hemorrhage",
    },
    routingDecision: {
      selectedProvider: "Virtual Radiologic",
      reason: "STAT neuroradiology subspecialty read — flagged critical by AI triage",
      factors: {
        studyComplexity: "complex",
        subspecialtyNeeded: "neuro",
        estimatedTurnaround: 10,
        costPerRead: 95,
        qualityScore: 94,
      },
      alternativeProviders: [],
    },
    status: "preliminary",
    submittedAt: "2026-03-28T07:32:00",
    interpretedAt: "2026-03-28T07:42:00",
    turnaroundMinutes: 10,
    report: {
      id: "rpt-001",
      radiologist: "Dr. James Park, MD — Neuroradiology",
      findings:
        "Acute right convexity subdural hematoma measuring 12mm maximal thickness with 6mm rightward midline shift. No evidence of skull fracture. Mild diffuse cerebral atrophy.",
      impression:
        "CRITICAL: Acute right subdural hematoma with midline shift. Neurosurgical consultation recommended emergently.",
      criticalFindings: ["Acute subdural hematoma with midline shift"],
      recommendations: [
        "Emergent neurosurgical consultation",
        "Transfer to Level I trauma center",
        "Repeat CT in 6 hours if non-operative",
      ],
      comparisonStudies: [],
      reportedAt: "2026-03-28T07:42:00",
      isAddendum: false,
    },
  },
  {
    id: "ts-003",
    facilityId: "fac-002",
    patientId: "p-003",
    modality: "X-ray",
    bodyPart: "Left ankle, 3-view",
    studyDate: "2026-03-28T09:00:00",
    clinicalContextPackage: {
      orderingIndication: "Inversion injury, unable to bear weight",
      relevantHistory: ["No significant PMH"],
      labValues: [],
      priorImagingFindings: [],
      arkaClnScore: 7,
      arkaClnCategory: "usually-appropriate",
      redFlags: [],
      medications: [],
      allergies: [],
      clinicalQuestion: "Fracture? Ligament avulsion?",
    },
    routingDecision: {
      selectedProvider: "Radiology Partners",
      reason: "General read with fracture detection AI",
      factors: {
        studyComplexity: "simple",
        subspecialtyNeeded: null,
        estimatedTurnaround: 20,
        costPerRead: 55,
        qualityScore: 91,
      },
      alternativeProviders: [],
    },
    status: "queued",
    submittedAt: "2026-03-28T09:02:00",
  },
];

const MOCK_QUALITY_METRICS: QualityMetrics = {
  facilityId: "fac-001",
  period: "2026-Q1",
  totalStudies: 342,
  averageTurnaroundMinutes: 28,
  turnaroundByUrgency: { stat: 12, urgent: 22, routine: 38 },
  addendumRate: 2.1,
  criticalFindingCallbackRate: 100,
  concordanceRate: 96.5,
  providerPerformance: [
    {
      providerId: "tele-001",
      providerName: "NightHawk Radiology",
      studiesRead: 98,
      averageTurnaround: 35,
      addendumRate: 3.1,
      qualityScore: 88,
    },
    {
      providerId: "tele-002",
      providerName: "Virtual Radiologic",
      studiesRead: 244,
      averageTurnaround: 25,
      addendumRate: 1.6,
      qualityScore: 94,
    },
  ],
};

const statusConfig: Record<TeleStudyStatus, { label: string; color: string; bg: string }> = {
  queued: { label: "Queued", color: "text-slate-600", bg: "bg-slate-100" },
  transmitting: { label: "Transmitting", color: "text-blue-600", bg: "bg-blue-100" },
  received: { label: "Received", color: "text-blue-600", bg: "bg-blue-100" },
  "ai-triaging": { label: "AI Triaging", color: "text-purple-600", bg: "bg-purple-100" },
  assigned: { label: "Assigned", color: "text-indigo-600", bg: "bg-indigo-100" },
  "in-progress": { label: "In Progress", color: "text-amber-600", bg: "bg-amber-100" },
  preliminary: { label: "Preliminary", color: "text-teal-600", bg: "bg-teal-100" },
  final: { label: "Final", color: "text-green-600", bg: "bg-green-100" },
  addendum: { label: "Addendum", color: "text-orange-600", bg: "bg-orange-100" },
};

export function TeleDashboard() {
  const [selectedStudy, setSelectedStudy] = useState<TeleStudy | null>(null);

  const hubFacility = DEMO_FACILITIES[0]!;

  return (
    <div className="space-y-6">
      <RuralDashboardPanel>
        <RuralStatBanner
          stats={[
            { label: "Queue depth", value: String(MOCK_TELE_STUDIES.length), hint: "Active studies" },
            { label: "Avg turnaround", value: `${MOCK_QUALITY_METRICS.averageTurnaroundMinutes} min`, hint: "Q1 demo" },
            { label: "Concordance", value: `${MOCK_QUALITY_METRICS.concordanceRate}%`, hint: "Peer review" },
          ]}
        />
      </RuralDashboardPanel>

      <RuralDashboardPanel delay={0.05}>
        <TeleSiteFlow />
      </RuralDashboardPanel>

      <Tabs defaultValue="queue">
        <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
          <TabsTrigger value="queue">Study queue</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="quality">Quality metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="mt-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            {MOCK_TELE_STUDIES.map((study) => (
              <motion.button
                key={study.id}
                type="button"
                onClick={() => setSelectedStudy(study)}
                className={cn(
                  "w-full rounded-radius-lg border p-4 text-left transition-all",
                  selectedStudy?.id === study.id
                    ? "border-arka-teal-400 bg-arka-teal-50 shadow-elevation-2"
                    : "border-border-subtle bg-surface hover:border-border-strong hover:shadow-elevation-1",
                  study.aiTriageResult?.priority === "critical" && "ring-2 ring-danger/30",
                )}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    {study.aiTriageResult?.priority === "critical" && (
                      <AlertTriangle className="h-4 w-4 shrink-0 text-danger" aria-hidden />
                    )}
                    <span className="truncate font-medium text-arka-slate-900">
                      {study.modality} — {study.bodyPart}
                    </span>
                  </div>
                  <Badge
                    variant={
                      study.status === "preliminary" || study.status === "final"
                        ? "success"
                        : study.status === "in-progress"
                          ? "warning"
                          : "neutral"
                    }
                  >
                    {statusConfig[study.status].label}
                  </Badge>
                </div>
                <p className="line-clamp-1 text-xs text-arka-slate-600">
                  {study.clinicalContextPackage.orderingIndication}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-arka-slate-500">
                  <span className="tabular-nums">CAS: {study.clinicalContextPackage.arkaClnScore}/9</span>
                  {study.aiTriageResult ? (
                    <span className="flex items-center gap-1">
                      <Zap className="h-3 w-3" aria-hidden />
                      AI: {study.aiTriageResult.priority}
                    </span>
                  ) : null}
                  <span className="flex items-center gap-1">
                    <ArrowRight className="h-3 w-3" aria-hidden />
                    {study.routingDecision.selectedProvider}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>

          <div className="lg:col-span-1">
            {selectedStudy ? (
              <Card className="sticky top-32 space-y-4 md:top-28">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {selectedStudy.modality} — {selectedStudy.bodyPart}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">

                {/* Clinical Context */}
                <div>
                  <p className="text-xs font-body-medium text-arka-text-dark mb-1">
                    <FileText className="inline h-3 w-3 mr-1" />
                    Clinical Context Package
                  </p>
                  <div className="rounded-lg bg-slate-50 p-3 space-y-2 text-xs text-arka-text-dark-muted">
                    <p>
                      <strong>Indication:</strong> {selectedStudy.clinicalContextPackage.orderingIndication}
                    </p>
                    <p>
                      <strong>History:</strong> {selectedStudy.clinicalContextPackage.relevantHistory.join(", ")}
                    </p>
                    <p>
                      <strong>Question:</strong> {selectedStudy.clinicalContextPackage.clinicalQuestion}
                    </p>
                    {selectedStudy.clinicalContextPackage.redFlags.length > 0 && (
                      <p className="text-red-600">
                        <strong>Red Flags:</strong> {selectedStudy.clinicalContextPackage.redFlags.join(", ")}
                      </p>
                    )}
                  </div>
                </div>

                {/* AI Triage */}
                {selectedStudy.aiTriageResult && (
                  <div>
                    <p className="text-xs font-body-medium text-arka-text-dark mb-1">
                      <Zap className="inline h-3 w-3 mr-1" />
                      AI Triage Result
                    </p>
                    <div
                      className={`rounded-lg p-3 text-xs ${
                        selectedStudy.aiTriageResult.priority === "critical"
                          ? "bg-red-50 border border-red-200"
                          : selectedStudy.aiTriageResult.priority === "urgent"
                            ? "bg-amber-50 border border-amber-200"
                            : "bg-green-50 border border-green-200"
                      }`}
                    >
                      <p className="font-body-medium mb-1">
                        {selectedStudy.aiTriageResult.algorithmName} ({selectedStudy.aiTriageResult.vendor})
                      </p>
                      {selectedStudy.aiTriageResult.findings.map((f, i) => (
                        <p key={i}>{f}</p>
                      ))}
                      <p className="mt-1 text-arka-text-dark-soft">
                        Confidence: {(selectedStudy.aiTriageResult.confidence * 100).toFixed(0)}% · Processed in{" "}
                        {selectedStudy.aiTriageResult.processingTimeMs}ms
                      </p>
                    </div>
                  </div>
                )}

                {/* Routing */}
                <div>
                  <p className="text-xs font-body-medium text-arka-text-dark mb-1">Routing Decision</p>
                  <div className="rounded-lg bg-slate-50 p-3 text-xs text-arka-text-dark-muted">
                    <p>
                      <strong>Provider:</strong> {selectedStudy.routingDecision.selectedProvider}
                    </p>
                    <p className="mt-1">{selectedStudy.routingDecision.reason}</p>
                  </div>
                </div>

                {selectedStudy.report ? (
                  <div>
                    <p className="mb-1 text-xs font-medium text-arka-slate-900">Report</p>
                    <div className="space-y-2 rounded-radius-md border border-success/30 bg-success-bg p-3 text-xs">
                      <p className="text-arka-slate-600">
                        <strong>Radiologist:</strong> {selectedStudy.report.radiologist}
                      </p>
                      <p className="text-arka-slate-600">
                        <strong>Findings:</strong> {selectedStudy.report.findings}
                      </p>
                      <p className="font-medium text-success">
                        <strong>Impression:</strong> {selectedStudy.report.impression}
                      </p>
                      {selectedStudy.report.criticalFindings.length > 0 ? (
                        <p className="text-danger">
                          <strong>Critical:</strong> {selectedStudy.report.criticalFindings.join("; ")}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ) : null}
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-10 text-center">
                  <p className="text-sm text-arka-slate-600">Select a study to view details</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        </TabsContent>

        <TabsContent value="operations" className="mt-6 space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <RuralDashboardPanel>
              <AITriagePrioritizer />
            </RuralDashboardPanel>
            <RuralDashboardPanel delay={0.05}>
              <StoreAndForwardManager />
            </RuralDashboardPanel>
            <RuralDashboardPanel delay={0.1}>
              <MultiProviderRouter />
            </RuralDashboardPanel>
            <RuralDashboardPanel delay={0.15}>
              <ClinicalContextPackager facility={hubFacility} />
            </RuralDashboardPanel>
          </div>
          <RuralDashboardPanel delay={0.2}>
            <QualityAssuranceDashboard />
          </RuralDashboardPanel>
        </TabsContent>

        <TabsContent value="quality" className="mt-6 space-y-6">
          <RuralStatBanner
            stats={[
              { label: "Total studies (Q1)", value: String(MOCK_QUALITY_METRICS.totalStudies), hint: "All modalities" },
              { label: "Avg turnaround", value: `${MOCK_QUALITY_METRICS.averageTurnaroundMinutes} min`, hint: "Weighted" },
              { label: "Concordance rate", value: `${MOCK_QUALITY_METRICS.concordanceRate}%`, hint: "Peer review" },
              { label: "Critical callback", value: `${MOCK_QUALITY_METRICS.criticalFindingCallbackRate}%`, hint: "SLA met" },
            ]}
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-h3">Turnaround by urgency</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(MOCK_QUALITY_METRICS.turnaroundByUrgency).map(([urgency, minutes]) => (
                <div key={urgency} className="flex items-center gap-4">
                  <span className="w-16 text-sm font-medium capitalize text-arka-slate-900">{urgency}</span>
                  <div className="h-6 flex-1 overflow-hidden rounded-full bg-arka-slate-100">
                    <motion.div
                      className="h-full rounded-full bg-arka-teal-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${(minutes / 60) * 100}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>
                  <span className="w-16 text-right text-sm tabular-nums text-arka-slate-600">
                    {minutes} min
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-h3">Provider performance</CardTitle>
            </CardHeader>
            <CardContent>
              <TableScrollWrapper aria-label="Teleradiology provider performance">
                <table className="w-full min-w-[520px] text-sm">
                  <thead className="sticky top-0 z-10 bg-surface shadow-[0_1px_0_var(--border-subtle)]">
                    <tr className="text-left text-xs font-medium uppercase tracking-wide text-arka-slate-500">
                      <th className="px-4 py-3">Provider</th>
                      <th className="px-4 py-3">Studies</th>
                      <th className="px-4 py-3">Avg TAT</th>
                      <th className="px-4 py-3">Addendum</th>
                      <th className="px-4 py-3">Quality</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_QUALITY_METRICS.providerPerformance.map((p) => (
                      <tr
                        key={p.providerId}
                        className="border-t border-border-subtle transition-colors hover:bg-surface-sunken"
                      >
                        <td className="px-4 py-3 font-medium text-arka-slate-900">{p.providerName}</td>
                        <td className="px-4 py-3 tabular-nums text-arka-slate-600">{p.studiesRead}</td>
                        <td className="px-4 py-3 tabular-nums text-arka-slate-600">{p.averageTurnaround} min</td>
                        <td className="px-4 py-3 tabular-nums text-arka-slate-600">{p.addendumRate}%</td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              p.qualityScore >= 90 ? "success" : p.qualityScore >= 80 ? "warning" : "danger"
                            }
                          >
                            {p.qualityScore}/100
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableScrollWrapper>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
