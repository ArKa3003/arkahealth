"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

import { useEvidenceModalOptional } from "./evidence-modal-context";

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
  if (pathname.startsWith("/clin")) {
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

/**
 * Thin FDA non-device CDS strip for global layout (21st Century Cures Act). Not dismissible.
 * Opens the shared {@link AIIEEvidenceModal} via "Learn more".
 */
export function FDANonDeviceBanner({ className, product: productProp, variant: variantProp }: FDANonDeviceBannerProps) {
  const pathname = usePathname();
  const evidence = useEvidenceModalOptional();

  const product = productProp ?? inferProduct(pathname);
  const variant = variantProp ?? (isPatientRoute(pathname) ? "patient" : "default");

  const coreFda =
    "ARKA is an FDA Non-Device Clinical Decision Support tool under Section 520(o)(1)(E) of the FD&C Act (21st Century Cures Act). This tool provides information to support clinical decisions; it does not replace clinical judgment.";

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
      {evidence ?
        <button
          type="button"
          onClick={() => evidence.setOpen(true)}
          className="shrink-0 font-medium text-blue-800 underline decoration-blue-600/80 underline-offset-2 hover:text-blue-900"
        >
          Learn more
        </button>
      : <span className="shrink-0 text-slate-500">Learn more</span>}
    </div>
  );
}
