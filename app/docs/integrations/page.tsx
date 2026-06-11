import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, MonitorPlay } from "lucide-react";

import { DocsPageLayout } from "@/components/docs/DocsPageLayout";

export const metadata: Metadata = {
  title: "EHR Integrations",
  description:
    "How ARKA embeds inside Epic-class EHRs: CDS Hooks service registration, SMART on FHIR launch, and the icon-mode UX contract.",
};

const CDS_SERVICES = [
  { id: "arka-clin-appropriateness", hook: "order-select", purpose: "AIIE appropriateness scoring on draft imaging orders" },
  { id: "arka-clin-appropriateness-sign", hook: "order-sign", purpose: "Final appropriateness check before signature" },
  { id: "arka-ins-coverage", hook: "order-select", purpose: "Coverage, prior-auth, and denial-risk signals" },
  { id: "arka-ins-final-check", hook: "order-sign", purpose: "Final payer check at signature" },
  { id: "arka-ins-appointment", hook: "appointment-book", purpose: "Scheduling-time coverage validation" },
] as const;

const SMART_FIELDS = [
  { field: "Launch type", value: "EHR launch (embedded)" },
  { field: "Launch URL", value: "/ehr/launch" },
  { field: "Redirect URI", value: "/ehr/callback" },
  { field: "Client type", value: "Public client + PKCE (S256)" },
  {
    field: "Scopes",
    value:
      "launch openid fhirUser patient/Patient.read patient/ServiceRequest.read patient/Condition.read patient/Observation.read patient/DiagnosticReport.read",
  },
  { field: "FHIR version", value: "R4" },
] as const;

/**
 * EHR integration overview at /docs/integrations — registration details for both
 * delivery pillars plus a one-click simulated EHR launch of the embedded rail.
 */
export default function IntegrationsDocsPage() {
  return (
    <DocsPageLayout
      title="EHR Integrations"
      description="ARKA runs inside Epic-class EHRs as an unobtrusive icon and panel while CDS Hooks does the automation. Two pillars, one AIIE engine, zero workflow friction."
      lastUpdated="June 2026"
    >
      <h2 id="simulated-ehr">Try it: simulated EHR</h2>
      <p>
        The embedded experience is fully demoable without a live EHR. The simulated environment
        wraps the real ARKA rail — running against sandbox fixtures — inside a mock EHR chrome
        frame, so you can see icon mode, the one-time alert pulse, and the expandable
        intelligence rail exactly as a clinician would.
      </p>
      <p>
        <Link
          href="/ehr/sandbox"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-radius-md bg-arka-teal-600 px-5 py-2.5 text-sm font-medium text-white no-underline shadow-elevation-1 transition hover:bg-arka-teal-500 hover:shadow-elevation-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500 focus-visible:ring-offset-2"
        >
          <MonitorPlay className="h-4 w-4" aria-hidden />
          Launch simulated EHR
          <ExternalLink className="h-3.5 w-3.5 opacity-70" aria-hidden />
        </Link>
      </p>

      <h2 id="cds-hooks">Pillar A — CDS Hooks services</h2>
      <p>
        EHRs discover ARKA services at <code>GET /api/cds-services</code> (also exposed at{" "}
        <code>/.well-known/cds-services</code>). Cards arrive automatically at order entry — no
        clicks, no context switching.
      </p>
      <table>
        <thead>
          <tr>
            <th>Service</th>
            <th>Hook</th>
            <th>Purpose</th>
          </tr>
        </thead>
        <tbody>
          {CDS_SERVICES.map((service) => (
            <tr key={service.id}>
              <td>
                <code>{service.id}</code>
              </td>
              <td>
                <code>{service.hook}</code>
              </td>
              <td>{service.purpose}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        Incoming requests are validated against the CDS Hooks 2.0 schema and — when{" "}
        <code>CDS_JWT_REQUIRED=1</code> — authenticated per the CDS Hooks security model: the
        EHR-signed JWT is verified against issuer/audience allowlists with JWKS fetched from the
        token&apos;s <code>jku</code> header and cached. Local demos run without keys.
      </p>

      <h2 id="smart-on-fhir">Pillar B — SMART on FHIR embedded app</h2>
      <p>
        The embedded rail launches via the standard SMART EHR-launch sequence:{" "}
        <code>iss</code> + <code>launch</code> → smart-configuration discovery → authorize
        redirect with PKCE (S256) → token exchange → encrypted httpOnly session cookies. Patient
        data is fetched client-side from the EHR&apos;s FHIR server; nothing is persisted on ARKA
        servers.
      </p>
      <table>
        <thead>
          <tr>
            <th>Registration field</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {SMART_FIELDS.map((row) => (
            <tr key={row.field}>
              <td>{row.field}</td>
              <td>
                <code>{row.value}</code>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 id="icon-mode-contract">The icon-mode UX contract</h2>
      <p>
        <strong>ARKA never interrupts; it signals.</strong> The default state is a single 48px
        floating button with the ARKA mark. The rail expands only when the clinician clicks the
        badge, or when a draft order scores ≤3 on AIIE or carries an EXPEDITE signal — in which
        case the container shows a one-time pulse ring and a count badge. No sound, no modal,
        and focus is never stolen. Evidence links open in a new tab; the rail never navigates
        the EHR frame.
      </p>

      <h2 id="deployment-guide">Full deployment guide</h2>
      <p>
        Registration checklists, required FHIR resources, environment variables, and the framing
        policy live in the repository deployment guide:{" "}
        <code>docs/integrations/epic-deployment.md</code>.
      </p>
    </DocsPageLayout>
  );
}
