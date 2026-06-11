"use client";

import { ComplianceBar, type ComplianceBarProps } from "@/components/shared/ComplianceBar";

export type { ArkaProduct } from "@/lib/compliance/fda-notice-copy";

export interface FDANonDeviceBannerProps extends Omit<ComplianceBarProps, "mode"> {
  className?: string;
}

/**
 * @deprecated Use {@link ComplianceBar} — retained for embedded surfaces during migration.
 */
export function FDANonDeviceBanner({ className, ...props }: FDANonDeviceBannerProps) {
  return <ComplianceBar mode="embedded" className={className} {...props} />;
}
