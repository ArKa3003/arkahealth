"use client";

import * as React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { MNAIResult } from "@/lib/coding/mnai";

import { MNAIAlignmentPanel } from "./MNAIAlignmentPanel";

export interface AIIEEvidenceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Optional live MNAI from the current order for the alignment tab. */
  mnai?: MNAIResult;
}

/**
 * Full-screen compliance and methodology reference for ARKA Imaging Intelligence Engine (AIIE) and ARKA-INS.
 */
export function AIIEEvidenceModal({ open, onOpenChange, mnai }: AIIEEvidenceModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        className="fixed left-0 top-0 z-50 flex h-[100dvh] w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-0 bg-white p-0 shadow-none duration-200 data-[state=open]:slide-in-from-bottom-0 data-[state=closed]:slide-out-to-bottom-0 dark:bg-slate-950 sm:inset-4 sm:h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-2rem)] sm:rounded-xl sm:border sm:border-slate-200 sm:shadow-xl dark:sm:border-slate-800"
      >
        <DialogHeader className="shrink-0 space-y-1 border-b border-slate-200 bg-slate-50 px-4 py-4 pr-14 text-left dark:border-slate-800 dark:bg-slate-900 sm:px-6 sm:pr-16">
          <DialogTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            ARKA evidence & compliance
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-600 dark:text-slate-400">
            FDA Non-Device Clinical Decision Support (21st Century Cures Act), AIIE methodology, and CMS interoperability
            alignment.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col px-4 py-3 sm:px-6 sm:pb-4">
          <Tabs defaultValue="fda" className="flex min-h-0 flex-1 flex-col">
            <TabsList className="no-scrollbar mb-0 h-auto w-full shrink-0 flex-wrap justify-start gap-1 overflow-x-auto bg-slate-100 p-2 dark:bg-slate-900">
              <TabsTrigger value="fda">FDA Compliance</TabsTrigger>
              <TabsTrigger value="mnai">Medical-Necessity Alignment</TabsTrigger>
              <TabsTrigger value="methodology">AIIE Methodology</TabsTrigger>
              <TabsTrigger value="data">Data Sources</TabsTrigger>
              <TabsTrigger value="cms">CMS-0057-F</TabsTrigger>
              <TabsTrigger value="privacy">Privacy</TabsTrigger>
              <TabsTrigger value="regulators">For Regulators</TabsTrigger>
            </TabsList>

            <TabsContent value="fda" className="mt-3 flex min-h-0 flex-1 flex-col overflow-y-auto">
              <div className="space-y-4 text-slate-800 dark:text-slate-200">
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  Section 520(o)(1)(E) — software functions excluded from device regulation when qualifying as non-device
                  CDS.
                </p>
                <ol className="list-decimal space-y-4 pl-5">
                  <li>
                    <span className="font-semibold">Not intended to acquire, process, or analyze medical images.</span>{" "}
                    ARKA surfaces appropriateness, coverage, and workflow context; it does not perform image acquisition
                    or diagnostic image interpretation as a medical device function.
                  </li>
                  <li>
                    <span className="font-semibold">Intended for display and analysis of medical information.</span> ARKA
                    presents structured recommendations, payer-aligned factors, and estimates for clinician or
                    administrative review.
                  </li>
                  <li>
                    <span className="font-semibold">
                      Intended for health care professionals (and, where applicable, support staff).
                    </span>{" "}
                    <span className="italic">ARKA-CLIN / ARKA-ED:</span> ordering and ED pathways for licensed
                    clinicians. <span className="italic">ARKA-INS:</span> PA, utilization, and transparency workflows for
                    licensed clinicians and trained utilization staff under organizational policy.
                  </li>
                  <li>
                    <span className="font-semibold">Enables independent review of the basis for recommendations.</span>{" "}
                    AIIE exposes traceable factors (guideline and policy-linked) consistent with transparent CDS
                    expectations; CDS Hooks cards repeat the standard ARKA disclaimer (Prompt 8).
                  </li>
                </ol>
                <p className="rounded-md border border-blue-200 bg-blue-50/80 p-3 text-sm text-slate-800 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-slate-200">
                  <span className="font-semibold">CLIN vs INS.</span> CLIN/ED emphasize appropriateness at order entry;
                  INS adds coverage, PA, and patient-facing financial estimates — each module keeps human accountability
                  explicit in the UI and in API card text.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="mnai" className="mt-3 flex min-h-0 flex-1 flex-col overflow-y-auto">
              <MNAIAlignmentPanel mnai={mnai} />
            </TabsContent>

            <TabsContent value="methodology" className="mt-3 flex min-h-0 flex-1 flex-col overflow-y-auto">
              <div className="space-y-4 text-slate-800 dark:text-slate-200">
                <p>
                  <span className="font-semibold">RAND/UCLA appropriateness methodology</span> — Panel-style
                  appropriateness framing for imaging decisions; ARKA maps clinical scenarios to evidence and policy
                  factors for auditability. See RAND appropriateness literature for the foundational methodology
                  (Fitch et al., RAND MR-1269 and related appropriateness series).
                </p>
                <p>
                  <span className="font-semibold">GRADE-inspired evidence hierarchy</span> — Factor contributions are
                  labeled by strength and source class so reviewers can see why a recommendation shifts (GRADE working
                  group publications; Schünemann et al., BMJ 2020 for overview).
                </p>
                <p>
                  <span className="font-semibold">Gradient boosting (XGBoost)</span> — Where ML scoring is used, models
                  are trained on de-identified feature rows with regularization and cross-validation; outputs are
                  calibrated for operational thresholds (Chen & Guestrin, XGBoost, KDD 2016).
                </p>
                <p>
                  <span className="font-semibold">SHAP (SHapley Additive exPlanations)</span> — Global and local
                  explainability for tabular factor models to support criterion 4 transparency (Lundberg & Lee, NeurIPS
                  2017 explainability framing).
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Citations summarize widely used primary sources; production deployments maintain internal model cards
                  and validation logs under your governance policy.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="data" className="mt-3 flex min-h-0 flex-1 flex-col overflow-y-auto">
              <ul className="list-disc space-y-2 pl-5 text-slate-800 dark:text-slate-200">
                <li>Peer-reviewed guidelines and appropriateness literature (e.g., ACR Appropriateness Criteria).</li>
                <li>Payer medical policies and coverage criteria (summarized, versioned references in implementation).</li>
                <li>
                  CMS transparency files (e.g., hospital standard charges, applicable machine-readable files where
                  integrated for shoppable services workflows).
                </li>
                <li>Public and plan-published cash-pay or shoppable price lists where available for comparison views.</li>
              </ul>
            </TabsContent>

            <TabsContent value="cms" className="mt-3 flex min-h-0 flex-1 flex-col overflow-y-auto">
              <p className="mb-3 text-sm text-slate-600 dark:text-slate-400">
                CMS-0057-F (Prior Authorization) — illustrative mapping for ARKA-INS demo surfaces; finalize wording with
                your compliance team for each payer contract.
              </p>
              <div className="overflow-x-auto rounded-md border border-slate-200 dark:border-slate-700">
                <table className="w-full min-w-[640px] border-collapse text-left text-xs sm:text-sm">
                  <thead className="bg-slate-100 dark:bg-slate-900">
                    <tr>
                      <th className="border-b border-slate-200 px-3 py-2 font-semibold text-slate-900 dark:border-slate-700 dark:text-slate-100">
                        Final rule theme
                      </th>
                      <th className="border-b border-slate-200 px-3 py-2 font-semibold text-slate-900 dark:border-slate-700 dark:text-slate-100">
                        ARKA-INS feature / behavior
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-800 dark:text-slate-200">
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                      <td className="px-3 py-2 align-top">Reasonable timelines &amp; urgent care</td>
                      <td className="px-3 py-2">SLA timers surfaced in reviewer UI; expedited path labeled in demos.</td>
                    </tr>
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                      <td className="px-3 py-2 align-top">Specific denial reasons</td>
                      <td className="px-3 py-2">Denial text ties to AIIE factors, not boilerplate alone.</td>
                    </tr>
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                      <td className="px-3 py-2 align-top">Appeals clarity</td>
                      <td className="px-3 py-2">Appeal deadline and channel placeholders aligned to 180-day reference.</td>
                    </tr>
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                      <td className="px-3 py-2 align-top">Metrics &amp; transparency</td>
                      <td className="px-3 py-2">Validation dashboards expose PA volumes, auto-approval, and labor impact.</td>
                    </tr>
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                      <td className="px-3 py-2 align-top">FHIR / Da Vinci alignment</td>
                      <td className="px-3 py-2">CDS Hooks + CRD/DTR/PAS-style routes for interoperable demos.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="privacy" className="mt-3 flex min-h-0 flex-1 flex-col overflow-y-auto">
              <ul className="list-disc space-y-2 pl-5 text-slate-800 dark:text-slate-200">
                <li>No PHI stored in ARKA-INS demo tables; identifiers are hashed (SHA-256) when persisted.</li>
                <li>Least-privilege API access; secrets via environment configuration in production patterns.</li>
                <li>SOC 2 — internal controls in progress (placeholder status for customer diligence packets).</li>
              </ul>
            </TabsContent>

            <TabsContent value="regulators" className="mt-3 flex min-h-0 flex-1 flex-col overflow-y-auto">
              <p className="mb-4 text-slate-800 dark:text-slate-200">
                A consolidated compliance dossier (PDF) can be provided for regulatory or payer diligence reviews.
              </p>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                }}
                className="inline-flex text-base font-medium text-blue-700 underline underline-offset-2 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Download full compliance dossier (PDF) — placeholder
              </a>
              <p className="mt-3 text-xs text-slate-600 dark:text-slate-400">
                Link will resolve to a signed artifact in production; this demo prevents navigation.
              </p>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
