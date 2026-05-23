import {
  filterLakeRows,
  localMeanParts,
} from "@/lib/federated/local-aggregate";
import { verifyInstitutionFederatedJwt } from "@/lib/federated/institution-jwt";
import type {
  FederatedLakeRow,
  MaskedAggRequest,
  MaskedAggResponse,
} from "@/lib/federated/types";
import type { AIIELibError } from "@/lib/types/aiie";

export type InstitutionAggContext = {
  institutionId: string;
  rows: FederatedLakeRow[];
};

/**
 * Applies an institution-local aggregate to a masked mean request.
 * Never returns row-level data — only masked partial sums.
 *
 * @param ctx - Institution identity and local lake slice.
 * @param body - Masked aggregation round payload.
 * @param bearerToken - Institution JWT.
 */
export function handleMaskedAggRequest(
  ctx: InstitutionAggContext,
  body: MaskedAggRequest,
  bearerToken: string | null,
): { data: MaskedAggResponse | null; error: AIIELibError | null } {
  if (!bearerToken) {
    return { data: null, error: { code: "UNAUTHORIZED", message: "Missing Bearer token." } };
  }
  const { data: claims, error: jwtErr } = verifyInstitutionFederatedJwt(bearerToken);
  if (jwtErr || !claims) {
    return { data: null, error: jwtErr ?? { code: "UNAUTHORIZED", message: "Invalid token." } };
  }
  if (claims.institution_id !== ctx.institutionId) {
    return {
      data: null,
      error: { code: "INSTITUTION_MISMATCH", message: "JWT institution does not match site." },
    };
  }
  if (body.kind !== "mean") {
    return { data: null, error: { code: "INVALID_KIND", message: "Only mean aggregation is supported." } };
  }
  const filtered = filterLakeRows(ctx.rows, body.filter);
  const { sum, count } = localMeanParts(filtered, body.column);
  return {
    data: {
      maskedSum: body.maskedSum + sum,
      maskedCount: body.maskedCount + count,
    },
    error: null,
  };
}
