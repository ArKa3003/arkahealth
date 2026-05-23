import dicomParser from "dicom-parser";
import sharp from "sharp";

import { scrubDicomPhiBuffer } from "@/lib/viewer/dicom-phi-scrub";

const MAX_DIM = 1024;

/**
 * Extracts embedded JPEG pixel data from a scrubbed DICOM buffer when present.
 *
 * @param scrubbed - PHI-scrubbed DICOM Part 10 buffer.
 */
function extractJpegFromDicom(scrubbed: Buffer): Buffer | null {
  try {
    const byteArray = new Uint8Array(scrubbed.buffer, scrubbed.byteOffset, scrubbed.byteLength);
    const dataSet = dicomParser.parseDicom(byteArray);
    const pixelElement = dataSet.elements.x7fe00010;
    if (!pixelElement || pixelElement.length <= 0) {
      return null;
    }
    const bytes = byteArray.subarray(pixelElement.dataOffset, pixelElement.dataOffset + pixelElement.length);
    const buf = Buffer.from(bytes);
    const start = buf.indexOf(Buffer.from([0xff, 0xd8]));
    const end = buf.lastIndexOf(Buffer.from([0xff, 0xd9]));
    if (start < 0 || end < start) {
      return null;
    }
    return buf.subarray(start, end + 2);
  } catch {
    return null;
  }
}

/**
 * Neutral placeholder WebP when DICOM pixels are unavailable (demo / missing WADO).
 */
async function placeholderWebp(label: string): Promise<Buffer> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
    <rect width="100%" height="100%" fill="#1e293b"/>
    <text x="50%" y="50%" fill="#94a3b8" font-size="18" font-family="system-ui,sans-serif" text-anchor="middle">${label}</text>
  </svg>`;
  return sharp(Buffer.from(svg)).resize(MAX_DIM, MAX_DIM, { fit: "inside" }).webp({ quality: 82 }).toBuffer();
}

/**
 * Converts a DICOM buffer to a downsampled WebP thumbnail (presentational only).
 *
 * @param dicomBuffer - Raw DICOM Part 10 bytes from FHIR Binary or WADO.
 */
export async function dicomBufferToWebp(dicomBuffer: Buffer): Promise<Buffer> {
  if (dicomBuffer.length === 0) {
    return placeholderWebp("Reference preview");
  }
  const scrubbed = scrubDicomPhiBuffer(dicomBuffer);
  const jpeg = extractJpegFromDicom(scrubbed);
  if (jpeg) {
    return sharp(jpeg)
      .resize(MAX_DIM, MAX_DIM, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();
  }
  return placeholderWebp("Reference preview");
}
