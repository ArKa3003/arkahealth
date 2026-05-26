import type {
  RAASInput,
  RAASResult,
  CASScore,
  RAASScore,
  TriageRecommendation,
  AlternativePathway,
  ResourceFactor,
  UrgencyClassification,
  CostEstimate,
  LocalFirstProtocol,
  MobileUnitProtocol,
  TransferProtocol,
  DeferProtocol,
  ImagingModality,
  FacilityProfile,
} from "../types";
import { TYPICAL_RURAL_EQUIPMENT } from "../constants";

/**
 * Calculate the Clinical Appropriateness Score (CAS).
 * This wraps the existing ARKA-CLIN AIIE scoring engine logic and maps it
 * to the rural context. In production, this would call the real AIIE engine.
 */
function calculateCAS(input: RAASInput): CASScore {
  const { clinicalScenario } = input;
  const { proposedImaging, chiefComplaint, redFlags } = clinicalScenario;

  // Simplified scoring logic for demo — in production, delegate to
  // lib/demos/clin/aiie/scoring-engine.ts -> calculateAIIEScore()
  let baseScore = 5; // Start at "may be appropriate"

  // Red flags increase appropriateness
  const activeRedFlags = redFlags.filter((rf) => rf.present);
  if (activeRedFlags.length > 0) baseScore += Math.min(activeRedFlags.length, 3);

  // Symptom duration affects scoring
  const durationMatch = clinicalScenario.duration.match(/(\d+)/);
  const durationWeeks = durationMatch ? parseInt(durationMatch[1]!, 10) : 0;
  if (proposedImaging.urgency === "stat") baseScore += 2;
  if (durationWeeks > 6) baseScore += 1;

  // Clamp to 1-9
  baseScore = Math.max(1, Math.min(9, baseScore));

  const category =
    baseScore >= 7
      ? "usually-appropriate"
      : baseScore >= 4
        ? "may-be-appropriate"
        : "usually-not-appropriate";

  return {
    value: baseScore,
    category,
    description: `Clinical appropriateness score of ${baseScore}/9 for ${proposedImaging.modality} ${proposedImaging.bodyPart}`,
    confidenceLevel: activeRedFlags.length > 0 ? "High" : "Medium",
    matchedCriteria: `ACR AC: ${chiefComplaint} — ${proposedImaging.modality}`,
  };
}

/**
 * Determine if a modality is available at the facility.
 */
function isModalityAvailable(
  facility: FacilityProfile,
  modality: ImagingModality
): "local" | "mobile" | "transfer" | "unavailable" {
  // Check local equipment
  const localEquip = facility.equipment.find(
    (e) => e.modality === modality && e.maintenanceStatus === "operational"
  );
  if (localEquip) return "local";

  // Check mobile units
  const mobileUnit = facility.mobileUnits.find((m) => m.modality === modality);
  if (mobileUnit) return "mobile";

  // Check transfer agreements
  const transfer = facility.transferAgreements.find((t) =>
    t.availableModalities.includes(modality)
  );
  if (transfer) return "transfer";

  return "unavailable";
}

/**
 * Calculate Resource-Adjusted Appropriateness Score (RAAS).
 * Adjusts the clinical score based on local resource availability.
 */
