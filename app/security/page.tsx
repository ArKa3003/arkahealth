import type { Metadata } from "next";

import { SecurityPageClient } from "@/components/security/SecurityPageClient";

const SECURITY_DESCRIPTION =
  "How ARKA Health protects clinical data: HIPAA privacy and security program in force, SOC 2 Type I/II in progress, HITRUST e1 roadmap, encryption everywhere, immutable audit trails, and a 21-document compliance package available for hospital security review.";

export const metadata: Metadata = {
  title: "Security & Compliance",
  description: SECURITY_DESCRIPTION,
  openGraph: {
    title: "ARKA — Security & Compliance",
    description: SECURITY_DESCRIPTION,
  },
};

export default function SecurityPage() {
  return <SecurityPageClient />;
}
