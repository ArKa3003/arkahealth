"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Brain, Heart, Activity, Bone, Zap } from "lucide-react";
import { clsx } from "clsx";
import { CaseViewer } from "./CaseViewer";
import {
  allCases,
  getCaseById,
  getImagingRatingsForCase,
  imagingOptions,
} from "@/lib/demos/ed";
import type { Case, CaseCategory, DifficultyLevel } from "@/lib/demos/ed/types";

const CATEGORY_CONFIG: Record<
  CaseCategory,
  { icon: React.ComponentType<{ className?: string }>; label: string }
> = {
  "low-back-pain": { icon: Zap, label: "Low Back Pain" },
  headache: { icon: Brain, label: "Headache" },
  "chest-pain": { icon: Heart, label: "Chest Pain" },
  "abdominal-pain": { icon: Activity, label: "Abdominal Pain" },
  "extremity-trauma": { icon: Bone, label: "Extremity Trauma" },
};

const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

function CaseCard({
  caseData,
  index,
  onSelect,
}: {
  caseData: Case;
  index: number;
  onSelect: () => void;
}) {
  const categoryConfig = CATEGORY_CONFIG[caseData.category];
  const CategoryIcon = categoryConfig.icon;

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      onClick={onSelect}
      className={clsx(
        "w-full text-left arka-card rounded-xl p-5 border border-arka-primary/20",
        "hover:border-arka-cyan/40 hover:shadow-glow-sm transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-arka-cyan focus:ring-offset-2 focus:ring-offset-arka-bg-dark"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-arka-cyan/20 text-arka-cyan">
          <CategoryIcon className="w-3 h-3" />
          {categoryConfig.label}
        </span>
        <span className="text-xs text-arka-text-soft">
          {DIFFICULTY_LABELS[caseData.difficulty]}
        </span>
      </div>
      <h3 className="font-semibold text-arka-text line-clamp-2 mb-2">{caseData.title}</h3>
      <p className="text-sm text-arka-text-muted line-clamp-2 italic">
        &ldquo;{caseData.chief_complaint}&rdquo;
      </p>
      <div className="mt-3 flex items-center gap-2 text-xs text-arka-text-soft">
        <BookOpen className="w-3.5 h-3.5" />
        Start case
      </div>
    </motion.button>
  );
}

export function EdDemoContent() {
  const [selectedCaseId, setSelectedCaseId] = React.useState<string | null>(null);

  const selectedCase = selectedCaseId ? getCaseById(selectedCaseId) : null;
  const imagingRatings = selectedCase
    ? getImagingRatingsForCase(selectedCase.id)
    : [];

  const handleBack = () => setSelectedCaseId(null);

  return (
    <AnimatePresence mode="wait">
      {selectedCase ? (
        <motion.div
          key="viewer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <CaseViewer
            caseData={selectedCase}
            imagingOptions={imagingOptions}
            imagingRatings={imagingRatings}
            onBack={handleBack}
          />
        </motion.div>
      ) : (
        <motion.div
          key="list"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="space-y-6"
        >
          <h2 className="text-xl font-semibold text-arka-text">Case Library</h2>
          <p className="text-arka-text-muted text-sm sm:text-base max-w-2xl">
            Choose a clinical case to practice imaging appropriateness. Each case includes a
            vignette, imaging options, and evidence-based feedback.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {allCases.map((caseData, index) => (
              <CaseCard
                key={caseData.id}
                caseData={caseData}
                index={index}
                onSelect={() => setSelectedCaseId(caseData.id)}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
