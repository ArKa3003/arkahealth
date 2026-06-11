"use client";

import dynamic from "next/dynamic";

import { DemoLoadingSkeleton } from "@/components/demos/DemoLoadingSkeleton";
import type { EdCockpitCase } from "@/components/demos/ed/ed-cockpit-cases";
import type { EdCaseEvaluationBundle } from "@/components/demos/ed/ed-cockpit-utils";

const EdDemoContent = dynamic(
  () => import("@/components/demos/ed/EdDemoContent").then((m) => m.EdDemoContent),
  { loading: () => <DemoLoadingSkeleton />, ssr: false },
);

export interface EdPageClientProps {
  cases: EdCockpitCase[];
  evaluations: Record<string, EdCaseEvaluationBundle>;
}

/** Client boundary — defers the ED cockpit bundle for faster LCP on /ed. */
export function EdPageClient({ cases, evaluations }: EdPageClientProps) {
  return <EdDemoContent cases={cases} evaluations={evaluations} />;
}
