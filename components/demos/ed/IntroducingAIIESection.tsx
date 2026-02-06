"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Check, AlertTriangle } from "lucide-react";
import { clsx } from "clsx";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/Tabs";

const AIIE_ITEMS = [
  "Knowledge graph architecture: Dynamic clinical reasoning on rich patient, context, and utilization signals vs. static Boolean rules.",
  "XGBoost + SHAP explainability: Machine learning tuned on clinical data with transparent feature attributions (AUC 0.876–0.942 in published studies).",
  "Tiered behavioral alerting: Graduated nudge design that targets high-risk, high-waste orders and reduces non-actionable interruptions.",
  "RAND/UCLA + GRADE methodology: Appropriateness thresholds grounded in validated consensus frameworks, updated as evidence evolves.",
  "Cumulative radiation tracking: Longitudinal tracking of prior exposure to protect high-risk patients and surface safer alternatives.",
  "FDA non-device CDS compliant: Designed to meet 21st Century Cures Act § 3060 criteria for non-device clinical decision support.",
];

const TRADITIONAL_ACR_ITEMS = [
  "Static rule-based guidance: Boolean logic tied to a limited number of structured fields; difficult to personalize in real time.",
  "49–96% override rate: Published CDS studies report very high alert override rates, signaling alert fatigue and low trust.",
  "2.4% voluntary adoption: JACR data show very limited voluntary use without regulatory or payer mandates.",
  "44% panel expertise gaps: Methodology reviews highlight incomplete specialty and stakeholder representation on some topics.",
  "62% appeal reversal rate: Majority of imaging denials in some cohorts are overturned on appeal, reflecting misalignment with clinical nuance.",
  "Limited real-time personalization: One-size-fits-all rules that cannot easily incorporate local practice patterns or patient-level risk.",
];

const STATS = [
  { value: "0.876–0.942", label: "AIIE AUC in published studies" },
  { value: "49–96%", label: "Traditional CDS alert override rates" },
  { value: "2.4%", label: "Voluntary ACR CDS adoption (JACR)" },
  { value: "62%", label: "Imaging denial appeal reversal rate (selected cohorts)" },
];

export function IntroducingAIIESection() {
  const [activeTab, setActiveTab] = React.useState("aiie");

  return (
    <section
      id="introducing-aiie"
      className="mt-10 sm:mt-14 pt-10 sm:pt-12 border-t border-arka-light"
      aria-labelledby="introducing-aiie-heading"
    >
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <span
          className="inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase bg-arka-teal/15 text-arka-teal border border-arka-teal/30 mb-4"
          aria-hidden
        >
          Proprietary Technology
        </span>
        <h2
          id="introducing-aiie-heading"
          className="text-2xl sm:text-3xl font-heading font-semibold text-arka-text-dark mb-2"
        >
          Introducing AIIE
        </h2>
        <p className="text-arka-text-dark-muted text-base sm:text-lg max-w-3xl">
          ARKA Imaging Intelligence Engine — a next-generation clinical decision support system
          that transforms how physicians learn and apply imaging appropriateness, beyond static
          ACR Appropriateness Criteria.
        </p>
      </div>

      {/* Tabs for mobile / toggle for comparison */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:inline-flex mb-4">
          <TabsTrigger value="aiie" className="data-[state=active]:bg-arka-teal data-[state=active]:text-white">
            AIIE Technology
          </TabsTrigger>
          <TabsTrigger value="acr" className="data-[state=active]:bg-amber-500 data-[state=active]:text-arka-bg-dark">
            Traditional ACR
          </TabsTrigger>
        </TabsList>

        {/* Dark comparison panel */}
        <div className="rounded-2xl bg-arka-bg-dark border border-arka-deep overflow-hidden">
          {/* Desktop: two columns side by side */}
          <div className="hidden lg:grid lg:grid-cols-2 divide-x divide-arka-deep">
            {/* AIIE column - teal */}
            <div
              className={clsx(
                "p-5 sm:p-6 lg:p-8",
                activeTab === "aiie" && "ring-2 ring-inset ring-arka-teal/50"
              )}
            >
              <h3 className="text-lg font-semibold text-arka-teal mb-4">
                AIIE — ARKA Imaging Intelligence Engine
              </h3>
              <ul className="space-y-3">
                {AIIE_ITEMS.map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm text-arka-text-soft">
                    <Check className="h-5 w-5 shrink-0 text-arka-teal mt-0.5" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            {/* Traditional ACR column - amber */}
            <div
              className={clsx(
                "p-5 sm:p-6 lg:p-8",
                activeTab === "acr" && "ring-2 ring-inset ring-amber-500/50"
              )}
            >
              <h3 className="text-lg font-semibold text-amber-400 mb-4">
                Traditional ACR — Appropriateness Criteria
              </h3>
              <ul className="space-y-3">
                {TRADITIONAL_ACR_ITEMS.map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm text-arka-text-soft">
                    <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Mobile: tab content only */}
          <div className="lg:hidden">
            <TabsContent value="aiie" className="mt-0 p-5 sm:p-6">
              <h3 className="text-lg font-semibold text-arka-teal mb-4">
                AIIE — ARKA Imaging Intelligence Engine
              </h3>
              <ul className="space-y-3">
                {AIIE_ITEMS.map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm text-arka-text-soft">
                    <Check className="h-5 w-5 shrink-0 text-arka-teal mt-0.5" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </TabsContent>
            <TabsContent value="acr" className="mt-0 p-5 sm:p-6">
              <h3 className="text-lg font-semibold text-amber-400 mb-4">
                Traditional ACR — Appropriateness Criteria
              </h3>
              <ul className="space-y-3">
                {TRADITIONAL_ACR_ITEMS.map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm text-arka-text-soft">
                    <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </TabsContent>
          </div>
        </div>
      </Tabs>

      {/* Statistics section */}
      <motion.div
        className="rounded-xl bg-arka-bg-dark border border-arka-deep p-5 sm:p-6"
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.3 }}
      >
        <h3 className="text-lg font-semibold text-arka-text mb-4">By the numbers</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {STATS.map((stat, i) => (
            <div key={i} className="text-center sm:text-left">
              <div className="text-xl sm:text-2xl font-bold text-arka-teal">{stat.value}</div>
              <div className="text-xs sm:text-sm text-arka-text-soft mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
