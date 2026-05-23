import type { FHIRClient } from "@/lib/fhir/client";
import { dicomBufferToWebp } from "@/lib/viewer/dicom-to-webp";

interface ImagingStudySeries {
  instance?: Array<{ uid?: string }>;
  endpoint?: Array<{ reference?: string }>;
}

interface ImagingStudyLike {
  series?: ImagingStudySeries[];
  endpoint?: Array<{ reference?: string }>;
}

/**
 * Resolves a DICOM byte buffer for an imaging study via FHIR Binary / WADO endpoint.
 *
 * @param client - Authenticated FHIR client.
 * @param imagingStudyId - ImagingStudy logical id.
 */
export async function fetchStudyDicomBuffer(
  client: FHIRClient,
  imagingStudyId: string,
): Promise<{ data: Buffer | null; error: string | null }> {
  const { data: study, error } = await client.readImagingStudy(imagingStudyId);
  if (error || !study) {
    return { data: null, error: error?.code ?? "imaging_study_unavailable" };
  }

  const refs: string[] = [];
  const typed = study as ImagingStudyLike;
  for (const ep of typed.endpoint ?? []) {
    if (ep.reference) {
      refs.push(ep.reference);
    }
  }
  for (const series of typed.series ?? []) {
    for (const ep of series.endpoint ?? []) {
      if (ep.reference) {
        refs.push(ep.reference);
      }
    }
    const uid = series.instance?.[0]?.uid;
    if (uid) {
      refs.push(`studies/${uid}`);
    }
  }

  for (const ref of refs) {
    const path = ref.startsWith("Binary/") ? ref : ref;
    const { data: buf, error: binErr } = await client.fetchBinary(path);
    if (buf && buf.length > 0) {
      return { data: buf, error: null };
    }
    if (binErr) {
      continue;
    }
  }

  return { data: null, error: "no_dicom_endpoint" };
}

/**
 * Produces a WebP thumbnail for a study, using FHIR when available else a neutral placeholder.
 */
export async function resolveStudyWebpThumbnail(
  client: FHIRClient | null,
  imagingStudyId: string,
): Promise<Buffer> {
  if (client) {
    const { data: dicom } = await fetchStudyDicomBuffer(client, imagingStudyId);
    if (dicom) {
      return dicomBufferToWebp(dicom);
    }
  }
  return dicomBufferToWebp(Buffer.alloc(0));
}
