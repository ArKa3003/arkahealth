"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Info } from "lucide-react";

import { DemoModeWatermark } from "@/components/ins/DemoModeWatermark";
import { describeImagingCpt, estimatedInNetworkAllowedForCpt } from "@/lib/aiie/cpt-pricing";
import { routes } from "@/lib/constants";
import type { OOPEstimate } from "@/lib/types/aiie";
import { getFdaNoticeParagraph } from "@/lib/compliance/fda-notice-copy";

function formatUsd(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function parseNum(s: string | null, fallback: number): number {
  if (!s?.trim()) return fallback;
  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Patient-facing OOP estimate — plain language, no clinical jargon.
 */
export function PatientExplainerClient() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orderId = typeof params.orderId === "string" ? params.orderId : "demo";

  const cptCode = searchParams.get("cpt")?.replace(/\D/g, "").slice(0, 5) || "74176";
  const zip = searchParams.get("zip")?.trim() || "75201";
  const payerId = searchParams.get("payerId")?.trim() || "uhc";

  const allowedDefault = estimatedInNetworkAllowedForCpt(cptCode);
  const fallbackPay = Math.round(allowedDefault * 0.18);

  const [estimate, setEstimate] = React.useState<OOPEstimate | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const u = new URL("/api/ins/oop/shoppable", window.location.origin);
        u.searchParams.set("cptCode", cptCode);
        u.searchParams.set("zip", zip);
        u.searchParams.set("radius", "50");
        u.searchParams.set("payerId", payerId);
        const res = await fetch(u.toString());
        const json = (await res.json()) as {
          error?: string;
          results?: Array<{ negotiatedRate: number | null; cashPrice: number | null; name: string }>;
        };
        if (!res.ok) throw new Error(json.error ?? "Could not load estimate");

        const site = json.results?.[0];
        const allowed = site?.negotiatedRate ?? allowedDefault;
        const patientPay = parseNum(searchParams.get("patientPay"), Math.round(allowed * 0.18));
        const deductibleRemaining = parseNum(searchParams.get("deductibleRemaining"), 1200);

        const demoEstimate: OOPEstimate = {
          estimatedPatientResponsibility: patientPay,
          deductibleRemaining,
          coinsurance: 0.2,
          copay: 0,
          inNetworkNegotiatedRate: allowed,
          cashPayComparator: site?.cashPrice ?? Math.round(allowed * 0.85),
          confidence: 0.82,
          assumptions: [
            "This is what you might pay after your plan's deductible and cost-sharing rules are applied.",
            "Your final bill can still change based on what happens during your visit.",
          ],
          alternativeSiteRecommended: (json.results?.length ?? 0) > 1,
          goodFaithEstimateCompliant: true,
          ...(site
            ? {
                cheapestInNetworkSite: {
                  id: "demo-site",
                  name: site.name,
                  estimatedPrice: site.negotiatedRate ?? allowed,
                },
              }
            : {}),
        };

        if (!cancelled) setEstimate(demoEstimate);
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not load estimate");
          setEstimate({
            estimatedPatientResponsibility: fallbackPay,
            deductibleRemaining: 1200,
            coinsurance: 0.2,
            copay: 0,
            inNetworkNegotiatedRate: allowedDefault,
            cashPayComparator: Math.round(allowedDefault * 0.85),
            confidence: 0.7,
            assumptions: [
              "This is a planning estimate using typical in-network rates.",
              "Talk with your care team if you have questions.",
            ],
            alternativeSiteRecommended: false,
            goodFaithEstimateCompliant: true,
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [cptCode, zip, payerId, searchParams, allowedDefault, fallbackPay]);

  const description = describeImagingCpt(cptCode);
  const fdaNotice = getFdaNoticeParagraph("INS", "patient");

  return (
    <div className="min-h-screen bg-surface-sunken pb-16">
      <DemoModeWatermark />

      <div className="mx-auto max-w-lg px-4 py-8 sm:py-10">
        <h1 className="text-h2 font-semibold text-arka-slate-900">What you might pay</h1>
        <p className="mt-2 text-body text-arka-slate-600">
          A simple cost snapshot for your upcoming imaging visit. This is not a bill and not medical advice.
        </p>

        <section
          className="mt-8 rounded-radius-lg border border-border-subtle bg-surface-raised p-6 shadow-elevation-2"
          aria-labelledby="oop-heading"
        >
          <h2 id="oop-heading" className="sr-only">
            Out-of-pocket estimate
          </h2>

          {loading ? (
            <p className="text-center text-arka-slate-500">Calculating your estimate…</p>
          ) : estimate ? (
            <>
              <p className="text-center text-caption font-medium uppercase tracking-wide text-arka-slate-500">
                Your estimated share
              </p>
              <p className="mt-2 text-center text-4xl font-semibold tabular-nums text-arka-slate-900">
                {formatUsd(estimate.estimatedPatientResponsibility)}
              </p>
              <ul className="mt-3 space-y-2 text-center text-body leading-relaxed text-arka-slate-600">
                {estimate.assumptions.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>

              <dl className="mt-8 space-y-3 border-t border-border-subtle pt-6 text-body">
                <div className="flex justify-between gap-4">
                  <dt className="text-arka-slate-600">What your plan may cover</dt>
                  <dd className="font-medium tabular-nums text-arka-slate-900">
                    {formatUsd(
                      Math.max(
                        0,
                        estimate.inNetworkNegotiatedRate - estimate.estimatedPatientResponsibility,
                      ),
                    )}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-arka-slate-600">Typical allowed amount</dt>
                  <dd className="tabular-nums text-arka-slate-800">
                    {formatUsd(estimate.inNetworkNegotiatedRate)}
                  </dd>
                </div>
                {estimate.cashPayComparator != null && estimate.cashPayComparator > 0 ? (
                  <div className="flex justify-between gap-4 text-caption">
                    <dt className="text-arka-slate-500">Cash price at nearby site (comparison)</dt>
                    <dd className="tabular-nums text-arka-slate-700">
                      {formatUsd(estimate.cashPayComparator)}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </>
          ) : null}

          {error ? (
            <p className="mt-4 rounded-radius-md border border-warning/30 bg-warning-bg px-3 py-2 text-sm text-warning">
              {error}
            </p>
          ) : null}
        </section>

        <section className="mt-6 rounded-radius-lg border border-border-subtle bg-surface-raised p-5">
          <h2 className="text-h3 font-semibold text-arka-slate-900">About your test</h2>
          <p className="mt-3 text-body leading-relaxed text-arka-slate-700">
            Your doctor ordered procedure code <span className="font-mono font-medium">{cptCode}</span>. In everyday
            terms: <strong className="text-arka-slate-900">{description}</strong>.
          </p>
          <p className="mt-3 flex items-start gap-2 text-caption text-arka-slate-500">
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            Only your care team can tell you whether this test is right for you.
          </p>
        </section>

        <div
          role="note"
          className="mt-8 rounded-radius-md border border-border-subtle bg-surface-sunken px-4 py-4 text-caption leading-relaxed text-arka-slate-600"
        >
          {fdaNotice}
        </div>

        <p className="mt-6 text-center text-caption text-arka-slate-500">
          Order reference: <span className="font-mono">{orderId}</span> · ZIP {zip}
        </p>
        <p className="mt-2 text-center">
          <Link href={routes.ins} className="text-sm font-medium text-arka-teal-700 hover:underline">
            Back to ARKA-INS
          </Link>
        </p>
      </div>
    </div>
  );
}
