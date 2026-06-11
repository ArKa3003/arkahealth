import type { Metadata } from "next";
import dynamic from "next/dynamic";

import { Hero } from "@/components/landing/Hero";

const GetPaidSection = dynamic(() =>
  import("@/components/landing/GetPaidSection").then((m) => ({ default: m.GetPaidSection })),
);
const ProblemSection = dynamic(() =>
  import("@/components/landing/ProblemSection").then((m) => ({ default: m.ProblemSection })),
);
const RevenueProof = dynamic(() =>
  import("@/components/landing/RevenueProof").then((m) => ({ default: m.RevenueProof })),
);
const WhyArka = dynamic(() =>
  import("@/components/landing/WhyArka").then((m) => ({ default: m.WhyArka })),
);
const TrustBand = dynamic(() =>
  import("@/components/landing/TrustBand").then((m) => ({ default: m.TrustBand })),
);
const PlatformEcosystem = dynamic(() =>
  import("@/components/landing/PlatformEcosystem").then((m) => ({ default: m.PlatformEcosystem })),
);
const Testimonials = dynamic(() =>
  import("@/components/landing/Testimonials").then((m) => ({ default: m.Testimonials })),
);
const CtaSection = dynamic(() =>
  import("@/components/landing/CtaSection").then((m) => ({ default: m.CtaSection })),
);

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
