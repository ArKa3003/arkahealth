import type { Config } from "tailwindcss";

/** ARKA teal ramp — 500 is brand accent #14B8A6 */
const arkaTeal = {
  50: "#F0FDFA",
  100: "#CCFBF1",
  200: "#99F6E4",
  300: "#5EEAD4",
  400: "#2DD4BF",
  500: "#14B8A6",
  600: "#0D9488",
  700: "#0F766E",
  800: "#115E59",
  900: "#134E4A",
  950: "#042F2E",
} as const;

/** ARKA slate ramp — aligned with Tailwind slate; 900 is brand navy #0F172A */
const arkaSlate = {
  50: "#F8FAFC",
  100: "#F1F5F9",
  200: "#E2E8F0",
  300: "#CBD5E1",
  400: "#94A3B8",
  500: "#64748B",
  600: "#475569",
  700: "#334155",
  800: "#1E293B",
  900: "#0F172A",
  950: "#020617",
} as const;

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        /* Full ramps — DEFAULT preserves bg-arka-teal / text-arka-teal */
        "arka-teal": { ...arkaTeal, DEFAULT: arkaTeal[500] },
        "arka-slate": { ...arkaSlate, DEFAULT: arkaSlate[900] },

        /* Legacy aliases — map to new ramps; do not remove */
        "arka-primary": arkaSlate[900],
        "arka-navy": arkaSlate[900],
        "arka-cyan": arkaTeal[500],
        "arka-deep": arkaSlate[800],
        "arka-light": arkaSlate[200],
        "arka-pale": arkaSlate[100],
        "arka-bg-dark": arkaSlate[900],
        "arka-bg-medium": arkaSlate[800],
        "arka-bg-light": arkaSlate[50],
        "arka-bg-alt": arkaSlate[100],
        "arka-text": "#FFFFFF",
        "arka-text-muted": arkaSlate[50],
        "arka-text-soft": arkaSlate[200],
        "arka-text-dark": arkaSlate[900],
        "arka-text-dark-muted": arkaSlate[600],
        "arka-text-dark-soft": arkaSlate[500],

        /* Semantic surfaces & borders */
        surface: {
          DEFAULT: "#FFFFFF",
          raised: "#FCFDFE",
          sunken: "#F1F5F9",
          dark: arkaSlate[900],
          "dark-raised": "#16203A",
        },
        "border-subtle": arkaSlate[200],
        "border-strong": arkaSlate[300],

        /* Clinical status ramps */
        success: {
          DEFAULT: "#059669",
          bg: "#ECFDF5",
        },
        warning: {
          DEFAULT: "#D97706",
          bg: "#FFFBEB",
        },
        danger: {
          DEFAULT: "#DC2626",
          bg: "#FEF2F2",
        },
        info: {
          DEFAULT: "#0284C7",
          bg: "#EFF6FF",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        heading: ["var(--font-inter)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        accent: ["Georgia", "ui-serif", "serif"],
      },
      fontSize: {
        display: [
          "clamp(2.5rem, 5vw, 4rem)",
          { lineHeight: "1.05", letterSpacing: "-0.03em" },
        ],
        h1: ["2.25rem", { lineHeight: "1.15", letterSpacing: "-0.025em" }],
        h2: ["1.75rem", { lineHeight: "1.2", letterSpacing: "-0.02em" }],
        h3: ["1.375rem", { lineHeight: "1.25", letterSpacing: "-0.015em" }],
        "body-lg": ["1.125rem", { lineHeight: "1.6", letterSpacing: "0" }],
        body: ["1rem", { lineHeight: "1.6", letterSpacing: "0" }],
        caption: ["0.875rem", { lineHeight: "1.5", letterSpacing: "0.01em" }],
      },
      fontWeight: {
        heading: "600",
        "heading-bold": "700",
        body: "400",
        "body-medium": "500",
      },
      borderRadius: {
        "radius-sm": "6px",
        "radius-md": "10px",
        "radius-lg": "14px",
        "radius-xl": "20px",
      },
      transitionDuration: {
        DEFAULT: "300ms",
      },
      transitionTimingFunction: {
        DEFAULT: "ease-out",
      },
      boxShadow: {
        /* Layered elevation system */
        "elevation-1":
          "0 1px 2px rgb(15 23 42 / 0.03), 0 1px 3px rgb(15 23 42 / 0.04)",
        "elevation-2":
          "0 1px 2px rgb(15 23 42 / 0.04), 0 4px 8px rgb(15 23 42 / 0.06), 0 12px 24px rgb(15 23 42 / 0.05)",
        "elevation-3":
          "0 2px 4px rgb(15 23 42 / 0.04), 0 8px 16px rgb(15 23 42 / 0.07), 0 20px 40px rgb(15 23 42 / 0.06)",
        "elevation-4":
          "0 4px 8px rgb(15 23 42 / 0.05), 0 16px 32px rgb(15 23 42 / 0.08), 0 32px 64px rgb(15 23 42 / 0.07)",
        /* Glow variants — ~30% lower opacity for premium feel */
        glow: "0 0 20px 4px rgb(20 184 166 / 0.14)",
        "glow-sm": "0 0 12px 2px rgb(20 184 166 / 0.105)",
        "glow-lg": "0 0 32px 8px rgb(20 184 166 / 0.175)",
        /* Legacy card shadows — kept for existing references */
        card: "0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.08)",
        "card-hover":
          "0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.06)",
      },
      backgroundImage: {
        "gradient-card": "linear-gradient(135deg, #ffffff 0%, #F8FAFC 100%)",
        "gradient-card-hover":
          "linear-gradient(135deg, #F8FAFC 0%, #ffffff 100%)",
        "gradient-hero":
          "linear-gradient(180deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)",
        "gradient-accent": "linear-gradient(90deg, #0F172A 0%, #14B8A6 100%)",
        grain:
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")",
        "grid-faint":
          "linear-gradient(to right, rgb(148 163 184 / 0.35) 1px, transparent 1px), linear-gradient(to bottom, rgb(148 163 184 / 0.35) 1px, transparent 1px)",
      },
      keyframes: {
        /* Existing motion — preserved exactly */
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 20px 4px rgb(0 217 255 / 0.2)" },
          "50%": { boxShadow: "0 0 28px 6px rgb(0 217 255 / 0.35)" },
        },
        /* Additive motion for new components */
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.97)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        /* Existing motion — preserved exactly */
        fadeIn: "fadeIn 0.3s ease-out forwards",
        slideUp: "slideUp 0.3s ease-out forwards",
        pulseGlow: "pulseGlow 2s ease-in-out infinite",
        /* Additive motion for new components */
        "fade-in-up": "fade-in-up 400ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "scale-in": "scale-in 250ms ease-out forwards",
        shimmer: "shimmer 2s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
