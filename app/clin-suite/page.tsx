"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, ExternalLink } from "lucide-react";

import { CdsDemoClient } from "@/components/cds-platform/demo/CdsDemoClient";
import { DemoLoadingSkeleton } from "@/components/demos/DemoLoadingSkeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CopyJsonButton } from "@/components/cds-platform/demo/CopyJsonButton";
import { complianceLinks, routes } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { safeFetchJson } from "@/lib/utils/safe-fetch-json";

const ClinDemoContent = dynamic(
  () => import("@/components/demos/clin/ClinDemoContent").then((m) => m.ClinDemoContent),
  { loading: () => <DemoLoadingSkeleton />, ssr: true },
);

const HowArkaWorksSection = dynamic(
  () => import("@/components/demos/clin/HowArkaWorksSection").then((m) => m.HowArkaWorksSection),
  { ssr: true },
);

type SuiteView = "standalone" | "embedded" | "discovery";

const VIEW_TABS: { value: SuiteView; label: string }[] = [
  { value: "standalone", label: "Standalone Web App (ARKA-CLIN)" },
  { value: "embedded", label: "EHR-Embedded (CDS Hooks Live Demo)" },
  { value: "discovery", label: "CDS Hooks Discovery" },
];

const SUITE_INTRO_PANEL_CLASS =
  "mb-6 rounded-xl border border-arka-light bg-arka-bg-alt p-4 sm:p-5 text-sm sm:text-base text-arka-text-dark";

const discoveryQuickActionClassName =
  "flex min-h-[44px] flex-col justify-center rounded-lg border border-arka-light bg-white px-4 py-3 text-sm text-arka-text-dark transition-colors hover:border-arka-teal/40 hover:bg-arka-bg-alt";

function isSuiteView(value: string | null): value is SuiteView {
  return value === "standalone" || value === "embedded" || value === "discovery";
}

/**
 * Combined ARKA-CLIN surface: standalone demo, CDS Hooks EHR demo, and discovery JSON.
 */
export default function ClinSuitePage() {
  return (
    <Suspense fallback={<ClinSuitePageFallback />}>
      <ClinSuitePageContent />
    </Suspense>
  );
}

function ClinSuitePageFallback() {
  return (
    <div className="min-h-full flex-1 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 xl:px-12">
        <DemoLoadingSkeleton />
      </div>
    </div>
  );
}

function ClinSuitePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewParam = searchParams.get("view");
  const activeView: SuiteView = isSuiteView(viewParam) ? viewParam : "standalone";

  const setActiveView = useCallback(
    (view: SuiteView) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("view", view);
      router.replace(`${routes.clinSuite}?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  return (
    <div className="min-h-full flex-1 bg-white dark:bg-white">
      <div
        className={cn(
          "mx-auto px-4 py-6 sm:px-6 lg:px-8 xl:px-12",
          activeView === "embedded" ? "max-w-[1600px]" : "max-w-7xl",
        )}
      >
        <nav aria-label="Breadcrumb" className="mb-4 sm:mb-6">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-arka-text-dark-muted">
            <li>
              <Link
                href={routes.home}
                className="text-arka-text-dark-muted hover:text-arka-teal-600 transition-colors"
              >
                Home
              </Link>
            </li>
            <li className="flex items-center gap-1.5">
              <ChevronRight className="h-4 w-4 text-arka-text-dark-soft" aria-hidden />
              <span className="text-arka-teal-600">ARKA-CLIN Suite</span>
            </li>
          </ol>
        </nav>

        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-semibold text-arka-text-dark">
            ARKA-CLIN — Two Views, One Engine.
          </h1>
          <p className="mt-2 text-arka-text-dark-muted font-sans text-base sm:text-lg max-w-3xl">
            Guides clinicians to order the right imaging at the point of care — in a browser or inside
            the EHR — with evidence-based appropriateness scores; supports, not replaces, clinical
            judgment.
          </p>
        </header>

        <Tabs
          value={activeView}
          onValueChange={(value) => {
            if (isSuiteView(value)) {
              setActiveView(value);
            }
          }}
          className="w-full"
        >
          <TabsList className="mb-6 h-auto w-full flex-wrap justify-start gap-1 bg-arka-primary/5 p-1">
            {VIEW_TABS.map(({ value, label }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="min-h-[44px] whitespace-normal px-3 py-2 text-left text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:text-arka-text-dark"
              >
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent
            value="standalone"
            className="mt-0 border-0 bg-white p-0 shadow-none dark:bg-white dark:text-arka-text-dark"
          >
            <p className={SUITE_INTRO_PANEL_CLASS}>
              The ARKA web application, used directly by a clinician in a browser. Enter or pick a clinical
              scenario; receive an evidence-based appropriateness score, factor breakdown, alternatives, and
              citations.
            </p>
            <ClinDemoContent />
            <HowArkaWorksSection />
          </TabsContent>

          <TabsContent
            value="embedded"
            className="mt-0 border-0 bg-white p-0 shadow-none dark:bg-white dark:text-arka-text-dark"
          >
            <p className={SUITE_INTRO_PANEL_CLASS}>
              The same ARKA engine, rendered inside a simulated Epic chart via the HL7 CDS Hooks open standard
              — the way a clinician sees ARKA in production. The live JSON panel shows real CDS Hooks 2.0
              traffic.
            </p>
            <CdsDemoClient />
          </TabsContent>

          <TabsContent
            value="discovery"
            className="mt-0 border-0 bg-white p-0 shadow-none dark:bg-white dark:text-arka-text-dark"
          >
            <DiscoveryTabContent />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function DiscoveryTabContent() {
  const [json, setJson] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadDiscovery() {
      setLoading(true);
      setLoadError(null);
      const result = await safeFetchJson<unknown>(routes.cdsWellKnown, {
        cache: "no-store",
      });

      if (cancelled) {
        return;
      }

      if (!result.ok) {
        const message =
          result.status !== undefined
            ? `Discovery request failed (${result.status})`
            : result.error;
        setLoadError(message);
        setJson(null);
      } else {
        setJson(JSON.stringify(result.data, null, 2));
      }

      setLoading(false);
    }

    void loadDiscovery();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <aside className="rounded-xl border border-arka-light bg-white p-4 sm:p-6 shadow-card">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {complianceLinks.map(({ href, label, description, ...rest }) => {
            const external = "external" in rest && rest.external === true;
            const cardLabel = (
              <>
                <span className="inline-flex items-center gap-1.5 font-semibold text-arka-teal-600">
                  {label}
                  {external ? <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden /> : null}
                </span>
                <span className="mt-1 text-xs text-arka-text-dark-muted">{description}</span>
              </>
            );

            if (external) {
              return (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={discoveryQuickActionClassName}
                >
                  {cardLabel}
                </a>
              );
            }

            return (
              <Link key={href} href={href} prefetch className={discoveryQuickActionClassName}>
                {cardLabel}
              </Link>
            );
          })}
        </div>
      </aside>

      <p className={SUITE_INTRO_PANEL_CLASS}>
        HL7 CDS Hooks 2.0 service discovery — the endpoint EHR systems call to register ARKA-CLIN and ARKA-INS
        hook services.
      </p>

      <div className="rounded-xl border border-arka-light bg-white p-4 sm:p-6 shadow-card">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-arka-text-dark sm:text-lg">
            {routes.cdsWellKnown}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            {json ? <CopyJsonButton text={json} label="Copy JSON" /> : null}
            <a
              href={routes.cdsWellKnown}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] touch-manipulation items-center text-sm font-medium text-arka-teal-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500"
            >
              Open raw JSON
            </a>
            <Link
              href={routes.cdsHooksDiscovery}
              className="inline-flex min-h-[44px] touch-manipulation items-center text-sm font-medium text-arka-slate-600 hover:text-arka-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500"
            >
              Human-readable catalog →
            </Link>
          </div>
        </div>
        {loading ? (
          <p className="text-sm text-arka-text-dark-muted">Loading discovery document…</p>
        ) : loadError ? (
          <p className="text-sm text-red-700" role="alert">
            {loadError}
          </p>
        ) : (
          <pre className="max-h-[min(60vh,520px)] overflow-auto rounded-lg bg-slate-900 p-4 font-mono text-xs text-slate-100">
            {json}
          </pre>
        )}
      </div>
    </div>
  );
}
