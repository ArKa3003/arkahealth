import { redirect } from "next/navigation";

/**
 * Legacy route — provider hub with Gold Card tab.
 */
export default async function InsProviderGoldCardPage({
  searchParams,
}: {
  searchParams: Promise<{ providerId?: string }>;
}) {
  const params = await searchParams;
  const q = params.providerId ? `?tab=gold-card&providerId=${encodeURIComponent(params.providerId)}` : "?tab=gold-card";
  redirect(`/ins/provider${q}`);
}
