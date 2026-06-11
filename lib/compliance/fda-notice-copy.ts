/**
 * Shared FDA Non-Device CDS notice copy for banners and the global acknowledgment modal.
 */

export type ArkaProduct = "CLIN" | "INS" | "ED";

export type FdaNoticeVariant = "default" | "patient";

/** localStorage key set when the user acknowledges the global FDA notice. */
export const FDA_ACKNOWLEDGMENT_STORAGE_KEY = "arka-fda-non-device-cds-acknowledged";

/**
 * Returns whether the user has acknowledged the global FDA notice in this browser.
 */
export function isFdaNoticeAcknowledged(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return localStorage.getItem(FDA_ACKNOWLEDGMENT_STORAGE_KEY) === "true";
}

/**
 * Persists global FDA notice acknowledgment for this browser.
 */
export function setFdaNoticeAcknowledged(): void {
  localStorage.setItem(FDA_ACKNOWLEDGMENT_STORAGE_KEY, "true");
}

/**
 * Infers product context from the current pathname for notice nuance.
 */
export function inferProductFromPathname(pathname: string | null): ArkaProduct {
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

/**
 * Whether the route should use patient-friendly FDA copy.
 */
export function isPatientFdaRoute(pathname: string | null): boolean {
  return Boolean(pathname?.includes("/ins/patient"));
}

/** Short product-specific clause appended to the required FDA paragraph. */
export function fdaProductClause(product: ArkaProduct): string {
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

const CORE_FDA_NOTICE =
  "ARKA Clinical Decision Support is designed to meet all four criteria for Non-Device CDS under FD&C Act §520(o)(1)(E) and FDA's January 2026 final guidance on Clinical Decision Support Software. Recommendations support, not replace, the clinician's judgment. Every recommendation is anchored in a published guideline or peer-reviewed source, with the basis available for independent review.";

/**
 * Full FDA notice paragraph for the given product and audience variant.
 */
export function getFdaNoticeParagraph(product: ArkaProduct, variant: FdaNoticeVariant = "default"): string {
  if (variant === "patient") {
    return `This site provides cost and planning information to support your decisions; it does not replace advice from your care team. ${fdaProductClause(product)}`;
  }
  return `${CORE_FDA_NOTICE} ${fdaProductClause(product)}`;
}
