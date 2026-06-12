import type { RAASInput, RAASResult } from "@/lib/demos/rural/types";
import type { RuralExemption } from "@/lib/demos/rural/types";

type ApiResult<T> = { data: T; error: null } | { data: null; error: string };

/**
 * Evaluates RAAS via the rural API route with a typed error tuple.
 */
export async function evaluateRaasViaApi(input: RAASInput): Promise<ApiResult<RAASResult>> {
  try {
    const response = await fetch("/api/rural/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      return { data: null, error: payload?.error ?? `Evaluation failed (${response.status})` };
    }

    const data = (await response.json()) as RAASResult;
    return { data, error: null };
  } catch {
    return { data: null, error: "Network error — could not reach evaluation service." };
  }
}

/**
 * Fetches applicable rural exemptions via the API route.
 */
export async function fetchRuralExemptions(
  designations: string[],
  payers?: string[],
): Promise<ApiResult<RuralExemption[]>> {
  try {
    const params = new URLSearchParams({
      designations: designations.join(","),
    });
    if (payers?.length) {
      params.set("payers", payers.join(","));
    }

    const response = await fetch(`/api/rural/exemptions?${params.toString()}`);

    if (!response.ok) {
      return { data: null, error: `Exemption lookup failed (${response.status})` };
    }

    const payload = (await response.json()) as { exemptions: RuralExemption[] };
    return { data: payload.exemptions, error: null };
  } catch {
    return { data: null, error: "Network error — could not load exemptions." };
  }
}
