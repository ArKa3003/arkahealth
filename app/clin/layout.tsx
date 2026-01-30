import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ARKA-CLIN | Clinical Decision Support",
  description:
    "Evidence-based imaging appropriateness evaluation. Enter a clinical scenario for appropriateness scores, factor breakdown, and peer-reviewed evidence.",
  openGraph: {
    title: "ARKA-CLIN | ARKA Health",
    description:
      "Clinical decision support for imaging appropriateness. Evidence-based ordering guidance at the point of care.",
  },
};

export default function ClinLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
