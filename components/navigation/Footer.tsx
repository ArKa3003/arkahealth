"use client";

import Link from "next/link";
import Image from "next/image";

import { AIIE_ENGINE_VERSION, complianceLinks, routes } from "@/lib/constants";
import { CONTACT_EMAIL, phaseNavItems } from "@/lib/navigation/routes";
import { useEvidenceModalOptional } from "@/components/shared/compliance/evidence-modal-context";

const productLinks = [
  { href: "/#platform", label: "Platform" },
  { href: routes.roi, label: "ROI Calculator" },
  { href: routes.cdsHooksDemo, label: "CDS Hooks Demo" },
  { href: routes.clinSuite, label: "CLIN Suite" },
] as const;

const companyLinks = [
  { href: "/action-plan", label: "Action Plan" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: `mailto:${CONTACT_EMAIL}`, label: "Contact" },
] as const;

/**
 * Global footer — dark navy with grain, four columns, compliance strip, system status.
 */
export function Footer() {
  const evidenceModal = useEvidenceModalOptional();

  return (
    <footer className="relative border-t border-white/10 bg-surface-dark text-white safe-area-bottom safe-area-left safe-area-right">
      <div className="bg-grain pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Product */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-arka-teal-300">
              Product
            </h2>
            <ul className="mt-4 space-y-2.5">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    prefetch
                    className="text-sm text-white/75 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-arka-slate-900"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Phases */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-arka-teal-300">
              Phases
            </h2>
            <ul className="mt-4 space-y-2.5">
              {phaseNavItems.map((phase) => (
                <li key={phase.id}>
                  <Link
                    href={phase.href}
                    prefetch
                    className="text-sm text-white/75 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-arka-slate-900"
                  >
                    {phase.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Compliance */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-arka-teal-300">
              Compliance
            </h2>
            <ul className="mt-4 space-y-2.5">
              <li>
                <button
                  type="button"
                  onClick={() => evidenceModal?.setOpen(true)}
                  className="text-left text-sm text-white/75 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-arka-slate-900"
                >
                  FDA Non-Device CDS
                </button>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-white/75 transition hover:text-white"
                >
                  HIPAA-aligned demo posture
                </Link>
              </li>
              <li>
                <Link
                  href={routes.trust}
                  className="text-sm text-white/75 transition hover:text-white"
                >
                  Trust center
                </Link>
              </li>
              <li>
                <Link
                  href={routes.regulatoryRationale}
                  className="text-sm text-white/75 transition hover:text-white"
                >
                  CMS-0057-F readiness
                </Link>
              </li>
              {complianceLinks.map((link) => {
                const external = "external" in link && link.external === true;
                const label =
                  "footerLabel" in link && link.footerLabel ? link.footerLabel : link.label;
                return (
                  <li key={link.href}>
                    {external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-white/75 transition hover:text-white"
                      >
                        {label}
                      </a>
                    ) : (
                      <Link href={link.href} prefetch className="text-sm text-white/75 transition hover:text-white">
                        {label}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 text-xs leading-relaxed text-white/50">
              Non-device CDS under §520(o)(1)(E). Supports clinician judgment — not a substitute
              for medical decision-making.
            </p>
          </div>

          {/* Company */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-arka-teal-300">
              Company
            </h2>
            <ul className="mt-4 space-y-2.5">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  {link.href.startsWith("mailto:") ? (
                    <a href={link.href} className="text-sm text-white/75 transition hover:text-white">
                      {link.label}
                    </a>
                  ) : (
                    <Link href={link.href} prefetch className="text-sm text-white/75 transition hover:text-white">
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link href={routes.home} className="inline-flex items-center gap-2 no-underline" aria-label="ARKA Health home">
              <Image
                src="/arka-icon.svg"
                alt=""
                width={28}
                height={28}
                className="h-7 w-7"
                unoptimized
              />
              <span className="text-sm font-semibold text-white">ARKA</span>
            </Link>
            <span className="text-sm text-white/50">© 2026 ARKA Health</span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-2 text-sm text-white/70">
              <span className="relative flex h-2 w-2" aria-hidden>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60 motion-reduce:animate-none" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
              </span>
              All systems operational
            </span>
            <span className="text-xs text-white/60">AIIE v{AIIE_ENGINE_VERSION}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
