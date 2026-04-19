import type { CaseImagingRating, ImagingOption, Modality } from "@/lib/demos/ed/types";
import type { ImagingModality, RuralImagingOption } from "@/lib/demos/rural/types";

function mapRuralModalityToEd(m: ImagingModality): Modality {
  switch (m) {
    case "X-ray":
      return "xray";
    case "CT":
    case "CT-with-contrast":
      return "ct";
    case "MRI":
    case "MRI-with-contrast":
      return "mri";
    case "Ultrasound":
      return "ultrasound";
    case "Nuclear-Medicine":
      return "nuclear";
    case "PET-CT":
      return "pet";
    case "Mammography":
      return "mammography";
    case "Fluoroscopy":
    case "C-arm":
      return "fluoroscopy";
    case "DEXA":
      return "xray";
    default:
      return "xray";
  }
}

export function parseRadiationDoseToMsv(dose: string): number {
  const t = dose.trim().toLowerCase();
  if (t === "none" || t === "0") return 0;
  if (t === "moderate") return 1;
  const match = t.match(/([\d.]+)\s*msv/i);
  if (match) return parseFloat(match[1]);
  const tilde = t.match(/~\s*([\d.]+)\s*msv/i);
  if (tilde) return parseFloat(tilde[1]);
  return 0;
}

function inferBodyRegion(study: string): string {
  const s = study.toLowerCase();
  if (s.includes("chest") || s.includes("pulmonary") || s.includes("pe ")) return "chest";
  if (s.includes("head")) return "head";
  if (s.includes("extremity") || s.includes("lower extremity")) return "extremity";
  if (s.includes("abdomen")) return "abdomen";
  return "chest";
}

export function ruralImagingOptionToEd(r: RuralImagingOption): ImagingOption {
  const modality = mapRuralModalityToEd(r.modality);
  const withContrast =
    r.modality === "CT-with-contrast" || r.modality === "MRI-with-contrast";
  return {
    id: r.id,
    name: r.study,
    short_name: r.study.length > 48 ? `${r.study.slice(0, 45)}…` : r.study,
    modality,
    body_region: inferBodyRegion(r.study),
    with_contrast: withContrast,
    typical_cost_usd: r.cost,
    radiation_msv: parseRadiationDoseToMsv(r.radiationDose),
    description: r.feedback.explanation,
    common_indications: [r.feedback.whenToUse],
    contraindications: r.contraindications,
    duration: r.turnaroundTime,
    is_active: true,
  };
}

export function ruralImagingOptionsToEdOptions(options: RuralImagingOption[]): ImagingOption[] {
  return options.map(ruralImagingOptionToEd);
}

function ratingCategoryFromCas(
  cas: number
): "usually-appropriate" | "may-be-appropriate" | "usually-not-appropriate" {
  if (cas >= 7) return "usually-appropriate";
  if (cas >= 4) return "may-be-appropriate";
  return "usually-not-appropriate";
}

export function ruralOptionsToCaseImagingRatings(
  caseId: string,
  options: RuralImagingOption[]
): CaseImagingRating[] {
  return options.map((r) => ({
    id: `${caseId}-${r.id}`,
    case_id: caseId,
    imaging_option_id: r.id,
    acr_rating: r.casRating,
    rating_category: ratingCategoryFromCas(r.casRating),
    rationale: r.feedback.explanation,
    acr_reference: "",
  }));
}
