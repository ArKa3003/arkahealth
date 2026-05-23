import type { Checklist } from "@/lib/viewer/checklist-types";

/** Cervical spine radiograph checklist. */
export const cSpineChecklist: Checklist = {
  region: "C-spine",
  items: [
    {
      id: "cspine-alignment",
      label: "Vertebral alignment",
      anchor: "Cervical alignment",
      rationale: "Lordosis and listhesis vs prior; ACR spine radiography manual §alignment.",
    },
    {
      id: "cspine-predental",
      label: "Predental space",
      anchor: "C1–C2 interval",
      rationale: "Atlantoaxial widening; ACR spine manual §upper-cervical.",
    },
    {
      id: "cspine-disc",
      label: "Disc spaces",
      anchor: "Intervertebral discs",
      rationale: "Narrowing or vacuum phenomenon; ACR spine manual §disc.",
    },
    {
      id: "cspine-prevertebral",
      label: "Prevertebral soft tissues",
      anchor: "Prevertebral stripe",
      rationale: "Swelling suggesting hematoma; ACR spine manual §soft-tissue.",
    },
    {
      id: "cspine-prior",
      label: "Matched projection prior",
      anchor: "Temporal comparison",
      rationale: "Lateral and AP pairs juxtaposed; ACR spine manual §comparison.",
    },
  ],
};
