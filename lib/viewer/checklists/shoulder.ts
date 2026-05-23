import type { Checklist } from "@/lib/viewer/checklist-types";

/** Shoulder radiograph checklist. */
export const shoulderChecklist: Checklist = {
  region: "Shoulder",
  items: [
    {
      id: "sh-glenohumeral",
      label: "Glenohumeral joint space",
      anchor: "GH joint",
      rationale: "Joint space narrowing vs prior; ACR extremity radiography manual §shoulder.",
    },
    {
      id: "sh-acromion",
      label: "Acromioclavicular interval",
      anchor: "AC joint",
      rationale: "Osteolysis or widening; ACR extremity manual §acromioclavicular.",
    },
    {
      id: "sh-humeral",
      label: "Proximal humerus cortex",
      anchor: "Humeral head",
      rationale: "Fracture or lesion; ACR extremity manual §humerus.",
    },
    {
      id: "sh-soft-tissue",
      label: "Soft tissues / calcific tendinopathy",
      anchor: "Rotator cuff region",
      rationale: "Calcification or effusion; ACR extremity manual §soft-tissue.",
    },
    {
      id: "sh-prior",
      label: "External rotation vs prior",
      anchor: "Temporal comparison",
      rationale: "Matched view prior reduces attentional drift; ACR extremity manual §comparison.",
    },
  ],
};
