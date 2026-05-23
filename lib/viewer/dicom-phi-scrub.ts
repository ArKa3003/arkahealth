import dicomParser from "dicom-parser";

/** DICOM tags commonly carrying PHI (group 0010 and related). */
const PHI_ELEMENT_PREFIXES = ["x0010", "x00080050", "x00080080", "x00080090", "x00081040", "x00081050"];

/**
 * Zeroes PHI-bearing DICOM element payloads in-place on a copy of the buffer.
 *
 * @param input - Raw DICOM Part 10 byte buffer.
 * @returns Scrubbed buffer safe for downstream pixel extraction.
 */
export function scrubDicomPhiBuffer(input: Buffer): Buffer {
  const out = Buffer.from(input);
  try {
    const byteArray = new Uint8Array(out.buffer, out.byteOffset, out.byteLength);
    const dataSet = dicomParser.parseDicom(byteArray);
    for (const tag of Object.keys(dataSet.elements)) {
      const isPhi = PHI_ELEMENT_PREFIXES.some((prefix) => tag.startsWith(prefix));
      if (!isPhi) {
        continue;
      }
      const el = dataSet.elements[tag];
      if (!el || el.length <= 0) {
        continue;
      }
      out.fill(0x20, el.dataOffset, el.dataOffset + el.length);
    }
  } catch {
    return out;
  }
  return out;
}

/**
 * Returns true when a byte buffer still contains a literal ASCII PHI needle.
 *
 * @param buffer - Response or intermediate buffer.
 * @param needle - Case-sensitive substring to forbid (e.g. burned-in test name).
 */
export function bufferContainsAsciiNeedle(buffer: Buffer, needle: string): boolean {
  if (!needle) {
    return false;
  }
  return buffer.indexOf(needle, 0, "ascii") >= 0;
}
