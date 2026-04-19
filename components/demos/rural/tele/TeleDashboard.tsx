"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Radio,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  FileText,
  Activity,
  Zap,
} from "lucide-react";
import { DEMO_FACILITIES } from "@/lib/demos/rural/facility-profiles";
import type { TeleStudy, TeleStudyStatus, QualityMetrics } from "@/lib/demos/rural/types";

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
  const [activeTab, setActiveTab] = useState<"queue" | "quality">("queue");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-arka-teal/10">
            <Radio className="h-5 w-5 text-arka-teal" />
          </div>
          <div>
            <h2 className="text-xl font-heading text-arka-text-dark">ARKA-TELE</h2>
            <p className="text-sm text-arka-text-dark-muted">Teleradiology Orchestration Dashboard</p>
          </div>
        </div>
        <p className="text-arka-text-dark-muted leading-relaxed max-w-3xl">
          ARKA-TELE sits between rural facilities and their teleradiology providers, automatically assembling
          clinical context packages, running AI triage on incoming studies, and routing to the optimal provider
          based on complexity, subspecialty needs, and turnaround time.
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2">
        {(["queue", "quality"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-body-medium transition-colors ${
              activeTab === tab
                ? "bg-arka-teal text-white"
                : "bg-slate-100 text-arka-text-dark-muted hover:bg-slate-200"
            }`}
          >
            {tab === "queue" ? "Study Queue" : "Quality Metrics"}
          </button>
        ))}
      </div>

      {/* Study Queue Tab */}
      {activeTab === "queue" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Study List */}
          <div className="lg:col-span-2 space-y-3">
            {MOCK_TELE_STUDIES.map((study) => (
              <motion.button
                key={study.id}
                type="button"
                onClick={() => setSelectedStudy(study)}
                className={`w-full text-left rounded-xl border p-4 transition-all ${
                  selectedStudy?.id === study.id
                    ? "border-arka-teal bg-arka-teal/5 shadow-glow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300 shadow-card"
                } ${study.aiTriageResult?.priority === "critical" ? "ring-2 ring-red-300" : ""}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {study.aiTriageResult?.priority === "critical" && (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="font-body-medium text-arka-text-dark">
                      {study.modality} — {study.bodyPart}
                    </span>
                  </div>
                  <span
                    className={`text-xs rounded-full px-2 py-0.5 ${statusConfig[study.status].bg} ${statusConfig[study.status].color}`}
                  >
                    {statusConfig[study.status].label}
                  </span>
                </div>
                <p className="text-xs text-arka-text-dark-muted line-clamp-1">
                  {study.clinicalContextPackage.orderingIndication}
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs text-arka-text-dark-soft">
                  <span>CAS: {study.clinicalContextPackage.arkaClnScore}/9</span>
                  {study.aiTriageResult && (
                    <span className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      AI: {study.aiTriageResult.priority}
                    </span>
                  )}
                  <span>
                    <ArrowRight className="inline h-3 w-3" /> {study.routingDecision.selectedProvider}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Detail Panel */}
          <div className="lg:col-span-1">
            {selectedStudy ? (
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card sticky top-24 space-y-4">
                <h4 className="font-heading text-arka-text-dark">
                  {selectedStudy.modality} — {selectedStudy.bodyPart}
                </h4>

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

                {/* Report */}
                {selectedStudy.report && (
                  <div>
                    <p className="text-xs font-body-medium text-arka-text-dark mb-1">Report</p>
                    <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-xs space-y-2">
                      <p className="text-arka-text-dark-muted">
                        <strong>Radiologist:</strong> {selectedStudy.report.radiologist}
                      </p>
                      <p className="text-arka-text-dark-muted">
                        <strong>Findings:</strong> {selectedStudy.report.findings}
                      </p>
                      <p className="font-body-medium text-green-700">
                        <strong>Impression:</strong> {selectedStudy.report.impression}
                      </p>
                      {selectedStudy.report.criticalFindings.length > 0 && (
                        <p className="text-red-600">
                          <strong>Critical:</strong> {selectedStudy.report.criticalFindings.join("; ")}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <p className="text-sm text-arka-text-dark-muted">Select a study to view details</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quality Metrics Tab */}
      {activeTab === "quality" && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Studies (Q1)", value: MOCK_QUALITY_METRICS.totalStudies, icon: Activity },
              { label: "Avg Turnaround", value: `${MOCK_QUALITY_METRICS.averageTurnaroundMinutes} min`, icon: Clock },
              { label: "Concordance Rate", value: `${MOCK_QUALITY_METRICS.concordanceRate}%`, icon: CheckCircle2 },
              { label: "Critical Callback", value: `${MOCK_QUALITY_METRICS.criticalFindingCallbackRate}%`, icon: AlertTriangle },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="h-4 w-4 text-arka-teal" />
                  <span className="text-xs text-arka-text-dark-muted">{label}</span>
                </div>
                <p className="text-2xl font-heading text-arka-text-dark">{value}</p>
              </div>
            ))}
          </div>

          {/* Turnaround by Urgency */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
            <h4 className="font-heading text-arka-text-dark mb-4">Turnaround by Urgency</h4>
            <div className="space-y-3">
              {Object.entries(MOCK_QUALITY_METRICS.turnaroundByUrgency).map(([urgency, minutes]) => (
                <div key={urgency} className="flex items-center gap-4">
                  <span className="w-16 text-sm font-body-medium text-arka-text-dark capitalize">{urgency}</span>
                  <div className="flex-1 h-6 rounded-full bg-slate-100 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-arka-teal"
                      initial={{ width: 0 }}
                      animate={{ width: `${(minutes / 60) * 100}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>
                  <span className="w-16 text-right text-sm text-arka-text-dark-muted">{minutes} min</span>
                </div>
              ))}
            </div>
          </div>

          {/* Provider Performance */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
            <h4 className="font-heading text-arka-text-dark mb-4">Provider Performance</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs text-arka-text-dark-muted">
                    <th className="pb-2 pr-4">Provider</th>
                    <th className="pb-2 pr-4">Studies</th>
                    <th className="pb-2 pr-4">Avg TAT</th>
                    <th className="pb-2 pr-4">Addendum Rate</th>
                    <th className="pb-2">Quality Score</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_QUALITY_METRICS.providerPerformance.map((p) => (
                    <tr key={p.providerId} className="border-b border-slate-100">
                      <td className="py-3 pr-4 font-body-medium text-arka-text-dark">{p.providerName}</td>
                      <td className="py-3 pr-4 text-arka-text-dark-muted">{p.studiesRead}</td>
                      <td className="py-3 pr-4 text-arka-text-dark-muted">{p.averageTurnaround} min</td>
                      <td className="py-3 pr-4 text-arka-text-dark-muted">{p.addendumRate}%</td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            p.qualityScore >= 90
                              ? "bg-green-100 text-green-700"
                              : p.qualityScore >= 80
                                ? "bg-amber-100 text-amber-700"
                                : "bg-red-100 text-red-700"
                          }`}
                        >
                          {p.qualityScore}/100
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
