"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export type ArkaProduct = "CLIN" | "INS" | "ED";

export interface FDANonDeviceBannerProps {
  className?: string;
  /** When set, overrides pathname-based detection. */
  product?: ArkaProduct;
  /** Patient-friendly copy for cost / education routes. */
  variant?: "default" | "patient";
}

function inferProduct(pathname: string | null): ArkaProduct {
  if (!pathname || pathname === "/") {
    return "CLIN";
  }
  if (pathname.startsWith("/ins")) {
    return "INS";
  }
  if (pathname.startsWith("/ed")) {
    return "ED";
  }
  if (pathname.startsWith("/clin-suite") || pathname.startsWith("/clin")) {
    return "CLIN";
  }
  return "CLIN";
}

function isPatientRoute(pathname: string | null): boolean {
  return Boolean(pathname?.includes("/ins/patient"));
}

/** Short product-specific clause (optional nuance after the required FDA paragraph). */
function productClause(product: ArkaProduct): string {
  switch (product) {
    case "INS":
      return "INS emphasizes prior authorization, coverage, and cost transparency workflows.";
    case "ED":
      return "ED emphasizes time-critical emergency imaging decisions.";
    case "CLIN":
    default:
      return "CLIN emphasizes imaging appropriateness at order entry.";
  }
}

const REGULATORY_LINK_CLASS =
  "shrink-0 font-medium text-blue-800 underline decoration-blue-600/80 underline-offset-2 hover:text-blue-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-cyan focus-visible:ring-offset-1";

/**
 * Thin FDA non-device CDS strip for global layout (21st Century Cures Act). Not dismissible.
 * Links to regulatory rationale and model card documentation.
 */
export function FDANonDeviceBanner({ className, product: productProp, variant: variantProp }: FDANonDeviceBannerProps) {
  const pathname = usePathname();

  const product = productProp ?? inferProduct(pathname);
  const variant = variantProp ?? (isPatientRoute(pathname) ? "patient" : "default");

  const coreFda =
    "ARKA Clinical Decision Support is designed to meet all four criteria for Non-Device CDS under FD&C Act §520(o)(1)(E) and FDA's September 2022 final guidance on Clinical Decision Support Software. Recommendations support, not replace, the clinician's judgment. Every recommendation is anchored in a published guideline or peer-reviewed source, with the basis available for independent review.";

  const body =
    variant === "patient" ?
      <>
        This site provides cost and planning information to support your decisions; it does not replace advice from your
        care team. {productClause(product)}
      </>
    : (
        <>
          {coreFda} {productClause(product)}
        </>
      );

  return (
    <div
      role="region"
      aria-label="FDA non-device clinical decision support notice"
      className={cn(
        "flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b px-4 py-2 text-left text-xs leading-snug text-slate-800 sm:text-sm",
        className,
      )}
      style={{
        backgroundColor: "#EFF6FF",
        borderBottomColor: "#BFDBFE",
      }}
    >
      <p className="min-w-0 flex-1">{body}</p>
      <div className="flex shrink-0 flex-wrap items-center gap-3">
        <Link href="/docs/regulatory-rationale" className={REGULATORY_LINK_CLASS}>
          Read the regulatory rationale ↗
        </Link>
        <Link href="/docs/model-card" className={REGULATORY_LINK_CLASS}>
          Review the model card ↗
        </Link>
      </div>
    </div>
  );
}
