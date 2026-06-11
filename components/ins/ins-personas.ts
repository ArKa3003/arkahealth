import type { LucideIcon } from "lucide-react";
import { BarChart3, Stethoscope, UserRound, ClipboardCheck } from "lucide-react";

/** ARKA-INS persona routes for the shell switcher. */
export type InsPersonaId = "dashboard" | "reviewer" | "provider" | "patient";

export interface InsPersona {
  id: InsPersonaId;
  label: string;
  shortLabel: string;
  description: string;
  href: string;
  icon: LucideIcon;
}

export const INS_PERSONAS: InsPersona[] = [
  {
    id: "dashboard",
    label: "Payer dashboard",
    shortLabel: "Dashboard",
    description: "Auth volume, funnel, and recent decisions",
    href: "/ins/dashboard",
    icon: BarChart3,
  },
  {
    id: "reviewer",
    label: "Reviewer queue",
    shortLabel: "Reviewer",
    description: "Human-in-the-loop PA disposition",
    href: "/ins/reviewer",
    icon: ClipboardCheck,
  },
  {
    id: "provider",
    label: "Provider hub",
    shortLabel: "Provider",
    description: "Gold card status and PA history",
    href: "/ins/provider",
    icon: Stethoscope,
  },
  {
    id: "patient",
    label: "Patient costs",
    shortLabel: "Patient",
    description: "Plain-language out-of-pocket estimate",
    href: "/ins/patient/explainer/demo-order-001",
    icon: UserRound,
  },
];

/**
 * Resolves the active persona from the current pathname.
 *
 * @param pathname - Next.js pathname.
 */
export function resolveInsPersona(pathname: string): InsPersonaId | null {
  if (pathname.startsWith("/ins/dashboard")) return "dashboard";
  if (pathname.startsWith("/ins/reviewer")) return "reviewer";
  if (pathname.startsWith("/ins/provider")) return "provider";
  if (pathname.startsWith("/ins/patient")) return "patient";
  return null;
}

/** True when the marketing landing at `/ins` should render without the app shell. */
export function isInsMarketingLanding(pathname: string): boolean {
  return pathname === "/ins" || pathname === "/ins/";
}

export interface InsBreadcrumb {
  label: string;
  href?: string;
}

/**
 * Breadcrumb trail for INS persona pages.
 *
 * @param pathname - Next.js pathname.
 */
export function insBreadcrumbs(pathname: string): InsBreadcrumb[] {
  const persona = resolveInsPersona(pathname);
  const crumbs: InsBreadcrumb[] = [{ label: "ARKA-INS", href: "/ins" }];

  if (!persona) return crumbs;

  const p = INS_PERSONAS.find((x) => x.id === persona);
  if (p) {
    crumbs.push({ label: p.shortLabel, href: p.href });
  }

  if (pathname.includes("/dashboard/roi")) {
    crumbs.push({ label: "ROI validation" });
  } else if (pathname.includes("/provider/gold-card")) {
    crumbs.push({ label: "Gold card" });
  } else if (pathname.includes("/patient/explainer")) {
    crumbs.push({ label: "Your costs" });
  }

  return crumbs;
}
