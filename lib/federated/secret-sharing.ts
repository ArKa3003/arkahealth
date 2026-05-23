/**
 * Generates additive masks that sum to zero for n-party secure aggregation.
 *
 * @param institutionCount - Number of participating institutions.
 */
export function generateZeroSumMasks(institutionCount: number): number[] {
  if (institutionCount < 1) {
    return [];
  }
  if (institutionCount === 1) {
    return [0];
  }
  const masks: number[] = [];
  let sum = 0;
  for (let i = 0; i < institutionCount - 1; i++) {
    const m = randomMaskComponent();
    masks.push(m);
    sum += m;
  }
  masks.push(-sum);
  return masks;
}

function randomMaskComponent(): number {
  return Math.floor(Math.random() * 1_000_000) - 500_000;
}
