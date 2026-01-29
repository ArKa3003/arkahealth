import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "arka-primary": "#5B9BD5",
        "arka-cyan": "#00D9FF",
        "arka-deep": "#2C5F8D",
        "arka-light": "#A8D5E2",
        "arka-pale": "#E8F4F8",
        "arka-bg-dark": "#0D1929",
        "arka-bg-medium": "#1A2942",
        "arka-text": "#FFFFFF",
        "arka-text-muted": "#E8F4F8",
        "arka-text-soft": "#B8D8E8",
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
        glow: "0 0 20px 4px rgb(0 217 255 / 0.2)",
        "glow-sm": "0 0 12px 2px rgb(0 217 255 / 0.15)",
        "glow-lg": "0 0 32px 8px rgb(0 217 255 / 0.25)",
      },
      backgroundImage: {
        "gradient-card":
          "linear-gradient(135deg, rgb(13 25 41 / 0.9) 0%, rgb(26 41 66 / 0.95) 100%)",
        "gradient-card-hover":
          "linear-gradient(135deg, rgb(26 41 66 / 0.95) 0%, rgb(44 95 141 / 0.2) 100%)",
        "gradient-hero":
          "linear-gradient(180deg, #0D1929 0%, #1A2942 50%, #0D1929 100%)",
        "gradient-accent":
          "linear-gradient(90deg, #5B9BD5 0%, #00D9FF 100%)",
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
