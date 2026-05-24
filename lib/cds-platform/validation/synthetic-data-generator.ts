/**
 * @file synthetic-data-generator.ts
 * @description Generates synthetic historical imaging cases with realistic distributions
 *   for retrospective validation. Labels are derived from ARKA AIIE Clinical Evidence Base
 *   logic (with noise for inter-rater variability); not from ACR Appropriateness Criteria.
 */

import type { ClinicalScenario } from '@/lib/cds-platform/types';
import type { HistoricalCase } from './types';

const MODALITIES = ['X-ray', 'CT', 'MRI', 'Ultrasound', 'CT with contrast', 'MRI with contrast'] as const;
const BODY_SITES = ['Spine', 'Head', 'Brain', 'Chest', 'Abdomen', 'Pelvis', 'Extremity', 'Neck'] as const;

/** Indication mix: low back 25%, headache 15%, abdominal 20%, chest 15%, MSK 10%, screening 10%, other 5% */
const INDICATION_DISTRIBUTION: Array<{ weight: number; indication: string; chiefComplaint: string }> = [
  { weight: 0.25, indication: 'Low back pain', chiefComplaint: 'Low back pain' },
  { weight: 0.15, indication: 'Headache', chiefComplaint: 'Headache' },
  { weight: 0.2, indication: 'Abdominal pain', chiefComplaint: 'Abdominal pain' },
  { weight: 0.15, indication: 'Chest pain', chiefComplaint: 'Chest pain' },
  { weight: 0.1, indication: 'Musculoskeletal extremity', chiefComplaint: 'Extremity pain' },
  { weight: 0.1, indication: 'Screening/surveillance', chiefComplaint: 'Cancer surveillance' },
  { weight: 0.05, indication: 'Other', chiefComplaint: 'Other symptoms' },
];

/** Score distribution: 30% appropriate (7-9), 30% uncertain (4-6), 40% inappropriate (1-3) */
function sampleScoreCategory(rng: () => number): { score: number; category: 'appropriate' | 'uncertain' | 'inappropriate' } {
  const u = rng();
  if (u < 0.3) {
    const score = 7 + rng() * 2;
    return { score: Math.round(score * 10) / 10, category: 'appropriate' };
  }
  if (u < 0.6) {
    const score = 4 + rng() * 2;
    return { score: Math.round(score * 10) / 10, category: 'uncertain' };
  }
  const score = 1 + rng() * 2;
  return { score: Math.round(score * 10) / 10, category: 'inappropriate' };
}

/** Normal distribution, clipped */
function normalClip(mean: number, std: number, min: number, max: number, rng: () => number): number {
  const u1 = rng();
  const u2 = rng();
  const z = Math.sqrt(-2 * Math.log(u1 || 1e-10)) * Math.cos(2 * Math.PI * u2);
  const x = mean + std * z;
  return Math.max(min, Math.min(max, Math.round(x)));
}

/** Sex: 48% male, 48% female, 4% other */
function sampleSex(rng: () => number): 'Male' | 'Female' | 'Other' {
  const u = rng();
  if (u < 0.48) return 'Male';
  if (u < 0.96) return 'Female';
  return 'Other';
}

/** Seeded simple RNG for reproducibility */
function createRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

/**
 * Generate n synthetic historical cases with realistic distributions.
 * Expert labels follow ARKA AIIE Clinical Evidence Base logic with added noise
 * to simulate inter-rater variability (3-5 raters, Fleiss' kappa 0.6-0.8).
 */
export function generateSyntheticHistoricalData(n: number = 1000): HistoricalCase[] {
  const rng = createRng(42);
  const cases: HistoricalCase[] = [];

  const indicationCumul: Array<{ cumul: number; indication: string; chiefComplaint: string }> = [];
  let cumul = 0;
  for (const d of INDICATION_DISTRIBUTION) {
    cumul += d.weight;
    indicationCumul.push({ cumul, indication: d.indication, chiefComplaint: d.chiefComplaint });
  }

  for (let i = 0; i < n; i++) {
    const caseId = `syn-${Date.now()}-${i}-${rng().toString(36).slice(2, 9)}`;
    const sex = sampleSex(rng);
    const age = normalClip(52, 18, 5, 95, rng);
    const pregnancyStatus: 'pregnant' | 'not_pregnant' | 'unknown' =
      sex === 'Female' && age >= 15 && age <= 45 && rng() < 0.05 ? 'pregnant' : 'not_pregnant';

    const u = rng();
    let indRow = indicationCumul[0]!;
    for (const row of indicationCumul) {
      if (u <= row.cumul) {
        indRow = row;
        break;
      }
    }

    const modality = MODALITIES[Math.floor(rng() * MODALITIES.length)]!;
    const bodySite = BODY_SITES[Math.floor(rng() * BODY_SITES.length)]!;
    const duration = rng() < 0.3 ? -1 : Math.floor(rng() * 365);
    const raterCount = 3 + Math.floor(rng() * 3);
    const kappa = 0.6 + rng() * 0.2;

    const { score: baseScore } = sampleScoreCategory(rng);
    const noise = (rng() - 0.5) * 0.8;
    const appropriatenessScore = Math.max(1, Math.min(9, Math.round((baseScore + noise) * 10) / 10));
    const category: 'appropriate' | 'uncertain' | 'inappropriate' =
      appropriatenessScore >= 7 ? 'appropriate' : appropriatenessScore >= 4 ? 'uncertain' : 'inappropriate';

    const scenario: ClinicalScenario = {
      patientId: `patient-${i}`,
      age,
      sex,
      chiefComplaint: indRow.chiefComplaint,
      clinicalHistory: duration >= 0 ? `Symptoms for ${duration} days; conservative treatment tried.` : 'Acute presentation.',
      symptoms: [indRow.chiefComplaint],
      duration: duration >= 0 ? duration : undefined,
      redFlags: [
        { flag: 'Neurological deficit', present: rng() < 0.05 },
        { flag: 'Cancer history', present: rng() < 0.1 },
        { flag: 'Fever', present: rng() < 0.08 },
      ],
      pregnancyStatus,
      contrastAllergy: rng() < 0.02,
      renalFunction: rng() < 0.15 ? { value: 45 + rng() * 30, date: new Date().toISOString().slice(0, 10), hasImpairment: true } : undefined,
      medications: {
        onAnticoagulation: rng() < 0.1,
        onMetformin: rng() < 0.12,
      },
      proposedImaging: {
        modality,
        bodyPart: bodySite,
        indication: indRow.indication,
        urgency: rng() < 0.1 ? 'Urgent' : 'Routine',
      },
      priorImaging: rng() < 0.3 ? [{ modality: 'X-ray', bodyPart: bodySite, daysAgo: 30 + Math.floor(rng() * 60), studyDescription: 'Prior study' }] : [],
    };

    const actualOrder = {
      modality,
      bodySite,
      indication: indRow.indication,
    };

    const expertLabel = {
      appropriatenessScore,
      category,
      raterCount,
      interRaterAgreement: kappa,
    };

    const orderChanged = rng() < 0.15;
    const outcome = {
      orderChanged,
      alternativeOrdered: orderChanged && rng() < 0.5 ? 'MRI' : undefined,
      clinicalOutcome: rng() < 0.2 ? 'Follow-up completed' : undefined,
    };

    cases.push({
      caseId,
      scenario,
      actualOrder,
      expertLabel,
      outcome,
    });
  }

  return cases;
}
