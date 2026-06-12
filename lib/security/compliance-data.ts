// Single source of truth for /security. Update statuses HERE when audit artifacts are issued (see ARKA-RDY-004 § 4 claims standard) — components render this data verbatim.

export type FrameworkStatus = "in-force" | "in-progress" | "roadmap";

export type MilestoneState = "done" | "active" | "upcoming";

export const STATUS_PILLS = [
  { label: "HIPAA program in force", status: "in-force" },
  { label: "SOC 2 Type I/II in progress", status: "in-progress" },
  { label: "HITRUST e1 roadmap", status: "roadmap" },
] as const satisfies ReadonlyArray<{ label: string; status: FrameworkStatus }>;

export const FRAMEWORKS = [
  {
    id: "hipaa",
    name: "HIPAA — Privacy, Security & Breach Notification Rules",
    status: "in-force",
    statusLabel: "Program in force",
    summary:
      "Full privacy and security policy suite adopted and operating; business associate agreement ready for execution; annual NIST 800-30 risk analysis complete.",
    detail:
      "HIPAA has no government certification. Compliance is demonstrated through adopted policies, implemented safeguards, and a six-year evidence trail — all maintained under ARKA's Information Security & Compliance Program Charter and available for diligence review.",
    docRef: "ARKA-GOV-001 · ARKA-PRIV series · ARKA-SEC series",
  },
  {
    id: "soc2",
    name: "SOC 2 — Security, Availability, Confidentiality",
    status: "in-progress",
    statusLabel: "In progress",
    summary:
      "Readiness assessment complete against the 2017 Trust Services Criteria (2022 points of focus). Type I examination targeted December 2026; Type II report mid-2027.",
    detail:
      "ARKA does not claim SOC 2 attestation before the auditor's report is issued. On issuance, the report will be available to customers and prospects under NDA.",
    docRef: "ARKA-RDY-002",
  },
  {
    id: "hitrust",
    name: "HITRUST e1 — Essentials, 1-Year Validated",
    status: "roadmap",
    statusLabel: "Roadmap active",
    summary:
      "44-requirement e1 tier selected as the appropriate entry certification; MyCSF self-assessment Q1 2027, validated assessment H1 2027. ~80–90% control overlap with the SOC 2 program lets one evidence body serve both.",
    detail:
      "ARKA is not HITRUST certified and will not use the phrase or the seal until the validated assessment is issued.",
    docRef: "ARKA-RDY-003",
  },
  {
    id: "nprm",
    name: "2025 HIPAA Security Rule NPRM",
    status: "in-force",
    statusLabel: "Adopted as baseline",
    summary:
      "The December 2024 OCR proposal's heightened specifications are ARKA's internal baseline today: mandatory MFA, universal encryption, asset inventory and network map, six-month vulnerability scans, annual penetration testing, segmentation, 72-hour restore capability.",
    detail:
      "Designing to the proposed rule now means no scramble when it is finalized — and answers the question hospital CISOs are already asking vendors.",
    docRef: "ARKA-SEC-001 § 5 · ARKA-SEC-007",
  },
] as const satisfies ReadonlyArray<{
  id: string;
  name: string;
  status: FrameworkStatus;
  statusLabel: string;
  summary: string;
  detail: string;
  docRef: string;
}>;

