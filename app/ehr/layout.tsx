import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "ARKA — Embedded",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

/**
 * Bare shell for the EHR-embedded surface. No navbar, footer, command menu, or
 * marketing chrome — this segment renders inside Epic-class EHR sidebars and
 * iframes (~340–420px wide) on a plain white background.
 */
export default function EhrLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh w-full overflow-x-hidden bg-white text-arka-slate-900 antialiased">
      {children}
    </div>
  );
}