function calculateRAAS(cas: CASScore, input: RAASInput): RAASScore {
  const { facilityProfile, clinicalScenario, patientContext } = input;
  const { proposedImaging } = clinicalScenario;
  const availability = isModalityAvailable(facilityProfile, proposedImaging.modality);

  let adjustedScore = cas.value;
  let adjustmentReason = "";
  let resourceWeight = 0;

  switch (availability) {
    case "local":
      // No adjustment needed — modality available on site
      adjustmentReason = "Proposed modality is available locally. No resource adjustment needed.";
      resourceWeight = 0;
      break;

    case "mobile":
      // Slight adjustment based on urgency and wait time
      if (proposedImaging.urgency === "stat") {
        adjustedScore = Math.max(1, adjustedScore - 2);
        adjustmentReason =
          "STAT urgency but modality only available via mobile unit. Consider local alternatives or transfer.";
        resourceWeight = 0.6;
      } else {
        adjustedScore = Math.max(1, adjustedScore - 1);
        adjustmentReason =
          "Modality available via mobile unit. Score slightly adjusted for scheduling delay.";
        resourceWeight = 0.3;
      }
      break;

    case "transfer":
      // More significant adjustment — transfer carries cost, time, and risk
      if (proposedImaging.urgency === "stat") {
        adjustmentReason =
          "Modality requires transfer. For STAT cases, transfer is recommended despite resource cost.";
        resourceWeight = 0.4;
      } else {
        adjustedScore = Math.max(1, adjustedScore - 2);
        adjustmentReason =
          "Modality requires patient transfer. Local alternatives may be more appropriate given travel burden.";
        resourceWeight = 0.7;
      }
      break;

    case "unavailable":
      adjustedScore = Math.max(1, adjustedScore - 3);
      adjustmentReason =
        "Modality is not available locally, via mobile unit, or at nearby transfer facilities. Strong recommendation to use available alternatives.";
      resourceWeight = 0.9;
      break;
  }

  // Patient travel burden adjustment
  if (patientContext.distanceToFacilityMiles > 60) {
    adjustedScore = Math.max(1, adjustedScore - 1);
    adjustmentReason += ` Patient must travel ${patientContext.distanceToFacilityMiles} miles.`;
    resourceWeight = Math.min(1, resourceWeight + 0.15);
  }

  // Transportation access adjustment
  if (patientContext.transportationAccess === "none") {
    adjustedScore = Math.max(1, adjustedScore - 1);
    adjustmentReason += " Patient has no reliable transportation.";
    resourceWeight = Math.min(1, resourceWeight + 0.1);
  }

  adjustedScore = Math.max(1, Math.min(9, adjustedScore));

  const category =
    adjustedScore >= 7
      ? "usually-appropriate"
      : adjustedScore >= 4
        ? "may-be-appropriate"
        : "usually-not-appropriate";

  return {
    value: adjustedScore,
    category,
    adjustmentReason,
    resourceContextWeight: Math.round(resourceWeight * 100) / 100,
    description: `Resource-adjusted score of ${adjustedScore}/9 considering local facility capabilities and patient context`,
  };
}

/**
 * Determine urgency classification for triage.
 */
function classifyUrgency(input: RAASInput): UrgencyClassification {
  const { clinicalScenario } = input;
  const { proposedImaging, redFlags } = clinicalScenario;

  if (proposedImaging.urgency === "stat") return "emergent";

  const activeRedFlags = redFlags.filter((rf) => rf.present);
  if (activeRedFlags.length >= 2) return "urgent";

  if (proposedImaging.urgency === "urgent") return "semi-urgent";

  return "routine";
}

/**
 * Generate triage recommendation with full protocol.
 */
