import type { FederatedFilter, FederatedLakeRow, FederatedQueryKind } from "@/lib/federated/types";

/**
 * Filters institution-local lake rows for a federated query.
 *
 * @param rows - Institution-local de-identified rows.
 * @param filter - Optional CPT filter.
 */
export function filterLakeRows(
  rows: FederatedLakeRow[],
  filter?: FederatedFilter,
): FederatedLakeRow[] {
  if (!filter?.cpt) {
    return rows;
  }
  const cpt = filter.cpt.trim();
  return rows.filter((r) => (r.cpt ?? "").trim() === cpt);
}

/**
 * Computes local sum and count for a numeric column mean.
 *
 * @param rows - Filtered institution rows.
 * @param column - Numeric column name.
 */
export function localMeanParts(
  rows: FederatedLakeRow[],
  column: string,
): { sum: number; count: number } {
  let sum = 0;
  let count = 0;
  for (const row of rows) {
    const v = readNumericColumn(row, column);
    if (v === null) {
      continue;
    }
    sum += v;
    count += 1;
  }
  return { sum, count };
}

/**
 * Computes a local count or boolean rate numerator/denominator.
 *
 * @param rows - Filtered institution rows.
 * @param kind - `count` or `rate`.
 * @param column - Column to count or treat as boolean numerator.
 */
export function localCountOrRate(
  rows: FederatedLakeRow[],
  kind: Extract<FederatedQueryKind, "count" | "rate">,
  column: string,
): number {
  if (kind === "count") {
    if (column === "*") {
      return rows.length;
    }
    return rows.filter((r) => readBooleanColumn(r, column) === true).length;
  }
  const denom = rows.length;
  if (denom === 0) {
    return 0;
  }
  const numer = rows.filter((r) => readBooleanColumn(r, column) === true).length;
  return numer / denom;
}

function readNumericColumn(row: FederatedLakeRow, column: string): number | null {
  if (column === "appropriateness") {
    return row.appropriateness ?? null;
  }
  if (column === "denial_risk") {
    return row.denial_risk ?? null;
  }
  return null;
}

function readBooleanColumn(row: FederatedLakeRow, column: string): boolean | null {
  if (column === "prior_imaging_within_30d") {
    return row.prior_imaging_within_30d ?? null;
  }
  return null;
}
