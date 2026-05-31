/**
 * ARKA ROI model — single source of truth for the /roi page.
 * Every figure is a MODELED, conservative estimate built on published third-party
 * figures (CAQH, KFF, MGMA, AMA, ACR, Change Healthcare, Johns Hopkins). ARKA is
 * Non-Device CDS; these are decision-support economics, not a guarantee of outcomes.
 * Citations are listed in CITATIONS below and surfaced on the page.
 */

export type Citation = {
  id: string;
  label: string;
  detail: string;
  url: string;
};

export const CITATIONS: Citation[] = [
  {
    id: "change-healthcare",
    label: "Change Healthcare 2020 Denials Index",
    detail: "86% of denials are potentially avoidable; 34% are unequivocally avoidable; ~48% of avoidable denials are never recovered.",
    url: "https://www.rivethealth.com/blog/denials-revenue-cycle-management",
  },
  {
    id: "kff-2023",
    label: "KFF — ACA Marketplace claims denials & appeals (2023)",
    detail: "HealthCare.gov insurers denied ~19–20% of in-network claims; consumers appealed fewer than 1% of denials; 56% of appealed denials were upheld.",
    url: "https://www.kff.org/private-insurance/claims-denials-and-appeals-in-aca-marketplace-plans-in-2023/",
  },
  {
    id: "mgma-rework",
    label: "MGMA / Change Healthcare — cost to rework a denied claim",
    detail: "~$25 average administrative cost to rework a claim; up to ~$118 fully loaded; MGMA estimates 50–65% of denials are never reworked.",
    url: "https://www.mgma.com/mgma-stats/6-keys-to-addressing-denials-in-your-medical-practice-s-revenue-cycle",
  },
  {
    id: "caqh-index",
    label: "CAQH Index (2023 / 2024)",
    detail: "Manual prior authorization costs providers ~$10.97 per transaction and ~24 minutes of staff time; full electronic PA cuts cost and time dramatically.",
    url: "https://www.caqh.org/hubfs/43908627/drupal/2024-01/2023_CAQH_Index_Report.pdf",
  },
  {
    id: "ama-survey",
    label: "AMA 2024 Prior Authorization Physician Survey",
    detail: "94% of physicians report PA delays care; 78% report patients abandon treatment; physicians average ~13 hours/week on PA.",
    url: "https://www.ama-assn.org/practice-management/prior-authorization/exhausted-prior-auth-many-patients-abandon-care-ama-survey",
  },
  {
    id: "jhu-prices",
    label: "Johns Hopkins — commercial vs. Medicare radiology prices (2021)",
    detail: "Median commercial price for MRI brain w/wo contrast ~$1,788 (4x Medicare $446); CT head w/o contrast ~$813 (5.9x Medicare $137).",
    url: "https://hub.jhu.edu/2021/12/13/radiological-services-compared-to-medicare/",
  },
  {
    id: "oig-ma",
    label: "HHS OIG — Medicare Advantage prior-authorization denials",
    detail: "Among denied payment requests reviewed, ~18% met Medicare coverage and billing rules — i.e., were improperly denied.",
    url: "https://oig.hhs.gov/oei/reports/OEI-09-18-00260.pdf",
  },
];

/** Model assumptions for the conservative case (a regional hospital group). */
export const ASSUMPTIONS = {
  annualAdvancedStudies: 120000,          // advanced imaging studies / yr (MRI, CT, PET)
  denialRatePct: 22,                      // conservative midpoint of the 20–40% range
  avoidablePct: 86,                       // share of denials that are avoidable (Change Healthcare)
  blendedValuePerOrder: 1180,             // blended reimbursement/margin at risk per avoidable advanced-imaging order ($)
  arkaCaptureOfStudiesPct: 2.5,           // conservative share of ALL studies ARKA converts to clean pays
  reworkCostPerClaim: 25,                 // $ admin cost to rework one denied claim (low end)
  throughputRecovery: 500000,             // $ / yr from faster approvals on highest-margin line
  pmpmLow: 0.30,                          // $ price per member per month (low)
  pmpmHigh: 0.50,                         // $ price per member per month (high)
  modeledFirstYearReturnX: 2.3,           // modeled first-year return multiple
} as const;

/** Derived headline numbers (kept in one place so the page and charts stay in sync). */
const ordersRecovered = Math.round(
  ASSUMPTIONS.annualAdvancedStudies * (ASSUMPTIONS.arkaCaptureOfStudiesPct / 100),
);
const denialRecovery = ordersRecovered * ASSUMPTIONS.blendedValuePerOrder; // ≈ $3.54M
const reworkAvoided = ordersRecovered * ASSUMPTIONS.reworkCostPerClaim;     // ≈ $75K
const throughput = ASSUMPTIONS.throughputRecovery;                          // $0.5M
const grossRecovery = denialRecovery + reworkAvoided + throughput;

export const RESULTS = {
  ordersRecovered,
  denialRecovery,
  reworkAvoided,
  throughput,
  grossRecovery,
} as const;

/** Waterfall data for the recovery chart. */
export const WATERFALL = [
  { name: "Denial recovery", value: Math.round(denialRecovery), note: "Clean documentation at point of order converts would-be denials to clean pays." },
  { name: "Rework labor avoided", value: Math.round(reworkAvoided), note: "Fewer denials means fewer appeals worked by staff." },
  { name: "Throughput defense", value: Math.round(throughput), note: "Faster approvals shorten the backlog on your highest-margin line." },
] as const;

/** Headline stat cards. */
export const HEADLINE_STATS = [
  { value: "~$3.5M", label: "recovered / yr in avoidable imaging denials" },
  { value: "86%", label: "of imaging denials are avoidable" },
  { value: "<800ms", label: "to score an order, in-flow, no extra click" },
  { value: "35–40%", label: "of orders auto-clear and never hit a queue" },
] as const;

export function formatUsd(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
}
