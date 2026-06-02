import type { Metadata } from "next";
import { Hero } from "@/components/landing/Hero";
import { GetPaidSection } from "@/components/landing/GetPaidSection";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { RevenueProof } from "@/components/landing/RevenueProof";
import { WhyArka } from "@/components/landing/WhyArka";
import { TrustBand } from "@/components/landing/TrustBand";
import { PlatformEcosystem } from "@/components/landing/PlatformEcosystem";
import { Testimonials } from "@/components/landing/Testimonials";
import { CtaSection } from "@/components/landing/CtaSection";

const HOME_DESCRIPTION =
  "ARKA is an evidence-based imaging clinical decision support engine — guides the right order at the point of care and the same appropriateness check on the payer side. Non-Device CDS, CMS-0057-F ready.";

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
      <GetPaidSection />
      <ProblemSection />
      <RevenueProof />
      <WhyArka />
      <TrustBand />
      <PlatformEcosystem />
      <Testimonials />
      <CtaSection />
    </>
  );
}
