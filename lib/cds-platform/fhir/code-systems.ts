/**
 * @file code-systems.ts
 * @description Comprehensive medical terminology mapping for imaging appropriateness.
 * Maps internal modality/indication names to SNOMED-CT, CPT, DICOM, ICD-10-CM, LOINC, RxNorm.
 * Used to normalize FHIR codings and display codes in cards and SHAP explanations.
 */

import type { Coding } from './resources';

// =============================================================================
// Types
// =============================================================================

/** Internal imaging modality names used by the CDS engine */
export type ImagingModality =
  | 'X-ray'
  | 'CT'
  | 'CT with contrast'
  | 'MRI'
  | 'MRI with contrast'
  | 'Ultrasound'
  | 'Nuclear Medicine'
  | 'PET-CT';

/** Radiation level for modality */
export type RadiationLevel = 'none' | 'low' | 'medium' | 'high';

/** Code system identifier */
export type CodeSystem = 'snomed' | 'icd10cm' | 'cpt' | 'loinc' | 'rxnorm';

/** Single code entry: code, display, optional parent/system */
export interface CodeEntry {
  code: string;
  display: string;
  system?: string;
  parent?: string;
}

/** Imaging modality code mapping: SNOMED-CT, CPT range, DICOM, radiation, cost */
export interface ImagingModalityCodeMap {
  internal: ImagingModality;
  snomed: { code: string; display: string };
  cptRange: { min: string; max: string; examples: string[] };
  dicom: string;
  radiationLevel: RadiationLevel;
  costTier: number; // 1–5, 1 = lowest cost
}

// =============================================================================
// 1. IMAGING_MODALITY_CODES
// =============================================================================

/** SNOMED-CT system URI */
const SNOMED_SYSTEM = 'http://snomed.info/sct';
/** CPT system URI */
const CPT_SYSTEM = 'http://www.ama-assn.org/go/cpt';
/** DICOM modality is not a URI; code only (CR, CT, MR, US, NM, PT) */

export const IMAGING_MODALITY_CODES: ImagingModalityCodeMap[] = [
  {
    internal: 'X-ray',
    snomed: {
      code: '363787002',
      display: 'Plain X-ray (procedure)',
    },
    cptRange: { min: '70000', max: '79999', examples: ['71045', '71046', '72020', '72040', '73030', '73562'] },
    dicom: 'CR',
    radiationLevel: 'low',
    costTier: 1,
  },
  {
    internal: 'CT',
    snomed: {
      code: '363680008',
      display: 'Computed tomography of body structure (procedure)',
    },
    cptRange: { min: '70450', max: '70498', examples: ['70450', '70460', '71250', '72125', '74150', '72192'] },
    dicom: 'CT',
    radiationLevel: 'medium',
    costTier: 3,
  },
  {
    internal: 'CT with contrast',
    snomed: {
      code: '387713003',
      display: 'Computed tomography with contrast (procedure)',
    },
    cptRange: { min: '70460', max: '74177', examples: ['70460', '70486', '71260', '71275', '74160', '74176', '74177'] },
    dicom: 'CT',
    radiationLevel: 'high',
    costTier: 4,
  },
  {
    internal: 'MRI',
    snomed: {
      code: '241541005',
      display: 'Magnetic resonance imaging (procedure)',
    },
    cptRange: { min: '70551', max: '70559', examples: ['70551', '70552', '70553', '72141', '72146', '72147', '73221', '73721'] },
    dicom: 'MR',
    radiationLevel: 'none',
    costTier: 4,
  },
  {
    internal: 'MRI with contrast',
    snomed: {
      code: '241541005',
      display: 'Magnetic resonance imaging with contrast (procedure)',
    },
    cptRange: { min: '70551', max: '73721', examples: ['70552', '70553', '72148', '72158', '73222', '73722'] },
    dicom: 'MR',
    radiationLevel: 'none',
    costTier: 5,
  },
  {
    internal: 'Ultrasound',
    snomed: {
      code: '59241006',
      display: 'Diagnostic ultrasonography (procedure)',
    },
    cptRange: { min: '76536', max: '76999', examples: ['76536', '76700', '76705', '76856', '76857', '93975', '93976'] },
    dicom: 'US',
    radiationLevel: 'none',
    costTier: 2,
  },
  {
    internal: 'Nuclear Medicine',
    snomed: {
      code: '77477000',
      display: 'Nuclear medicine (procedure)',
    },
    cptRange: { min: '78000', max: '78999', examples: ['78451', '78452', '78453', '78454', '78580', '78600'] },
    dicom: 'NM',
    radiationLevel: 'medium',
    costTier: 4,
  },
  {
    internal: 'PET-CT',
    snomed: {
      code: '78899008',
      display: 'Positron emission tomography (procedure)',
    },
    cptRange: { min: '78811', max: '78816', examples: ['78811', '78812', '78813', '78814', '78815', '78816'] },
    dicom: 'PT',
    radiationLevel: 'high',
    costTier: 5,
  },
];

