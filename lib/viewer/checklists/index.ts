import type { Checklist } from "@/lib/viewer/checklist-types";

import { cSpineChecklist } from "@/lib/viewer/checklists/c-spine";
import { cxrChecklist } from "@/lib/viewer/checklists/cxr";
import { kneeChecklist } from "@/lib/viewer/checklists/knee";
import { kubChecklist } from "@/lib/viewer/checklists/kub";
import { lSpineChecklist } from "@/lib/viewer/checklists/l-spine";
import { shoulderChecklist } from "@/lib/viewer/checklists/shoulder";

export { cxrChecklist, kubChecklist, cSpineChecklist, lSpineChecklist, shoulderChecklist, kneeChecklist };

/** Region key → checklist for reference viewer. */
export const CHECKLISTS_BY_REGION: Record<string, Checklist> = {
  CXR: cxrChecklist,
  KUB: kubChecklist,
  "C-spine": cSpineChecklist,
  "L-spine": lSpineChecklist,
  Shoulder: shoulderChecklist,
  Knee: kneeChecklist,
};

/**
 * Resolves a checklist for a body region hint (modality/body site text).
 *
 * @param bodyHint - Body site or study description.
 */
export function checklistForBodyHint(bodyHint: string | undefined): Checklist {
  const hint = (bodyHint ?? "").toLowerCase();
  if (/chest|cxr|thorax|lung/i.test(hint)) {
    return cxrChecklist;
  }
  if (/kub|abdomen|abdominal/i.test(hint)) {
    return kubChecklist;
  }
  if (/cervical|c-spine|c spine/i.test(hint)) {
    return cSpineChecklist;
  }
  if (/lumbar|l-spine|l spine/i.test(hint)) {
    return lSpineChecklist;
  }
  if (/shoulder/i.test(hint)) {
    return shoulderChecklist;
  }
  if (/knee/i.test(hint)) {
    return kneeChecklist;
  }
  return cxrChecklist;
}