function generateTriageRecommendation(
  cas: CASScore,
  _raas: RAASScore,
  urgency: UrgencyClassification,
  input: RAASInput
): TriageRecommendation {
  const { facilityProfile, clinicalScenario } = input;
  const { proposedImaging } = clinicalScenario;
  const availability = isModalityAvailable(facilityProfile, proposedImaging.modality);

  // Determine tier
  if (availability === "local") {
    const equipment = facilityProfile.equipment.find(
      (e) => e.modality === proposedImaging.modality && e.maintenanceStatus === "operational"
    );
    const protocol: LocalFirstProtocol = {
      type: "local-first",
      recommendedStudy: `${proposedImaging.modality} ${proposedImaging.bodyPart}`,
      modality: proposedImaging.modality,
      protocolGuidance: [
        `Perform ${proposedImaging.modality} using standard ${proposedImaging.bodyPart} protocol`,
        `Equipment: ${equipment?.manufacturer} ${equipment?.model}`,
        "Ensure proper patient positioning per department protocol",
        "Apply ALARA principles for radiation optimization",
      ],
      expectedFindings: `Evaluate for findings related to: ${proposedImaging.indication}`,
      limitations: equipment?.limitations.join("; ") || "None noted",
      followUpRequired: cas.value < 7,
      followUpStudy:
        cas.value < 7 ? "Consider advanced imaging if initial study is inconclusive" : undefined,
      followUpTimeframe: cas.value < 7 ? "2-4 weeks based on clinical trajectory" : undefined,
    };

    return {
      tier: "local-first",
      protocol,
      reasoning: `${proposedImaging.modality} is available on-site. Proceed with local imaging.`,
      clinicalSafetyNote: "Local imaging is clinically appropriate for this scenario.",
    };
  }

  if (availability === "mobile" && (urgency === "routine" || urgency === "semi-urgent")) {
    const mobileUnit = facilityProfile.mobileUnits.find(
      (m) => m.modality === proposedImaging.modality
    );
    const waitHours = mobileUnit
      ? Math.round(
          (new Date(mobileUnit.nextVisitDate).getTime() - Date.now()) / (1000 * 60 * 60)
        )
      : 72;

    const protocol: MobileUnitProtocol = {
      type: "mobile-unit",
      recommendedStudy: `${proposedImaging.modality} ${proposedImaging.bodyPart}`,
      modality: proposedImaging.modality,
      nextAvailableDate: mobileUnit?.nextVisitDate || "TBD",
      nextAvailableSlot: "Contact scheduling for exact time",
      waitTimeHours: Math.max(0, waitHours),
      clinicalSafetyOfWait:
        urgency === "routine" ? "safe" : "acceptable-with-monitoring",
      preparationInstructions: [
        `Schedule patient for next ${mobileUnit?.provider || "mobile unit"} visit`,
        "Provide patient with preparation instructions for the study",
        "Ensure all prior authorization is obtained before the visit date",
        "Have clinical summary ready for the mobile unit team",
      ],
      alternativeIfUrgent: `If clinical situation changes, proceed with transfer to ${facilityProfile.transferAgreements[0]?.partnerFacilityName || "nearest hub facility"}`,
    };

    return {
      tier: "mobile-unit",
      protocol,
      reasoning: `${proposedImaging.modality} is available via mobile unit (${mobileUnit?.provider}). Clinical urgency allows waiting for next scheduled visit.`,
      clinicalSafetyNote:
        urgency === "routine"
          ? "Safe to wait for mobile unit. Monitor for clinical changes."
          : "Acceptable to wait with active monitoring. Reassess if symptoms worsen.",
    };
  }

  // Transfer protocol
  const transfer = facilityProfile.transferAgreements[0];
  if (transfer) {
    const protocol: TransferProtocol = {
      type: "transfer",
      receivingFacility: transfer.partnerFacilityName,
      receivingFacilityId: transfer.partnerFacilityId,
      distanceMiles: transfer.distanceMiles,
      estimatedTransferMinutes: transfer.estimatedTransferMinutes,
      transportMethod: transfer.transferProtocol,
      requiredModality: proposedImaging.modality,
      preNotificationTemplate: `TRANSFER REQUEST: ${clinicalScenario.age}yo ${clinicalScenario.sex} presenting with ${clinicalScenario.chiefComplaint}. Requires ${proposedImaging.modality} ${proposedImaging.bodyPart}. Urgency: ${proposedImaging.urgency}. Red flags: ${clinicalScenario.redFlags.filter((r) => r.present).map((r) => r.flag).join(", ") || "None"}.`,
      clinicalSummary: `Patient: ${clinicalScenario.age}yo ${clinicalScenario.sex}\nCC: ${clinicalScenario.chiefComplaint}\nHPI: ${clinicalScenario.clinicalHistory}\nSymptoms: ${clinicalScenario.symptoms.join(", ")}\nDuration: ${clinicalScenario.duration}\nProposed: ${proposedImaging.modality} ${proposedImaging.bodyPart}\nIndication: ${proposedImaging.indication}`,
      contactNumber: transfer.contactPhone,
      directSchedulingAvailable: transfer.acceptsDirectScheduling,
    };

    return {
      tier: "transfer",
      protocol,
      reasoning: `${proposedImaging.modality} is not available locally or via mobile unit. Transfer to ${transfer.partnerFacilityName} (${transfer.distanceMiles} miles, ~${transfer.estimatedTransferMinutes} min) is recommended.`,
      clinicalSafetyNote:
        urgency === "emergent"
          ? "CRITICAL: Consider transfer; review urgency criteria and pre-notify the receiving facility if proceeding."
          : "Transfer recommended. Coordinate with patient on logistics and timing.",
    };
  }

  // Defer protocol (fallback)
  const deferProtocol: DeferProtocol = {
    type: "defer",
    reason: "No immediate imaging pathway available. Clinical monitoring recommended.",
    monitoringPlan: "Serial clinical assessments with documented re-evaluation at 48-72 hours",
    reassessmentTimeframe: "48-72 hours or sooner if clinical change",
    redFlagsTriggeringEscalation: [
      "New neurological deficits",
      "Hemodynamic instability",
      "Worsening pain unresponsive to treatment",
      "New fever or signs of sepsis",
    ],
  };

  return {
    tier: "defer",
    protocol: deferProtocol,
    reasoning:
      "Imaging not immediately available through any pathway. Clinical monitoring with planned reassessment.",
    clinicalSafetyNote: "Document monitoring plan. Reassess urgency at each follow-up.",
  };
}

