"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { describeImagingCpt, estimatedInNetworkAllowedForCpt } from "@/lib/aiie/cpt-pricing";
import { buildGoodFaithEstimateBlock } from "@/lib/ins/gfe";
import { latLngFromZip } from "@/lib/ins/us-zip-centroids";
import { routes } from "@/lib/constants";
import { DemoModeWatermark } from "@/components/ins/DemoModeWatermark";
import { Progress } from "@/components/demos/ins/ui/Progress";

type ShoppableResult = {
  siteId: string;
  name: string;
  address: string | null;
  negotiatedRate: number | null;
  cashPrice: number | null;
  distance: number;
  framingText: string;
};

function formatUsd(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function parseNum(s: string | null, fallback: number): number {
  if (!s?.trim()) {
    return fallback;
  }
  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Patient-facing cost transparency explainer (mobile-first, plain language).
 */
export function PatientExplainerClient() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orderId = typeof params.orderId === "string" ? params.orderId : "demo";

  const cptCode = searchParams.get("cpt")?.replace(/\D/g, "").slice(0, 5) || "74176";
  const zip = searchParams.get("zip")?.trim() || "75201";
  const payerId = searchParams.get("payerId")?.trim() || "uhc";
  const radius = parseNum(searchParams.get("radius"), 50);

  const allowedDefault = estimatedInNetworkAllowedForCpt(cptCode);
  const patientPay = parseNum(searchParams.get("patientPay"), Math.round(allowedDefault * 0.18));
  const insurancePay = parseNum(searchParams.get("insurancePay"), Math.max(0, allowedDefault - patientPay));
  const deductibleTotal = parseNum(searchParams.get("deductibleTotal"), 3000);
  const deductibleRemaining = parseNum(searchParams.get("deductibleRemaining"), 1200);
  const isHdhp = searchParams.get("hdhp") === "1" || searchParams.get("hdhp") === "true";

  const [sites, setSites] = React.useState<ShoppableResult[]>([]);
  const [shopError, setShopError] = React.useState<string | null>(null);
  const [shopLoading, setShopLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      setShopLoading(true);
      setShopError(null);
      try {
        const u = new URL("/api/ins/oop/shoppable", window.location.origin);
        u.searchParams.set("cptCode", cptCode);
        u.searchParams.set("zip", zip);
        u.searchParams.set("radius", String(radius));
        u.searchParams.set("payerId", payerId);
        const res = await fetch(u.toString());
        const json = (await res.json()) as { error?: string; results?: ShoppableResult[] };
        if (!res.ok) {
          throw new Error(json.error ?? "Could not load nearby sites");
        }
        if (!cancelled) {
          setSites((json.results ?? []).slice(0, 3));
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setShopError(e instanceof Error ? e.message : "Could not load alternatives");
          setSites([]);
        }
      } finally {
        if (!cancelled) {
          setShopLoading(false);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [cptCode, zip, radius, payerId]);

  const description = describeImagingCpt(cptCode);
  const deductibleMet = Math.max(0, deductibleTotal - deductibleRemaining);
  const deductiblePct = deductibleTotal > 0 ? Math.min(100, Math.round((deductibleMet / deductibleTotal) * 100)) : 0;

  const centroid = latLngFromZip(zip);
  const mapBbox = centroid
    ? `${centroid.lng - 0.12},${centroid.lat - 0.08},${centroid.lng + 0.12},${centroid.lat + 0.08}`
    : "";

  const issueDateIso = new Date().toISOString().slice(0, 10);
  const gfe = buildGoodFaithEstimateBlock({
    providerName: "ARKA Imaging Network",
    providerNPI: "1999999999",
    providerTIN: "00-0000000",
    cptCode,
    diagnosisCodes: ["Z13.89"],
    expectedChargeUsd: allowedDefault,
    issueDateIso,
  });

  const gfeDownloadText =
    `Good Faith Estimate\n` +
    `Order reference: ${orderId}\n` +
    `Provider: ${gfe.providerName} | NPI ${gfe.providerNPI} | TIN ${gfe.providerTIN}\n` +
    `Issue date: ${gfe.issueDate}\n` +
    `Services:\n` +
    gfe.expectedChargesItemized.map((r) => `  ${r.code} ${r.description}: ${formatUsd(r.chargeUsd)}\n`).join("") +
    `\n${gfe.disclaimerText}\n`;

  const onDownloadGfe = () => {
    const blob = new Blob([gfeDownloadText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `good-faith-estimate-${orderId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 text-slate-900">
      <DemoModeWatermark />
      <div className="mx-auto max-w-lg px-4 pt-6 sm:pt-10">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          <Link href={routes.ins} className="text-arka-teal underline-offset-2 hover:underline">
            ARKA-INS
          </Link>
          <span className="text-slate-400"> / Your costs</span>
        </p>
        <h1 className="mt-2 text-2xl font-semibold leading-tight tracking-tight text-slate-900">Your imaging cost snapshot</h1>
        <p className="mt-2 text-base leading-relaxed text-slate-600">
          This page uses simple words to explain what you might pay. Your exact bill can still change based on your plan
          rules and what happens during your visit.
        </p>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="what-test">
          <h2 id="what-test" className="text-lg font-semibold text-slate-900">
            What is this test?
          </h2>
          <p className="mt-3 text-base leading-relaxed text-slate-700">
            Your doctor ordered a billing code called <span className="font-mono font-medium">{cptCode}</span>. In plain
            language, that usually means: <strong className="font-semibold text-slate-900">{description}</strong>.
          </p>
          <p className="mt-3 text-base leading-relaxed text-slate-600">
            This page does not tell you if the test is right for you. Only your care team can answer that.
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="what-pay">
          <h2 id="what-pay" className="text-lg font-semibold text-slate-900">
            What will you pay?
          </h2>
          <p className="mt-2 text-sm text-slate-600">This is an estimate for planning, not a bill.</p>
          <div className="mt-6 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">You may pay about</p>
            <p className="mt-1 text-5xl font-semibold tabular-nums text-slate-900">{formatUsd(patientPay)}</p>
            <p className="mt-2 text-sm text-slate-600">before you meet any remaining deductible or cost sharing shown below.</p>
          </div>
          <dl className="mt-8 space-y-3 border-t border-slate-100 pt-6 text-base">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-600">Plan pays (estimated)</dt>
              <dd className="font-medium tabular-nums text-slate-900">{formatUsd(insurancePay)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-600">Your share (estimated)</dt>
              <dd className="font-medium tabular-nums text-slate-900">{formatUsd(patientPay)}</dd>
            </div>
            <div className="flex justify-between gap-4 text-sm">
              <dt className="text-slate-500">Expected allowed amount (demo)</dt>
              <dd className="tabular-nums text-slate-700">{formatUsd(allowedDefault)}</dd>
            </div>
          </dl>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="deductible">
          <h2 id="deductible" className="text-lg font-semibold text-slate-900">
            Your deductible status
          </h2>
          <p className="mt-2 text-base leading-relaxed text-slate-600">
            A deductible is the amount you pay before your plan starts paying its share for many services.
          </p>
          <div className="mt-4">
            <div className="flex justify-between text-sm text-slate-700">
              <span>Progress</span>
              <span className="tabular-nums">
                {formatUsd(deductibleMet)} of {formatUsd(deductibleTotal)}
              </span>
            </div>
            <Progress value={deductiblePct} max={100} size="md" className="mt-2 w-full" />
            <p className="mt-2 text-sm text-slate-600">
              About <strong className="font-semibold text-slate-900">{formatUsd(deductibleRemaining)}</strong> left to
              meet your deductible (demo numbers).
            </p>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="alternatives">
          <h2 id="alternatives" className="text-lg font-semibold text-slate-900">
            Could you pay less elsewhere?
          </h2>
          <p className="mt-2 text-base leading-relaxed text-slate-600">
            Sometimes prices vary by location. Comparing sites is optional. Choosing care is always between you and your
            doctor.
          </p>
          {shopLoading && <p className="mt-4 text-sm text-slate-500">Loading nearby options…</p>}
          {shopError && (
            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">{shopError}</p>
          )}
          {!shopLoading && !shopError && sites.length === 0 && (
            <p className="mt-4 text-sm text-slate-600">No matches in this ZIP and radius for this code. Try another ZIP from your region.</p>
          )}
          <ul className="mt-4 space-y-6">
            {sites.map((s, idx) => (
              <li key={s.siteId} className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Option {idx + 1}</p>
                <h3 className="mt-1 text-base font-semibold text-slate-900">{s.name}</h3>
                {s.address && <p className="mt-1 text-sm text-slate-600">{s.address}</p>}
                <p className="mt-2 text-sm text-slate-700">
                  {s.negotiatedRate != null && (
                    <span className="mr-2">In-network estimate: {formatUsd(s.negotiatedRate)}</span>
                  )}
                  {s.cashPrice != null && <span className="text-slate-600">Cash self-pay: {formatUsd(s.cashPrice)}</span>}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.framingText}</p>
                <p className="mt-1 text-xs text-slate-500">About {s.distance} miles away (straight-line distance).</p>
                <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
                  <iframe
                    title={`Map area for ${s.name}`}
                    className="h-40 w-full"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://www.google.com/maps?q=${encodeURIComponent(`${s.name} ${s.address ?? ""}`)}&output=embed`}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>

        {centroid && mapBbox && (
          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <iframe
              title="Approximate area map for your ZIP code"
              className="h-44 w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapBbox}&layer=mapnik`}
            />
            <p className="px-4 py-2 text-center text-xs text-slate-500">Map shows the general ZIP area, not exact driving routes.</p>
          </div>
        )}

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="gfe">
          <h2 id="gfe" className="text-lg font-semibold text-slate-900">
            Good Faith Estimate
          </h2>
          <p className="mt-2 text-base leading-relaxed text-slate-600">
            Federal rules can give you a written estimate for certain planned services. ARKA can package a Good Faith
            Estimate block for your records.
          </p>
          <button
            type="button"
            onClick={onDownloadGfe}
            className="mt-4 w-full rounded-xl border border-arka-teal bg-arka-teal px-4 py-3 text-center text-base font-semibold text-white shadow-sm transition hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arka-teal"
          >
            Download estimate file
          </button>
          <p className="mt-2 text-xs text-slate-500">
            Downloads as a text file you can save, email, or print to PDF from your device.
          </p>
          <div className="mt-6 rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
            <p className="font-semibold text-slate-900">Provider of estimate</p>
            <p className="mt-1">
              {gfe.providerName} — NPI {gfe.providerNPI}, TIN {gfe.providerTIN}
            </p>
            <p className="mt-3 font-semibold text-slate-900">Expected charges (itemized)</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              {gfe.expectedChargesItemized.map((row) => (
                <li key={row.code}>
                  {row.code} — {row.description}: {formatUsd(row.chargeUsd)}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-slate-600">{gfe.disclaimerText}</p>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="assist">
          <h2 id="assist" className="text-lg font-semibold text-slate-900">
            Financial assistance
          </h2>
          <ul className="mt-3 list-inside list-disc space-y-2 text-base leading-relaxed text-slate-700">
            <li>
              Many hospitals offer charity care or financial aid. Ask your billing office for a plain-language application.
            </li>
            <li>
              Nonprofit information:{" "}
              <a
                href="https://www.cms.gov/nosurprises"
                className="text-arka-teal underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arka-teal"
                target="_blank"
                rel="noreferrer"
              >
                CMS: No Surprises Act
              </a>{" "}
              resources for billing questions.
            </li>
            {isHdhp && (
              <li>
                If you have a high-deductible health plan, you may be able to use a health savings account (HSA) for
                eligible costs. Check with your employer or plan documents.
              </li>
            )}
          </ul>
          {!isHdhp && (
            <p className="mt-3 text-sm text-slate-600">
              If you use a health savings account (HSA), review your plan booklet for what counts as an eligible expense.
            </p>
          )}
        </section>

        <details className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <summary className="cursor-pointer text-lg font-semibold text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arka-teal">
            Why am I seeing this?
          </summary>
          <div className="mt-4 space-y-3 text-base leading-relaxed text-slate-700">
            <p>
              Federal price transparency rules are meant to help people understand costs ahead of time. Two common ones
              are the{" "}
              <strong className="font-semibold text-slate-900">No Surprises Act</strong> (protections from many surprise
              bills) and the <strong className="font-semibold text-slate-900">Hospital Price Transparency</strong> rule
              (published hospital prices for many services).
            </p>
            <p>
              ARKA shows this screen to help you compare estimates and learn your rights. It is still only a tool. Always
              talk with your doctor if you have questions about whether a test is right for you.
            </p>
          </div>
        </details>

        <div
          role="note"
          className="mt-8 rounded-xl border border-slate-300 bg-slate-100 px-4 py-4 text-sm leading-relaxed text-slate-800"
        >
          This information is provided by ARKA, an FDA Non-Device CDS tool. It is not medical advice. Talk to your doctor
          about whether this test is right for you.
        </div>
      </div>
    </div>
  );
}
