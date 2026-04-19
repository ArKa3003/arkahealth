export function predictFacilityRisk(factors: {
  staffingFTE: number;
  modalityGaps: number;
}): { score: number; band: "green" | "amber" | "red" } {
  const raw = Math.min(
    100,
    Math.round((1 - factors.staffingFTE / 2) * 40 + factors.modalityGaps * 20)
  );
  const band = raw < 35 ? "green" : raw < 65 ? "amber" : "red";
  return { score: raw, band };
}
