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
  ed: "/ed",
  ins: "/ins",
} as const;

export const navLinks = [
  { href: routes.home, label: "Home" },
  { href: routes.clin, label: "ARKA-CLIN" },
  { href: routes.ed, label: "ARKA-ED" },
  { href: routes.ins, label: "ARKA-INS" },
] as const;

export const phaseCards = [
  {
    id: "clin",
    title: "ARKA-CLIN",
    description: "Clinical decision support for imaging appropriateness.",
    href: routes.clin,
    icon: "Stethoscope",
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
] as const;
