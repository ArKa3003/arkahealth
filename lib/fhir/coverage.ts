import type { FHIRCoding, FHIRCodeableConcept, FHIRQuantity, Coverage } from "@/lib/types/fhir";

const HDHP_DEDUCTIBLE_USD_THRESHOLD = 1600;

/**
 * Structured payer and benefit view derived from a FHIR `Coverage` resource.
 */
export interface ParsedCoverage {
  /** Logical id of the payor when resolvable from `payor[0].reference`. */
  payerId?: string;
  /** Display label for the payor when present. */
  payerName?: string;
  /** Plan identifier from `Coverage.class` when available. */
  planId?: string;
  /** Plan name from `Coverage.class` when available. */
  planName?: string;
  /** Member identifier when available (`subscriberId` or subscriber identifier). */
  memberId?: string;
  /** Group identifier from `Coverage.class` when available. */
  groupId?: string;
  /** Annual deductible amount in USD when inferable. */
  deductible?: number;
  /** Remaining deductible in USD when inferable. */
  deductibleRemaining?: number;
  /** Out-of-pocket maximum in USD when inferable. */
  outOfPocketMax?: number;
  /** Remaining out-of-pocket amount in USD when inferable. */
  outOfPocketRemaining?: number;
  /** Coinsurance percentage (0–100) when inferable. */
  coinsurancePct?: number;
  /** Copay amount for imaging-related benefit rows when inferable (USD). */
  copayImaging?: number;
  /** Network tier label when `Coverage.network` or class name is present. */
  networkTier?: string;
  /**
   * Heuristic confidence score in the range 0–1 based on how many high-value fields
   * could be populated from the source resource.
   */
  confidence: number;
}

function conceptText(c?: FHIRCodeableConcept): string {
  if (!c) {
    return "";
  }
  const parts: string[] = [];
  if (c.text) {
    parts.push(c.text.toLowerCase());
  }
  for (const coding of c.coding ?? []) {
    if (coding.display) {
      parts.push(coding.display.toLowerCase());
    }
    if (coding.code) {
      parts.push(coding.code.toLowerCase());
    }
  }
  return parts.join(" ");
}

function matchesCostKind(text: string, kinds: string[]): boolean {
  return kinds.some((k) => text.includes(k));
}

function moneyValue(valueMoney?: { value?: number; currency?: string }): number | undefined {
  if (valueMoney?.value == null || Number.isNaN(valueMoney.value)) {
    return undefined;
  }
  const cur = valueMoney.currency?.toUpperCase();
  if (cur && cur !== "USD") {
    return undefined;
  }
  return valueMoney.value;
}

function quantityNumber(q?: FHIRQuantity): number | undefined {
  if (q?.value == null || Number.isNaN(q.value)) {
    return undefined;
  }
  return q.value;
}

function coinsurancePercent(q?: FHIRQuantity): number | undefined {
  const v = quantityNumber(q);
  if (v == null || !q) {
    return undefined;
  }
  const unit = (q.unit ?? q.code ?? "").toString().toLowerCase();
  if (unit === "%" || unit === "percent" || unit === "percentage") {
    return v;
  }
  if (v >= 0 && v <= 1) {
    return v * 100;
  }
  if (v > 1 && v <= 100) {
    return v;
  }
  return undefined;
}

function pickClassValue(
  coverage: Coverage,
  predicate: (coding: FHIRCoding | undefined, name: string | undefined) => boolean,
): { value?: string; name?: string } | undefined {
  for (const cls of coverage.class ?? []) {
    const name = cls.name?.toLowerCase() ?? "";
    const codings = cls.type?.coding ?? [];
    const primary = codings[0];
    if (predicate(primary, name)) {
      return { value: cls.value, name: cls.name };
    }
    for (const c of codings) {
      if (predicate(c, name)) {
        return { value: cls.value, name: cls.name };
      }
    }
  }
  return undefined;
}

function referenceTail(ref?: { reference?: string }): string | undefined {
  const r = ref?.reference?.trim();
  if (!r) {
    return undefined;
  }
  const idx = r.lastIndexOf("/");
  return idx >= 0 ? r.slice(idx + 1) : r;
}

function parseFinancials(coverage: Coverage): Pick<
  ParsedCoverage,
  | "deductible"
  | "deductibleRemaining"
  | "outOfPocketMax"
  | "outOfPocketRemaining"
  | "coinsurancePct"
  | "copayImaging"
