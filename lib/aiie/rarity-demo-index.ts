/**
 * Offline rarity corpus for demos when `ins_rarity_index` is not yet refreshed.
 * Counts are illustrative (~42k total orders); no PHI.
 */

type DemoRarityRow = {
  icd10_combo: string;
  cpt_combo: string;
  age_bucket: string;
  sex: string;
  region_bucket: string;
  redflag_combo: string;
  occurrences: number;
};

const COMMON_ICD = "M54.16+M54.5";
const COMMON_CPT = "72148+71046";

/**
 * Builds a synthetic 365-day frequency table for local demos and unit tests.
 */
export function buildDemoRarityIndex(): DemoRarityRow[] {
  const rows: DemoRarityRow[] = [];
  let remaining = 42_000;

  const push = (row: DemoRarityRow) => {
    rows.push(row);
    remaining -= row.occurrences;
  };

  push({
    icd10_combo: COMMON_ICD,
    cpt_combo: COMMON_CPT,
    age_bucket: "40-64",
    sex: "female",
    region_bucket: "unspecified",
    redflag_combo: "none",
    occurrences: 18_500,
  });

  push({
    icd10_combo: COMMON_ICD,
    cpt_combo: "71260+71046",
    age_bucket: "40-64",
    sex: "male",
    region_bucket: "unspecified",
    redflag_combo: "ageOver50",
    occurrences: 12_400,
  });

  push({
    icd10_combo: "M54.5",
    cpt_combo: "73721",
    age_bucket: "18-39",
    sex: "female",
    region_bucket: "rural-midwest",
    redflag_combo: "none",
    occurrences: 8_200,
  });

  push({
    icd10_combo: "G93.41+C79.31+D49.6",
    cpt_combo: COMMON_CPT,
    age_bucket: "40-64",
    sex: "female",
    region_bucket: "rural-midwest",
    redflag_combo: "cancerHistory+neurologicalDeficit+progressiveSymptoms+ageOver50",
    occurrences: 3,
  });

  if (remaining > 0) {
    push({
      icd10_combo: "R91.8",
      cpt_combo: "74177",
      age_bucket: "65+",
      sex: "male",
      region_bucket: "unspecified",
      redflag_combo: "none",
      occurrences: remaining,
    });
  }

  return rows;
}
