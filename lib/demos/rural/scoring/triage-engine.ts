import type {
  FacilityProfile,
  ImagingModality,
  LocalFirstProtocol,
  MobileUnitProtocol,
  TriageRecommendation,
  TransferProtocol,
} from "@/lib/demos/rural/types";
import { facilityHasMri, nearestHubTransferMinutes } from "@/lib/demos/rural/facility-profiles";

function localFirst(modality: ImagingModality, summary: string): TriageRecommendation {
  const protocol: LocalFirstProtocol = {
    type: "local-first",
    recommendedStudy: "Site-appropriate imaging",
    modality,
    protocolGuidance: ["Follow local contrast policy", "Document clinical question"],
    expectedFindings: "Varies by indication",
    limitations: "Resource profile may limit advanced sequences",
    followUpRequired: false,
  };
  return {
    tier: "local-first",
    protocol,
    reasoning: summary,
    clinicalSafetyNote: "Escalate if instability or red-flag progression.",
  };
}

export function recommendTriage(_chiefComplaint: string, facility: FacilityProfile): TriageRecommendation {
  const hubMinutes = nearestHubTransferMinutes(facility);
  const mriOnSite = facilityHasMri(facility);

  if (facility.mobileUnits.length > 0) {
    const mu = facility.mobileUnits[0]!;
    const protocol: MobileUnitProtocol = {
      type: "mobile-unit",
      recommendedStudy: `${mu.modality} scheduled slot`,
      modality: mu.modality,
      nextAvailableDate: mu.nextVisitDate,
      nextAvailableSlot: "Morning block",
      waitTimeHours: 36,
      clinicalSafetyOfWait: "acceptable-with-monitoring",
      preparationInstructions: ["NPO if contrast required", "Confirm transport"],
      alternativeIfUrgent: hubMinutes < 90 ? "Transfer to hub for STAT" : "Call teleradiology for protocol guidance",
    };
    return {
      tier: "mobile-unit",
      protocol,
      reasoning: "Route through mobile imaging protocol; escalate if contrast or advanced sequences required.",
      clinicalSafetyNote: "Reassess if clinical status changes before the mobile date.",
    };
  }

  if (!mriOnSite && hubMinutes < 90) {
    const xfer = facility.transferAgreements[0];
    const protocol: TransferProtocol = {
      type: "transfer",
      receivingFacility: xfer?.partnerFacilityName ?? "Regional hub",
      receivingFacilityId: xfer?.partnerFacilityId ?? "hub",
      distanceMiles: xfer?.distanceMiles ?? 40,
      estimatedTransferMinutes: hubMinutes,
      transportMethod: "ambulance",
      requiredModality: "MRI",
      preNotificationTemplate: "Clinical summary + stability + accepting provider",
      clinicalSummary: "Stable patient; advanced MRI not available locally.",
      contactNumber: xfer?.contactPhone ?? "555-0100",
      directSchedulingAvailable: xfer?.acceptsDirectScheduling ?? false,
    };
    return {
      tier: "transfer",
      protocol,
      reasoning: "Advanced MRI not on-site; stable patients may transfer per hub SLA.",
      clinicalSafetyNote: "Verify acceptance and transport before departure.",
    };
  }

  return localFirst("CT", "Local-first pathway appropriate for current resource profile.");
}
