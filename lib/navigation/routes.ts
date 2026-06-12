/**
 * Typed navigation registry for command palette, footer, and mega-menu surfaces.
 */

import { routes } from "@/lib/constants";

export type CommandRouteGroup =
  | "Phases"
  | "Demos"
  | "Evidence"
  | "Docs"
  | "Compliance"
  | "Company";

/** Searchable route entry for {@link CommandMenu}. */
export type CommandRoute = {
  id: string;
  title: string;
  href: string;
  description?: string;
  group: CommandRouteGroup;
  keywords?: string[];
  external?: boolean;
};

/** Phase pillar entries for mega-menu and footer. */
export type PhaseNavItem = {
  id: string;
  name: string;
  description: string;
  href: string;
  keywords: string[];
};

export const phaseNavItems: PhaseNavItem[] = [
  {
    id: "clin",
    name: "ARKA-CLIN",
    description: "Appropriateness at order entry — standalone & CDS Hooks.",
    href: routes.clinSuite,
    keywords: ["clin", "clinical", "appropriateness", "cds hooks", "ehr"],
  },
  {
    id: "ed",
    name: "ARKA-ED",
    description: "Emergency imaging education and workflow CDS.",
    href: routes.ed,
    keywords: ["ed", "emergency", "education", "acrr"],
  },
  {
    id: "ins",
    name: "ARKA-INS",
    description: "Prior auth, gold card, and utilization management.",
    href: routes.ins,
    keywords: ["ins", "insurance", "prior auth", "payer", "um"],
  },
  {
    id: "rural",
    name: "ARKA-RURAL",
    description: "Rural imaging hub — CDS, tele, training, analytics.",
    href: routes.rural,
    keywords: ["rural", "tele", "network", "reimbursement"],
  },
];

/** Paths that show the page scroll progress bar (2px teal). */
export const scrollProgressPaths = [
  "/docs",
  "/privacy",
  "/terms",
  "/trust",
  "/security",
  "/action-plan",
  "/evidence",
] as const;

/** @see {@link isLightTopPage} in nav-appearance.ts — re-exported for backward compatibility. */
export { isLightTopPage } from "@/lib/navigation/nav-appearance";

/** True when scroll progress bar should render. */
export function showsScrollProgress(pathname: string): boolean {
  return scrollProgressPaths.some((p) => pathname.startsWith(p));
}

/** Simple includes()-based filter for command palette search. */
export function filterCommandRoutes(query: string, items: CommandRoute[]): CommandRoute[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;

  return items.filter((item) => {
    if (item.title.toLowerCase().includes(q)) return true;
    if (item.description?.toLowerCase().includes(q)) return true;
    if (item.group.toLowerCase().includes(q)) return true;
    return item.keywords?.some((k) => k.toLowerCase().includes(q)) ?? false;
  });
}