// =============================================================================
// 2. BODY_SITE_CODES (SNOMED-CT)
// =============================================================================

export const BODY_SITE_CODES: Record<string, { code: string; display: string }> = {
  Head: { code: '69536005', display: 'Head (body structure)' },
  Chest: { code: '80891009', display: 'Thoracic structure (body structure)' },
  Abdomen: { code: '818983003', display: 'Abdomen (body structure)' },
  Pelvis: { code: '12921003', display: 'Pelvis (body structure)' },
  'Spine cervical': { code: '297171002', display: 'Cervical spine (body structure)' },
  'Spine thoracic': { code: '297172009', display: 'Thoracic spine (body structure)' },
  'Spine lumbar': { code: '297173004', display: 'Lumbar spine (body structure)' },
  'Spine sacral': { code: '42106005', display: 'Sacral spine (body structure)' },
  Spine: { code: '42106005', display: 'Spine (body structure)' },
  'Extremities upper': { code: '371398001', display: 'Upper extremity (body structure)' },
  'Extremities lower': { code: '371195009', display: 'Lower extremity (body structure)' },
  Extremities: { code: '410668003', display: 'Extremity (body structure)' },
  Neck: { code: '45048000', display: 'Neck (body structure)' },
  Brain: { code: '12738006', display: 'Brain (body structure)' },
};

// =============================================================================
// 3. CLINICAL_INDICATION_CODES (Chief complaint → ICD-10-CM)
// =============================================================================

const ICD10CM_SYSTEM = 'http://hl7.org/fhir/sid/icd-10-cm';

/** Chief complaint category (internal) to ICD-10-CM codes */
export const CLINICAL_INDICATION_CODES: Record<string, string[]> = {
  'Low back pain': ['M54.5', 'M54.50', 'M54.51', 'M54.59'],
  Headache: ['R51', 'R51.0', 'R51.9', 'G43.0', 'G43.1', 'G43.9', 'G44.0', 'G44.00', 'G44.009', 'G44.2', 'G44.209', 'G44.219', 'G44.229'],
  'Abdominal pain': ['R10.0', 'R10.10', 'R10.11', 'R10.12', 'R10.13', 'R10.2', 'R10.30', 'R10.31', 'R10.32', 'R10.33', 'R10.84', 'R10.9'],
  'Chest pain': ['R07.1', 'R07.2', 'R07.81', 'R07.82', 'R07.89', 'R07.9'],
  Appendicitis: ['K35.80', 'K35.89', 'K35.90', 'K36', 'K37'],
  'Pulmonary embolism': ['I26.0', 'I26.90', 'I26.99', 'I26.9'],
  'Cancer screening': ['Z12.0', 'Z12.11', 'Z12.12', 'Z12.39', 'Z12.72', 'Z12.73', 'Z12.75', 'Z12.79', 'Z12.89'],
};

/** Reverse: ICD-10-CM code → internal chief complaint category */
const ICD10_TO_INDICATION: Map<string, string> = (() => {
  const m = new Map<string, string>();
  for (const [indication, codes] of Object.entries(CLINICAL_INDICATION_CODES)) {
    for (const code of codes) {
      m.set(code, indication);
      // Also map base codes (e.g. M54.5 matches M54.50, M54.51)
      const base = code.replace(/\.\d+$/, '');
      if (!m.has(base)) m.set(base, indication);
    }
  }
  return m;
})();

