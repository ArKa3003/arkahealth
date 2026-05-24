import { describe, expect, it } from "vitest";

import { evaluateStat } from "@/lib/aiie/stat-gate";
import { OVERUSE_RULES } from "@/lib/aiie/overuse-patterns";
import type { RedundancyAssessment } from "@/lib/aiie/redundancy";
import { buildAlternativeSiteCard } from "@/lib/cards/alternative-site-card";
import { buildCoverageCard } from "@/lib/cards/coverage-card";
import { buildDuplicateOrderCard } from "@/lib/cards/duplicate-order-card";
import { buildGoldCardCard } from "@/lib/cards/gold-card-card";
import { buildOOPCard } from "@/lib/cards/oop-card";
import { buildOveruseCard } from "@/lib/cards/overuse-soft-block-card";
import { buildStatReclassCard } from "@/lib/cards/stat-reclass-card";
import {
  buildAppointmentCheaperAlternativeCard,
  buildAppointmentSiteOptimalCard,
  buildCoverageUnavailableCard,
  buildCRDCards,
  buildOrderSignCriticalBlockCard,
  buildOrderSignLowRiskConfirmationCard,
  buildOrderSignModerateRiskCard,
} from "@/lib/davinci/crd";
import { convertResultToCDSCards, evaluateImaging } from "@/lib/demos/clin/evaluate-imaging";
import type { ClinicalScenario } from "@/lib/demos/clin/types";
import type { INSAuthorizationBand } from "@/lib/aiie/denial-risk";
import type { AIIEScore, GoldCardStatus, OOPEstimate } from "@/lib/types/aiie";
import type { CDSCard } from "@/lib/types/cds-hooks";
import type { ParsedCoverage } from "@/lib/fhir/coverage";
import type { PatientRecordSnapshot } from "@/lib/types/record-snapshot";
import type { ServiceRequest } from "@/lib/types/fhir";

function emptySnapshot(): PatientRecordSnapshot {
  return {
    patientHash: "sandbox-hash",
    capturedAtIso: new Date().toISOString(),
    ttlSeconds: 1800,
    problems: [],
    medications: [],
    allergies: [],
    encounters: [],
    priorImaging: [],
    priorReports: [],
    labs: [],
    vitals: [],
    notes: [],
    codingContext: { activeIcd10: [], activeCpt: [] },
  };
}

const baseAiieScore: AIIEScore = {
  clinicalScore: 7,
  denialRisk: 3,
  confidence: 0.85,
  factors: [
    {
      id: "clinical_indication",
      name: "Clinical indication strength",
      weight: 0.25,
      contribution: 0.42,
      evidenceCitation:
        "Choosing Wisely / ACR appropriateness criteria on redundant imaging in stable presentations.",
    },
    {
      id: "guideline_alignment",
      name: "Guideline alignment",
      weight: 0.2,
      contribution: -0.15,
      evidenceCitation:
        "GRADE evidence-to-decision tables favoring conservative care before advanced imaging when appropriate.",
    },
  ],
  narrativeRationale: "Sandbox narrative for medical-basis presence test.",
};

const parsedCoverage: ParsedCoverage = {
  payerId: "Organization/aetna",
  payerName: "Aetna",
  confidence: 0.9,
};

const goldCardEligible: GoldCardStatus = {
  eligible: true,
  score: 92,
  approvalRate: 0.96,
  sampleSize: 48,
};

const oopEstimate: OOPEstimate = {
  estimatedPatientResponsibility: 450,
  deductibleRemaining: 1800,
  coinsurance: 0.2,
  copay: 0,
  inNetworkNegotiatedRate: 2200,
  confidence: 0.8,
  assumptions: ["Sandbox OOP estimate"],
  alternativeSiteRecommended: true,
  goodFaithEstimateCompliant: true,
  cashPayComparator: 380,
};

function crdCardsFor(action: INSAuthorizationBand, denialRisk: number, gold: GoldCardStatus | null): CDSCard[] {
  return buildCRDCards({
    aiie: baseAiieScore,
    denialRisk,
    action,
    goldCard: gold,
    oopEstimate,
    alternatives: [
      {
        id: "site-1",
        name: "Community MRI Center",
        distanceMiles: 8,
        qualityScore: 88,
        waitTimeDays: 3,
        cashPrice: 280,
      },
    ],
    coverage: parsedCoverage,
    order: { id: "sandbox-order", cpt: "70553" },
    provider: { name: "Sandbox MD" },
    currentSiteName: "Hospital outpatient imaging",
    currentSitePatientResponsibility: 450,
    paHistorySimilar: { approvedPercent: 88, sampleSize: 120 },
  });
}

/**
 * Collects CDS cards produced by the same builders exercised in `scripts/test-cds-sandbox.ts`
 * (offline validation + representative CRD / order-sign / appointment surfaces).
 */
