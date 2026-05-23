/**
 * Heuristic extraction of projection and laterality from imaging study text.
 */

const VIEW_PATTERNS: Array<{ code: string; pattern: RegExp }> = [
  { code: "PA", pattern: /\bPA\b|\bposteroanterior\b/i },
  { code: "AP", pattern: /\bAP\b|\banteroposterior\b/i },
  { code: "LAT", pattern: /\bLAT\b|\blateral\b/i },
  { code: "OBL", pattern: /\bOBL\b|\boblique\b/i },
  { code: "DECUB", pattern: /\bdecub/i },
  { code: "SWIMMERS", pattern: /\bswimmer/i },
  { code: "FLEX", pattern: /\bflexion\b/i },
  { code: "EXT", pattern: /\bextension\b/i },
];

/**
 * Infers a normalized view code from study description or series title.
 *
 * @param text - Free-text description or series label.
 */
export function inferViewCode(text: string | undefined): string | undefined {
  if (!text?.trim()) {
    return undefined;
  }
  for (const { code, pattern } of VIEW_PATTERNS) {
    if (pattern.test(text)) {
      return code;
    }
  }
  return undefined;
}

/**
 * Infers laterality from body site or description text.
 *
 * @param text - Body site or description.
 */
export function inferLaterality(text: string | undefined): string | undefined {
  if (!text?.trim()) {
    return undefined;
  }
  if (/\bbilateral\b|\bboth\b/i.test(text)) {
    return "bilateral";
  }
  if (/\bleft\b|\bL\b/i.test(text)) {
    return "L";
  }
  if (/\bright\b|\bR\b/i.test(text)) {
    return "R";
  }
  return undefined;
}
