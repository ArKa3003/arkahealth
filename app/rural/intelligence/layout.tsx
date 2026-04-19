import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data Intelligence",
  description: "Population health analytics and imaging desert maps demo.",
};

export default function RuralIntelligenceLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
