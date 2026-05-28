"use client";

import Link from "next/link";
import Image from "next/image";
import { AIIE_ENGINE_VERSION, complianceLinks, navLinks, routes } from "@/lib/constants";
import { useEvidenceModal } from "@/components/shared/compliance/evidence-modal-context";

const socialPlaceholders = [
  { label: "LinkedIn", href: "#", ariaLabel: "ARKA on LinkedIn" },
  { label: "Twitter", href: "#", ariaLabel: "ARKA on Twitter" },
  { label: "GitHub", href: "#", ariaLabel: "ARKA on GitHub" },
] as const;

export function Footer() {
  const { setOpen } = useEvidenceModal();

  return (
    <footer className="safe-area-bottom border-t border-arka-deep/50 bg-arka-navy dark:border-neutral-800 dark:bg-arka-navy">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 safe-area-left safe-area-right">
        <div className="flex flex-col gap-8 sm:gap-10">
          {/* Top row: logo + nav + social */}
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-arka-text no-underline"
              aria-label="ARKA Health – Home"
            >
              <Image
                src="/arka-icon.svg"
                alt=""
                width={32}
                height={32}
                className="h-8 w-8 shrink-0"
                unoptimized
              />
              <span className="text-sm font-semibold">ARKA</span>
            </Link>
            <ul className="flex flex-wrap items-center gap-6">
              {navLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="arka-link-underline text-sm text-arka-text-soft hover:text-arka-text dark:text-neutral-400 dark:hover:text-white"
                  >
                    {label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="mailto:arrihantk@getarka.health"
                  className="arka-link-underline text-sm text-arka-text-soft hover:text-arka-text dark:text-neutral-400 dark:hover:text-white"
                >
                  Contact
                </Link>
              </li>
            </ul>
            <ul className="flex flex-wrap items-center gap-4">
              {socialPlaceholders.map(({ href, label, ariaLabel }) => (
                <li key={label}>
                  <a
                    href={href}
                    className="arka-link-underline text-sm text-arka-text-soft hover:text-arka-cyan"
                    aria-label={ariaLabel}
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          {/* Compliance + copyright */}
          <div className="flex flex-col gap-4 border-t border-arka-deep/30 pt-6">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {complianceLinks.map((link) => {
                const buttonLabel =
                  "footerLabel" in link && link.footerLabel ? link.footerLabel : link.label;
                const buttonClassName =
                  "rounded-lg border border-arka-cyan/40 bg-arka-cyan/5 px-3 py-1.5 text-xs font-medium text-arka-cyan transition hover:border-arka-cyan/60 hover:bg-arka-cyan/10 sm:text-sm";
                if ("external" in link && link.external) {
                  return (
                    <a
                      key={link.href}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={buttonClassName}
                    >
                      {buttonLabel}
                    </a>
                  );
                }
                return (
                  <Link key={link.href} href={link.href} prefetch className={buttonClassName}>
                    {buttonLabel}
                  </Link>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-center text-[11px] leading-relaxed text-arka-text-soft/95 sm:text-xs dark:text-neutral-400">
              <span>ARKA Health © 2026</span>
              <span className="hidden text-arka-deep/50 sm:inline" aria-hidden>
                |
              </span>
              <span>FDA Non-Device CDS — supports decisions; not a substitute for clinical judgment</span>
              <span className="hidden text-arka-deep/50 sm:inline" aria-hidden>
                |
              </span>
              <span className="inline-flex items-center rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-200/90">
                CMS-0057-F ready
              </span>
              <span className="hidden text-arka-deep/50 sm:inline" aria-hidden>
                |
              </span>
              <span>AIIE v{AIIE_ENGINE_VERSION}</span>
              <span className="hidden text-arka-deep/50 sm:inline" aria-hidden>
                |
              </span>
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="arka-link-underline font-medium text-arka-cyan hover:text-white"
              >
                Evidence
              </button>
              <span className="hidden text-arka-deep/50 sm:inline" aria-hidden>
                |
              </span>
              <Link
                href="/action-plan"
                className="arka-link-underline font-medium text-arka-cyan hover:text-white"
              >
                Action Plan
              </Link>
              <span className="hidden text-arka-deep/50 sm:inline" aria-hidden>
                |
              </span>
              <Link
                href={routes.cdsHooksDiscovery}
                className="arka-link-underline font-medium text-arka-cyan hover:text-white"
              >
                CDS Hooks Discovery
              </Link>
              <span className="hidden text-arka-deep/50 sm:inline" aria-hidden>
                |
              </span>
              <Link
                href={routes.cdsHooksDemoValidation}
                className="arka-link-underline font-medium text-arka-cyan hover:text-white"
              >
                CDS Validation Dashboard
              </Link>
              <span className="hidden text-arka-deep/50 sm:inline" aria-hidden>
                |
              </span>
              <Link href={routes.clinSuite} className="arka-link-underline font-medium text-arka-cyan hover:text-white">
                ARKA-CLIN Suite (standalone + EHR)
              </Link>
              <span className="hidden text-arka-deep/50 sm:inline" aria-hidden>
                |
              </span>
              <Link href="/privacy" className="arka-link-underline text-arka-text-soft hover:text-arka-text">
                Privacy
              </Link>
              <span className="hidden text-arka-deep/50 sm:inline" aria-hidden>
                |
              </span>
              <Link href="/terms" className="arka-link-underline text-arka-text-soft hover:text-arka-text">
                Terms
              </Link>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <p className="text-sm text-arka-text-soft dark:text-neutral-400">
                © 2026 ARKA. <span className="font-accent italic">remARKAbly precise.</span>
              </p>
              <p className="text-sm text-arka-text-soft/90 dark:text-neutral-500">Built with precision</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
