import type { Config } from "tailwindcss";

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
        "arka-primary": "#0F172A",
        "arka-navy": "#0F172A",
        "arka-teal": "#14B8A6",
        "arka-cyan": "#14B8A6",
        "arka-deep": "#1E293B",
        "arka-light": "#E2E8F0",
        "arka-pale": "#F1F5F9",
        "arka-bg-dark": "#0F172A",
        "arka-bg-medium": "#1E293B",
        "arka-bg-light": "#F8FAFC",
        "arka-bg-alt": "#F1F5F9",
        "arka-text": "#FFFFFF",
        "arka-text-muted": "#F8FAFC",
        "arka-text-soft": "#E2E8F0",
        "arka-text-dark": "#0F172A",
        "arka-text-dark-muted": "#475569",
        "arka-text-dark-soft": "#64748B",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        heading: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        accent: ["Georgia", "ui-serif", "serif"],
      },
      fontWeight: {
        heading: "600",
        "heading-bold": "700",
        body: "400",
        "body-medium": "500",
      },
      transitionDuration: {
        DEFAULT: "300ms",
      },
      transitionTimingFunction: {
        DEFAULT: "ease-out",
      },
      boxShadow: {
        glow: "0 0 20px 4px rgb(20 184 166 / 0.2)",
        "glow-sm": "0 0 12px 2px rgb(20 184 166 / 0.15)",
        "glow-lg": "0 0 32px 8px rgb(20 184 166 / 0.25)",
        card: "0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.08)",
        "card-hover": "0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.06)",
      },
      backgroundImage: {
        "gradient-card":
          "linear-gradient(135deg, #ffffff 0%, #F8FAFC 100%)",
        "gradient-card-hover":
          "linear-gradient(135deg, #F8FAFC 0%, #ffffff 100%)",
        "gradient-hero":
          "linear-gradient(180deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)",
        "gradient-accent":
          "linear-gradient(90deg, #0F172A 0%, #14B8A6 100%)",
      },
      keyframes: {
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
      },
      animation: {
        fadeIn: "fadeIn 0.3s ease-out forwards",
        slideUp: "slideUp 0.3s ease-out forwards",
        pulseGlow: "pulseGlow 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
