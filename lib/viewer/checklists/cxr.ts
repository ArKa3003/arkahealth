import type { Checklist } from "@/lib/viewer/checklist-types";

/** Chest radiograph systematic comparison checklist (non-diagnostic scaffold). */
export const cxrChecklist: Checklist = {
  region: "CXR",
  items: [
    {
      id: "cxr-cardiac-silhouette",
      label: "Cardiac silhouette size and contour",
      anchor: "Cardiac silhouette",
      rationale:
        "Compare cardiothoracic ratio and border definition to prior; ACR Practice Parameter ref chest-plain-film-interpretation §cardiac.",
    },
    {
      id: "cxr-mediastinum",
      label: "Mediastinum width and contour",
      anchor: "Mediastinum",
      rationale:
        "Assess superior mediastinum and aortic knob; ACR manual chest plain film §mediastinum.",
    },
    {
      id: "cxr-costophrenic",
      label: "Costophrenic angles",
      anchor: "Costophrenic angles",
      rationale:
        "Blunting or effusion pattern vs prior; ACR manual chest plain film §pleura.",
    },
    {
      id: "cxr-vasculature",
      label: "Pulmonary vasculature",
      anchor: "Pulmonary vasculature",
      rationale:
        "Upper vs lower zone redistribution; ACR manual chest plain film §pulmonary-vessels.",
    },
    {
      id: "cxr-osseous",
      label: "Osseous structures (ribs, spine, shoulders)",
      anchor: "Osseous thorax",
      rationale:
        "Fracture, lesion, or hardware change; ACR manual chest plain film §bones-soft-tissues.",
    },
    {
      id: "cxr-hidden",
      label: "Hidden areas (apices, behind heart)",
      anchor: "Apices / retrocardiac",
      rationale:
        "Systematic search for apical and retrocardiac opacity; ACR manual chest plain film §hidden-areas.",
    },
    {
      id: "cxr-lines-tubes",
      label: "Lines and tubes",
      anchor: "Support devices",
      rationale:
        "ETT, central line, NG tube position vs prior; ACR manual chest plain film §devices.",
    },
    {
      id: "cxr-prior-compare",
      label: "Side-by-side comparison to prior",
      anchor: "Temporal comparison",
      rationale:
        "Document interval change using matched projection priors; ACR manual chest plain film §comparison.",
    },
  ],
};
