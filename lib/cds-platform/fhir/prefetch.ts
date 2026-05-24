/**
 * @file prefetch.ts
 * @description CDS Hooks prefetch template system. Defines FHIR queries, resolves templates
 *   from hook context, fetches in parallel, validates (patient required), and caches results.
 */

import pino from 'pino';
import type { FHIRClient } from './client';
import type {
  FHIRPatient,
  FHIRCondition,
  FHIRServiceRequest,
  FHIRImagingStudy,
  FHIRObservation,
  FHIRMedicationRequest,
  FHIRBundle,
} from './resources';
import type { CdsHooksContext } from '../cds-hooks/types';

// -----------------------------------------------------------------------------
// Logger
// -----------------------------------------------------------------------------

const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  ...(process.env.NODE_ENV !== 'production' && {
    transport: { target: 'pino-pretty', options: { colorize: true } },
  }),
});

// -----------------------------------------------------------------------------
// PREFETCH_TEMPLATES
// -----------------------------------------------------------------------------

/** FHIR query templates keyed by prefetch key. Use {{context.patientId}} for substitution. */
export const PREFETCH_TEMPLATES = {
  patient: 'Patient/{{context.patientId}}',
  activeConditions:
    'Condition?patient={{context.patientId}}&clinical-status=active',
  recentImaging:
    'ImagingStudy?subject={{context.patientId}}&_sort=-started&_count=20',
  relevantLabs:
    'Observation?subject={{context.patientId}}&code=69405-9,2160-0,3094-0,2106-3,80384-1&_sort=-date&_count=10',
  activeMedications:
    'MedicationRequest?subject={{context.patientId}}&status=active',
  priorServiceRequests:
    'ServiceRequest?subject={{context.patientId}}&status=completed&category=363679005&_sort=-authored&_count=20',
} as const;

export type PrefetchKey = keyof typeof PREFETCH_TEMPLATES;

/** Returns prefetch templates for discovery (key → template string). */
export function getPrefetchTemplates(): Record<string, string> {
  return { ...PREFETCH_TEMPLATES };
}

// -----------------------------------------------------------------------------
// PrefetchData
// -----------------------------------------------------------------------------

export interface PrefetchData {
  patient: FHIRPatient;
  activeConditions: FHIRBundle<FHIRCondition>;
  recentImaging: FHIRBundle<FHIRImagingStudy>;
  relevantLabs: FHIRBundle<FHIRObservation>;
  activeMedications: FHIRBundle<FHIRMedicationRequest>;
  priorServiceRequests: FHIRBundle<FHIRServiceRequest>;
}

// -----------------------------------------------------------------------------
// Template resolution (replace {{context.*}} tokens)
// -----------------------------------------------------------------------------

function substituteTemplate(template: string, context: CdsHooksContext): string {
  return template.replace(/\{\{context\.(\w+)\}\}/g, (_, key) => {
    const value = context[key];
    return typeof value === 'string' ? value : '';
  });
}

/** Resolve all templates to FHIR paths for the given context. */
function resolveTemplatesToPaths(context: CdsHooksContext): Record<PrefetchKey, string> {
  const out = {} as Record<PrefetchKey, string>;
  for (const key of Object.keys(PREFETCH_TEMPLATES) as PrefetchKey[]) {
    out[key] = substituteTemplate(PREFETCH_TEMPLATES[key], context);
  }
  return out;
}

// -----------------------------------------------------------------------------
// Cache: 5 minutes per patient, key = patientId + timestamp bucket
// -----------------------------------------------------------------------------

const CACHE_TTL_MS = 5 * 60 * 1000;
const BUCKET_MS = 60 * 1000; // 1-minute buckets so cache key is stable within a minute

function cacheKey(patientId: string): string {
  const bucket = Math.floor(Date.now() / BUCKET_MS) * BUCKET_MS;
  return `${patientId}:${bucket}`;
}

// -----------------------------------------------------------------------------
// PrefetchResolver
// -----------------------------------------------------------------------------

export class PrefetchResolver {
  private readonly fhirClient: FHIRClient;
  private readonly cache = new Map<string, { data: PrefetchData; expires: number }>();

  constructor(fhirClient: FHIRClient) {
    this.fhirClient = fhirClient;
  }