// =============================================================================
// 4. RED_FLAG_CODES (SNOMED-CT)
// =============================================================================

export const RED_FLAG_CODES: Record<string, { code: string; display: string }> = {
  'Cancer history': { code: '109355002', display: 'Malignant neoplasm (disorder)' },
  'Neurological deficit': { code: '230572002', display: 'Neurological finding (finding)' },
  'Fever with back pain': { code: '386661006', display: 'Fever (finding)' },
  'Saddle anesthesia': { code: '271594007', display: 'Saddle anesthesia (finding)' },
  'Bowel dysfunction': { code: '62315008', display: 'Dysfunction of bowel (finding)' },
  'Bladder dysfunction': { code: '68961008', display: 'Urinary bladder dysfunction (finding)' },
  'Thunderclap headache onset': { code: '25064002', display: 'Headache (finding)' },
  'Worst headache of life': { code: '25064002', display: 'Headache (finding)' },
  'Immunocompromised state': { code: '414545008', display: 'Immunodeficiency (disorder)' },
  'Anticoagulation therapy': { code: '316764009', display: 'Anticoagulant therapy (regime/therapy)' },
  Trauma: { code: '28306000', display: 'Traumatic injury (disorder)' },
};

// =============================================================================
// 5. MEDICATION_CODES (RxNorm)
// =============================================================================

const RXNORM_SYSTEM = 'http://www.nlm.nih.gov/research/umls/rxnorm';

/** RxNorm codes for medications we check (metformin, anticoagulants, contrast) */
export const MEDICATION_CODES: Record<string, { rxcui: string; display: string }[]> = {
  Metformin: [
    { rxcui: '861004', display: 'Metformin 500 MG Oral Tablet' },
    { rxcui: '861005', display: 'Metformin 850 MG Oral Tablet' },
    { rxcui: '861006', display: 'Metformin 1000 MG Oral Tablet' },
    { rxcui: '860992', display: 'Metformin hydrochloride 500 MG Oral Tablet' },
    { rxcui: '1807888', display: 'Metformin hydrochloride 1000 MG Extended Release Oral Tablet' },
  ],
  Warfarin: [
    { rxcui: '855332', display: 'Warfarin 1 MG Oral Tablet' },
    { rxcui: '855335', display: 'Warfarin 5 MG Oral Tablet' },
    { rxcui: '855336', display: 'Warfarin 10 MG Oral Tablet' },
  ],
  Heparin: [
    { rxcui: '364074', display: 'Heparin' },
    { rxcui: '308182', display: 'Heparin 5000 UNT/ML Injectable Solution' },
  ],
  Enoxaparin: [
    { rxcui: '261551', display: 'Enoxaparin sodium' },
    { rxcui: '403834', display: 'Enoxaparin 100 MG/ML Injectable Solution' },
  ],
  Rivaroxaban: [
    { rxcui: '999986', display: 'Rivaroxaban 10 MG Oral Tablet' },
    { rxcui: '999987', display: 'Rivaroxaban 15 MG Oral Tablet' },
    { rxcui: '999988', display: 'Rivaroxaban 20 MG Oral Tablet' },
  ],
  Apixaban: [
    { rxcui: '1114195', display: 'Apixaban 2.5 MG Oral Tablet' },
    { rxcui: '1114196', display: 'Apixaban 5 MG Oral Tablet' },
  ],
  Dabigatran: [
    { rxcui: '861007', display: 'Dabigatran etexilate 75 MG Oral Capsule' },
    { rxcui: '861008', display: 'Dabigatran etexilate 150 MG Oral Capsule' },
  ],
  'Contrast - Iohexol': [
    { rxcui: '25789', display: 'Iohexol' },
  ],
  'Contrast - Iodixanol': [
    { rxcui: '2598', display: 'Iodixanol' },
  ],
  'Contrast - Gadolinium': [
    { rxcui: '63713', display: 'Gadolinium' },
    { rxcui: '316964', display: 'Gadopentetate dimeglumine' },
    { rxcui: '316965', display: 'Gadoteridol' },
  ],
};

