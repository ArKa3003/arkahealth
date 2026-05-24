/**
 * @file scenarios.ts
 * @description Typed demo scenarios for the CDS Hooks live EHR mock (shareholder demo).
 */

import { medicalBasisFromCitation } from '@/lib/cds-platform/cds-hooks/medical-basis';
import type { MedicalBasis } from '@/lib/cds-platform/cds-hooks/medical-basis';
import type { FHIRServiceRequest } from '@/lib/cds-platform/fhir/resources';
import type { ImagingModality, ImagingUrgency } from '@/lib/cds-platform/types';
import type { TieredAlertTier } from '@/lib/cds-platform/alerting/types';

/** Demo scenario identifier. */
export type DemoScenarioId = 'lbp-1' | 'ha-1' | 'belly' | 'knee';

/** Expected alert tier for scenario validation / demo copy. */
export type DemoExpectedTier = TieredAlertTier;

/** Active problem row in the EpicSim chart. */
export interface DemoProblem {
  display: string;
  icd10: string;
}

/** Red-flag row for chart display. */
export interface DemoRedFlag {
  flag: string;
  present: boolean;
}

/** Alternative order with guideline basis (not auto-submitted). */
export interface DemoAlternativeWithBasis {
  alternative: FHIRServiceRequest;
  basis: MedicalBasis;
  considerations: string[];
}

/**
 * Full demo scenario: patient chart, draft order, and expected CDS posture.
 */
export interface DemoScenario {
  id: DemoScenarioId;
  label: string;
  patientName: string;
  mrn: string;
  age: number;
  sex: 'Male' | 'Female';
  allergies: string;
  eGFR: number;
  chiefComplaint: string;
  problems: DemoProblem[];
  duration: number;
  urgency: ImagingUrgency;
  modality: ImagingModality;
  bodyPart: string;
  cpt: string;
  icd10: string;
  orderDisplay: string;
  redFlags: DemoRedFlag[];
  avoidedCostEstimate: number;
  expectedTier: DemoExpectedTier;
  medicalBasis: MedicalBasis;
  citationIds: string[];
  alternativeWithBasis?: DemoAlternativeWithBasis;
  patientId: string;
  userId: string;
}

const LBP_BASIS = medicalBasisFromCitation(
  'doi:10.1016/j.jacr.2022.02.018',
  'guideline',
  'For non-radicular low back pain under six weeks without red flags, ACR Appropriateness Criteria generally rate lumbar MRI as low utility (often 2/9, "Usually Not Appropriate"). Conservative management and reassessment are favored before advanced imaging.',
  'ACR Appropriateness Criteria 2022 — Low Back Pain',
);

const HA_BASIS = medicalBasisFromCitation(
  'acr:sudden-headache',
  'guideline',
  'For sudden severe headache with features concerning for subarachnoid hemorrhage, ACR Headache criteria support timely non-contrast head CT as an appropriate initial study when clinical suspicion warrants exclusion of emergent pathology.',
  'ACR Appropriateness Criteria 2019 — Headache',
);

const BELLY_BASIS = medicalBasisFromCitation(
  'acr:ped-rlq-pain',
  'guideline',
  'For pediatric right lower quadrant pain with fever, ACR Appropriateness Criteria favor ultrasound as first-line imaging before CT when appendicitis is suspected, reserving CT for inconclusive ultrasound or complications.',
  'ACR Appropriateness Criteria 2023 — Pediatric RLQ Pain',
);

const KNEE_BASIS = medicalBasisFromCitation(
  'acr:knee-oa',
  'guideline',
  'For chronic knee pain due to osteoarthritis without red flags, ACR criteria generally recommend plain radiographs before MRI to establish structural baseline and avoid low-yield advanced imaging.',
  'ACR Appropriateness Criteria 2022 — Chronic Knee Pain',
);

interface DraftServiceRequestOptions {
  bodyPart?: string;
  modalityNote?: string;
  prep?: string;
  radiationNote?: string;
  imagingCategory?: boolean;
}

