/**
 * Laplace mechanism for numeric aggregates (scale = sensitivity / epsilon).
 *
 * @param epsilon - Privacy budget ε (> 0).
 * @param sensitivity - L1 sensitivity of the aggregate (default 1 for counts).
 */
export function laplaceNoiseStdDev(epsilon: number, sensitivity = 1): number {
  if (epsilon <= 0) {
    return Number.POSITIVE_INFINITY;
  }
  const scale = sensitivity / epsilon;
  return Math.SQRT2 * scale;
}

/**
 * Samples Laplace(0, sensitivity/ε) noise for count/rate queries.
 *
 * @param epsilon - Privacy budget ε (> 0).
 * @param sensitivity - L1 sensitivity (default 1).
 */
export function sampleLaplaceNoise(epsilon: number, sensitivity = 1): number {
  const scale = sensitivity / epsilon;
  const u = Math.random() - 0.5;
  return -scale * Math.sign(u) * Math.log1p(-2 * Math.abs(u));
}

/**
 * Applies Laplace noise to a numeric value.
 *
 * @param value - True aggregate before noise.
 * @param epsilon - Privacy budget ε (> 0).
 * @param sensitivity - L1 sensitivity (default 1).
 */
export function addLaplaceNoise(
  value: number,
  epsilon: number,
  sensitivity = 1,
): { noisyValue: number; noiseStdDev: number } {
  const noise = sampleLaplaceNoise(epsilon, sensitivity);
  return {
    noisyValue: value + noise,
    noiseStdDev: laplaceNoiseStdDev(epsilon, sensitivity),
  };
}
