import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ARKA-TELE",
  description: "Teleradiology orchestration dashboard demo.",
};

export default function RuralTeleLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
