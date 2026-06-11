"use client";

import dynamic from "next/dynamic";

const RuralHubMap = dynamic(
  () => import("./RuralHubMap").then((m) => ({ default: m.RuralHubMap })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[320px] w-full animate-pulse rounded-radius-lg border border-border-subtle bg-surface-sunken" />
    ),
  },
);

/** Lazy rural hub map — keeps /rural LCP on static hero copy. */
export function RuralHubMapLazy() {
  return <RuralHubMap />;
}
