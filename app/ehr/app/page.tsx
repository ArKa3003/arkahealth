import type { Metadata } from "next";

import { EhrEmbedClient } from "@/components/ehr/EhrEmbedClient";

export const metadata: Metadata = {
  title: "ARKA — EHR Panel",
  robots: { index: false, follow: false },
};

/**
 * The EHR-embedded surface at /ehr/app. Renders only the floating ARKA icon and
 * its expandable intelligence rail — designed for Epic-class sidebar dimensions
 * (~340–420px wide) with zero marketing chrome. In demo mode
 * (NEXT_PUBLIC_EHR_DEMO=1) it runs against sandbox fixtures; otherwise it reads
 * the SMART launch session established by /ehr/launch → /ehr/callback.
 */
export default async function EhrAppPage({
  searchParams,
}: {
  searchParams: Promise<{ launch_error?: string }>;
}) {
  const params = await searchParams;
  const demoMode = process.env.NEXT_PUBLIC_EHR_DEMO === "1";

  return (
    <main className="min-h-dvh bg-white">
      <EhrEmbedClient demoMode={demoMode} launchError={params.launch_error} />
    </main>
  );
}
