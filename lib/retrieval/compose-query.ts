/**
 * Builds a single embedding/search query from order context (no PHI).
 *
 * @param input - CPT, region, and chief complaint text.
 * @returns Composed query string for vector lookup.
 */
export function composeReferenceQuery(input: {
  cpt?: string;
  bodyPart?: string;
  complaint: string;
}): string {
  const parts: string[] = [];
  if (input.cpt?.trim()) {
    parts.push(`CPT ${input.cpt.trim()}`);
  }
  if (input.bodyPart?.trim()) {
    parts.push(`region ${input.bodyPart.trim()}`);
  }
  parts.push(input.complaint.trim());
  return parts.filter(Boolean).join("; ");
}
