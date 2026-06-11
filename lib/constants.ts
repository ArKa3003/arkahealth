/**
 * ARKA Health – shared design tokens and config
 */

export const colors = {
  primary: {
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",
    950: "#172554",
  },
  accent: {
    teal: "#0d9488",
    emerald: "#059669",
    slate: "#475569",
  },
  neutral: {
    50: "#f8fafc",
    100: "#f1f5f9",
    200: "#e2e8f0",
    300: "#cbd5e1",
    400: "#94a3b8",
    500: "#64748b",
    600: "#475569",
    700: "#334155",
    800: "#1e293b",
    900: "#0f172a",
  },
} as const;

export const fonts = {
  sans: "var(--font-geist-sans)",
  mono: "var(--font-geist-mono)",
} as const;

export const routes = {
  home: "/",
  clin: "/clin",
  clinSuite: "/clin-suite",
  ed: "/ed",
  ins: "/ins",
  rural: "/rural",
  ruralCds: "/rural/cds",
  ruralTele: "/rural/tele",
  cdsHooksDemo: "/cds-hooks-demo",
  cdsHooksDemoValidation: "/cds-hooks-demo/validation",
  cdsHooksDiscovery: "/cds-hooks-discovery",
  regulatoryRationale: "/docs/regulatory-rationale",
  featureCatalog: "/docs/feature-catalog",
  modelCard: "/docs/model-card",
  trust: "/trust",
  roi: "/roi",
} as const;

/** FDA §520(o)(1)(E) non-device CDS criteria — links anchor Phase 11 regulatory memo route. */
export const FDA_NON_DEVICE_CRITERIA = [
  {
    id: "criterion-1",
    name: "Not device software",
    implementation:
      "ARKA ingests structured FHIR resources only; the Feature Rationale Catalogue documents permitted source types and excludes image-pixel pipelines.",
    href: `${routes.regulatoryRationale}#criterion-1`,
  },
  {
    id: "criterion-2",
    name: "Basis in published evidence",
    implementation:
      "Cards and ML features link to ACR Appropriateness Criteria and registered citations in the Citation Library with last-verified dates.",
    href: `${routes.regulatoryRationale}#criterion-2`,
  },
  {
    id: "criterion-3",
    name: "Recommendations, not directives",
    implementation:
      "FDA disclosure text on every surface states that the ordering clinician retains full responsibility for the final decision.",
    href: `${routes.regulatoryRationale}#criterion-3`,
  },
  {
    id: "criterion-4",
    name: "Independent review",
    implementation:
      "SHAP contributions, feature metadata on /predict, and this validation dashboard expose why each score was produced.",
    href: `${routes.regulatoryRationale}#criterion-4`,
  },
] as const;

export const navLinks = [
  { href: routes.home, label: "Home" },
  { href: routes.clinSuite, label: "ARKA-CLIN Suite" },
  { href: routes.ed, label: "ARKA-ED" },
  { href: routes.ins, label: "ARKA-INS" },
  { href: routes.rural, label: "Rural Platform" },
] as const;

export const demoNavLinks = [
  { href: routes.clinSuite, label: "ARKA-CLIN Suite", icon: "Stethoscope" },
  { href: routes.ed, label: "ARKA-ED", icon: "GraduationCap" },
  { href: routes.ins, label: "ARKA-INS", icon: "Shield" },
  { href: routes.rural, label: "Rural Platform", icon: "TreePine" },
] as const;

export const phaseCards = [
  {
    id: "clin-suite",
    title: "ARKA-CLIN Suite",
    subtitle: "Standalone + EHR-Embedded (CDS Hooks)",
    description:
      "Two views, one engine. The standalone clinician web app and ARKA running inside a simulated Epic chart via HL7 CDS Hooks — on a single page.",
    href: routes.clinSuite,
    icon: "Stethoscope",
    liveDemo: true,
  },
  {
    id: "ed",
    title: "ARKA-ED",
    description: "Emergency department imaging workflow and CDS.",
    href: routes.ed,
    icon: "Zap",
  },
  {
    id: "ins",
    title: "ARKA-INS",
    description: "Insurance prior authorization and appropriateness.",
    href: routes.ins,
    icon: "Shield",
  },
  {
    id: "rural",
    title: "Rural Platform",
    description: "Rural imaging crisis hub — CDS, tele, training, and analytics.",
    href: routes.rural,
    icon: "TreePine",
  },
] as const;

/** Shown in site footer and compliance surfaces; bump when AIIE model or factor set changes materially. */
export const AIIE_ENGINE_VERSION = "2.0.0" as const;

/** Validation, regulatory, and CDS discovery surfaces — single source for nav, footer, and clin-suite. */
export const complianceLinks = [
  {
    href: routes.cdsHooksDemoValidation,
    label: "Validation Dashboard",
    description: "CDS service validation, latency, and conformance metrics.",
  },
  {
    href: routes.regulatoryRationale,
    label: "Regulatory Rationale",
    description: "FDA Non-Device CDS rationale memo (§520(o)(1)(E)).",
  },
  {
    href: routes.featureCatalog,
    label: "Feature Evidence Catalog",
    footerLabel: "Feature Catalog",
    description: "Per-feature evidence with last-verified citations.",
  },
  {
    href: "/.well-known/cds-services",
    label: "Discovery JSON",
    description: "Raw HL7 CDS Hooks 2.0 discovery document.",
    external: true,
  },
] as const;
