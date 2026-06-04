import type { Metadata } from "next";
import { ActionPlanViewer } from "@/components/action-plan/ActionPlanViewer";

const PDF_PATH = "/docs/ARKA_Action_Plan_ver8.pdf";

export const metadata: Metadata = {
  title: "Action Plan",
  description:
    "ARKA Health Comprehensive Action Plan — strategic ROI analysis, FDA non-device CDS pathway, AIIE methodology, and implementation roadmap.",
  openGraph: {
    title: "ARKA Action Plan",
    description:
      "Comprehensive Action Plan for the ARKA Imaging Intelligence Platform (ARKA-CLIN | ARKA-ED | ARKA-INS).",
  },
};

export default function ActionPlanPage() {
  return (
    <section className="bg-arka-bg-dark">
      {/* Slim header strip — matches privacy/terms aesthetic, does not compete with the document */}
      <div className="mx-auto max-w-6xl px-4 pb-4 pt-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-arka-cyan/80">
              ARKA Health · Version 6.0 · February 2026
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-arka-text sm:text-3xl">
              Comprehensive Action Plan
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-arka-text-soft">
              Three-Phase Platform — ARKA-CLIN · ARKA-ED · ARKA-INS — powered by the ARKA Imaging
              Intelligence Engine (AIIE).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={PDF_PATH}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-arka-cyan/40 bg-arka-cyan/5 px-3 py-1.5 text-sm font-medium text-arka-cyan transition hover:border-arka-cyan/60 hover:bg-arka-cyan/10"
            >
              Open in new tab
            </a>
            <a
              href={PDF_PATH}
              download
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-arka-text-muted transition hover:border-white/20 hover:text-arka-text"
            >
              Download PDF
            </a>
          </div>
        </div>
      </div>

      {/* PDF viewer */}
      <ActionPlanViewer src={PDF_PATH} />
    </section>
  );
}
