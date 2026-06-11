import { describe, expect, it } from 'vitest';

import patientFixture from '@/sandbox-fixtures/ehr/patient.json';
import serviceRequestsFixture from '@/sandbox-fixtures/ehr/service-requests.json';
import { mapServiceRequestBundle, patientBannerFromFhir } from '@/lib/ehr/order-mapper';
import { scoreOrder } from '@/lib/aiie/scoring-engine';
import type {
  FHIRBundle,
  FHIRPatient,
  FHIRServiceRequest,
} from '@/lib/cds-platform/fhir/resources';

const patient = patientFixture as unknown as FHIRPatient;
const bundle = serviceRequestsFixture as unknown as FHIRBundle<FHIRServiceRequest>;

describe('EHR demo fixtures → rail pipeline', () => {
  it('builds a masked patient banner', () => {
    const banner = patientBannerFromFhir(patient);
    expect(banner.name).toContain('Rivera');
    expect(banner.mrnMasked).toBe('•••1937');
    expect(banner.mrnMasked).not.toContain('4821937');
    expect(banner.age).toBeGreaterThan(60);
  });

  it('maps all three fixture orders and scores each via the shared engine', async () => {
    const orders = mapServiceRequestBundle(bundle, patient);
    expect(orders).toHaveLength(3);

    const scored = await Promise.all(
      orders.map(async (order) => ({ order, score: await scoreOrder(order.aiieInput) })),
    );
    for (const { score } of scored) {
      expect(score.clinicalScore).toBeGreaterThanOrEqual(1);
      expect(score.clinicalScore).toBeLessThanOrEqual(9);
      expect(score.factors.length).toBeGreaterThan(0);
    }

    // The STAT CT abd/pelvis carries the EXPEDITE signal that drives the
    // one-time pulse + auto-expansion contract.
    const expedited = scored.filter(({ order }) => order.expedite);
    expect(expedited.length).toBeGreaterThanOrEqual(1);

    const alertWorthy = scored.filter(
      ({ order, score }) => score.clinicalScore <= 3 || order.expedite,
    );
    expect(alertWorthy.length).toBeGreaterThanOrEqual(1);
  });
});
