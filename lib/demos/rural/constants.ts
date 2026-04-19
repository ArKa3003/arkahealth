import {
  BarChart3,
  Brain,
  Building2,
  DollarSign,
  GraduationCap,
  Network,
  Radio,
  Stethoscope,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { AIAlgorithmCategory, RuralExemptionType } from "./types";

// ---------------------------------------------------------------------------
// RURAL CRISIS STATISTICS (for banners, infographics)
// ---------------------------------------------------------------------------

export const RURAL_CRISIS_STATS = {
  hospitalsAtRisk: 768,
  hospitalsInImminentDanger: 315,
  hospitalsClosed2005to2024: 193,
  currentREHs: 42,
  rehMonthlyPayment: 285625.9,
  criticalAccessHospitals: 1350,
  ruralAmericansUnderserved: 60_000_000,
  teleradiologyMarket2025: 19.2e9,
  teleradiologyMarket2030: 60.3e9,
  teleradiologyCAGR: 25.7,
  digitalHealthFunding2025: 14.2e9,
  healthTechUnicorns2025: 16,
  fdaApprovedAIDevicesRadiology: 723,
  radiologistShortage: 4000,
  midwestStatesHighestRisk: ["Kansas", "Missouri", "Oklahoma", "Mississippi"],
  kansasHospitalsAtImmediateRisk: 30,
} as const;

// ---------------------------------------------------------------------------
// MODALITY AVAILABILITY MATRIX (typical rural facility)
// ---------------------------------------------------------------------------

export const TYPICAL_RURAL_EQUIPMENT: Record<
  string,
  {
    commonlyAvailable: boolean;
    requiresMobileUnit: boolean;
    requiresTransfer: boolean;
    averageCost: number;
    replacementCostRange: [number, number];
  }
> = {
  "X-ray": {
    commonlyAvailable: true,
    requiresMobileUnit: false,
    requiresTransfer: false,
    averageCost: 200,
    replacementCostRange: [75_000, 300_000],
  },
  Ultrasound: {
    commonlyAvailable: true,
    requiresMobileUnit: false,
    requiresTransfer: false,
    averageCost: 350,
    replacementCostRange: [25_000, 200_000],
  },
  CT: {
    commonlyAvailable: false,
    requiresMobileUnit: true,
    requiresTransfer: true,
    averageCost: 1500,
    replacementCostRange: [1_500_000, 3_000_000],
  },
  MRI: {
    commonlyAvailable: false,
    requiresMobileUnit: true,
    requiresTransfer: true,
    averageCost: 2500,
    replacementCostRange: [1_000_000, 2_500_000],
  },
  "CT-with-contrast": {
    commonlyAvailable: false,
    requiresMobileUnit: true,
    requiresTransfer: true,
    averageCost: 2000,
    replacementCostRange: [1_500_000, 3_000_000],
  },
  "MRI-with-contrast": {
    commonlyAvailable: false,
    requiresMobileUnit: true,
    requiresTransfer: true,
    averageCost: 3000,
    replacementCostRange: [1_000_000, 2_500_000],
  },
  "Nuclear-Medicine": {
    commonlyAvailable: false,
    requiresMobileUnit: false,
    requiresTransfer: true,
    averageCost: 1800,
    replacementCostRange: [500_000, 1_500_000],
  },
  "PET-CT": {
    commonlyAvailable: false,
    requiresMobileUnit: false,
    requiresTransfer: true,
    averageCost: 5000,
    replacementCostRange: [2_000_000, 4_000_000],
  },
  Mammography: {
    commonlyAvailable: false,
    requiresMobileUnit: true,
    requiresTransfer: true,
    averageCost: 400,
    replacementCostRange: [150_000, 500_000],
  },
  DEXA: {
    commonlyAvailable: false,
    requiresMobileUnit: false,
    requiresTransfer: true,
    averageCost: 250,
    replacementCostRange: [30_000, 100_000],
  },
  Fluoroscopy: {
    commonlyAvailable: false,
    requiresMobileUnit: false,
    requiresTransfer: true,
    averageCost: 800,
    replacementCostRange: [200_000, 600_000],
  },
  "C-arm": {
    commonlyAvailable: true,
    requiresMobileUnit: false,
    requiresTransfer: false,
    averageCost: 600,
    replacementCostRange: [50_000, 250_000],
  },
};

// ---------------------------------------------------------------------------
// AI ALGORITHM RURAL VALUE RANKINGS
// ---------------------------------------------------------------------------

export const AI_RURAL_PRIORITY_RANKING: {
  category: AIAlgorithmCategory;
  rank: number;
  reason: string;
}[] = [
  {
    category: "chest-xray-triage",
    rank: 1,
    reason: "X-ray available at virtually every rural facility; highest immediate impact",
  },
  {
    category: "fracture-detection",
    rank: 2,
    reason: "Orthopedic emergencies common in rural settings; specialist reads are slow",
  },
  {
    category: "stroke-triage",
    rank: 3,
    reason: "Critical for time-sensitive emergencies in transfer-dependent facilities",
  },
  {
    category: "lung-nodule-tracking",
    rank: 4,
    reason: "High smoking rates in rural populations; valuable for cancer screening",
  },
  {
    category: "pe-detection",
    rank: 5,
    reason: "PE is time-sensitive; CT availability is limited in rural settings",
  },
  {
    category: "mammography-screening",
    rank: 6,
    reason: "Mobile mammography common; AI aids screening accuracy",
  },
  {
    category: "general-triage",
    rank: 7,
    reason: "Multi-condition triage helps prioritize teleradiology queue",
  },
  {
    category: "pocus-quality",
    rank: 8,
    reason: "Assists less-experienced POCUS operators in getting diagnostic images",
  },
  {
    category: "cardiac-assessment",
    rank: 9,
    reason: "Valuable but requires echo equipment not always available",
  },
];

// ---------------------------------------------------------------------------
// ROUTES
// ---------------------------------------------------------------------------

export const RURAL_ROUTES = {
  hub: "/rural",
  cds: "/rural/cds",
  tele: "/rural/tele",
  training: "/rural/training",
  reimbursement: "/rural/reimbursement",
  network: "/rural/network",
  ai: "/rural/ai",
  intelligence: "/rural/intelligence",
} as const;

/** Alias for `RURAL_ROUTES` (existing app imports). */
export const ruralRoutes = RURAL_ROUTES;

export const RURAL_NAV_LINKS = [
  { href: RURAL_ROUTES.hub, label: "Rural Hub", icon: "Building2" },
  { href: RURAL_ROUTES.cds, label: "ARKA-RURAL CDS", icon: "Stethoscope" },
  { href: RURAL_ROUTES.tele, label: "ARKA-TELE", icon: "Radio" },
  { href: RURAL_ROUTES.training, label: "Rural Training", icon: "GraduationCap" },
  { href: RURAL_ROUTES.reimbursement, label: "Reimbursement", icon: "DollarSign" },
  { href: RURAL_ROUTES.network, label: "Network Manager", icon: "Network" },
  { href: RURAL_ROUTES.ai, label: "AI Diagnostics", icon: "Brain" },
  { href: RURAL_ROUTES.intelligence, label: "Intelligence", icon: "BarChart3" },
] as const;

type RuralNavLinkIcon = (typeof RURAL_NAV_LINKS)[number]["icon"];

const RURAL_NAV_ICON_MAP: Record<RuralNavLinkIcon, LucideIcon> = {
  Building2,
  Stethoscope,
  Radio,
  GraduationCap,
  DollarSign,
  Network,
  Brain,
  BarChart3,
};

const RURAL_NAV_ITEM_META: { shortLabel: string; description: string }[] = [
  { shortLabel: "Hub", description: "Overview of rural imaging capabilities" },
  { shortLabel: "CDS", description: "Resource-aware clinical decision support" },
  { shortLabel: "Tele", description: "Teleradiology orchestration" },
  { shortLabel: "Training", description: "Case library and CME" },
  { shortLabel: "Reimburse", description: "Rural reimbursement optimizer" },
  { shortLabel: "Network", description: "Hub-and-spoke network manager" },
  { shortLabel: "AI", description: "AI marketplace and POCUS" },
  { shortLabel: "Intel", description: "Population health and desert maps" },
];

export type RuralNavItem = {
  href: (typeof RURAL_ROUTES)[keyof typeof RURAL_ROUTES];
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
};

export const RURAL_NAV_ITEMS: RuralNavItem[] = RURAL_NAV_LINKS.map((link, i) => ({
  href: link.href,
  label: link.label,
  shortLabel: RURAL_NAV_ITEM_META[i]!.shortLabel,
  description: RURAL_NAV_ITEM_META[i]!.description,
  icon: RURAL_NAV_ICON_MAP[link.icon],
}));

// ---------------------------------------------------------------------------
// PAYER RURAL EXEMPTION TYPES
// ---------------------------------------------------------------------------

export const RURAL_EXEMPTION_DESCRIPTIONS: Record<RuralExemptionType, string> = {
  "prior-auth-waiver": "Complete waiver of prior authorization for facilities meeting rural criteria",
  "travel-distance-exception": "Modified requirements when patient must travel 60+ miles for imaging",
  "critical-access-exemption": "Reduced documentation for Critical Access Hospital imaging orders",
  "reh-exemption": "Streamlined authorization for Rural Emergency Hospital outpatient imaging",
  "emergency-bypass": "Emergency bypass for rural facilities without 24/7 radiology coverage",
  "modified-criteria": "Modified clinical criteria acknowledging limited modality access",
  "gold-card-rural": "Gold-card status for rural providers with strong appropriateness history",
};

// ---------------------------------------------------------------------------
// CME CERTIFICATION TRACKS
// ---------------------------------------------------------------------------

export const RURAL_CERTIFICATION_TRACKS = [
  {
    id: "rural-imaging-appropriateness",
    name: "Rural Imaging Appropriateness Certification",
    credits: 25,
    cases: 20,
    specialty: "General",
    description: "Comprehensive certification in resource-aware imaging decision-making",
  },
  {
    id: "rural-emergency-imaging",
    name: "Rural Emergency Imaging Certificate",
    credits: 15,
    cases: 12,
    specialty: "Emergency Medicine",
    description: "Emergency imaging decision-making with limited resources",
  },
  {
    id: "pocus-rural-provider",
    name: "Rural POCUS Provider Certificate",
    credits: 20,
    cases: 15,
    specialty: "Point-of-Care Ultrasound",
    description: "Point-of-care ultrasound proficiency for rural settings",
  },
  {
    id: "teleradiology-quality",
    name: "Teleradiology Quality Assurance",
    credits: 10,
    cases: 8,
    specialty: "Radiology",
    description: "Quality management for remote radiology interpretation",
  },
] as const;
