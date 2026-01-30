"use client";

import Link from "next/link";
import Image from "next/image";
import { navLinks } from "@/lib/constants";

const socialPlaceholders = [
  { label: "LinkedIn", href: "#", ariaLabel: "ARKA on LinkedIn" },
  { label: "Twitter", href: "#", ariaLabel: "ARKA on Twitter" },
  { label: "GitHub", href: "#", ariaLabel: "ARKA on GitHub" },
] as const;

export function Footer() {
  return (
    <footer className="safe-area-bottom border-t border-arka-deep/50 bg-arka-bg-medium/40 dark:border-neutral-800 dark:bg-neutral-900/50">
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
                  href="mailto:contact@arkahealth.com"
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
          {/* Bottom row: copyright + tagline */}
          <div className="flex flex-col gap-2 border-t border-arka-deep/30 pt-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <p className="text-sm text-arka-text-soft dark:text-neutral-400">
              © 2026 ARKA. <span className="font-accent italic">remARKAbly precise.</span>
            </p>
            <p className="text-sm text-arka-text-soft/90 dark:text-neutral-500">
              Built with precision
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
