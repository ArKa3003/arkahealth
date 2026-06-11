"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Info } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  UiTooltipProvider,
} from "@/components/ui/tooltip";
import { FDA_NON_DEVICE_CDS_DISCLOSURE } from "@/lib/compliance/fda-disclosure";
import {
  type ArkaProduct,
  type FdaNoticeVariant,
  getFdaNoticeParagraph,
  inferProductFromPathname,
  isPatientFdaRoute,
} from "@/lib/compliance/fda-notice-copy";
import { routes } from "@/lib/constants";
import { cn } from "@/lib/utils";

export type { ArkaProduct };

export interface ComplianceBarProps {
  className?: string;
  /** When set, overrides pathname-based detection. */
  product?: ArkaProduct;
  /** Patient-friendly copy for cost / education routes. */
  variant?: FdaNoticeVariant;
  /** Full four-item band on phase pages; compact disclaimer-only in embedded surfaces. */
  mode?: "page" | "embedded";
}

type ComplianceItem = {
  id: string;
  label: string;
  tooltip: string;
};

const COMPLIANCE_ITEMS: ComplianceItem[] = [
  {
    id: "fda",
    label: "FDA Non-Device CDS · 21st Century Cures §520(o)(1)(E)",
    tooltip:
      "ARKA is designed to meet the four Non-Device Clinical Decision Support criteria under FD&C Act §520(o)(1)(E). Recommendations support, not replace, clinician judgment.",
  },
  {
    id: "phi",
    label: "No PHI stored · SHA-256 hashed identifiers",
    tooltip:
      "Public demos use synthetic data only. Production identifiers are hashed with SHA-256; raw PHI is not stored in demo tables.",
  },
  {
    id: "cms",
    label: "CMS-0057-F aligned",
    tooltip:
      "Da Vinci CRD/DTR/PAS endpoints are registered for CDS Hooks discovery. CMS-0057-F interoperability patterns are implemented in ARKA-INS.",
  },
  {
    id: "interop",
    label: "CDS Hooks 2.0 / FHIR R4",
    tooltip:
      "ARKA integrates via HL7 CDS Hooks with FHIR R4 prefetch — the standard surface supported by major commercial EHRs.",
  },
];

/**
 * Slim compliance band for phase pages — four tooltip items plus expandable FDA disclaimer.
 */
export function ComplianceBar({
  className,
  product: productProp,
  variant: variantProp,
  mode = "page",
}: ComplianceBarProps) {
  const pathname = usePathname();
  const product = productProp ?? inferProductFromPathname(pathname);
  const variant = variantProp ?? (isPatientFdaRoute(pathname) ? "patient" : "default");
  const noticeParagraph = getFdaNoticeParagraph(product, variant);

  return (
    <UiTooltipProvider>
      <div
        role="region"
        aria-label="ARKA compliance and regulatory posture"
        className={cn(
          "w-full border-b border-border-subtle bg-surface-sunken text-arka-slate-700",
          mode === "page" ? "px-4 py-2 sm:px-6" : "rounded-radius-md border px-3 py-2 text-xs",
          className,
        )}
      >
        {mode === "page" ? (
          <ul className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-4 gap-y-2 lg:justify-between">
            {COMPLIANCE_ITEMS.map((item) => (
              <li key={item.id}>
                <ComplianceTooltipItem item={item} />
              </li>
            ))}
          </ul>
        ) : null}

        <details
          className={cn(
            "group",
            mode === "page" ? "mx-auto mt-2 max-w-7xl" : "mt-0",
          )}
        >
          <summary
            className={cn(
              "flex cursor-pointer list-none items-center gap-1.5 font-medium text-arka-teal-700",
              "hover:text-arka-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500 focus-visible:ring-offset-2",
              mode === "page" ? "justify-center text-caption sm:justify-start" : "text-xs",
            )}
          >
            <ChevronDown
              className="h-3.5 w-3.5 transition-transform group-open:rotate-180"
              aria-hidden
            />
            Full FDA Non-Device CDS disclaimer
          </summary>
          <div
            className={cn(
              "mt-2 space-y-2 rounded-radius-md border border-border-subtle bg-surface px-3 py-2.5 text-arka-slate-700",
              mode === "page" ? "text-caption leading-relaxed" : "text-xs leading-snug",
            )}
          >
            <p>{noticeParagraph}</p>
            <p className="border-t border-border-subtle pt-2 text-arka-slate-600">
              {FDA_NON_DEVICE_CDS_DISCLOSURE}
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Link
                href={routes.regulatoryRationale}
                className="font-medium text-arka-teal-700 underline decoration-arka-teal-700/30 underline-offset-2 hover:decoration-arka-teal-700"
              >
                Regulatory rationale
              </Link>
              <Link
                href={routes.featureCatalog}
                className="font-medium text-arka-teal-700 underline decoration-arka-teal-700/30 underline-offset-2 hover:decoration-arka-teal-700"
              >
                Feature catalog
              </Link>
              <Link
                href="/trust"
                className="font-medium text-arka-teal-700 underline decoration-arka-teal-700/30 underline-offset-2 hover:decoration-arka-teal-700"
              >
                Trust center
              </Link>
            </div>
          </div>
        </details>
      </div>
    </UiTooltipProvider>
  );
}

function ComplianceTooltipItem({ item }: { item: ComplianceItem }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex max-w-[16rem] items-center gap-1.5 truncate text-left text-caption font-medium text-arka-slate-600 hover:text-arka-slate-900 sm:max-w-none"
        >
          <Info className="h-3.5 w-3.5 shrink-0 text-arka-teal-600" aria-hidden />
          <span className="truncate">{item.label}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-sm">
        {item.tooltip}
      </TooltipContent>
    </Tooltip>
  );
}
