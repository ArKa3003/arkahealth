"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, MapPin } from "lucide-react";
import { clsx } from "clsx";
import { RURAL_CASES } from "@/lib/demos/rural/training/rural-cases";
import { RuralCaseViewer } from "@/components/demos/rural/training/RuralCaseViewer";
import { FacilityContextCard } from "@/components/demos/rural/training/FacilityContextCard";
import { CMETracker } from "@/components/demos/rural/training/CMETracker";
import { CurriculumChecklist } from "@/components/demos/rural/training/CurriculumChecklist";
import { RuralDashboardPanel } from "@/components/demos/rural/shared/RuralDashboardPanel";
import { RuralStatBanner } from "@/components/demos/rural/shared/RuralStatBanner";
import { Button } from "@/components/demos/rural/shared/ui/Button";
import type { RuralCase, RuralCaseCategory } from "@/lib/demos/rural/types";

const CATEGORY_LABELS: Record<RuralCaseCategory, string> = {
  "resource-constrained": "Resource constrained",
  "scope-expansion": "Scope expansion",
  "mobile-unit-optimization": "Mobile unit",
  "transfer-decision": "Transfer decision",
  "pocus-application": "POCUS",
  "emergency-triage": "Emergency triage",
};

const DIFFICULTY_LABELS = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
} as const;

function RuralCaseCard({
  caseData,
  index,
  onSelect,
}: {
  caseData: RuralCase;
  index: number;
  onSelect: () => void;
}) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      onClick={onSelect}
      className={clsx(
        "w-full rounded-xl border border-arka-primary/15 bg-white p-5 text-left shadow-sm transition-all duration-200",
        "hover:border-arka-teal/40 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-arka-teal focus:ring-offset-2 focus:ring-offset-arka-bg-light"
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <span className="inline-flex max-w-[85%] items-center gap-1.5 rounded-full bg-arka-teal/10 px-2 py-0.5 text-xs font-medium text-arka-teal">
          <MapPin className="h-3 w-3 shrink-0" aria-hidden />
          <span className="truncate">{CATEGORY_LABELS[caseData.category]}</span>
        </span>
        <span className="shrink-0 text-xs font-medium text-arka-text-dark-muted">
          {DIFFICULTY_LABELS[caseData.difficulty]}
        </span>
      </div>
      <h3 className="mb-2 font-semibold text-arka-text-dark line-clamp-2">{caseData.title}</h3>
      <p className="line-clamp-2 text-sm italic text-arka-text-dark-muted">
        &ldquo;{caseData.patientVignette.slice(0, 140)}
        {caseData.patientVignette.length > 140 ? "…" : ""}&rdquo;
      </p>
      <div className="mt-3 flex items-center gap-2 text-xs font-medium text-arka-teal">
        <BookOpen className="h-3.5 w-3.5" aria-hidden />
        Start case
      </div>
    </motion.button>
  );
}

export function RuralTrainingHub() {
  const [selectedCaseId, setSelectedCaseId] = React.useState<string | null>(null);
  const selectedCase = selectedCaseId
    ? RURAL_CASES.find((c) => c.id === selectedCaseId) ?? null
    : null;

  const totalCme = RURAL_CASES.reduce((sum, c) => sum + c.cmeCredits, 0);

  return (
    <div className="space-y-6">
      <RuralDashboardPanel>
        <RuralStatBanner
          stats={[
            { label: "Rural cases", value: String(RURAL_CASES.length), hint: "Demo" },
            { label: "Library CME", value: `${totalCme.toFixed(1)}`, hint: "Illustrative" },
            { label: "Est. time", value: `${RURAL_CASES[0]?.estimatedCompletionMinutes ?? "—"}`, hint: "Synthetic" },
          ]}
        />
      </RuralDashboardPanel>

      <RuralDashboardPanel delay={0.05}>
        <CurriculumChecklist />
      </RuralDashboardPanel>

      <AnimatePresence mode="wait">
        {!selectedCase ? (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div>
              <h2 className="font-heading text-xl font-semibold text-arka-text-dark">Case library</h2>
              <p className="mt-2 max-w-2xl text-sm text-arka-text-dark-muted sm:text-base">
                Practice imaging decisions under rural resource constraints. Each case includes facility
                context, ordering, and structured feedback aligned with local vs. referral-level options.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {RURAL_CASES.map((c, index) => (
                <RuralCaseCard
                  key={c.id}
                  caseData={c}
                  index={index}
                  onSelect={() => setSelectedCaseId(c.id)}
                />
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="viewer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-6 lg:grid lg:grid-cols-12 lg:items-start"
          >
            <aside className="space-y-4 lg:col-span-3">
              <Button variant="secondary" className="w-full sm:w-auto" onClick={() => setSelectedCaseId(null)}>
                ← Back to library
              </Button>

              <div className="rounded-xl border border-arka-primary/10 bg-white p-3">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-arka-text-dark-muted">
                  Cases
                </p>
                <ul className="space-y-1">
                  {RURAL_CASES.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedCaseId(c.id)}
                        className={clsx(
                          "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                          c.id === selectedCase.id
                            ? "bg-arka-teal/10 font-medium text-arka-teal"
                            : "text-arka-text-dark-muted hover:bg-arka-bg-light/80 hover:text-arka-text-dark"
                        )}
                      >
                        <span className="line-clamp-2">{c.title}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <FacilityContextCard caseData={selectedCase} />
              <CMETracker />
            </aside>

            <div className="min-w-0 lg:col-span-9">
              <RuralCaseViewer
                key={selectedCase.id}
                caseData={selectedCase}
                onBack={() => setSelectedCaseId(null)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
