"use client";

import * as React from "react";

import { mnaiFdaDisclaimer, type MNAIResult, type QualifierStatus } from "@/lib/coding/mnai";

export interface MNAIAlignmentPanelProps {
  /** Live MNAI result from AIIE scoring; when omitted, shows methodology-only content. */
  mnai?: MNAIResult;
}

const TIER_STYLES: Record<
  MNAIResult["tier"],
  { label: string; className: string }
> = {
  green: {
    label: "Aligned",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-100",
  },
  amber: {
    label: "Review qualifiers",
    className:
      "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100",
  },
  red: {
    label: "Policy gap likely",
    className:
      "border-red-200 bg-red-50 text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100",
  },
};

function qualifierLabel(id: string): string {
  return id.replace(/_/g, " ");
}

function statusBadge(status: QualifierStatus): React.ReactNode {
  const map: Record<QualifierStatus, string> = {
    met: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200",
    unmet: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200",
    unknown: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  };
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-medium capitalize ${map[status]}`}>
      {status}
    </span>
  );
}

/**
 * Medical-necessity alignment tab body: MNAI tier, qualifier checklist, and FDA non-device CDS disclosure.
 */
export function MNAIAlignmentPanel({ mnai }: MNAIAlignmentPanelProps) {
  const tierStyle = mnai ? TIER_STYLES[mnai.tier] : TIER_STYLES.amber;
  const qualifierEntries = mnai ? Object.entries(mnai.qualifierStatus) : [];

  return (
    <div className="space-y-5 text-slate-800 dark:text-slate-200">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        The Medical Necessity Alignment Index (MNAI) matches working ICD-10-CM diagnosis codes and the
        requested CPT procedure against curated payer-policy and ACR appropriateness references. ARKA
        does not autonomously approve or deny services — clinicians verify each qualifier against the
        medical record.
      </p>

      {mnai ?
        <div
          className={`rounded-lg border px-4 py-3 ${tierStyle.className}`}
          role="status"
          aria-live="polite"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-lg font-semibold">
              MNAI {mnai.index}/100 — {tierStyle.label}
            </p>
            <p className="text-sm opacity-90">
              {mnai.curated && mnai.matchedIcd10 && mnai.matchedCpt ?
                `${mnai.matchedIcd10} + CPT ${mnai.matchedCpt}`
              : "No curated pair"}
            </p>
          </div>
          <p className="mt-2 text-sm">{mnai.narrative.replace(mnaiFdaDisclaimer(), "").trim()}</p>
        </div>
      : <div className="rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm dark:border-amber-900/50 dark:bg-amber-950/30">
          Run AIIE with ICD-10/CPT and a record snapshot to populate live MNAI qualifiers. Until then,
          review curated pair tables in implementation governance packets.
        </div>
      }

      {qualifierEntries.length > 0 ?
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            Qualifier checklist
          </h3>
          <ul className="divide-y divide-slate-200 rounded-md border border-slate-200 dark:divide-slate-700 dark:border-slate-700">
            {qualifierEntries.map(([id, status]) => (
              <li
                key={id}
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
              >
                <span className="capitalize">{qualifierLabel(id)}</span>
                {statusBadge(status)}
              </li>
            ))}
          </ul>
        </div>
      : null}

      {mnai && mnai.policyReferences.length > 0 ?
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            Policy references
          </h3>
          <ul className="list-disc space-y-2 pl-5 text-sm">
            {mnai.policyReferences.map((ref) => (
              <li key={`${ref.source}-${ref.strength}`}>
                <span className="font-medium">{ref.source}</span>
                <span className="text-slate-600 dark:text-slate-400">
                  {" "}
                  — strength: {ref.strength.replace(/_/g, " ")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      : null}

      <p className="rounded-md border border-blue-200 bg-blue-50/80 p-3 text-sm text-slate-800 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-slate-200">
        {mnaiFdaDisclaimer()}
      </p>
    </div>
  );
}