> {
  let deductible: number | undefined;
  let deductibleRemaining: number | undefined;
  let outOfPocketMax: number | undefined;
  let outOfPocketRemaining: number | undefined;
  let coinsurancePct: number | undefined;
  let copayImaging: number | undefined;

  for (const row of coverage.costToBeneficiary ?? []) {
    const label = conceptText(row.type);
    const money = moneyValue(row.valueMoney);
    const pct = coinsurancePercent(row.valueQuantity);

    if (matchesCostKind(label, ["deduct", "deductible"])) {
      deductible = money ?? deductible;
    }
    if (matchesCostKind(label, ["deduct", "deductible"]) && label.includes("remain")) {
      deductibleRemaining = money ?? deductibleRemaining;
    }
    if (matchesCostKind(label, ["out of pocket", "out-of-pocket", "stop", "moop", "oop"])) {
      if (label.includes("max") || label.includes("limit") || label.includes("maximum")) {
        outOfPocketMax = money ?? outOfPocketMax;
      } else if (label.includes("remain")) {
        outOfPocketRemaining = money ?? outOfPocketRemaining;
      } else {
        outOfPocketMax = money ?? outOfPocketMax;
      }
    }
    if (matchesCostKind(label, ["coinsurance", "coinsur"])) {
      coinsurancePct = pct ?? coinsurancePct;
    }
    if (matchesCostKind(label, ["copay", "co-pay", "co pay"])) {
      if (label.includes("imag") || label.includes("radiology") || label.includes("advanced")) {
        copayImaging = money ?? copayImaging;
      }
    }
  }

  return {
    deductible,
    deductibleRemaining,
    outOfPocketMax,
    outOfPocketRemaining,
    coinsurancePct,
    copayImaging,
  };
}

function confidenceScore(parsed: ParsedCoverage, coverage: Coverage): number {
  let score = 0;
  const weights: Array<[keyof ParsedCoverage, number]> = [
    ["payerId", 0.15],
    ["payerName", 0.1],
    ["planId", 0.1],
    ["planName", 0.08],
    ["memberId", 0.12],
    ["groupId", 0.08],
    ["deductible", 0.1],
    ["deductibleRemaining", 0.05],
    ["outOfPocketMax", 0.07],
    ["outOfPocketRemaining", 0.05],
    ["coinsurancePct", 0.05],
    ["copayImaging", 0.03],
    ["networkTier", 0.02],
  ];
  for (const [k, w] of weights) {
    const v = parsed[k];
    if (v != null && v !== "") {
      score += w;
    }
  }
  if (coverage.status === "active") {
    score += 0.05;
  }
  return Math.min(1, Math.round(score * 1000) / 1000);
}

/**
 * Extracts payer, plan, member, and financial fields from a FHIR `Coverage` resource.
 */
export function parseCoverage(coverage: Coverage): ParsedCoverage {
  const pay0 = coverage.payor?.[0];
  let payerId: string | undefined;
  if (pay0?.reference?.includes("/")) {
    payerId = pay0.reference.split("/").pop();
  } else if (pay0?.reference) {
    payerId = pay0.reference;
  }
  const payerName = pay0?.display;

  const planRow =
    pickClassValue(coverage, (coding) => (coding?.code?.toLowerCase() ?? "") === "plan") ??
    pickClassValue(coverage, (_coding, name) => (name ?? "").includes("plan"));

  const groupRow = pickClassValue(coverage, (coding) => {
    const code = coding?.code?.toLowerCase() ?? "";
    return code === "group";
  });

  const memberId =
    coverage.subscriberId?.trim() ||
    referenceTail(coverage.subscriber) ||
    referenceTail(coverage.beneficiary);

  const financial = parseFinancials(coverage);

  const parsed: ParsedCoverage = {
    payerId,
    payerName,
    planId: planRow?.value,
    planName: planRow?.name ?? planRow?.value,
    memberId,
    groupId: groupRow?.value,
    networkTier: coverage.network,
    confidence: 0,
    ...financial,
  };

  parsed.confidence = confidenceScore(parsed, coverage);
  return parsed;
}

/**
 * Returns true when the plan deductible meets or exceeds the IRS HDHP minimum threshold (USD).
 */
export function isHighDeductiblePlan(coverage: Coverage): boolean {
  const { deductible } = parseCoverage(coverage);
  if (deductible == null) {
    return false;
  }
  return deductible >= HDHP_DEDUCTIBLE_USD_THRESHOLD;
}
