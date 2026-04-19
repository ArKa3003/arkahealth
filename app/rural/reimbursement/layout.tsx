import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ARKA-INS Rural",
  description: "Rural reimbursement optimizer and batch authorization demo.",
};

export default function RuralReimbursementLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
