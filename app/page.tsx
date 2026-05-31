import type { Metadata } from "next";
import { Hero } from "@/components/landing/Hero";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { RevenueProof } from "@/components/landing/RevenueProof";
import { WhyArka } from "@/components/landing/WhyArka";
import { TrustBand } from "@/components/landing/TrustBand";
import { PlatformBand } from "@/components/landing/PlatformBand";
import { PhaseCards } from "@/components/landing/PhaseCards";
import { EcosystemDiagram } from "@/components/landing/EcosystemDiagram";
import { Testimonials } from "@/components/landing/Testimonials";
import { CtaSection } from "@/components/landing/CtaSection";

const HOME_DESCRIPTION =
  "ARKA recovers imaging revenue lost to prior-auth denials — clean documentation at the point of order, inside Epic, Cerner, and Athena, with zero workflow change. Non-Device CDS, CMS-0057-F ready.";

export const metadata: Metadata = {
  title: "Home",
  description: HOME_DESCRIPTION,
  openGraph: {
    title: "ARKA — Get paid for the imaging you already do",
    description: HOME_DESCRIPTION,
  },
};

export default function Home() {
  return (
    <>
      <Hero />
      <ProblemSection />
      <RevenueProof />
      <WhyArka />
      <TrustBand />
      <PlatformBand />
      <PhaseCards />
      <EcosystemDiagram />
      <Testimonials />
      <CtaSection />
    </>
  );
}
