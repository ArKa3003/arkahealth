import { nearestHubTransferMinutes } from "@/lib/demos/rural/facility-profiles";
import type { FacilityProfile } from "@/lib/demos/rural/types";

export interface TransferDraft {
  reason: string;
  checklist: string[];
  etaMinutes: number;
}

export function buildTransferProtocol(facility: FacilityProfile, studyType: string): TransferDraft {
  return {
    reason: `${studyType} exceeds on-site capability at ${facility.name}`,
    checklist: [
      "Clinical stability verified",
      "Accepting radiologist at hub confirmed",
      "Transport mode documented",
      "Relevant priors packaged for telerad",
    ],
    etaMinutes: nearestHubTransferMinutes(facility) + 15,
  };
}
