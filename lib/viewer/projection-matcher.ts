import type { PriorImagingStudy } from "@/lib/types/record-snapshot";

/** Minimum similarity to surface as a prior reference match. */
export const PROJECTION_MATCH_MIN_SCORE = 0.6;

/** A prior study ranked for same-projection reference juxtaposition. */
export interface ProjectionMatch {
  priorStudyId: string;
  priorDate: string;
  modality: string;
  view: string;
  similarityScore: number;
  rationale: string;
}

function normalizeToken(value: string | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function scoreModality(a: PriorImagingStudy, b: PriorImagingStudy): number {
  const ma = new Set(a.modality.map((m) => normalizeToken(m)).filter(Boolean));
  const mb = new Set(b.modality.map((m) => normalizeToken(m)).filter(Boolean));
  if (ma.size === 0 || mb.size === 0) {
    return 0.4;
  }
  let overlap = 0;
  for (const m of ma) {
    if (mb.has(m) || [...mb].some((x) => x.includes(m) || m.includes(x))) {
      overlap += 1;
    }
  }
  return overlap / Math.max(ma.size, mb.size);
}

function scoreBodyPart(a: PriorImagingStudy, b: PriorImagingStudy): number {
  const pa = normalizeToken(a.bodySite);
  const pb = normalizeToken(b.bodySite);
  if (!pa || !pb) {
    return 0.35;
  }
  if (pa === pb) {
    return 1;
  }
  if (pa.includes(pb) || pb.includes(pa)) {
    return 0.85;
  }
  const tokensA = pa.split(/[\s;,]+/).filter(Boolean);
  const tokensB = new Set(pb.split(/[\s;,]+/).filter(Boolean));
  const shared = tokensA.filter((t) => tokensB.has(t)).length;
  if (shared === 0) {
    return 0.2;
  }
  return shared / Math.max(tokensA.length, tokensB.size);
}

function scoreView(a: PriorImagingStudy, b: PriorImagingStudy): number {
  const va = normalizeToken(a.view);
  const vb = normalizeToken(b.view);
  if (!va || !vb) {
    return 0.45;
  }
  return va === vb ? 1 : 0.15;
}

function scoreLaterality(a: PriorImagingStudy, b: PriorImagingStudy): number {
  const la = normalizeToken(a.laterality);
  const lb = normalizeToken(b.laterality);
  if (!la || !lb) {
    return 0.5;
  }
  if (la === "bilateral" || lb === "bilateral") {
    return 0.7;
  }
  return la === lb ? 1 : 0.1;
}

function buildRationale(parts: string[]): string {
  return parts.filter(Boolean).join("; ");
}

function studyId(study: PriorImagingStudy): string | undefined {
  return study.id ?? study.studyUid;
}

/**
 * Ranks prior studies by projection metadata similarity to the current study.
 * Returns matches with {@link PROJECTION_MATCH_MIN_SCORE} or higher, newest first within ties.
 *
 * @param current - Active (current) imaging study.
 * @param all - All prior studies for the same patient (including current).
 */
export function matchProjections(
  current: PriorImagingStudy,
  all: PriorImagingStudy[],
): ProjectionMatch[] {
  const currentId = studyId(current);
  const matches: ProjectionMatch[] = [];

  for (const prior of all) {
    const priorId = studyId(prior);
    if (!priorId || priorId === currentId) {
      continue;
    }

    const modScore = scoreModality(current, prior);
    const bodyScore = scoreBodyPart(current, prior);
    const viewScore = scoreView(current, prior);
    const latScore = scoreLaterality(current, prior);

    const similarityScore =
      modScore * 0.3 + bodyScore * 0.3 + viewScore * 0.25 + latScore * 0.15;

    if (similarityScore < PROJECTION_MATCH_MIN_SCORE) {
      continue;
    }

    const rationaleParts: string[] = [];
    if (modScore >= 0.8) {
      rationaleParts.push("Same modality family");
    }
    if (bodyScore >= 0.8) {
      rationaleParts.push("Matching body region");
    }
    if (viewScore >= 0.9 && current.view && prior.view) {
      rationaleParts.push(`Matching projection (${prior.view})`);
    }
    if (latScore >= 0.9 && current.laterality && prior.laterality) {
      rationaleParts.push(`Matching laterality (${prior.laterality})`);
    }
    if (rationaleParts.length === 0) {
      rationaleParts.push("Partial metadata alignment for reference juxtaposition");
    }

    matches.push({
      priorStudyId: priorId,
      priorDate: prior.startedIso ?? "",
      modality: prior.modality.join(", ") || "—",
      view: prior.view ?? "—",
      similarityScore: Math.round(similarityScore * 1000) / 1000,
      rationale: buildRationale(rationaleParts),
    });
  }

  matches.sort((a, b) => {
    if (b.similarityScore !== a.similarityScore) {
      return b.similarityScore - a.similarityScore;
    }
    return (b.priorDate || "").localeCompare(a.priorDate || "");
  });

  return matches;
}
