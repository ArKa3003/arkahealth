import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Diagnostics",
  description: "AI marketplace and POCUS integration demo.",
};

export default function RuralAiLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
