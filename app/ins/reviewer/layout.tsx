import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ARKA-INS | RBM Reviewer Dashboard",
  description:
    "Human review queue for prior authorization with AIIE transparency, coverage, OOP, and documentation context.",
};

export default function InsReviewerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