function collectSandboxCards(): CDSCard[] {
  const cards: CDSCard[] = [];

  const statGate = evaluateStat({
    snapshot: emptySnapshot(),
    order: { modality: "CT", procedure: "CT head without contrast", bodyPart: "head" },
    complaint: "chronic headache",
    priority: "stat",
    patientAgeYears: 42,
  });
  const sr: ServiceRequest = {
    resourceType: "ServiceRequest",
    id: "offline-stat-sr",
    intent: "order",
    priority: "stat",
    subject: { reference: "Patient/sandbox-patient-1" },
  };
  cards.push(buildStatReclassCard({ gate: statGate, serviceRequest: sr }));

  const redundancy: RedundancyAssessment = {
    severity: "high",
    reason: "Prior lumbar MRI within 14 days.",
    priorStudyId: "img-offline-1",
    daysSincePrior: 14,
    sameCpt: true,
    sameRegionDifferentModality: false,
    priorNormalWithoutRedFlags: true,
    suggestedAction: "BLOCK_SOFT",
  };
  cards.push(buildDuplicateOrderCard(redundancy));
  cards.push(
    buildOveruseCard(OVERUSE_RULES[0], {
      order: { modality: "MRI", procedure: "MRI lumbar spine", bodyPart: "lumbar", cpt: "72148" },
    }),
  );

  cards.push(...crdCardsFor("AUTO_APPROVE", 2, goldCardEligible));
  cards.push(...crdCardsFor("CLINICAL_REVIEW", 5, null));
  cards.push(...crdCardsFor("LIKELY_DENY", 8, null));

  cards.push(buildCoverageUnavailableCard());
  cards.push(
    buildOrderSignCriticalBlockCard({ denialRisk: 8, cpt: "74177", payerId: "Organization/aetna" }),
  );
  cards.push(
    buildOrderSignLowRiskConfirmationCard({
      cpt: "72148",
      payerId: "Organization/aetna",
      orderId: "sandbox-order",
    }),
  );
  cards.push(
    buildOrderSignModerateRiskCard({ denialRisk: 5, cpt: "70553", payerId: "Organization/aetna" }),
  );
  cards.push(
    buildAppointmentSiteOptimalCard({
      siteLabel: "Hospital outpatient imaging",
      currentPatientUsd: 450,
      bestAlternativeUsd: 420,
    }),
  );
  cards.push(
    buildAppointmentCheaperAlternativeCard({
      currentSiteLabel: "Hospital outpatient imaging",
      cheaperSiteName: "Community MRI Center",
      currentPatientUsd: 450,
      cheaperPatientUsd: 280,
      cpt: "70553",
      appointmentId: "sandbox-appt-1",
      suggestedSiteId: "site-1",
    }),
  );

  const altOnly = buildAlternativeSiteCard(
    { name: "Hospital", estimatedPatientResponsibility: 600 },
    [{ id: "s2", name: "Low-cost imaging", cashPrice: 300 }],
  );
  if (altOnly) {
    cards.push(altOnly);
  }

  cards.push(buildCoverageCard(baseAiieScore, 3, "LIKELY_APPROVE", parsedCoverage));
  cards.push(buildGoldCardCard(goldCardEligible, "Sandbox MD", "72148"));
  cards.push(buildOOPCard(oopEstimate, parsedCoverage));

  const clinScenario: ClinicalScenario = {
    patientId: "p1",
    age: 45,
    sex: "female",
    chiefComplaint: "Low back pain",
    clinicalHistory: "6 weeks duration",
    symptoms: ["pain"],
    duration: "6 weeks",
    redFlags: [{ flag: "fever", present: false }],
    proposedImaging: {
      modality: "MRI",
      bodyPart: "lumbar spine",
      indication: "Low back pain without red flags",
      urgency: "routine",
    },
  };
  const clinResult = evaluateImaging(clinScenario);
  for (const hookCard of convertResultToCDSCards(clinResult)) {
    cards.push(hookCard as CDSCard);
  }

  return cards;
}

describe("medical basis presence on sandbox CDS cards", () => {
  it("every card from the sandbox harness has medicalBasis.label and medicalBasis.citationId", () => {
    const cards = collectSandboxCards();
    expect(cards.length).toBeGreaterThan(0);

    for (const card of cards) {
      expect(card.medicalBasis, `missing medicalBasis on card ${card.uuid ?? card.summary}`).toBeDefined();
      expect(card.medicalBasis?.label.trim(), `empty label on ${card.uuid ?? card.summary}`).not.toBe("");
      expect(
        card.medicalBasis?.citationId.trim(),
        `empty citationId on ${card.uuid ?? card.summary}`,
      ).not.toBe("");
    }
  });
});
