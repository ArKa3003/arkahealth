import type { Metadata } from "next";
import Link from "next/link";
import { FileText, ShieldCheck } from "lucide-react";

import { DocsPageLayout } from "@/components/docs/DocsPageLayout";
import { routes } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Trust Center",
  description:
    "ARKA regulatory posture — FDA Pre-Submission package summary, evidence attachments, and links to in-repo regulatory documentation.",
};

const TOC = [
  { id: "overview", label: "Overview", level: 2 },
  { id: "function-map", label: "Function map", level: 2 },
  { id: "arka-clin", label: "ARKA-CLIN (Non-Device CDS)", level: 2 },
  { id: "arka-ins", label: "ARKA-INS (administrative support)", level: 2 },
  { id: "evidence", label: "Supporting evidence", level: 2 },
  { id: "pre-filing", label: "Pre-filing gates", level: 2 },
  { id: "docs", label: "Documentation", level: 2 },
] as const;

/**
 * Trust center — summarizes regulatory posture from `docs/regulatory` and `docs/regulatory-evidence`.
 */
export default function TrustPage() {
  return (
    <DocsPageLayout
      title="Trust center"
      description="Regulatory posture for the ARKA platform, sourced from the in-repo FDA Pre-Submission (Q-Sub) package and supporting evidence. This page requests FDA feedback; it does not represent FDA approval, clearance, or endorsement."
      lastUpdated="June 9, 2026"
      toc={[...TOC]}
    >
      <section id="overview" className="scroll-mt-24">
        <h2>Overview</h2>
        <p>
          ARKA Health, Inc. maintains a Pre-Submission (Q-Sub) package (version 1.0, June 9, 2026)
          requesting FDA written feedback on two software functions: <strong>ARKA-CLIN</strong>,
          designed to meet the four Non-Device Clinical Decision Support criteria under FD&amp;C Act
          §520(o)(1)(E), and <strong>ARKA-INS</strong>, administrative-support software under
          §520(o)(1)(A). A reference-image viewer is documented as a separate display function
          outside the scope of that submission.
        </p>
        <p>
          Package manifest:{" "}
          <code className="text-sm">docs/regulatory/q-sub-draft/00_README.md</code> · Final PDFs:{" "}
          <code className="text-sm">docs/regulatory/q-sub-final/</code>
        </p>
      </section>

      <section id="function-map" className="scroll-mt-24">
        <h2>Function map</h2>
        <p>
          Per the multiple-function analysis (Document 05), ARKA is a single platform with distinct
          software functions assessed separately:
        </p>
        <ul>
          <li>
            <strong>ARKA-CLIN</strong> — imaging-appropriateness recommendations from structured
            data; ranked, evidence-cited options with reviewable basis. Regulatory basis presented:
            §520(o)(1)(E) Non-Device CDS (four criteria). Status requested: FDA concurrence
            (Question 1).
          </li>
          <li>
            <strong>ARKA-INS</strong> — benefit-eligibility determination, claims-based
            utilization/cost analysis, prior-authorization documentation (Da Vinci CRD/DTR/PAS), cost
            transparency, and scheduling. Regulatory basis presented: §520(o)(1)(A) administrative
            support. Status requested: FDA concurrence (Question 2).
          </li>
          <li>
            <strong>Reference viewer</strong> — displays previously acquired DICOM studies as
            non-diagnostic thumbnails. Documented as out of scope, walled off by{" "}
            <code className="text-sm">docs/SCOPE_BOUNDARY.md</code> and CI import guards.
          </li>
        </ul>
      </section>

      <section id="arka-clin" className="scroll-mt-24">
        <h2>ARKA-CLIN (Non-Device CDS)</h2>
        <p>
          Intended use (Document 03): ARKA-CLIN is intended for licensed health care professionals to
          support selection of clinically appropriate diagnostic imaging using structured clinical
          data. It presents ranked, evidence-cited imaging options drawn from published clinical
          guidelines and peer-reviewed literature, with the basis available for independent review.
          It does not acquire, process, or analyze medical images or physiological signals; does not
          provide time-critical alerts or triage; and does not place, cancel, or block orders.
        </p>
        <p>
          Architecture (Document 02): rules-first engine — every recommendation is anchored to a
          published guideline; if no guideline-anchored rule fires, ARKA-CLIN returns no card.
          Optional XGBoost refinement with SHAP is secondary and labeled; the system falls back to
          rules-only output when the model is unavailable. Inputs are structured FHIR R4 prefetch
          only; CI guards fail the build if image- or signal-processing code enters in-scope CDS
          paths.
        </p>
        <p>
          Open FDA questions (Document 04) include concurrence on Non-Device CDS status, change-control
          expectations for the rule library and model weights, and sufficiency of current synthetic
          validation evidence (~74% three-class accuracy on a synthetic, ACR-aligned cohort per
          Document 04 — not presented as a clinical-performance claim).
        </p>
      </section>

      <section id="arka-ins" className="scroll-mt-24">
        <h2>ARKA-INS (administrative support)</h2>
        <p>
          ARKA-INS is intended for health care providers and qualified staff to determine
          health-benefit eligibility, analyze historical claims data, support prior-authorization
          documentation, and present cost-transparency and scheduling information — administrative
          functions under §520(o)(1)(A), not clinical diagnosis or treatment recommendations
          (Document 03). Detailed feature-level support is in Document 06 (
          <code className="text-sm">06_INS_administrative_support_memo.md</code>).
        </p>
      </section>

      <section id="evidence" className="scroll-mt-24">
        <h2>Supporting evidence</h2>
        <p>Attachments referenced in the Q-Sub package manifest:</p>
        <ul>
          <li>
            Model card — <code className="text-sm">ml-service/MODEL_CARD.md</code> (Criteria 2 and
            4)
          </li>
          <li>
            Scope boundary — <code className="text-sm">docs/SCOPE_BOUNDARY.md</code> (Criterion 1;
            viewer fenced out of CDS)
          </li>
          <li>
            CI enforcement — <code className="text-sm">.github/workflows/go-live.yml</code>,{" "}
            <code className="text-sm">scripts/regulatory-checks.ts</code>,{" "}
            <code className="text-sm">scripts/lint-scope-boundary.ts</code>,{" "}
            <code className="text-sm">scripts/lint-cards.ts</code>
          </li>
          <li>
            Sandbox screenshots (5) —{" "}
            <code className="text-sm">docs/regulatory-evidence/sandbox-screenshots/</code>
          </li>
          <li>
            Clinical sign-off log — <code className="text-sm">docs/CLINICAL_SIGN_OFF_LOG.md</code>{" "}
            (pre-filing gate: in progress per manifest)
          </li>
          <li>
            On-card FDA disclosure (v1.2.0) —{" "}
            <code className="text-sm">lib/compliance/fda-disclosure.ts</code>
          </li>
          <li>
            Render health snapshot —{" "}
            <code className="text-sm">docs/regulatory-evidence/render-health-2026-05-26.json</code>{" "}
            (model loaded, catalog hashes recorded)
          </li>
        </ul>
      </section>

      <section id="pre-filing" className="scroll-mt-24">
        <h2>Pre-filing gates</h2>
        <p>From the Q-Sub package manifest — complete before submitting:</p>
        <ol>
          <li>
            <strong>Clinician sign-off — IN PROGRESS.</strong> At least one licensed clinician must
            review the rule library, citations, feature catalogue, and card language and sign a
            dated entry in <code className="text-sm">docs/CLINICAL_SIGN_OFF_LOG.md</code>.
          </li>
          <li>CDRH Portal account registered under the sponsor contact on file.</li>
          <li>PreSTAR2 v3.0 completed with &quot;eSTAR COMPLETE&quot; status before upload.</li>
          <li>
            Recommended: run FDA&apos;s Digital Health Policy Navigator for ARKA-CLIN and ARKA-INS
            separately and retain screenshots.
          </li>
        </ol>
        <p className="text-sm text-arka-slate-500">
          This package requests FDA feedback; it must never be described as FDA approval, clearance,
          registration, or endorsement.
        </p>
      </section>

      <section id="docs" className="scroll-mt-24">
        <h2>Documentation</h2>
        <div className="not-prose grid gap-4 sm:grid-cols-2">
          <Link
            href={routes.regulatoryRationale}
            className="flex gap-3 rounded-radius-lg border border-border-subtle bg-surface-raised p-4 shadow-elevation-1 transition hover:shadow-elevation-2"
          >
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-arka-teal-600" aria-hidden />
            <span>
              <span className="block font-semibold text-arka-slate-900">Regulatory rationale memo</span>
              <span className="mt-1 block text-sm text-arka-slate-600">
                §520(o)(1)(E) criteria analysis for ARKA-CLIN.
              </span>
            </span>
          </Link>
          <Link
            href={routes.featureCatalog}
            className="flex gap-3 rounded-radius-lg border border-border-subtle bg-surface-raised p-4 shadow-elevation-1 transition hover:shadow-elevation-2"
          >
            <FileText className="mt-0.5 h-5 w-5 shrink-0 text-arka-teal-600" aria-hidden />
            <span>
              <span className="block font-semibold text-arka-slate-900">Feature rationale catalogue</span>
              <span className="mt-1 block text-sm text-arka-slate-600">
                Per-feature evidence for FDA Criterion 4 independent review.
              </span>
            </span>
          </Link>
          <Link
            href={routes.modelCard}
            className="flex gap-3 rounded-radius-lg border border-border-subtle bg-surface-raised p-4 shadow-elevation-1 transition hover:shadow-elevation-2"
          >
            <FileText className="mt-0.5 h-5 w-5 shrink-0 text-arka-teal-600" aria-hidden />
            <span>
              <span className="block font-semibold text-arka-slate-900">ML model card</span>
              <span className="mt-1 block text-sm text-arka-slate-600">
                XGBoost refinement model — training data, metrics, limitations.
              </span>
            </span>
          </Link>
          <Link
            href={routes.cdsHooksDemoValidation}
            className="flex gap-3 rounded-radius-lg border border-border-subtle bg-surface-raised p-4 shadow-elevation-1 transition hover:shadow-elevation-2"
          >
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-arka-teal-600" aria-hidden />
            <span>
              <span className="block font-semibold text-arka-slate-900">Validation dashboard</span>
              <span className="mt-1 block text-sm text-arka-slate-600">
                Measured sandbox metrics — synthetic cohort accuracy published today.
              </span>
            </span>
          </Link>
        </div>
        <p className="mt-6 text-sm text-arka-slate-500">
          Full Q-Sub draft markdown:{" "}
          <code className="text-xs">docs/regulatory/q-sub-draft/</code> · Final PDFs:{" "}
          <code className="text-xs">docs/regulatory/q-sub-final/</code>
        </p>
      </section>
    </DocsPageLayout>
  );
}
