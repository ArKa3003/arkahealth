/**
 * Evidence system contract tests (Part 4):
 * - every evidenceSlug the Knowledge Matrix can emit resolves in the registry;
 * - every registry citation URL is well-formed https;
 * - evidenceUrl() emits first-party absolute /evidence/[slug] URLs;
 * - UI aliases and relatedSlugs resolve to canonical entries.
 */

import { describe, expect, it } from "vitest";

import { collectMatrixEvidenceSlugs } from "@/lib/evidence/matrix-slugs";
import {
  EVIDENCE_ALIASES,
  EVIDENCE_REGISTRY,
  getEvidenceEntry,
  listEvidenceEntries,
  resolveEvidenceSlug,
} from "@/lib/evidence/registry";
import { evidenceUrl } from "@/lib/evidence/url";

const EVIDENCE_URL_PATTERN = /^https?:\/\/.+\/evidence\/[a-z0-9-]+$/;

describe("evidence registry coverage", () => {
  it("resolves every matrix evidenceSlug to a registry entry", () => {
    const missing = [...collectMatrixEvidenceSlugs()].filter(
      (slug) => getEvidenceEntry(slug) === null,
    );
    expect(missing).toEqual([]);
  });

  it("keys every entry by its own slug", () => {
    for (const [key, entry] of Object.entries(EVIDENCE_REGISTRY)) {
      expect(entry.slug).toBe(key);
    }
  });

  it("has complete content on every entry", () => {
    for (const entry of listEvidenceEntries()) {
      expect(entry.title.length, entry.slug).toBeGreaterThan(0);
      expect(entry.summary.length, entry.slug).toBeGreaterThan(40);
      expect(entry.clinicalBottomLine.length, entry.slug).toBeGreaterThan(20);
      expect(entry.keyPoints.length, entry.slug).toBeGreaterThan(0);
      expect(entry.citations.length, entry.slug).toBeGreaterThan(0);
      expect(entry.lastReviewed, entry.slug).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});

describe("registry citations", () => {
  it("uses well-formed https URLs for every citation", () => {
    for (const entry of listEvidenceEntries()) {
      for (const citation of entry.citations) {
        const parsed = new URL(citation.url);
        expect(parsed.protocol, `${entry.slug}: ${citation.url}`).toBe("https:");
        expect(parsed.hostname.length, `${entry.slug}: ${citation.url}`).toBeGreaterThan(0);
      }
    }
  });

  it("points doi citations at doi.org", () => {
    for (const entry of listEvidenceEntries()) {
      for (const citation of entry.citations) {
        if (citation.doi) {
          expect(citation.url, entry.slug).toBe(`https://doi.org/${citation.doi}`);
        }
      }
    }
  });
});

describe("evidenceUrl()", () => {
  it("emits first-party absolute /evidence/[slug] URLs for every matrix slug", () => {
    for (const slug of collectMatrixEvidenceSlugs()) {
      expect(evidenceUrl(slug)).toMatch(EVIDENCE_URL_PATTERN);
    }
  });

  it("sanitizes arbitrary input into a valid slug path", () => {
    expect(evidenceUrl("Some Weird/Slug!!")).toMatch(EVIDENCE_URL_PATTERN);
    expect(evidenceUrl("")).toMatch(EVIDENCE_URL_PATTERN);
  });
});

describe("slug resolution for phase UIs", () => {
  it("resolves every alias to a canonical registry entry", () => {
    for (const [alias, canonical] of Object.entries(EVIDENCE_ALIASES)) {
      expect(resolveEvidenceSlug(alias), alias).toBe(canonical);
      expect(getEvidenceEntry(canonical), alias).not.toBeNull();
    }
  });

  it("resolves every relatedSlug to a canonical registry entry", () => {
    for (const entry of listEvidenceEntries()) {
      for (const related of entry.relatedSlugs) {
        expect(getEvidenceEntry(related), `${entry.slug} → ${related}`).not.toBeNull();
      }
    }
  });

  it("returns null for unknown slugs", () => {
    expect(resolveEvidenceSlug("definitely-not-a-real-slug")).toBeNull();
  });
});