// =============================================================================
// 6. LAB_CODES (LOINC)
// =============================================================================

const LOINC_SYSTEM = 'http://loinc.org';

/** LOINC codes for relevant lab tests */
export const LAB_CODES: Record<string, { code: string; display: string }[]> = {
  eGFR: [
    { code: '69405-9', display: 'eGFR non-African American [Volume/Time] in Serum or Plasma by CKD-EPI' },
    { code: '62238-1', display: 'eGFR [Volume/Time] in Serum or Plasma by CKD-EPI' },
    { code: '77147-7', display: 'eGFR [Volume/Time] in Serum or Plasma' },
  ],
  'Serum creatinine': [
    { code: '2160-0', display: 'Creatinine [Mass/volume] in Serum or Plasma' },
  ],
  BUN: [
    { code: '3094-0', display: 'Urea nitrogen [Mass/volume] in Serum or Plasma' },
  ],
  'Pregnancy test (hCG)': [
    { code: '2106-3', display: 'Choriogonadotropin [Presence] in Urine' },
    { code: '80384-1', display: 'Choriogonadotropin [Units/volume] in Serum or Plasma' },
  ],
};

// =============================================================================
// Helper: findModalityByCode
// =============================================================================

/**
 * Find internal ImagingModality by code from a given system (snomed, cpt, or dicom).
 */
export function findModalityByCode(
  system: string,
  code: string
): ImagingModality | null {
  const sys = system.toLowerCase();
  const codeNorm = code.trim();

  if (sys.includes('snomed') || sys === SNOMED_SYSTEM) {
    const m = IMAGING_MODALITY_CODES.find(
      (x) => x.snomed.code === codeNorm
    );
    return m ? m.internal : null;
  }

  if (sys.includes('cpt') || sys === CPT_SYSTEM) {
    const m = IMAGING_MODALITY_CODES.find(
      (x) =>
        codeNorm >= x.cptRange.min &&
        codeNorm <= x.cptRange.max
    );
    if (m) return m.internal;
    const byExample = IMAGING_MODALITY_CODES.find((x) =>
      x.cptRange.examples.includes(codeNorm)
    );
    return byExample ? byExample.internal : null;
  }

  if (sys.includes('dicom') || sys === 'dicom' || sys === '') {
    const dicomMod = IMAGING_MODALITY_CODES.find(
      (x) => x.dicom === codeNorm
    );
    return dicomMod ? dicomMod.internal : null;
  }

  return null;
}

// =============================================================================
// Helper: findBodySiteByCode
// =============================================================================

/**
 * Find internal body site name by SNOMED-CT (or same code) code.
 */
export function findBodySiteByCode(system: string, code: string): string | null {
  const codeNorm = code.trim();
  if (!system.toLowerCase().includes('snomed') && system !== SNOMED_SYSTEM) return null;
  for (const [name, entry] of Object.entries(BODY_SITE_CODES)) {
    if (entry.code === codeNorm) return name;
  }
  return null;
}

// =============================================================================
// Helper: findIndicationByCode
// =============================================================================

/**
 * Reverse lookup: given ICD-10-CM code, return internal chief complaint category.
 */
export function findIndicationByCode(system: string, code: string): string | null {
  const codeNorm = code.trim();
  if (!system.toLowerCase().includes('icd') && system !== ICD10CM_SYSTEM) return null;
  return ICD10_TO_INDICATION.get(codeNorm) ?? ICD10_TO_INDICATION.get(codeNorm.replace(/\.$/, '')) ?? null;
}

// =============================================================================
// Helper: mapFHIRModalityToInternal
// =============================================================================

/**
 * Map FHIR Coding[] (e.g. from ServiceRequest or ImagingStudy.modality) to internal ImagingModality.
 * Prefers SNOMED, then CPT, then DICOM.
 */
export function mapFHIRModalityToInternal(coding: Coding[]): ImagingModality | null {
  if (!coding?.length) return null;
  for (const c of coding) {
    const sys = c.system ?? '';
    const code = c.code?.trim();
    if (!code) continue;
    const found = findModalityByCode(sys, code);
    if (found) return found;
  }
  return null;
}

