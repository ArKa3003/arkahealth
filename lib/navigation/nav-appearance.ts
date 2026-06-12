/**
 * Navbar appearance — single source of truth for header background AND link colors.
 *
 * INVARIANT: `resolveNavAppearance()` returns one value that drives BOTH the header
 * surface classes (`NAV_HEADER_CLASSES`) and nav item text classes (`navItemClasses`).
 * Never compute "inverted" or link colors independently from the header background.
 */

import { cn } from "@/lib/utils";

export type NavAppearance = "overlay" | "solid";

export type NavItemId = "platform" | "phases" | "evidence" | "roi" | "security" | "docs" | "aiie";

/**
 * Routes whose first viewport section uses a light background — header starts solid at scrollY=0.
 * Audited against all app route pages: /, /clin, /clin-suite, /ed, /ins, /rural, /docs,
 * /evidence, /roi, /action-plan, /trust, /privacy, /terms, /cds-hooks-demo and related paths.
 * Dark-hero overlay (like /): / and /security (navy hero). /ehr routes omit SiteChrome entirely.
 */
const LIGHT_TOP_PREFIXES = [
  "/clin",
  "/clin-suite",
  "/ed",
  "/ins",
  "/rural",
  "/docs",
  "/privacy",
  "/terms",
  "/roi",
  "/action-plan",
  "/trust",
  "/cds-hooks",
  "/evidence",
  "/signin",
] as const;

/** True when the page top is a light background (header starts in solid mode). */
export function isLightTopPage(pathname: string): boolean {
  if (pathname === "/") return false;
  return LIGHT_TOP_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/** Derive navbar appearance from route + scroll — the only input for header and link styling. */
export function resolveNavAppearance(pathname: string, scrolled: boolean): NavAppearance {
  return isLightTopPage(pathname) || scrolled ? "solid" : "overlay";
}

/** Header shell classes keyed by appearance (background + border always paired). */
export const NAV_HEADER_CLASSES: Record<NavAppearance, string> = {
  overlay: [
    "border-b border-white/5",
    "bg-gradient-to-b from-surface-dark/95 via-surface-dark/55 to-transparent",
  ].join(" "),
  solid: "border-b border-border-subtle bg-white/80 shadow-elevation-1 backdrop-blur-md",
};

const NAV_ITEM_BASE = [
  "group relative inline-flex min-h-[44px] touch-manipulation items-center",
  "rounded-radius-sm px-3.5 py-2 text-base font-semibold tracking-tight",
  "transition-[transform,color] duration-200 motion-reduce:transition-none",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500 focus-visible:ring-offset-2",
].join(" ");

/** Primary nav link / trigger label + interaction colors. */
export function navItemClasses(appearance: NavAppearance, active: boolean): string {
  const labelColor = active
    ? appearance === "overlay"
      ? "text-arka-teal-300"
      : "text-arka-teal-700"
    : appearance === "overlay"
      ? "text-white [text-shadow:0_1px_3px_rgb(0_0_0/0.45)] group-hover:text-white group-focus-visible:text-white"
      : "text-arka-slate-700 group-hover:text-arka-slate-900 group-focus-visible:text-arka-slate-900";

  return cn(NAV_ITEM_BASE, labelColor);
}

/** Animated underline bar beneath nav items. */
export function navUnderlineClasses(active: boolean): string {
  return cn(
    "pointer-events-none absolute bottom-1.5 left-3.5 right-3.5 h-0.5 origin-left bg-arka-teal-400",
    "transition-transform duration-200 motion-reduce:transition-none",
    active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100 group-focus-visible:scale-x-100",
  );
}

/** Inner label wrapper — subtle lift on hover/focus. */
export function navLabelClasses(): string {
  return cn(
    "inline-flex items-center gap-1 transition-transform duration-200 motion-reduce:transition-none",
    "group-hover:-translate-y-px group-focus-visible:-translate-y-px",
  );
}

/** Hamburger / icon-only control in the header. */
export function navMenuButtonClasses(appearance: NavAppearance): string {
  return cn(
    "inline-flex min-h-[44px] min-w-[44px] touch-manipulation items-center justify-center rounded-radius-md",
    "transition-colors duration-200 motion-reduce:transition-none",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500 focus-visible:ring-offset-2",
    appearance === "overlay"
      ? "text-white [text-shadow:0_1px_3px_rgb(0_0_0/0.45)] hover:bg-white/10"
      : "text-arka-slate-700 hover:bg-arka-slate-100 hover:text-arka-slate-900",
  );
}

/** Ghost CTA override when header is in overlay mode. */
export function navGhostButtonClasses(appearance: NavAppearance): string {
  return appearance === "overlay"
    ? "text-white [text-shadow:0_1px_3px_rgb(0_0_0/0.45)] hover:bg-white/10 hover:text-white"
    : "";
}

/** Returns true when a top-level nav item matches the current route. */
export function isNavItemActive(id: NavItemId, pathname: string): boolean {
  switch (id) {
    case "platform":
      return pathname === "/";
    case "aiie":
      return pathname === "/";
    case "phases":
      return (
        pathname.startsWith("/clin") ||
        pathname.startsWith("/ed") ||
        pathname.startsWith("/ins") ||
        pathname.startsWith("/rural")
      );
    case "evidence":
      return pathname.startsWith("/evidence");
    case "roi":
      return pathname.startsWith("/roi");
    case "security":
      return pathname.startsWith("/security");
    case "docs":
      return pathname.startsWith("/docs") || pathname === "/action-plan";
    default:
      return false;
  }
}
