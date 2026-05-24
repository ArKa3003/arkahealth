/**
 * @file duration-parser.ts
 * @description Parses duration from natural language (e.g. "3 days", "2 weeks") and ISO dates.
 * Used when Condition has notes or onsetString.
 */

/**
 * Parse a natural language duration string to approximate days.
 * Handles patterns like "3 days", "2 weeks", "1 month", "6 months", "1 year".
 * @param text - Free text (e.g. from Condition.onsetString or note)
 * @returns Approximate number of days, or null if unparseable
 */
export function parseDurationToDays(text: string | null | undefined): number | null {
  if (text == null || typeof text !== 'string') return null;
  const t = text.trim().toLowerCase();
  if (!t) return null;

  // Match: optional number + optional whitespace + unit (day|week|month|year)
  const patterns: Array<{ regex: RegExp; multiplier: number }> = [
    { regex: /(\d+)\s*years?/, multiplier: 365 },
    { regex: /(\d+)\s*months?/, multiplier: 30 },
    { regex: /(\d+)\s*weeks?/, multiplier: 7 },
    { regex: /(\d+)\s*days?/, multiplier: 1 },
    { regex: /(\d+)\s*yr/, multiplier: 365 },
    { regex: /(\d+)\s*mo/, multiplier: 30 },
    { regex: /(\d+)\s*wk/, multiplier: 7 },
    { regex: /(\d+)\s*d\b/, multiplier: 1 },
  ];

  for (const { regex, multiplier } of patterns) {
    const m = t.match(regex);
    if (m) {
      const n = parseInt(m[1], 10);
      if (Number.isFinite(n) && n >= 0) return n * multiplier;
    }
  }
  return null;
}

/**
 * Compute days between an ISO date string and a reference date (default: now).
 */
export function daysSince(dateIso: string | null | undefined, referenceDate: Date = new Date()): number | null {
  if (dateIso == null || typeof dateIso !== 'string') return null;
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return null;
  const ms = referenceDate.getTime() - d.getTime();
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}
