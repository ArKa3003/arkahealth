import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ARKA-RURAL CDS",
  description: "Resource-aware clinical decision support for rural imaging.",
};

export default function RuralCdsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