// =============================================================================
// Helper: mapFHIRBodySiteToInternal
// =============================================================================

/**
 * Map FHIR Coding[] (body site) to internal body site string.
 */
export function mapFHIRBodySiteToInternal(coding: Coding[]): string | null {
  if (!coding?.length) return null;
  for (const c of coding) {
    const sys = c.system ?? '';
    const code = c.code?.trim();
    if (!code) continue;
    const name = findBodySiteByCode(sys, code);
    if (name) return name;
  }
  return null;
}

// =============================================================================
// Helper: getRadiationLevel
// =============================================================================

/**
 * Get radiation level for a modality (from our map).
 */
export function getRadiationLevel(modality: ImagingModality): RadiationLevel {
  const entry = IMAGING_MODALITY_CODES.find((m) => m.internal === modality);
  return entry ? entry.radiationLevel : 'none';
}

// =============================================================================
// Helper: getCostTier
// =============================================================================

/**
 * Get relative cost tier (1–5) for a modality.
 */
export function getCostTier(modality: ImagingModality): number {
  const entry = IMAGING_MODALITY_CODES.find((m) => m.internal === modality);
  return entry ? entry.costTier : 1;
}

// =============================================================================
// Legacy / shared: lookupCode, lookupDisplays, isImagingProcedure, getCodeSystemLabel
// =============================================================================

/**
 * Looks up a code in the given code system and returns display name and metadata.
 */
export function lookupCode(system: CodeSystem, code: string): CodeEntry | null {
  const codeNorm = code.trim();
  if (system === 'snomed') {
    for (const m of IMAGING_MODALITY_CODES) {
      if (m.snomed.code === codeNorm)
        return { code: m.snomed.code, display: m.snomed.display, system: SNOMED_SYSTEM };
    }
    for (const [, v] of Object.entries(BODY_SITE_CODES)) {
      if (v.code === codeNorm) return { code: v.code, display: v.display, system: SNOMED_SYSTEM };
    }
    for (const [, v] of Object.entries(RED_FLAG_CODES)) {
      if (v.code === codeNorm) return { code: v.code, display: v.display, system: SNOMED_SYSTEM };
    }
  }
  if (system === 'icd10cm') {
    const indication = findIndicationByCode(ICD10CM_SYSTEM, codeNorm);
    if (indication)
      return {
        code: codeNorm,
        display: indication,
        system: ICD10CM_SYSTEM,
      };
  }
  if (system === 'cpt') {
    const internal = findModalityByCode(CPT_SYSTEM, codeNorm);
    if (internal) {
      const m = IMAGING_MODALITY_CODES.find((x) => x.internal === internal);
      if (m) return { code: codeNorm, display: m.snomed.display, system: CPT_SYSTEM };
    }
  }
  if (system === 'loinc') {
    for (const arr of Object.values(LAB_CODES)) {
      for (const lab of arr) {
        if (lab.code === codeNorm) return { code: lab.code, display: lab.display, system: LOINC_SYSTEM };
      }
    }
  }
  return null;
}

/**
 * Resolves multiple codes to display strings.
 */
export function lookupDisplays(
  system: CodeSystem,
  codes: string[]
): string[] {
  return codes.map((code) => lookupCode(system, code)?.display ?? '');
}

/**
 * Returns whether the code is a known imaging procedure (CPT) for appropriateness.
 */
export function isImagingProcedure(system: CodeSystem, code: string): boolean {
  if (system !== 'cpt' && system !== 'loinc') return false;
  if (system === 'cpt') return findModalityByCode(CPT_SYSTEM, code.trim()) !== null;
  return false;
}

/**
 * Returns human-readable label for a code system.
 */
export function getCodeSystemLabel(system: CodeSystem): string {
  const labels: Record<CodeSystem, string> = {
    snomed: 'SNOMED-CT',
    icd10cm: 'ICD-10-CM',
    cpt: 'CPT',
    loinc: 'LOINC',
    rxnorm: 'RxNorm',
  };
  return labels[system] ?? system;
}
