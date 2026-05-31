"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  type ArkaProduct,
  type FdaNoticeVariant,
  getFdaNoticeParagraph,
  inferProductFromPathname,
  isPatientFdaRoute,
} from "@/lib/compliance/fda-notice-copy";
import { cn } from "@/lib/utils";

export type { ArkaProduct };

export interface FDANonDeviceBannerProps {
  className?: string;
  /** When set, overrides pathname-based detection. */
  product?: ArkaProduct;
  /** Patient-friendly copy for cost / education routes. */
  variant?: FdaNoticeVariant;
}

const REGULATORY_LINK_CLASS =
  "shrink-0 font-medium text-blue-800 underline decoration-blue-600/80 underline-offset-2 hover:text-blue-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-cyan focus-visible:ring-offset-1";

/**
 * Inline FDA non-device CDS strip for embedded surfaces (drawers, product pages). Not dismissible.
 * Site-wide first visit uses {@link FDAAcknowledgmentModal} instead of a top banner.
 */
export function FDANonDeviceBanner({ className, product: productProp, variant: variantProp }: FDANonDeviceBannerProps) {
  const pathname = usePathname();

  const product = productProp ?? inferProductFromPathname(pathname);
  const variant = variantProp ?? (isPatientFdaRoute(pathname) ? "patient" : "default");
  const body = getFdaNoticeParagraph(product, variant);

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
