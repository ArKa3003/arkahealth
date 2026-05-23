import { NextResponse } from "next/server";

import { FHIRClient } from "@/lib/fhir/client";
import { resolveStudyWebpThumbnail } from "@/lib/viewer/fetch-study-dicom";
import { findImagingStudyInSnapshot, readCachedRecordSnapshot } from "@/lib/viewer/snapshot-study";
import {
  getCachedThumbnail,
  setCachedThumbnail,
} from "@/lib/viewer/thumbnail-cache";
import { withInsApiLogging } from "@/lib/server/with-ins-api-logging";

export const maxDuration = 8;

const SHA256_HEX = /^[a-f0-9]{64}$/i;

function fhirClientFromRequest(request: Request): FHIRClient | null {
  const server =
    request.headers.get("x-fhir-server")?.trim() ||
    request.headers.get("fhir-server")?.trim() ||
    process.env.ARKA_FHIR_BASE_URL?.trim();
  const auth = request.headers.get("authorization")?.trim();
  if (!server) {
    return null;
  }
  return new FHIRClient(server, auth ?? undefined);
}

/**
 * GET /api/ins/viewer/image/[studyUid] — PHI-scrubbed WebP thumbnail for reference viewer.
 * Query: `patientHash` (SHA-256). Returns 404 when study is absent from cached record snapshot.
 */
async function getViewerImage(
  request: Request,
  context: { params: Promise<{ studyUid: string }> },
): Promise<NextResponse> {
  const { studyUid } = await context.params;
  const key = studyUid?.trim();
  if (!key) {
    return NextResponse.json({ error: "studyUid is required." }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const patientHash = searchParams.get("patientHash")?.trim() ?? "";
  if (!SHA256_HEX.test(patientHash)) {
    return NextResponse.json(
      { error: "patientHash must be a SHA-256 hex digest." },
      { status: 400 },
    );
  }

  const cached = getCachedThumbnail(patientHash, key);
  if (cached) {
    return new NextResponse(new Uint8Array(cached), {
      status: 200,
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "private, max-age=300",
        "X-Arka-Viewer": "reference-non-diagnostic",
      },
    });
  }

  const { data: snapshot, error: snapErr } = await readCachedRecordSnapshot(patientHash);
  if (snapErr) {
    return NextResponse.json({ error: snapErr.message }, { status: 503 });
  }
  if (!snapshot) {
    return NextResponse.json({ error: "Record snapshot not found." }, { status: 404 });
  }

  const study = findImagingStudyInSnapshot(snapshot, key);
  if (!study) {
    return NextResponse.json(
      { error: "Study not present in record snapshot." },
      { status: 404 },
    );
  }

  const imagingId = study.id ?? key;
  const client = fhirClientFromRequest(request);
  const webp = await resolveStudyWebpThumbnail(client, imagingId);
  setCachedThumbnail(patientHash, key, webp);

  return new NextResponse(new Uint8Array(webp), {
    status: 200,
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "private, max-age=300",
      "X-Arka-Viewer": "reference-non-diagnostic",
    },
  });
}

export const GET = withInsApiLogging(getViewerImage);
