/**
 * ARKA-INS reviewer queue: deterministic mock cases and sort order (SLA → denial risk → submitted time).
 */

import type { ReviewerQueueCase } from "@/lib/ins/reviewer-types";

/** Demo provider UUID used when no `providerId` query is passed. */
export const REVIEWER_DEMO_PROVIDER_ID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

/** Metadata marker for `ins_validation_events` rows from this dashboard. */
export const RBM_REVIEWER_EVENT_SOURCE = "rbm_reviewer";

/**
 * Sorts cases by SLA urgency (soonest deadline first), then denial risk (desc), then submitted time (asc).
 *
 * @param cases - Queue rows to order.
 */
export function sortReviewerQueue(cases: ReviewerQueueCase[]): ReviewerQueueCase[] {
  return [...cases].sort((a, b) => {
    const slaA = new Date(a.slaDeadlineAt).getTime();
    const slaB = new Date(b.slaDeadlineAt).getTime();
    if (slaA !== slaB) return slaA - slaB;
    if (a.denialRisk !== b.denialRisk) return b.denialRisk - a.denialRisk;
    return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
  });
}

function hoursFromNow(hours: number): string {
  return new Date(Date.now() + hours * 3600000).toISOString();
}

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 3600000).toISOString();
}

/**
 * Builds a deterministic mock queue for the reviewer UI when no live feed exists.
 *
 * @param providerId - Provider UUID to attach to each case.
 */
