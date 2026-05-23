/** Federated aggregate query kinds supported by the coordinator gateway. */
export type FederatedQueryKind = "mean" | "count" | "rate";

/** Column-level filter for institution-local aggregation (no row payloads leave the site). */
export type FederatedFilter = {
  cpt?: string;
};

/** Coordinator request for a cross-institution aggregate. */
export type FederatedQuery = {
  kind: FederatedQueryKind;
  column: string;
  filter?: FederatedFilter;
  epsilon: number;
};

/** Coordinator response with differentially private or securely aggregated value. */
export type FederatedResult = {
  value: number;
  noiseStdDev: number;
  /** Present for count/rate queries only. */
  institutions?: number;
};

/** Masked partial sum returned from an institution agg endpoint. */
export type MaskedAggRequest = {
  queryId: string;
  roundId: string;
  kind: "mean";
  column: string;
  filter?: FederatedFilter;
  maskedSum: number;
  maskedCount: number;
};

export type MaskedAggResponse = {
  maskedSum: number;
  maskedCount: number;
};

/** De-identified lake row shape used for local institution aggregation stubs. */
export type FederatedLakeRow = {
  cpt?: string | null;
  appropriateness?: number | null;
  denial_risk?: number | null;
  prior_imaging_within_30d?: boolean;
};
