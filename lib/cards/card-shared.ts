import type { CDSCardSource } from "@/lib/types/cds-hooks";

/** CDS source attribution for ARKA-INS builder cards. */
export const ARKA_INS_CARD_SOURCE: CDSCardSource = {
  label: "ARKA-INS (AIIE v2.0)",
  url: "https://arkahealth.com/ins/aiie",
};

/** Public site origin for absolute links inside CDS cards. */
export const ARKA_PUBLIC_SITE_ORIGIN = "https://arkahealth.com";

import { FDA_NON_DEVICE_CDS_DISCLOSURE } from "@/lib/compliance/fda-disclosure";

const FDA_DETAIL_FOOTER = `\n\n---\n*${FDA_NON_DEVICE_CDS_DISCLOSURE}*`;

/**
 * Appends the required FDA non-device CDS disclaimer to card detail markdown.
 *
 * @param detail - Markdown body shown before the disclaimer.
 * @returns Detail string including the disclaimer block.
 */
export function appendFdaDetailDisclaimer(detail: string): string {
  const t = detail.trim();
  if (!t) {
    return FDA_DETAIL_FOOTER.trim();
  }
  return `${t}${FDA_DETAIL_FOOTER}`;
}

/**
 * Formats a USD amount for CDS card copy.
 *
 * @param n - Amount in dollars.
 * @returns Locale-formatted currency string.
 */
export function formatUsd(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

/**
 * Returns a placeholder CDS create action for suggestions that only drive UI workflows.
 */
export function noopSuggestionActions() {
  return [{ type: "create" as const, description: "Record clinician selection in the EHR workflow." }];
}
