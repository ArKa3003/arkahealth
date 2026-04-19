export function correlateDelayToOutcome(transferDelayMinutes: number): "low" | "moderate" | "elevated" {
  if (transferDelayMinutes < 45) return "low";
  if (transferDelayMinutes < 120) return "moderate";
  return "elevated";
}
