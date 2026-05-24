import Link from "next/link";
import { headers } from "next/headers";

interface CdsDiscoveryService {
  hook: string;
  id: string;
  title: string;
  description: string;
}

interface CdsDiscoveryResponse {
  services: CdsDiscoveryService[];
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
async function fetchDiscoveryServices(): Promise<CdsDiscoveryService[]> {
  const hdrs = await headers();
  const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host");
  const proto = hdrs.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "production" ? "https" : "http");

  if (!host) {
    return [];
  }

  const res = await fetch(`${proto}://${host}/api/cds-services`, { cache: "no-store" });
  if (!res.ok) {
    return [];
  }

  const data = (await res.json()) as CdsDiscoveryResponse;
  return data.services ?? [];
}

export default async function CdsHooksDiscoveryPage() {
  const services = await fetchDiscoveryServices();

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-white">CDS Hooks Discovery</h1>
      <p className="mt-4 text-arka-text-soft">
        This page documents the standard HL7 CDS Hooks 2.0 service-discovery endpoint that electronic health
        record systems (Epic, Cerner, SMART Sandbox, and others) call to register ARKA. A single discovery URL
        advertises every ARKA-CLIN and ARKA-INS hook service on the platform.
      </p>

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
        {services.length === 0 ? (
          <p className="mt-4 text-sm text-arka-text-soft">
            Discovery services could not be loaded. Use the raw JSON link below or retry shortly.
          </p>
        ) : null}
      </div>

      <section className="mt-12">
        <h2 className="text-lg font-semibold text-white">For developers</h2>
        <p className="mt-2 text-sm text-arka-text-soft">
          EHR sandboxes and integration engineers should register this discovery URL and inspect the live
          service list with:
        </p>
        <pre className="mt-4 overflow-x-auto rounded-md bg-arka-deep p-4 font-mono text-xs text-arka-text">
          curl https://arkahealth.vercel.app/api/cds-services | jq
        </pre>
        <p className="mt-4">
          <Link
            href="/api/cds-services"
            target="_blank"
            className="arka-link-underline text-arka-cyan hover:text-white"
          >
            Open raw discovery JSON →
          </Link>
        </p>
      </section>
    </div>
  );
}
