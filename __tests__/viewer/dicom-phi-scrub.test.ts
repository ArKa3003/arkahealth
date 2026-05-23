import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  bufferContainsAsciiNeedle,
  scrubDicomPhiBuffer,
} from "@/lib/viewer/dicom-phi-scrub";
import { dicomBufferToWebp } from "@/lib/viewer/dicom-to-webp";

const PATIENT_NAME = "ARRI KANNA";

function buildBufferWithNameAt(offset: number, name: string): Buffer {
  const buf = Buffer.alloc(600, 0);
  buf.write("DICM", 128, "ascii");
  buf.write(name, offset, "ascii");
  return buf;
}

const parseDicomMock = vi.fn();

vi.mock("dicom-parser", () => ({
  default: {
    parseDicom: (arr: Uint8Array) => parseDicomMock(arr),
  },
}));

describe("dicom PHI scrub", () => {
  beforeEach(() => {
    parseDicomMock.mockReset();
  });

  it("removes PatientName from scrubbed DICOM buffer", () => {
    const raw = buildBufferWithNameAt(256, PATIENT_NAME);
    expect(bufferContainsAsciiNeedle(raw, PATIENT_NAME)).toBe(true);

    parseDicomMock.mockReturnValue({
      elements: {
        x00100010: { dataOffset: 256, length: PATIENT_NAME.length },
      },
    });

    const scrubbed = scrubDicomPhiBuffer(raw);
    expect(bufferContainsAsciiNeedle(scrubbed, PATIENT_NAME)).toBe(false);
  });

  it("WebP pipeline response does not contain burned-in test name", async () => {
    const raw = buildBufferWithNameAt(256, PATIENT_NAME);
    parseDicomMock.mockImplementation((arr: Uint8Array) => {
      const buf = Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength);
      if (bufferContainsAsciiNeedle(buf, PATIENT_NAME)) {
        return {
          elements: {
            x00100010: { dataOffset: 256, length: PATIENT_NAME.length },
          },
        };
      }
      return { elements: {} };
    });

    const webp = await dicomBufferToWebp(raw);
    expect(bufferContainsAsciiNeedle(webp, PATIENT_NAME)).toBe(false);
  });
});