/**
 * Generate alternative imaging pathways.
 */
function generateAlternatives(input: RAASInput, cas: CASScore): AlternativePathway[] {
  const { facilityProfile, clinicalScenario } = input;
  const alternatives: AlternativePathway[] = [];

  const alternativeModalities: { modality: ImagingModality; casAdjust: number }[] = [
    { modality: "X-ray", casAdjust: -2 },
    { modality: "Ultrasound", casAdjust: -1 },
    { modality: "CT", casAdjust: 0 },
    { modality: "MRI", casAdjust: 0 },
  ];

  for (const alt of alternativeModalities) {
    if (alt.modality === clinicalScenario.proposedImaging.modality) continue;

    const availability = isModalityAvailable(facilityProfile, alt.modality);
    if (availability === "unavailable") continue;

    const adjustedCAS = Math.max(1, Math.min(9, cas.value + alt.casAdjust));
    const equipInfo = TYPICAL_RURAL_EQUIPMENT[alt.modality];

    alternatives.push({
      study: `${alt.modality} ${clinicalScenario.proposedImaging.bodyPart}`,
      modality: alt.modality,
      availability:
        availability === "local"
          ? "local-now"
          : availability === "mobile"
            ? "mobile-unit"
            : "transfer-required",
      casScore: adjustedCAS,
      raasScore: availability === "local" ? adjustedCAS + 1 : adjustedCAS,
      costEstimate: equipInfo?.averageCost || 500,
      radiationDose:
        alt.modality === "Ultrasound"
          ? "none"
          : alt.modality === "X-ray"
            ? "low"
            : alt.modality === "CT"
              ? "moderate"
              : "none",
      rationale: `${alt.modality} is ${availability === "local" ? "available on-site" : availability === "mobile" ? "available via mobile unit" : "available via transfer"}. ${availability === "local" ? "Eliminates travel burden and scheduling delay." : ""}`,
    });
  }

  return alternatives.sort((a, b) => {
    // Prioritize locally available, then by RAAS score
    const availOrder: Record<AlternativePathway["availability"], number> = {
      "local-now": 0,
      "local-scheduled": 1,
      "mobile-unit": 2,
      "transfer-required": 3,
    };
    const aDiff = availOrder[a.availability] ?? 4;
    const bDiff = availOrder[b.availability] ?? 4;
    if (aDiff !== bDiff) return aDiff - bDiff;
    return b.raasScore - a.raasScore;
  });
}

/**
 * Generate resource factors for SHAP-style display.
 */
