import type { Checklist } from "@/lib/viewer/checklist-types";

/** KUB systematic comparison checklist. */
export const kubChecklist: Checklist = {
  region: "KUB",
  items: [
    {
      id: "kub-bowel-gas",
      label: "Bowel gas pattern",
      anchor: "Bowel gas",
      rationale: "Dilated loops or ileus pattern vs prior; ACR KUB interpretation manual §bowel.",
    },
    {
      id: "kub-calculi",
      label: "Calcifications / calculi",
      anchor: "Renal / ureteric shadows",
      rationale: "Stone size and position; ACR KUB manual §genitourinary.",
    },
    {
      id: "kub-soft-tissue",
      label: "Soft tissue masses",
      anchor: "Abdominal soft tissues",
      rationale: "Psoas margins and extrinsic masses; ACR KUB manual §soft-tissue.",
    },
    {
      id: "kub-skeleton",
      label: "Lumbar spine and pelvis",
      anchor: "Osseous pelvis",
      rationale: "Degenerative change or acute osseous abnormality; ACR KUB manual §skeleton.",
    },
    {
      id: "kub-prior",
      label: "Comparison to prior KUB",
      anchor: "Temporal comparison",
      rationale: "Interval change in gas pattern or calcifications; ACR KUB manual §comparison.",
    },
  ],
};