function draftServiceRequest(
  patientId: string,
  id: string,
  cpt: string,
  display: string,
  indication: string,
  icd10: string,
  options?: DraftServiceRequestOptions,
): FHIRServiceRequest {
  const notes: { text: string }[] = [];
  if (options?.modalityNote) notes.push({ text: `Modality: ${options.modalityNote}` });
  if (options?.radiationNote) notes.push({ text: `Expected radiation: ${options.radiationNote}` });

  return {
    resourceType: 'ServiceRequest',
    id,
    status: 'draft',
    intent: 'order',
    subject: { reference: `Patient/${patientId}` },
    category: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/service-request-category',
            code: options?.imagingCategory === false ? 'procedure' : 'imaging',
            display: options?.imagingCategory === false ? 'Procedure' : 'Imaging',
          },
        ],
      },
    ],
    code: {
      coding: [
        {
          system: 'http://www.ama-assn.org/go/cpt',
          code: cpt,
          display,
        },
      ],
      text: display,
    },
    bodySite: options?.bodyPart ? [{ text: options.bodyPart }] : undefined,
    patientInstruction: options?.prep,
    note: notes.length > 0 ? notes : undefined,
    reasonCode: [{ text: indication, coding: [{ code: icd10, display: indication }] }],
  };
}

/** All shareholder demo scenarios keyed by id. */
export const DEMO_SCENARIOS: Record<DemoScenarioId, DemoScenario> = {
  'lbp-1': {
    id: 'lbp-1',
    label: 'LBP-1',
    patientName: 'Daniel Adams',
    mrn: '100024',
    age: 49,
    sex: 'Male',
    allergies: 'none',
    eGFR: 88,
    chiefComplaint: 'Chronic low back pain',
    problems: [
      { display: 'Chronic low back pain', icd10: 'M54.5' },
      { display: 'Hypertension', icd10: 'I10' },
    ],
    duration: 21,
    urgency: 'Routine',
    modality: 'MRI',
    bodyPart: 'lumbar spine',
    cpt: '72148',
    icd10: 'M54.5',
    orderDisplay: 'MRI Lumbar Spine',
    redFlags: [
      { flag: 'Cauda equina symptoms', present: false },
      { flag: 'Progressive neurologic deficit', present: false },
      { flag: 'Fever with spine pain', present: false },
    ],
    avoidedCostEstimate: 2400,
    expectedTier: 'warning',
    medicalBasis: LBP_BASIS,
    citationIds: ['doi:10.1016/j.jacr.2022.02.018', 'uspstf:lbp-imaging'],
    patientId: 'demo-patient-lbp-1',
    userId: 'demo-practitioner-001',
    alternativeWithBasis: {
      alternative: draftServiceRequest(
        'demo-patient-lbp-1',
        'alt-lbp-pt',
        '97110',
        'Physical therapy evaluation',
        'Low back pain — conservative management',
        'M54.5',
        {
          bodyPart: 'lumbar spine',
          modalityNote: 'Physical therapy',
          prep: 'None required',
          radiationNote: 'Not applicable (no ionizing radiation)',
          imagingCategory: false,
        },
      ),
      basis: medicalBasisFromCitation(
        'doi:10.1016/j.jacr.2022.02.018',
        'guideline',
        'ACR low back pain variants emphasize an adequate trial of conservative therapy before MRI when red flags are absent.',
        'ACR §5 — Conservative management',
      ),
      considerations: [
        'May not apply when red flags, progressive deficit, or suspected serious pathology are present.',
        'Re-verify duration of symptoms, prior conservative trials, and neurologic examination before substituting.',
        'Revisit lumbar MRI if pain persists beyond six weeks despite therapy or if clinical status changes.',
      ],
    },
  },
  'ha-1': {
    id: 'ha-1',
    label: 'HA-1',
    patientName: 'Maya Chen',
    mrn: '100089',
    age: 28,
    sex: 'Female',
    allergies: 'none',
    eGFR: 95,
    chiefComplaint: 'Sudden thunderclap headache',
    problems: [{ display: 'Acute severe headache', icd10: 'R51.9' }],
    duration: 1,
    urgency: 'Urgent',
    modality: 'CT',
    bodyPart: 'head',
    cpt: '70450',
    icd10: 'R51.9',
    orderDisplay: 'CT Head without contrast',
    redFlags: [{ flag: 'Thunderclap onset', present: true }],
    avoidedCostEstimate: 0,
    expectedTier: 'passive',
    medicalBasis: HA_BASIS,
    citationIds: ['acr:sudden-headache'],
    patientId: 'demo-patient-ha-1',
    userId: 'demo-practitioner-001',
  },
  belly: {
    id: 'belly',
    label: 'Belly',
    patientName: 'Sofia Martinez',
    mrn: '100201',
    age: 7,
    sex: 'Female',
    allergies: 'none',
    eGFR: 110,
    chiefComplaint: 'Right lower quadrant pain with fever',
    problems: [
      { display: 'Abdominal pain', icd10: 'R10.31' },
      { display: 'Fever', icd10: 'R50.9' },
    ],
    duration: 2,
    urgency: 'Urgent',
    modality: 'CT with contrast',
    bodyPart: 'abdomen',
    cpt: '74177',
    icd10: 'R10.31',
    orderDisplay: 'CT Abdomen with contrast',
    redFlags: [
      { flag: 'Fever', present: true },
      { flag: 'RLQ tenderness', present: true },
    ],
    avoidedCostEstimate: 1800,
    expectedTier: 'warning',
    medicalBasis: BELLY_BASIS,
    citationIds: ['acr:ped-rlq-pain'],
    patientId: 'demo-patient-belly',
    userId: 'demo-practitioner-001',
    alternativeWithBasis: {
      alternative: draftServiceRequest(
        'demo-patient-belly',
        'alt-belly-us',
        '76705',
        'Ultrasound appendix',
        'RLQ pain — appendicitis evaluation',
        'R10.31',
        {
          bodyPart: 'appendix / RLQ',
          modalityNote: 'Ultrasound',
          prep: 'Typically none; NPO if sedation is planned',
          radiationNote: 'None (no ionizing radiation)',
        },
      ),
      basis: medicalBasisFromCitation(
        'acr:ped-rlq-pain',
        'guideline',
        'Pediatric RLQ ACR criteria rate ultrasound as usually appropriate first-line before CT in suspected appendicitis.',
        'ACR Pediatric RLQ — Ultrasound first',
      ),
      considerations: [
        'May not apply when perforation, abscess, or complicated appendicitis is suspected on exam.',
        'Re-verify fever curve, RLQ exam, and surgical consultation availability before substituting.',
        'Revisit CT if ultrasound is non-diagnostic and clinical suspicion for appendicitis remains high.',
      ],
    },
  },
  knee: {
    id: 'knee',
    label: 'Knee',
    patientName: 'Robert Kim',
    mrn: '100312',
    age: 65,
    sex: 'Male',
    allergies: 'none',
    eGFR: 72,
    chiefComplaint: 'Chronic knee pain — osteoarthritis',
    problems: [
      { display: 'Primary osteoarthritis, right knee', icd10: 'M17.11' },
      { display: 'Type 2 diabetes mellitus', icd10: 'E11.9' },
    ],
    duration: 180,
    urgency: 'Routine',
    modality: 'MRI',
    bodyPart: 'knee',
    cpt: '73721',
    icd10: 'M17.11',
    orderDisplay: 'MRI Knee without contrast',
    redFlags: [{ flag: 'Acute trauma', present: false }],
    avoidedCostEstimate: 2100,
    expectedTier: 'warning',
    medicalBasis: KNEE_BASIS,
    citationIds: ['acr:knee-oa'],
    patientId: 'demo-patient-knee',
    userId: 'demo-practitioner-001',
    alternativeWithBasis: {
      alternative: draftServiceRequest(
        'demo-patient-knee',
        'alt-knee-xr',
        '73562',
        'X-ray knee 3 views',
        'Chronic knee pain — structural baseline',
        'M17.11',
        {
          bodyPart: 'knee',
          modalityNote: 'X-ray',
          prep: 'Weight-bearing views when clinically appropriate',
          radiationNote: '~0.005 mSv effective dose (approx.)',
        },
      ),
      basis: medicalBasisFromCitation(
        'acr:knee-oa',
        'guideline',
        'ACR knee osteoarthritis pathways recommend radiographs before MRI when evaluating chronic mechanical knee pain without red flags.',
        'ACR Knee OA — Radiograph first',
      ),
      considerations: [
        'May not apply when acute trauma, infection, or rapidly progressive effusion is present.',
        'Re-verify mechanical symptoms, effusion, and prior imaging before substituting.',
        'Revisit MRI after radiographs if surgery, internal derangement, or refractory symptoms warrant advanced imaging.',
      ],
    },
  },
};

/** Ordered list for scenario picker UI. */
export const DEMO_SCENARIO_LIST: DemoScenario[] = [
  DEMO_SCENARIOS['lbp-1'],
  DEMO_SCENARIOS['ha-1'],
  DEMO_SCENARIOS.belly,
  DEMO_SCENARIOS.knee,
];

/**
 * Resolves a scenario by id (defaults to lbp-1).
 *
 * @param id - Scenario id from the picker.
 */
export function getDemoScenario(id: string): DemoScenario {
  const key = id as DemoScenarioId;
  return DEMO_SCENARIOS[key] ?? DEMO_SCENARIOS['lbp-1'];
}