function generateResourceFactors(input: RAASInput): ResourceFactor[] {
  const { facilityProfile, clinicalScenario, patientContext } = input;
  const { proposedImaging } = clinicalScenario;
  const factors: ResourceFactor[] = [];

  // Equipment availability
  const availability = isModalityAvailable(facilityProfile, proposedImaging.modality);
  factors.push({
    name: "Equipment Availability",
    value:
      availability === "local"
        ? "Available on-site"
        : availability === "mobile"
          ? "Mobile unit only"
          : availability === "transfer"
            ? "Transfer required"
            : "Unavailable",
    impact: availability === "local" ? "increases-score" : "decreases-score",
    weight: availability === "local" ? 0.0 : availability === "mobile" ? 0.3 : 0.7,
    explanation:
      availability === "local"
        ? `${proposedImaging.modality} is operational on-site.`
        : `${proposedImaging.modality} is not available locally. ${availability === "mobile" ? "Available via mobile unit." : "Requires patient transfer."}`,
  });

  // Patient travel distance
  factors.push({
    name: "Patient Travel Burden",
    value: `${patientContext.distanceToFacilityMiles} miles`,
    impact:
      patientContext.distanceToFacilityMiles > 60
        ? "decreases-score"
        : patientContext.distanceToFacilityMiles > 30
          ? "neutral"
          : "increases-score",
    weight: patientContext.distanceToFacilityMiles > 60 ? 0.4 : 0.1,
    explanation: `Patient lives ${patientContext.distanceToFacilityMiles} miles from the facility. ${patientContext.distanceToFacilityMiles > 60 ? "Significant travel burden increases barriers to follow-through." : "Manageable travel distance."}`,
  });

  // Transportation access
  factors.push({
    name: "Transportation Access",
    value: patientContext.transportationAccess.replaceAll("-", " "),
    impact: patientContext.transportationAccess === "own-vehicle" ? "increases-score" : "decreases-score",
    weight: patientContext.transportationAccess === "none" ? 0.5 : 0.1,
    explanation: `Patient ${patientContext.transportationAccess === "own-vehicle" ? "has own vehicle" : patientContext.transportationAccess === "none" ? "has no reliable transportation" : "relies on " + patientContext.transportationAccess}.`,
  });

  // Facility designation
  const hasRuralDesignation = facilityProfile.designation.some((d) =>
    ["CAH", "REH", "RHC", "HPSA", "MUA"].includes(d)
  );
  factors.push({
    name: "Facility Designation",
    value: facilityProfile.designation.join(", ") || "None",
    impact: hasRuralDesignation ? "increases-score" : "neutral",
    weight: 0.2,
    explanation: hasRuralDesignation
      ? `Facility holds ${facilityProfile.designation.join(", ")} designation(s). May qualify for rural payer exemptions.`
      : "No special rural designations.",
  });

  // Employment impact
  factors.push({
    name: "Employment Impact",
    value: patientContext.employmentImpact,
    impact: patientContext.employmentImpact === "multi-day" ? "decreases-score" : "neutral",
    weight: patientContext.employmentImpact === "multi-day" ? 0.3 : 0.05,
    explanation: `Imaging appointment requires ${patientContext.employmentImpact} away from work.`,
  });

  // Radiologist coverage
  const hasOnSiteRad = facilityProfile.staffing.radiologists.length > 0;
  factors.push({
    name: "Radiologist Coverage",
    value: hasOnSiteRad ? "On-site radiologist" : "Teleradiology only",
    impact: hasOnSiteRad ? "increases-score" : "decreases-score",
    weight: hasOnSiteRad ? 0.0 : 0.2,
    explanation: hasOnSiteRad
      ? "On-site radiologist available for real-time interpretation."
      : "No on-site radiologist. Studies require teleradiology interpretation with potential delay.",
  });

  return factors;
}

/**
 * Estimate costs across pathways.
 */
function estimateCosts(input: RAASInput): CostEstimate {
  const { facilityProfile, clinicalScenario, patientContext } = input;
  const equipInfo = TYPICAL_RURAL_EQUIPMENT[clinicalScenario.proposedImaging.modality];
  const avgCost = equipInfo?.averageCost || 1000;

  const localAvail = isModalityAvailable(facilityProfile, clinicalScenario.proposedImaging.modality);

  return {
    localEstimate: localAvail === "local" ? avgCost : null,
    mobileUnitEstimate: localAvail === "mobile" ? avgCost * 1.15 : null, // 15% mobile unit surcharge
    transferEstimate: avgCost + patientContext.distanceToFacilityMiles * 2, // rough travel cost
    patientOutOfPocket: Math.round(avgCost * 0.2), // rough 20% cost share
    travelCost: Math.round(patientContext.distanceToFacilityMiles * 0.67 * 2), // IRS mileage rate round trip
    currency: "USD",
  };
}

// ===========================================================================
// MAIN ENTRY POINT
// ===========================================================================

/**
 * Evaluate a clinical scenario with resource-aware appropriateness scoring.
 * This is the primary function called by the RuralCDSDemo component.
 */
export function evaluateRAAS(input: RAASInput): RAASResult {
  const cas = calculateCAS(input);
  const raas = calculateRAAS(cas, input);
  const urgency = classifyUrgency(input);
  const triage = generateTriageRecommendation(cas, raas, urgency, input);
  const alternatives = generateAlternatives(input, cas);
  const resourceFactors = generateResourceFactors(input);
  const costEstimate = estimateCosts(input);

  return {
    clinicalAppropriatenessScore: cas,
    resourceAdjustedScore: raas,
    triageRecommendation: triage,
    alternativePathways: alternatives,
    resourceFactors,
    overallRecommendation: triage.reasoning,
    urgencyClassification: urgency,
    estimatedCost: costEstimate,
    evaluatedAt: new Date().toISOString(),
  };
}
