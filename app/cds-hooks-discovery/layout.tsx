import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CDS Hooks Discovery",
  description:
    "Human-readable explainer for the ARKA CDS Hooks 2.0 service-discovery endpoint that EHRs (Epic, Cerner, SMART Sandbox) hit to register ARKA services.",
};

export default function CdsHooksDiscoveryLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="min-h-screen bg-arka-navy">{children}</div>;
}