  /**
   * Resolve all prefetch templates with context, execute FHIR queries in parallel,
   * validate (patient required), log warnings for failures, return partial data on non-fatal failures.
   */
  async resolveTemplates(context: CdsHooksContext): Promise<PrefetchData> {
    const patientId = context.patientId;
    if (patientId) {
      const key = cacheKey(patientId);
      const entry = this.cache.get(key);
      if (entry && Date.now() < entry.expires) {
        return entry.data;
      }
    }

    const paths = resolveTemplatesToPaths(context);
    const keys = Object.keys(paths) as PrefetchKey[];

    const results = await Promise.allSettled(
      keys.map((k) => this.fhirClient.getByPath(paths[k]))
    );

    const partial: Partial<PrefetchData> = {};
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const result = results[i];
      if (result.status === 'fulfilled') {
        (partial as Record<PrefetchKey, PrefetchData[PrefetchKey]>)[key] = result.value as PrefetchData[PrefetchKey];
      } else {
        logger.warn(
          { key, err: result.reason?.message ?? result.reason },
          'Prefetch query failed'
        );
      }
    }

    if (!partial.patient || (partial.patient as { resourceType?: string })?.resourceType !== 'Patient') {
      logger.warn('Prefetch: patient resource missing or invalid');
      throw new Error('Patient resource is required and could not be fetched');
    }

    const data: PrefetchData = {
      patient: partial.patient as FHIRPatient,
      activeConditions:
        (partial.activeConditions as PrefetchData['activeConditions']) ?? emptyBundle(),
      recentImaging:
        (partial.recentImaging as PrefetchData['recentImaging']) ?? emptyBundle(),
      relevantLabs:
        (partial.relevantLabs as PrefetchData['relevantLabs']) ?? emptyBundle(),
      activeMedications:
        (partial.activeMedications as PrefetchData['activeMedications']) ?? emptyBundle(),
      priorServiceRequests:
        (partial.priorServiceRequests as PrefetchData['priorServiceRequests']) ?? emptyBundle(),
    };

    if (patientId) {
      this.cache.set(cacheKey(patientId), {
        data,
        expires: Date.now() + CACHE_TTL_MS,
      });
    }

    return data;
  }

  /**
   * For each missing prefetch key, fetch from FHIR and merge with existing prefetch.
   * Handles partial prefetch from the EHR.
   */
  async resolveMissing(
    prefetch: Partial<PrefetchData>,
    context: CdsHooksContext
  ): Promise<PrefetchData> {
    const paths = resolveTemplatesToPaths(context);
    const missing = (Object.keys(PREFETCH_TEMPLATES) as PrefetchKey[]).filter(
      (k) => prefetch[k] == null
    );

    if (missing.length === 0) {
      return prefetch as PrefetchData;
    }

    const results = await Promise.allSettled(
      missing.map((k) => this.fhirClient.getByPath(paths[k]))
    );

    const merged = { ...prefetch } as Partial<PrefetchData>;
    for (let i = 0; i < missing.length; i++) {
      const key = missing[i];
      const result = results[i];
      if (result.status === 'fulfilled') {
        (merged as Record<PrefetchKey, PrefetchData[PrefetchKey]>)[key] = result.value as PrefetchData[PrefetchKey];
      } else {
        logger.warn(
          { key, err: result.reason?.message ?? result.reason },
          'resolveMissing: query failed'
        );
      }
    }

    const patientId = context.patientId;
    if (!merged.patient || (merged.patient as { resourceType?: string })?.resourceType !== 'Patient') {
      if (patientId) {
        try {
          merged.patient = await this.fhirClient.getPatient(patientId);
        } catch (e) {
          logger.warn({ err: (e as Error)?.message }, 'Could not fetch patient in resolveMissing');
          throw new Error('Patient resource is required and could not be fetched');
        }
      } else {
        throw new Error('Patient resource is required and could not be fetched');
      }
    }

    const data: PrefetchData = {
      patient: merged.patient as FHIRPatient,
      activeConditions:
        (merged.activeConditions as PrefetchData['activeConditions']) ?? emptyBundle(),
      recentImaging:
        (merged.recentImaging as PrefetchData['recentImaging']) ?? emptyBundle(),
      relevantLabs:
        (merged.relevantLabs as PrefetchData['relevantLabs']) ?? emptyBundle(),
      activeMedications:
        (merged.activeMedications as PrefetchData['activeMedications']) ?? emptyBundle(),
      priorServiceRequests:
        (merged.priorServiceRequests as PrefetchData['priorServiceRequests']) ?? emptyBundle(),
    };

    if (patientId) {
      this.cache.set(cacheKey(patientId), {
        data,
        expires: Date.now() + CACHE_TTL_MS,
      });
    }

    return data;
  }

  /** Clear cache for a patient or all patients. */
  clearCache(patientId?: string): void {
    if (patientId) {
      for (const key of this.cache.keys()) {
        if (key.startsWith(`${patientId}:`)) this.cache.delete(key);
      }
    } else {
      this.cache.clear();
    }
  }
}

function emptyBundle<T>(): FHIRBundle<T> {
  return {
    resourceType: 'Bundle',
    type: 'searchset',
    total: 0,
    entry: [],
  };
}
