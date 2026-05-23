import { beforeEach, describe, expect, it } from "vitest";

import { MAX_EPSILON_PER_CPT_PER_WEEK } from "@/lib/federated/constants";
import type { EpsilonLedgerStore } from "@/lib/federated/epsilon-ledger";
import { laplaceNoiseStdDev } from "@/lib/federated/laplace";
import {
  askFederatedQuery,
  federatedMeanGroundTruth,
  type InstitutionFederatedSite,
} from "@/lib/federated/query-gateway";

const CPT = "72141";
const EPS = 0.5;

const THREE_SITES: InstitutionFederatedSite[] = [
  {
    institutionId: "inst-alpha",
    rows: [
      { cpt: CPT, appropriateness: 72 },
      { cpt: CPT, appropriateness: 88 },
      { cpt: "70551", appropriateness: 40 },
    ],
  },
  {
    institutionId: "inst-beta",
    rows: [
      { cpt: CPT, appropriateness: 65 },
      { cpt: CPT, appropriateness: 75 },
    ],
  },
  {
    institutionId: "inst-gamma",
    rows: [
      { cpt: CPT, appropriateness: 90 },
      { cpt: CPT, appropriateness: 80 },
      { cpt: CPT, appropriateness: 70 },
    ],
  },
];

describe("askFederatedQuery", () => {
  beforeEach(() => {
    process.env.ARKA_FEDERATED_JWT_SECRET = "test-federated-jwt-secret-32chars";
  });

  it("returns federated mean(appropriateness) within zero noise of ground truth (3 institutions)", async () => {
    const query = {
      kind: "mean" as const,
      column: "appropriateness",
      filter: { cpt: CPT },
      epsilon: EPS,
    };
    const truth = federatedMeanGroundTruth(query, THREE_SITES);

    const { data, error, status } = await askFederatedQuery(query, {
      institutions: THREE_SITES,
      epsilonLedger: { entries: [] },
    });

    expect(status).toBeUndefined();
    expect(error).toBeNull();
    expect(data).not.toBeNull();
    expect(data!.noiseStdDev).toBe(0);
    expect(data!.value).toBeCloseTo(truth, 5);
    expect(truth).toBeCloseTo(540 / 7, 5);
  });

  it("adds Laplace noise to count queries and reports noiseStdDev", async () => {
    const { data, error } = await askFederatedQuery(
      {
        kind: "count",
        column: "*",
        filter: { cpt: CPT },
        epsilon: 1,
      },
      { institutions: THREE_SITES, epsilonLedger: { entries: [] } },
    );

    expect(error).toBeNull();
    expect(data!.institutions).toBe(3);
    expect(data!.noiseStdDev).toBeCloseTo(laplaceNoiseStdDev(1), 6);
    expect(Math.abs(data!.value - 7)).toBeLessThan(8);
  });

  it("returns 429 when epsilon budget for CPT is exceeded", async () => {
    const ledger: EpsilonLedgerStore = {
      entries: [{ cpt: CPT, epsilon: MAX_EPSILON_PER_CPT_PER_WEEK - 0.1, at: Date.now() }],
    };

    const { data, error, status } = await askFederatedQuery(
      {
        kind: "count",
        column: "*",
        filter: { cpt: CPT },
        epsilon: 0.5,
      },
      { institutions: THREE_SITES, epsilonLedger: ledger },
    );

    expect(data).toBeNull();
    expect(status).toBe(429);
    expect(error?.code).toBe("EPSILON_BUDGET_EXCEEDED");
  });
});