/** Full searchable route registry. */
export const commandRoutes: CommandRoute[] = [
  ...phaseNavItems.map((p) => ({
    id: `phase-${p.id}`,
    title: p.name,
    description: p.description,
    href: p.href,
    group: "Phases" as const,
    keywords: p.keywords,
  })),
  {
    id: "demo-clin",
    title: "ARKA-CLIN Demo",
    description: "Standalone clinician appropriateness demo.",
    href: routes.clin,
    group: "Demos",
    keywords: ["clin demo", "standalone"],
  },
  {
    id: "demo-cds-hooks",
    title: "CDS Hooks Live Demo",
    href: routes.cdsHooksDemo,
    group: "Demos",
    keywords: ["cds hooks", "epic", "sandbox"],
  },
  {
    id: "demo-cds-validation",
    title: "CDS Validation Dashboard",
    href: routes.cdsHooksDemoValidation,
    group: "Demos",
    keywords: ["validation", "conformance"],
  },
  {
    id: "demo-cds-discovery",
    title: "CDS Hooks Discovery",
    href: routes.cdsHooksDiscovery,
    group: "Demos",
    keywords: ["discovery", "well-known"],
  },
  {
    id: "rural-cds",
    title: "Rural CDS",
    href: routes.ruralCds,
    group: "Demos",
    keywords: ["rural cds", "triage"],
  },
  {
    id: "rural-tele",
    title: "Rural Tele",
    href: routes.ruralTele,
    group: "Demos",
    keywords: ["teleradiology", "tele"],
  },
  {
    id: "ins-dashboard",
    title: "INS Payer Dashboard",
    href: "/ins/dashboard",
    group: "Demos",
    keywords: ["payer", "utilization", "dashboard", "metrics"],
  },
  {
    id: "ins-reviewer",
    title: "INS Reviewer Dashboard",
    href: "/ins/reviewer",
    group: "Demos",
    keywords: ["reviewer", "hitl", "queue"],
  },
  {
    id: "ins-provider",
    title: "INS Provider Dashboard",
    href: "/ins/provider",
    group: "Demos",
    keywords: ["provider", "gold card"],
  },
  {
    id: "ins-roi",
    title: "INS ROI Dashboard",
    href: "/ins/dashboard/roi",
    group: "Evidence",
    keywords: ["roi", "validation metrics"],
  },
  {
    id: "evidence-library",
    title: "AIIE Evidence Library",
    description: "First-party evidence registry behind every AIIE recommendation.",
    href: routes.evidence,
    group: "Evidence",
    keywords: ["evidence", "citations", "guidelines", "knowledge matrix", "literature"],
  },
  {
    id: "roi",
    title: "ROI Calculator",
    href: routes.roi,
    group: "Evidence",
    keywords: ["return", "savings", "revenue"],
  },
  {
    id: "home",
    title: "Platform Overview",
    href: routes.home,
    group: "Company",
    keywords: ["home", "platform", "landing"],
  },
  {
    id: "platform",
    title: "Platform Overview",
    href: "/#platform",
    group: "Company",
    keywords: ["home", "platform", "landing", "ecosystem"],
  },
  {
    id: "aiie",
    title: "AIIE Technology",
    description: "ARKA Imaging Intelligence Engine vs traditional ACR Appropriateness Criteria.",
    href: "/#aiie",
    group: "Company",
    keywords: ["aiie", "acr", "appropriateness", "ml", "cds"],
  },
  {
    id: "trust",
    title: "Trust Center",
    description: "Regulatory posture summary and Q-Sub package links.",
    href: routes.trust,
    group: "Compliance",
    keywords: ["trust", "regulatory", "fda", "q-sub"],
  },
  {
    id: "security",
    title: "Security & Compliance",
    description: "HIPAA, SOC 2, HITRUST, encryption, and audit controls.",
    href: routes.security,
    group: "Compliance",
    keywords: ["security", "hipaa", "soc 2", "hitrust", "compliance", "encryption"],
  },
  {
    id: "doc-regulatory",
    title: "Regulatory Rationale",
    description: "FDA Non-Device CDS rationale memo.",
    href: routes.regulatoryRationale,
    group: "Docs",
    keywords: ["fda", "520", "non-device"],
  },
  {
    id: "doc-feature-catalog",
    title: "Feature Evidence Catalog",
    href: routes.featureCatalog,
    group: "Docs",
    keywords: ["features", "citations", "evidence"],
  },
  {
    id: "doc-model-card",
    title: "Model Card",
    href: "/docs/model-card",
    group: "Docs",
    keywords: ["model", "aiie", "ml"],
  },
  {
    id: "doc-action-plan",
    title: "Action Plan",
    href: "/action-plan",
    group: "Docs",
    keywords: ["roadmap", "plan"],
  },
  {
    id: "compliance-validation",
    title: "Validation Dashboard",
    href: routes.cdsHooksDemoValidation,
    group: "Compliance",
    keywords: ["cms", "0057"],
  },
  {
    id: "privacy",
    title: "Privacy Policy",
    href: "/privacy",
    group: "Company",
    keywords: ["hipaa", "privacy"],
  },
  {
    id: "terms",
    title: "Terms of Service",
    href: "/terms",
    group: "Company",
    keywords: ["terms", "legal"],
  },
  {
    id: "discovery-json",
    title: "CDS Discovery JSON",
    href: "/.well-known/cds-services",
    group: "Compliance",
    keywords: ["hl7", "well-known"],
    external: true,
  },
];

export const CONTACT_EMAIL = "arrihantk@getarka.health" as const;

export const DEMO_BOOKING_MAILTO = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Book an ARKA demo")}`;

export const REQUEST_ACCESS_MAILTO = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("ARKA platform access")}`;
