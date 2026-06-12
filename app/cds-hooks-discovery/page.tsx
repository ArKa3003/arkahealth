import Link from "next/link";
import { headers } from "next/headers";
import { ChevronRight } from "lucide-react";

import { CopyJsonButton } from "@/components/cds-platform/demo/CopyJsonButton";
import { routes } from "@/lib/constants";

interface CdsDiscoveryService {
  hook: string;
  id: string;
  title: string;
  description: string;
}

interface CdsDiscoveryResponse {
  services: CdsDiscoveryService[];
  feedback?: string;
}

/**
 * Trims a service description to roughly one line for the discovery table.
 */
function trimDescription(text: string, maxLength = 140): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}

/**
 * Fetches the live CDS Hooks discovery document from the same host (server-side).
 */
async function fetchDiscoveryServices(): Promise<{
  services: CdsDiscoveryService[];
  feedback?: string;
  error?: string;
}> {
  const hdrs = await headers();
  const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host");
  const proto = hdrs.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "production" ? "https" : "http");

  if (!host) {
    return { services: [], error: "Host header unavailable" };
  }

  const res = await fetch(`${proto}://${host}${routes.cdsServicesApi}`, { cache: "no-store" });
  if (!res.ok) {
    return { services: [], error: `Discovery request failed (${res.status})` };
  }

  const data = (await res.json()) as CdsDiscoveryResponse;
  return { services: data.services ?? [], feedback: data.feedback };
}

export default async function CdsHooksDiscoveryPage() {
  const { services, feedback, error } = await fetchDiscoveryServices();
  const curlExample = `curl ${routes.cdsServicesApi} | jq`;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 sm:py-16">
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-arka-text-soft">
          <li>
            <Link
              href={routes.home}
              className="transition-colors hover:text-arka-teal-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500"
            >
              Home
            </Link>
          </li>
          <li className="flex items-center gap-1.5">
            <ChevronRight className="h-4 w-4 text-arka-slate-400" aria-hidden />
            <Link
              href={`${routes.clinSuite}?view=discovery`}
              className="transition-colors hover:text-arka-teal-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500"
            >
              ARKA-CLIN Suite
            </Link>
          </li>
          <li className="flex items-center gap-1.5">
            <ChevronRight className="h-4 w-4 text-arka-slate-400" aria-hidden />
            <span className="font-semibold text-arka-teal-300">CDS Hooks Discovery</span>
          </li>
        </ol>
      </nav>

      <h1 className="text-3xl font-bold text-white">CDS Hooks Discovery</h1>
      <p className="mt-4 text-arka-text-soft">
        This page documents the standard HL7 CDS Hooks 2.0 service-discovery endpoint that electronic health
        record systems (Epic, Cerner, SMART Sandbox, and others) call to register ARKA. A single discovery URL
        advertises every ARKA-CLIN and ARKA-INS hook service on the platform.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={`${routes.clinSuite}?view=standalone`}
          className="inline-flex min-h-[44px] touch-manipulation items-center rounded-lg border border-arka-teal/40 bg-arka-teal/10 px-4 py-2 text-sm font-medium text-arka-teal hover:bg-arka-teal/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500"
        >
          Standalone demo
        </Link>
        <Link
          href={`${routes.clinSuite}?view=embedded`}
          className="inline-flex min-h-[44px] touch-manipulation items-center rounded-lg border border-arka-teal/40 bg-arka-teal/10 px-4 py-2 text-sm font-medium text-arka-teal hover:bg-arka-teal/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500"
        >
          EHR-embedded demo
        </Link>
        <Link
          href={routes.cdsHooksDemoValidation}
          className="inline-flex min-h-[44px] touch-manipulation items-center rounded-lg border border-arka-slate-600 px-4 py-2 text-sm font-medium text-arka-slate-200 hover:border-arka-teal/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500"
        >
          Validation dashboard
        </Link>
      </div>

      <div className="mt-10 overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-arka-deep text-arka-text-soft">
              <th className="py-3 pr-4 font-medium">Hook</th>
              <th className="py-3 pr-4 font-medium">ID</th>
              <th className="py-3 pr-4 font-medium">Title</th>
              <th className="py-3 font-medium">Description</th>
            </tr>
          </thead>
          <tbody>
            {services.map((service) => (
              <tr key={service.id} className="border-b border-arka-deep/60 align-top">
                <td className="py-4 pr-4">
                  <span className="inline-flex rounded-full border border-arka-teal/40 bg-arka-teal/10 px-2.5 py-0.5 font-mono text-xs font-medium text-arka-teal">
                    {service.hook}
                  </span>
                </td>
                <td className="py-4 pr-4 font-mono text-xs text-arka-cyan">{service.id}</td>
                <td className="py-4 pr-4 font-medium text-arka-text">{service.title}</td>
                <td className="py-4 text-arka-text-soft">{trimDescription(service.description)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {error ? (
          <p className="mt-4 text-sm text-amber-200" role="alert">
            {error}.{" "}
            <Link href={routes.cdsServicesApi} className="underline hover:text-white">
              Open raw JSON
            </Link>
          </p>
        ) : null}
        {services.length === 0 && !error ? (
          <p className="mt-4 text-sm text-arka-text-soft">
            Discovery services could not be loaded. Use the raw JSON link below or retry shortly.
          </p>
        ) : null}
      </div>

      {feedback ? (
        <p className="mt-6 text-sm text-arka-text-soft">
          Feedback endpoint:{" "}
          <Link href={feedback} className="font-mono text-arka-cyan hover:text-white">
            {feedback}
          </Link>
        </p>
      ) : null}

      <section className="mt-12">
        <h2 className="text-lg font-semibold text-white">For developers</h2>
        <p className="mt-2 text-sm text-arka-text-soft">
          EHR sandboxes and integration engineers should register the well-known URL and inspect the live
          service list with:
        </p>
        <div className="relative mt-4">
          <pre className="overflow-x-auto rounded-md bg-arka-deep p-4 pr-14 font-mono text-xs text-arka-text">
            {curlExample}
          </pre>
          <CopyJsonButton text={curlExample} className="absolute right-2 top-2" />
        </div>
        <div className="mt-4 flex flex-wrap gap-4">
          <Link
            href={routes.cdsWellKnown}
            target="_blank"
            className="arka-link-underline text-arka-cyan hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500"
          >
            Open well-known JSON →
          </Link>
          <Link
            href={routes.cdsServicesApi}
            target="_blank"
            className="arka-link-underline text-arka-cyan hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500"
          >
            Open API discovery JSON →
          </Link>
        </div>
      </section>
    </div>
  );
}
