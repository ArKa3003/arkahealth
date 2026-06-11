/**
 * Illustrative rural imaging reimbursement rates for the demo rate table.
 * Values are relative to a $100 professional-component baseline — not live fee schedules.
 */

export type RuralImagingRateRow = {
  cpt: string;
  description: string;
  modality: string;
  medicare: number;
  medicaid: number;
  commercial: number;
  ruralAdj: number;
};

export const RURAL_IMAGING_RATES: RuralImagingRateRow[] = [
  {
    cpt: "71046",
    description: "Chest X-ray, 2 views",
    modality: "X-ray",
    medicare: 28,
    medicaid: 18,
    commercial: 42,
    ruralAdj: 1.03,
  },
  {
    cpt: "73030",
    description: "Shoulder X-ray, minimum 2 views",
    modality: "X-ray",
    medicare: 24,
    medicaid: 15,
    commercial: 38,
    ruralAdj: 1.03,
  },
  {
    cpt: "76705",
    description: "Ultrasound, abdominal limited",
    modality: "Ultrasound",
    medicare: 52,
    medicaid: 34,
    commercial: 78,
    ruralAdj: 1.04,
  },
  {
    cpt: "70450",
    description: "CT head without contrast",
    modality: "CT",
    medicare: 98,
    medicaid: 62,
    commercial: 145,
    ruralAdj: 1.05,
  },
  {
    cpt: "74177",
    description: "CT abdomen/pelvis with contrast",
    modality: "CT",
    medicare: 186,
    medicaid: 118,
    commercial: 275,
    ruralAdj: 1.05,
  },
  {
    cpt: "70553",
    description: "MRI brain with and without contrast",
    modality: "MRI",
    medicare: 312,
    medicaid: 198,
    commercial: 465,
    ruralAdj: 1.06,
  },
  {
    cpt: "77067",
    description: "Screening mammography, bilateral",
    modality: "Mammography",
    medicare: 68,
    medicaid: 44,
    commercial: 102,
    ruralAdj: 1.04,
  },
  {
    cpt: "93306",
    description: "Echocardiography, complete",
    modality: "Ultrasound",
    medicare: 142,
    medicaid: 91,
    commercial: 210,
    ruralAdj: 1.03,
  },
];