export const CONTROL_PILLARS = [
  {
    id: "encryption",
    icon: "Lock",
    title: "Encryption everywhere",
    points: [
      "AES-256 at rest across databases, object storage, and backups",
      "TLS 1.2+ in transit (1.3 preferred), HSTS on all public endpoints",
      "Keys in managed KMS; rotation and custody documented; no plaintext ePHI anywhere",
    ],
  },
  {
    id: "access",
    icon: "KeyRound",
    title: "Access control",
    points: [
      "MFA on all production, code, and data systems; FIDO2 hardware keys for admins",
      "Role-based least privilege from a documented access matrix; quarterly reviews",
      "24-hour deprovisioning; break-glass access alarmed, logged, and reviewed",
    ],
  },
  {
    id: "monitoring",
    icon: "FileSearch",
    title: "Audit & monitoring",
    points: [
      "Append-only audit trail: record-level access, admin actions, deployments",
      "Security logs retained 6 years; alerting on anomalous access and exports",
      "Weekly security review; monthly sampled access-log review",
    ],
  },
  {
    id: "resilience",
    icon: "DatabaseBackup",
    title: "Resilience",
    points: [
      "Immutable cross-region backups: 35-day point-in-time + 12-month archives",
      "Quarterly restore tests; annual full recovery exercise",
      "72-hour restoration standard for critical systems; 15-minute RPO on the data tier",
    ],
  },
  {
    id: "vendors",
    icon: "Network",
    title: "Vendor & subcontractor risk",
    points: [
      "Tiered vendor register; BAAs executed with every PHI-touching subprocessor",
      "Annual attestation review (SOC 2 / ISO 27001) mapped to shared-responsibility matrix",
      "NIST 800-88 return/destruction on offboarding",
    ],
  },
  {
    id: "sdlc",
    icon: "GitBranch",
    title: "Secure development",
    points: [
      "Protected branches; CI gates: type checks, compliance tests, dependency audit, secret scanning",
      "No production data in dev, test, or demo — synthetic fixtures enforced by CI guards",
      "Independent penetration test annually; criticals fixed in 10 days",
    ],
  },
] as const satisfies ReadonlyArray<{
  id: string;
  icon: string;
  title: string;
  points: readonly string[];
}>;

export const HARD_NUMBERS = [
  { value: "0", label: "PHI records in the demo environment — 100% synthetic data" },
  { value: "21", label: "controlled documents in the compliance package" },
  { value: "6 yr", label: "security-evidence retention (45 C.F.R. § 164.316)" },
  { value: "≤ 10 bd", label: "customer breach notice under our BAA" },
  { value: "72 h", label: "critical-system restore standard" },
  { value: "100%", label: "of workforce trained before production access" },
] as const satisfies ReadonlyArray<{ value: string; label: string }>;

export const MILESTONES = [
  {
    quarter: "Q2 2026",
    title: "Policy suite adopted",
    detail:
      "21-document HIPAA/SOC 2/HITRUST program in force; initial NIST 800-30 risk analysis complete",
    state: "done",
  },
  {
    quarter: "Q3 2026",
    title: "Hardening & evidence accrual",
    detail: "FIDO2 rollout, cloud-posture scanning, cyber insurance, audit-firm engagement",
    state: "active",
  },
  {
    quarter: "Q4 2026",
    title: "Pen test + SOC 2 Type I",
    detail: "First independent penetration test; Type I examination as of December 2026",
    state: "upcoming",
  },
  {
    quarter: "Q4 2026 – Q2 2027",
    title: "Type II observation window",
    detail: "≥ 3 months of operating evidence; first design-partner BAAs executed",
    state: "upcoming",
  },
  {
    quarter: "H1 2027",
    title: "SOC 2 Type II report · HITRUST e1",
    detail: "Type II report issued; e1 validated assessment submitted for certification",
    state: "upcoming",
  },
] as const satisfies ReadonlyArray<{
  quarter: string;
  title: string;
  detail: string;
  state: MilestoneState;
}>;

