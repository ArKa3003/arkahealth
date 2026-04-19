export function turnaroundPercentile(minutes: number): number {
  if (minutes <= 30) return 95;
  if (minutes <= 60) return 80;
  return 55;
}

export function peerReviewRate(monthlyReads: number): number {
  return Math.min(12, Math.round(monthlyReads * 0.02));
}
