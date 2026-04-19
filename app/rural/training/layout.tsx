import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ARKA-ED Rural",
  description: "Rural case library and CME tracker demo.",
};

export default function RuralTrainingLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