export const DOCUMENT_LIBRARY = [
  {
    series: "Governance",
    items: [
      { no: "ARKA-GOV-001", title: "Information Security & Compliance Program Charter" },
    ],
  },
  {
    series: "Privacy",
    items: [
      { no: "ARKA-PRIV-001", title: "HIPAA Privacy Policy" },
      { no: "ARKA-PRIV-002", title: "De-Identification & Limited Data Set Policy" },
    ],
  },
  {
    series: "Contracts",
    items: [
      { no: "ARKA-LGL-001", title: "Business Associate Agreement (Template)" },
    ],
  },
  {
    series: "Security",
    items: [
      { no: "ARKA-SEC-001", title: "Information Security Policy" },
      { no: "ARKA-SEC-002", title: "Risk Analysis & Risk Management" },
      { no: "ARKA-SEC-003", title: "Access Control & Identity Management" },
      { no: "ARKA-SEC-004", title: "Encryption & Key Management" },
      { no: "ARKA-SEC-005", title: "Audit Logging & Monitoring" },
      { no: "ARKA-SEC-006", title: "Incident Response & Breach Notification" },
      { no: "ARKA-SEC-007", title: "Contingency Plan (Backup, DR & Emergency Mode)" },
      { no: "ARKA-SEC-008", title: "Workforce Training & Sanctions" },
      { no: "ARKA-SEC-009", title: "Vendor & Subcontractor Risk Management" },
      { no: "ARKA-SEC-010", title: "Secure SDLC & Change Management" },
      { no: "ARKA-SEC-011", title: "Data Classification, Retention & Disposal" },
      { no: "ARKA-SEC-012", title: "Acceptable Use, Workstation & Mobile Device" },
    ],
  },
  {
    series: "Readiness",
    items: [
      { no: "ARKA-RDY-001", title: "HIPAA Security Risk Assessment Report (2026)" },
      { no: "ARKA-RDY-002", title: "SOC 2 Readiness & Gap Assessment" },
      { no: "ARKA-RDY-003", title: "HITRUST e1 Readiness Roadmap" },
      { no: "ARKA-RDY-004", title: "Compliance Roadmap & Certification Timeline" },
    ],
  },
  {
    series: "Demo",
    items: [
      {
        no: "ARKA-DEMO-001",
        title: "Demo Environment Synthetic Data Policy & No-PHI Attestation",
      },
    ],
  },
] as const satisfies ReadonlyArray<{
  series: string;
  items: ReadonlyArray<{ no: string; title: string }>;
}>;

export const FAQ = [
  {
    q: "Is ARKA 'HIPAA certified'?",
    a: "No one is — HIPAA has no certification. What exists is a compliance program: adopted policies, implemented safeguards, risk analyses, training, and evidence. Ours is in force and documented in a 21-document package available under NDA. Vendors who say 'HIPAA certified' are telling you something about their diligence.",
  },
  {
    q: "Will ARKA sign a BAA?",
    a: "Yes. We maintain an attorney-drafted Business Associate Agreement template (45 C.F.R. §§ 164.314(a), 164.504(e)) with 10-business-day breach notice, subcontractor flow-down, and NIST 800-88 return/destruction terms. We also execute customer paper subject to counsel review.",
  },
  {
    q: "Is ARKA SOC 2 or HITRUST certified today?",
    a: "Not yet, and we won't claim otherwise. SOC 2 Type I is targeted for December 2026 with the Type II report to follow in mid-2027; HITRUST e1 validated assessment is targeted H1 2027. The full timeline, including what we say publicly at each stage, is documented in ARKA-RDY-004.",
  },
  {
    q: "Does the demo contain real patient data?",
    a: "No. Every patient, encounter, claim, and scenario in the ARKA demo is synthetic — generated by our synthetic-data tooling and tagged with an [ARKA-DEMO] marker. A quarterly officer-signed attestation (ARKA-DEMO-001) verifies the environment, and submitting PHI into the demo is prohibited by our terms.",
  },
  {
    q: "Where is data hosted and who can see it?",
    a: "Production runs on U.S. cloud infrastructure (AWS, Vercel, Supabase) under executed BAAs with each provider before any PHI flows. Tenant data is isolated with row-level security; ARKA staff access customer tenants only through a logged, ticketed support workflow.",
  },
  {
    q: "Does ARKA train AI models on PHI?",
    a: "No. Model training, evaluation, and analytics use synthetic or de-identified data exclusively (ARKA-PRIV-002), with disclosure-risk review on outputs. De-identification of customer PHI happens only where the BAA expressly permits it.",
  },
] as const satisfies ReadonlyArray<{ q: string; a: string }>;

export const DEMO_LAST_VERIFIED = "June 10, 2026";

export const CONTACTS = {
  security: "security@getarka.health",
  privacy: "privacy@getarka.health",
  overviewPdf: "/docs/ARKA_Data_Security_Overview.pdf",
} as const;
