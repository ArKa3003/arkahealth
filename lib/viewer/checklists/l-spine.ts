import type { Checklist } from "@/lib/viewer/checklist-types";

/** Lumbar spine radiograph checklist. */
export const lSpineChecklist: Checklist = {
  region: "L-spine",
  items: [
    {
      id: "lspine-alignment",
      label: "Segmental alignment",
      anchor: "Lumbar alignment",
      rationale: "Spondylolisthesis grade vs prior; ACR spine manual §alignment.",
    },
    {
      id: "lspine-disc",
      label: "Disc height and endplates",
      anchor: "Lumbar discs",
      rationale: "Degenerative change progression; ACR spine manual §disc.",
    },
    {
      id: "lspine-pars",
      label: "Pars interarticularis",
      anchor: "Posterior elements",
      rationale: "Spondylolysis lucency; ACR spine manual §posterior-elements.",
    },
    {
      id: "lspine-facet",
      label: "Facet joints",
      anchor: "Facet arthropathy",
      rationale: "Hypertrophy and narrowing; ACR spine manual §facet.",
    },
    {
      id: "lspine-prior",
      label: "Prior lateral comparison",
      anchor: "Temporal comparison",
      rationale: "Same projection prior for fatigue-aware review; ACR spine manual §comparison.",
    },
  ],
};
