import type { Checklist } from "@/lib/viewer/checklist-types";

/** Knee radiograph checklist. */
export const kneeChecklist: Checklist = {
  region: "Knee",
  items: [
    {
      id: "knee-joint-space",
      label: "Medial and lateral joint space",
      anchor: "Tibiofemoral compartments",
      rationale: "Tricompartment narrowing vs prior; ACR extremity manual §knee.",
    },
    {
      id: "knee-patella",
      label: "Patellofemoral alignment",
      anchor: "Patella",
      rationale: "Subluxation or alta/baja; ACR extremity manual §patellofemoral.",
    },
    {
      id: "knee-effusion",
      label: "Suprapatellar effusion",
      anchor: "Joint effusion",
      rationale: "Fat pad sign or effusion; ACR extremity manual §effusion.",
    },
    {
      id: "knee-hardware",
      label: "Hardware / postoperative change",
      anchor: "Fixation devices",
      rationale: "Interval hardware or fracture healing; ACR extremity manual §postoperative.",
    },
    {
      id: "knee-prior",
      label: "Weight-bearing vs prior",
      anchor: "Temporal comparison",
      rationale: "Matched weight-bearing projection; ACR extremity manual §comparison.",
    },
  ],
};
