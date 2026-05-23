/** Coarse age bands for the imaging metadata lake (HIPAA-safe demographics). */
export type ImagingLakeAgeBucket =
  | "0-4"
  | "5-17"
  | "18-44"
  | "45-64"
  | "65-84"
  | "85+";

const LAKE_AGE_BUCKETS: readonly ImagingLakeAgeBucket[] = [
  "0-4",
  "5-17",
  "18-44",
  "45-64",
  "65-84",
  "85+",
];

/**
 * Maps patient age in years to a lake-safe bucket per governance schema.
 *
 * @param ageYears - Patient age in years.
 */
export function imagingLakeAgeBucket(ageYears: number): ImagingLakeAgeBucket {
  if (!Number.isFinite(ageYears) || ageYears < 0) {
    return "18-44";
  }
  if (ageYears <= 4) {
    return "0-4";
  }
  if (ageYears <= 17) {
    return "5-17";
  }
  if (ageYears <= 44) {
    return "18-44";
  }
  if (ageYears <= 64) {
    return "45-64";
  }
  if (ageYears <= 84) {
    return "65-84";
  }
  return "85+";
}

/**
 * Returns true when `value` is a valid lake age bucket literal.
 *
 * @param value - Candidate bucket string.
 */
export function isImagingLakeAgeBucket(value: string): value is ImagingLakeAgeBucket {
  return (LAKE_AGE_BUCKETS as readonly string[]).includes(value);
}
