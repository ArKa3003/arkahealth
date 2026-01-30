// src/lib/duration-parser.ts
// Advanced duration parsing for clinical scenarios

export interface ParsedDuration {
  value: number; // Duration in weeks
  pattern: 'constant' | 'intermittent' | 'progressive' | 'improving' | 'unknown';
  interpretation: string; // Human-readable interpretation
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Common duration options for dropdown fallback
 */
export const COMMON_DURATIONS = [
  { label: '< 1 day (hours)', value: '< 1 day', weeks: 0.1 },
  { label: '1-3 days', value: '1-3 days', weeks: 0.3 },
  { label: '4-7 days', value: '4-7 days', weeks: 1 },
  { label: '1-4 weeks', value: '1-4 weeks', weeks: 2.5 },
  { label: '1-3 months', value: '1-3 months', weeks: 8 },
  { label: '3-6 months', value: '3-6 months', weeks: 19.5 },
  { label: '> 6 months', value: '> 6 months', weeks: 26 },
];

/**
 * Parse duration string with comprehensive pattern matching
 */
export function parseDuration(duration: string): ParsedDuration {
  if (!duration || duration.trim().length === 0) {
    return {
      value: 0,
      pattern: 'unknown',
      interpretation: 'No duration specified',
      confidence: 'low',
    };
  }

  const lower = duration.toLowerCase().trim();
  let weeks = 0;
  let pattern: ParsedDuration['pattern'] = 'constant';
  let confidence: ParsedDuration['confidence'] = 'high';
  let interpretation = '';

  // Pattern detection
  if (lower.includes('intermittent') || lower.includes('on and off') || lower.includes('comes and goes')) {
    pattern = 'intermittent';
  } else if (lower.includes('progressive') || lower.includes('worsening') || lower.includes('getting worse')) {
    pattern = 'progressive';
  } else if (lower.includes('improving') || lower.includes('getting better') || lower.includes('resolving')) {
    pattern = 'improving';
  }

  // Handle "on and off for X" pattern
  const onAndOffMatch = lower.match(/on\s+and\s+off\s+(?:for\s+)?(\d+)\s*(day|days|week|weeks|month|months|year|years)/i);
  if (onAndOffMatch) {
    const num = parseInt(onAndOffMatch[1]);
    const unit = onAndOffMatch[2].toLowerCase();
    weeks = convertToWeeks(num, unit);
    pattern = 'intermittent';
    interpretation = `~${formatDuration(weeks)} duration, intermittent pattern`;
    return { value: weeks, pattern, interpretation, confidence: 'high' };
  }

  // Handle "started yesterday/today" patterns
  if (lower.includes('yesterday') || lower.match(/started\s+yesterday/i)) {
    weeks = 0.14; // ~1 day
    interpretation = '~1 day duration';
    return { value: weeks, pattern, interpretation, confidence: 'high' };
  }

  if (lower.includes('today') || lower.match(/started\s+today/i)) {
    weeks = 0.07; // < 1 day
    interpretation = '< 1 day duration';
    return { value: weeks, pattern, interpretation, confidence: 'high' };
  }

  // Handle "few" / "several" / "many" patterns
  if (lower.match(/few\s+weeks/i)) {
    weeks = 2.5; // Average of 2-3 weeks
    interpretation = '~2-3 weeks duration';
    confidence = 'medium';
  } else if (lower.match(/few\s+months/i)) {
    weeks = 8; // Average of 2-3 months
    interpretation = '~2-3 months duration';
    confidence = 'medium';
  } else if (lower.match(/several\s+weeks/i)) {
    weeks = 4;
    interpretation = '~several weeks duration';
    confidence = 'medium';
  } else if (lower.match(/several\s+months/i)) {
    weeks = 19.5; // Average of 3-6 months
    interpretation = '~3-6 months duration';
    confidence = 'medium';
  } else if (lower.match(/many\s+months/i) || lower.match(/many\s+weeks/i)) {
    weeks = 26; // > 6 months
    interpretation = '> 6 months duration';
    confidence = 'medium';
  }
  // Handle "chronic" / "long-standing"
  else if (lower.includes('chronic') || lower.includes('long-standing') || lower.includes('long standing')) {
    weeks = 26; // > 6 months for chronic
    interpretation = '> 6 months duration (chronic)';
    confidence = 'high';
  }
  // Handle "acute" / "sudden onset"
  else if (lower.includes('acute') || lower.match(/sudden\s+onset/i)) {
    weeks = 0.5; // < 1 week
    interpretation = '< 1 week duration (acute)';
    confidence = 'high';
  }
  // Handle explicit numeric patterns
  else {
    // Try to extract number and unit
    const numericPatterns = [
      // "3 days", "3 days ago", "for 3 days"
      /(\d+)\s*(?:day|days)(?:\s+ago)?/i,
      // "2 weeks", "2 weeks ago", "for 2 weeks"
      /(\d+)\s*(?:week|weeks)(?:\s+ago)?/i,
      // "6 months", "6 months ago", "for 6 months"
      /(\d+)\s*(?:month|months)(?:\s+ago)?/i,
      // "1 year", "1 years ago", "for 1 year"
      /(\d+)\s*(?:year|years)(?:\s+ago)?/i,
      // "3-4 weeks", "2 to 3 months" (ranges)
      /(\d+)\s*[-–—to]\s*(\d+)\s*(?:week|weeks|month|months|day|days)/i,
    ];

    let matched = false;
    for (const pattern of numericPatterns) {
      const match = lower.match(pattern);
      if (match) {
        matched = true;
        if (match[2]) {
          // Range pattern (e.g., "3-4 weeks")
          const num1 = parseInt(match[1]);
          const num2 = parseInt(match[2]);
          const unit = match[0].match(/(day|week|month|year)/i)?.[0] || 'week';
          const avgNum = (num1 + num2) / 2;
          weeks = convertToWeeks(avgNum, unit);
          interpretation = `~${formatDuration(weeks)} duration (range: ${num1}-${num2} ${unit}s)`;
          confidence = 'high';
        } else {
          // Single number pattern
          const num = parseInt(match[1]);
          const unit = match[0].match(/(day|week|month|year)/i)?.[0] || 'week';
          weeks = convertToWeeks(num, unit);
          interpretation = `~${formatDuration(weeks)} duration`;
          confidence = 'high';
        }
        break;
      }
    }

    if (!matched) {
      // Fallback: try to find any number
      const anyNumber = lower.match(/(\d+)/);
      if (anyNumber) {
        const num = parseInt(anyNumber[1]);
        // Assume weeks if no unit found
        weeks = num;
        interpretation = `~${num} weeks duration (estimated)`;
        confidence = 'low';
      } else {
        // No numeric value found
        weeks = 0;
        interpretation = 'Unable to parse duration';
        confidence = 'low';
      }
    }
  }

  // Add pattern to interpretation if not constant
  if (pattern !== 'constant' && interpretation) {
    interpretation += `, ${pattern} pattern`;
  }

  return {
    value: weeks,
    pattern,
    interpretation: interpretation || `~${formatDuration(weeks)} duration`,
    confidence,
  };
}

/**
 * Convert number and unit to weeks
 */
function convertToWeeks(num: number, unit: string): number {
  const unitLower = unit.toLowerCase();
  if (unitLower.includes('day')) return num / 7;
  if (unitLower.includes('week')) return num;
  if (unitLower.includes('month')) return num * 4.33; // Average weeks per month
  if (unitLower.includes('year')) return num * 52;
  return num; // Default to weeks
}

/**
 * Format weeks to human-readable string
 */
function formatDuration(weeks: number): string {
  if (weeks < 0.14) return '< 1 day';
  if (weeks < 1) return `${Math.round(weeks * 7)} day${Math.round(weeks * 7) !== 1 ? 's' : ''}`;
  if (weeks < 4) return `${Math.round(weeks)} week${Math.round(weeks) !== 1 ? 's' : ''}`;
  if (weeks < 52) {
    const months = Math.round(weeks / 4.33);
    return `${months} month${months !== 1 ? 's' : ''}`;
  }
  const years = Math.round(weeks / 52);
  return `${years} year${years !== 1 ? 's' : ''}`;
}

