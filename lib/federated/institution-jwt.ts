import { createHmac, timingSafeEqual } from "node:crypto";

import type { AIIELibError } from "@/lib/types/aiie";

const JWT_PARTS = 3;

type FederatedJwtClaims = {
  institution_id: string;
  aud: string;
  exp: number;
};

/**
 * Signs an HS256 JWT for an institution federated agg endpoint.
 *
 * @param institutionId - Institution tenant id.
 * @param ttlSeconds - Token lifetime in seconds (default 300).
 */
export function signInstitutionFederatedJwt(
  institutionId: string,
  ttlSeconds = 300,
): { data: string | null; error: AIIELibError | null } {
  const secret = federatedJwtSecret();
  if (!secret) {
    return {
      data: null,
      error: {
        code: "MISSING_FEDERATED_JWT_SECRET",
        message: "ARKA_FEDERATED_JWT_SECRET must be set to sign institution tokens.",
      },
    };
  }
  const header = base64UrlJson({ alg: "HS256", typ: "JWT" });
  const payload = base64UrlJson({
    institution_id: institutionId,
    aud: "arka-federated-agg",
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  });
  const signingInput = `${header}.${payload}`;
  const sig = createHmac("sha256", secret).update(signingInput).digest("base64url");
  return { data: `${signingInput}.${sig}`, error: null };
}

/**
 * Verifies an institution JWT and returns claims when valid.
 *
 * @param token - Bearer token (JWT).
 */
export function verifyInstitutionFederatedJwt(token: string): {
  data: FederatedJwtClaims | null;
  error: AIIELibError | null;
} {
  const secret = federatedJwtSecret();
  if (!secret) {
    return {
      data: null,
      error: {
        code: "MISSING_FEDERATED_JWT_SECRET",
        message: "ARKA_FEDERATED_JWT_SECRET must be set to verify institution tokens.",
      },
    };
  }
  const parts = token.trim().split(".");
  if (parts.length !== JWT_PARTS) {
    return { data: null, error: { code: "INVALID_JWT", message: "Malformed JWT." } };
  }
  const [headerB64, payloadB64, sigB64] = parts;
  const signingInput = `${headerB64}.${payloadB64}`;
  const expected = createHmac("sha256", secret).update(signingInput).digest("base64url");
  try {
    const a = Buffer.from(sigB64 ?? "");
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return { data: null, error: { code: "INVALID_JWT", message: "Invalid signature." } };
    }
  } catch {
    return { data: null, error: { code: "INVALID_JWT", message: "Invalid signature." } };
  }
  let claims: FederatedJwtClaims;
  try {
    claims = JSON.parse(
      Buffer.from(payloadB64 ?? "", "base64url").toString("utf8"),
    ) as FederatedJwtClaims;
  } catch {
    return { data: null, error: { code: "INVALID_JWT", message: "Invalid payload." } };
  }
  if (claims.aud !== "arka-federated-agg") {
    return { data: null, error: { code: "INVALID_JWT", message: "Invalid audience." } };
  }
  if (!claims.institution_id?.trim()) {
    return { data: null, error: { code: "INVALID_JWT", message: "Missing institution_id." } };
  }
  if (typeof claims.exp !== "number" || claims.exp < Math.floor(Date.now() / 1000)) {
    return { data: null, error: { code: "JWT_EXPIRED", message: "Token expired." } };
  }
  return { data: claims, error: null };
}

function federatedJwtSecret(): string | null {
  const s = process.env.ARKA_FEDERATED_JWT_SECRET?.trim();
  return s && s.length >= 16 ? s : null;
}

function base64UrlJson(obj: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(obj), "utf8").toString("base64url");
}
