export function estimateNetRevenue(
  grossCharges: number,
  denialRate: number,
  ruralAdjustment: number
): number {
  return Math.round(grossCharges * (1 - denialRate) * (1 + ruralAdjustment));
}
