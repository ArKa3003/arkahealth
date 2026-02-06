import type { Metadata } from "next";
import { Hero } from "@/components/landing/Hero";
import { WhyArka } from "@/components/landing/WhyArka";
import { PhaseCards } from "@/components/landing/PhaseCards";
import { EcosystemDiagram } from "@/components/landing/EcosystemDiagram";
import { Testimonials } from "@/components/landing/Testimonials";
import { CtaSection } from "@/components/landing/CtaSection";

export const metadata: Metadata = {
  title: "Home",
  description:
    "ARKA Health — Cutting-Edge clinical decision support for imaging appropriateness. Explore ARKA-CLIN, ARKA-ED, and ARKA-INS.",
  openGraph: {
    title: "ARKA Health | Imaging CDS",
    description:
      "Cutting-Edge clinical decision support for imaging appropriateness. Explore ARKA-CLIN, ARKA-ED, and ARKA-INS.",
  },
};

export default function Home() {
  return (
    <>
      {/* 1. Hero — 100vh */}
      <Hero />

      {/* 2. Why ARKA — value proposition, three benefits, Gungnir metaphor */}
      <WhyArka />

      {/* 3. Phase Cards — id="solutions" */}
      <PhaseCards />

      {/* 4. Ecosystem Diagram — id="ecosystem" */}
      <EcosystemDiagram />

      {/* 5. Testimonials / social proof placeholder */}
      <Testimonials />

      {/* 6. CTA — "Ready to experience precision?" */}
      <CtaSection />

      {/* 7. Footer is in app/layout.tsx — links, copyright, contact */}
    </>
  );
}
