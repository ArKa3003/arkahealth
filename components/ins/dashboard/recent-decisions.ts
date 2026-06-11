/**
 * Presentation helpers for payer dashboard recent-decisions table.
 */

export type DecisionStatus = "approved" | "denied" | "pended" | "auto_approved";

export interface RecentDecisionRow {
  id: string;
  cptCode: string;
  payerId: string;
  payerLabel: string;
  submittedAt: string;
  decisionAt: string;
  status: DecisionStatus;
  aiieScore: number;
  denialReason?: string;
  factors: Array<{ id: string; label: string; contribution: number }>;
  evidenceLinks: Array<{ label: string; href: string }>;
}

const DENIAL_REASONS = [
  "Prior imaging within recommended interval",
  "Conservative care trial not documented",
  "Indication not aligned with ACR criteria",
  "Missing red-flag symptom documentation",
  "Plan policy exception required",
] as const;

function payerLabel(id: string): string {
  return id
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function inferStatus(
  pas: Record<string, unknown> | null,
  appealFiled: boolean,
): DecisionStatus {
  const outcome = pas?.outcome ?? pas?.disposition;
  if (typeof outcome === "string") {
    const o = outcome.toLowerCase();
    if (o.includes("deny")) return "denied";
    if (o.includes("pend")) return "pended";
    if (o.includes("auto")) return "auto_approved";
    if (o.includes("approv")) return "approved";
  }
  if (appealFiled) return "denied";
  const seed = hashSeed(JSON.stringify(pas ?? {}));
  const modes: DecisionStatus[] = ["approved", "auto_approved", "denied", "pended"];
  return modes[seed % modes.length] ?? "approved";
}

/** First-party AIIE evidence slugs for the demo CPT codes (Part 4 evidence routes). */
const CPT_EVIDENCE: Record<string, { label: string; slug: string }> = {
  "72148": {
    label: "AIIE Evidence — MRI lumbar spine appropriateness",
    slug: "spine-lumbar-low-back-pain-radiculopathy-over-6wk",
  },
  "74176": {
    label: "AIIE Evidence — CT abdomen/pelvis appropriateness",
    slug: "abdomen-rlq-appendicitis-adult-ct",
  },
  "70553": {
    label: "AIIE Evidence — MRI brain appropriateness",
    slug: "head-brain-acute-headache-chronic-stable",
  },
  "71260": {
    label: "AIIE Evidence — CT chest appropriateness",
    slug: "chest-acute-chest-pain-pe-intermediate-pretest",
  },
  "76700": {
    label: "AIIE Evidence — US abdomen appropriateness",
    slug: "abdomen-ruq-cholecystitis-us-first",
  },
};

/** Builds first-party evidence links for a decision row from its CPT code. */
function evidenceLinksForCpt(cptCode: string): RecentDecisionRow["evidenceLinks"] {
  const mapped = CPT_EVIDENCE[cptCode];
  return [
    mapped
      ? { label: mapped.label, href: `/evidence/${mapped.slug}` }
      : { label: "AIIE evidence library", href: "/evidence" },
    { label: "Regulatory rationale", href: "/docs/regulatory-rationale" },
  ];
}

function demoFactors(score: number): RecentDecisionRow["factors"] {
  if (score >= 7) {
    return [
      { id: "indication", label: "Clinical indication documented", contribution: 1.2 },
      { id: "guideline", label: "ACR guideline alignment", contribution: 0.9 },
      { id: "prior", label: "Prior imaging interval", contribution: -0.3 },
    ];
  }
  if (score >= 5) {
    return [
      { id: "indication", label: "Indication present but thin", contribution: 0.4 },
      { id: "conservative", label: "Conservative care gap", contribution: -0.8 },
      { id: "redundancy", label: "Recent comparable study", contribution: -0.6 },
    ];
  }
  return [
    { id: "indication", label: "Weak clinical indication", contribution: -1.1 },
    { id: "conservative", label: "No conservative trial documented", contribution: -0.9 },
    { id: "policy", label: "Plan LCD criteria not met", contribution: -0.7 },
  ];
}

/**
 * Maps `ins_pa_history` drill-down rows to dashboard table rows (presentation only).
 */
export function mapPaHistoryToDecisions(
  rows: Array<{
    id: string;
    payer_id: string;
    cpt_code: string;
    submitted_at: string;
    decision_at: string | null;
    appeal_filed: boolean;
    pas_response: Record<string, unknown> | null;
  }>,
): RecentDecisionRow[] {
  return rows.slice(0, 25).map((row) => {
    const seed = hashSeed(row.id);
    const aiieScore = Math.min(9, Math.max(1, Math.round(3 + (seed % 60) / 10)));
    const status = inferStatus(row.pas_response, row.appeal_filed);
    return {
      id: row.id,
      cptCode: row.cpt_code,
      payerId: row.payer_id,
      payerLabel: payerLabel(row.payer_id),
      submittedAt: row.submitted_at,
      decisionAt: row.decision_at ?? row.submitted_at,
      status,
      aiieScore,
      denialReason: status === "denied" ? DENIAL_REASONS[seed % DENIAL_REASONS.length] : undefined,
      factors: demoFactors(aiieScore),
      evidenceLinks: evidenceLinksForCpt(row.cpt_code),
    };
  });
}

/** Offline demo rows when the drill-down API is unavailable. */
export function buildDemoRecentDecisions(): RecentDecisionRow[] {
  const payers = ["uhc", "bcbs-tx", "aetna", "humana", "cigna"];
  const cpts = ["72148", "74176", "70553", "71260", "76700"];
  const now = Date.now();

  return Array.from({ length: 12 }, (_, i) => {
    const id = `demo-decision-${i}`;
    const seed = hashSeed(id);
    const aiieScore = Math.min(9, Math.max(1, Math.round(4 + (seed % 50) / 10)));
    const statuses: DecisionStatus[] = ["approved", "auto_approved", "denied", "pended"];
    const status = statuses[seed % statuses.length] ?? "approved";
    const cptCode = cpts[i % cpts.length] ?? "72148";
    return {
      id,
      cptCode,
      payerId: payers[i % payers.length] ?? "uhc",
      payerLabel: payerLabel(payers[i % payers.length] ?? "uhc"),
      submittedAt: new Date(now - (i + 1) * 3600000 * 6).toISOString(),
      decisionAt: new Date(now - (i + 1) * 3600000 * 4).toISOString(),
      status,
      aiieScore,
      denialReason: status === "denied" ? DENIAL_REASONS[seed % DENIAL_REASONS.length] : undefined,
      factors: demoFactors(aiieScore),
      evidenceLinks: evidenceLinksForCpt(cptCode),
    };
  });
}

/** Pareto denial-reason counts for the dashboard bar chart. */
export function buildDenialParetoData(): Array<{ reason: string; count: number }> {
  return [
    { reason: "Prior imaging", count: 42 },
    { reason: "Conservative care", count: 36 },
    { reason: "ACR misalignment", count: 28 },
    { reason: "Documentation gap", count: 22 },
    { reason: "Policy exception", count: 14 },
    { reason: "Other", count: 8 },
  ];
}

/** Approval funnel stages for the dashboard chart. */
export function buildApprovalFunnelData(totalAuth: number): Array<{ stage: string; count: number }> {
  const submitted = totalAuth;
  const screened = Math.round(submitted * 0.98);
  const autoApproved = Math.round(screened * 0.62);
  const clinicalReview = Math.round(screened * 0.28);
  const decided = autoApproved + clinicalReview;
  const denied = Math.round(decided * 0.08);
  const approved = decided - denied;

  return [
    { stage: "Submitted", count: submitted },
    { stage: "AIIE screened", count: screened },
    { stage: "Auto-approved", count: autoApproved },
    { stage: "Clinical review", count: clinicalReview },
    { stage: "Approved", count: approved },
    { stage: "Denied", count: denied },
  ];
}