export function buildMockReviewerQueue(providerId: string): ReviewerQueueCase[] {
  const base: ReviewerQueueCase[] = [
    {
      id: "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01",
      patientInitials: "M.R.",
      cptCode: "72148",
      payerId: "humana",
      payerDisplay: "Humana",
      providerId,
      submittedAt: hoursAgo(5),
      slaDeadlineAt: hoursFromNow(8),
      expedited: true,
      denialRisk: 72,
      aiieRecommendationLabel: "Approve",
      aiieRecommendationConfidencePct: 94,
      clinical: {
        score: 7,
        positiveFactors: [
          { id: "clinical_indication", label: "Clinical indication documented", contribution: 1.4 },
          { id: "guideline_alignment", label: "Guideline-aligned indication", contribution: 1.1 },
        ],
        negativeFactors: [
          { id: "prior_imaging_redundancy", label: "Recent comparable study", contribution: -0.9 },
        ],
        guidelineCitations: [
          "ACR Appropriateness Criteria — Low back pain (variant 4).",
          "Payer LCD — Lumbar spine MRI indications.",
        ],
      },
      coverage: {
        planName: "PPO Gold",
        memberIdMasked: "••••8821",
        paRequired: true,
        goldCardEligible: false,
        goldCardScore: 62,
        parsedSummary: "In-network PPO; imaging PA required for advanced MRI; no gold card.",
      },
      oop: {
        deductibleRemainingUsd: 640,
        coinsurancePct: 20,
        estimatedPatientPayUsd: 312,
        cashPayComparatorUsd: 580,
        alternativeSites: [
          { name: "Regional Imaging Center", distanceMiles: 14, cashPriceUsd: 550 },
          { name: "Freestanding MRI North", distanceMiles: 22, cashPriceUsd: 520 },
        ],
      },
      dtr: {
        items: [
          { linkId: "indication", text: "Document primary indication for lumbar MRI", type: "string", prefilled: "Chronic radicular pain 6+ weeks" },
          { linkId: "conservative", text: "Conservative care completed ≥4 weeks", type: "boolean", prefilled: "yes" },
          { linkId: "redflags", text: "Review red-flag symptoms", type: "boolean", prefilled: "no" },
        ],
      },
      socialProof: { approved: 47, denied: 3 },
      aiieNarrative:
        "Score 7/9: indication and documentation support MRI; minor redundancy factor from prior lumbar CT 10 months ago mitigated by new radicular pattern. Recommend approval with note on conservative trial.",
    },
    {
      id: "b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a02",
      patientInitials: "A.L.",
      cptCode: "74177",
      payerId: "uhc",
      payerDisplay: "UnitedHealthcare",
      providerId,
      submittedAt: hoursAgo(18),
      slaDeadlineAt: hoursFromNow(30),
      expedited: false,
      denialRisk: 41,
      aiieRecommendationLabel: "Approve",
      aiieRecommendationConfidencePct: 81,
      clinical: {
        score: 6,
        positiveFactors: [
          { id: "clinical_indication", label: "Acute abdominal symptoms", contribution: 1.2 },
        ],
        negativeFactors: [
          { id: "patient_risk_factors", label: "Limited risk documentation", contribution: -0.6 },
        ],
        guidelineCitations: ["ACR — Acute abdominal pain with suspected diverticulitis."],
      },
      coverage: {
        planName: "Choice Plus",
        memberIdMasked: "••••4410",
        paRequired: true,
        goldCardEligible: true,
        goldCardScore: 88,
        parsedSummary: "Gold card eligible for outpatient CT abdomen/pelvis with contrast.",
      },
      oop: {
        deductibleRemainingUsd: 0,
        coinsurancePct: 10,
        estimatedPatientPayUsd: 89,
        cashPayComparatorUsd: 420,
        alternativeSites: [
          { name: "Outpatient Imaging Pavilion", distanceMiles: 6, cashPriceUsd: 395 },
        ],
      },
      dtr: {
        items: [
          { linkId: "contrast", text: "Contrast allergy screening", type: "boolean", prefilled: "no" },
          { linkId: "labs", text: "Recent creatinine within 90 days", type: "string", prefilled: "1.0 mg/dL — 14d ago" },
        ],
      },
      socialProof: { approved: 32, denied: 1 },
      aiieNarrative:
        "Score 6/9: clinically appropriate for suspected diverticulitis; gold card pathway likely applies — verify attestation on file.",
    },
    {
      id: "b3eebc99-9c0b-4ef8-bb6d-6bb9bd380a03",
      patientInitials: "K.T.",
      cptCode: "70553",
      payerId: "bcbs",
      payerDisplay: "Blue Cross",
      providerId,
      submittedAt: hoursAgo(2),
      slaDeadlineAt: hoursFromNow(20),
      expedited: false,
      denialRisk: 58,
      aiieRecommendationLabel: "Pend",
      aiieRecommendationConfidencePct: 61,
      clinical: {
        score: 5,
        positiveFactors: [{ id: "guideline_alignment", label: "Headache with focal neuro findings", contribution: 0.9 }],
        negativeFactors: [
          { id: "clinical_indication", label: "Indication narrative incomplete", contribution: -1.2 },
          { id: "prior_imaging_redundancy", label: "Prior MRI brain 4 months ago", contribution: -0.8 },
        ],
        guidelineCitations: ["ACR — Headache / neurologic deficit."],
      },
      coverage: {
        planName: "HMO Standard",
        memberIdMasked: "••••2290",
        paRequired: true,
        goldCardEligible: false,
        parsedSummary: "PA required; no gold card — documentation gaps flagged.",
      },
      oop: {
        deductibleRemainingUsd: 1200,
        coinsurancePct: 20,
        estimatedPatientPayUsd: 780,
        cashPayComparatorUsd: 890,
        alternativeSites: [
          { name: "Hospital outpatient MRI", distanceMiles: 3, cashPriceUsd: 950 },
          { name: "Imaging Associates", distanceMiles: 11, cashPriceUsd: 820 },
        ],
      },
      dtr: {
        items: [
          { linkId: "neuro", text: "Document focal neuro exam findings", type: "string" },
          { linkId: "prior", text: "Explain medical necessity vs prior MRI", type: "string" },
        ],
      },
      socialProof: { approved: 18, denied: 5 },
      aiieNarrative:
        "Score 5/9: borderline appropriateness — focal findings help, but overlap with recent MRI raises policy risk. Pend for clarified neuro documentation or peer-to-peer.",
    },
  ];

  return sortReviewerQueue(base);
}
