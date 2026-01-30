import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ARKA-INS | Utilization Management",
  description:
    "Insurance prior authorization and imaging appropriateness. RBM workflow with patient selection, order entry, pre-submission analysis, and appeal generation.",
  openGraph: {
    title: "ARKA-INS | ARKA Health",
    description:
      "Utilization management and prior authorization. Evidence-based RBM criteria and appeal assistance.",
  },
};

export default function InsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
