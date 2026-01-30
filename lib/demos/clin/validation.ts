// src/lib/validation.ts
// Clinical input validation utilities

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ValidationWarnings {
  ageWarning?: string;
  pediatricFlag?: boolean;
  geriatricFlag?: boolean;
  contradictoryInputs?: string[];
  pregnancyRadiationWarning?: string;
  chiefComplaintNormalized?: string;
}

// Chief complaint normalization mapping
const CHIEF_COMPLAINT_MAP: Record<string, string> = {
  'lbp': 'Low back pain',
  'low back pain': 'Low back pain',
  'back pain': 'Low back pain',
  'ha': 'Headache',
  'headache': 'Headache',
  'head pain': 'Headache',
  'sob': 'Shortness of breath',
  'shortness of breath': 'Shortness of breath',
  'dyspnea': 'Shortness of breath',
  'chest pain': 'Chest pain',
  'cp': 'Chest pain',
  'abdominal pain': 'Abdominal pain',
  'abd pain': 'Abdominal pain',
  'knee pain': 'Knee pain',
  'knee injury': 'Knee injury',
};

// Common chief complaint suggestions for autocomplete
export const CHIEF_COMPLAINT_SUGGESTIONS = [
  'Low back pain',
  'Headache',
  'Chest pain',
  'Shortness of breath',
  'Abdominal pain',
  'Knee pain',
  'Knee injury',
  'Neck pain',
  'Shoulder pain',
  'Hip pain',
  'Ankle pain',
  'Wrist pain',
  'Elbow pain',
];

/**
 * Normalize chief complaint
 */
export function normalizeChiefComplaint(complaint: string): string | null {
  if (!complaint) return null;
  
  const lower = complaint.toLowerCase().trim();
  
  // Check for exact match
  if (CHIEF_COMPLAINT_MAP[lower]) {
    return CHIEF_COMPLAINT_MAP[lower];
  }
  
  // Check for partial match
  for (const [key, value] of Object.entries(CHIEF_COMPLAINT_MAP)) {
    if (lower.includes(key) || key.includes(lower)) {
      return value;
    }
  }
  
  return null;
}

/** Returns true if string is empty or only whitespace (after trim). */
export function isEmptyOrWhitespace(value: string): boolean {
  return typeof value !== 'string' || value.trim().length === 0;
}

/** Error message for empty/whitespace-only required fields. */
export const EMPTY_FIELD_MESSAGE = 'This field cannot be empty';

/** Validate required text: must be non-empty after trim. Rejects whitespace-only. */
export function validateRequiredText(
  value: string,
  fieldName: string
): ValidationError | null {
  if (isEmptyOrWhitespace(value)) {
    return { field: fieldName, message: EMPTY_FIELD_MESSAGE, severity: 'error' };
  }
  return null;
}

/** Validate text max length. */
export function validateTextMaxLength(
  value: string,
  fieldName: string,
  maxLength: number
): ValidationError | null {
  const trimmed = (value || '').trim();
  if (trimmed.length > maxLength) {
    return {
      field: fieldName,
      message: `Must be ${maxLength} characters or fewer (currently ${trimmed.length})`,
      severity: 'error',
    };
  }
  return null;
}

/** Validate age: required, numeric, integer (no decimals), 0–120. */
export function validateAge(age: unknown): ValidationError[] {
  const errors: ValidationError[] = [];
  const num = typeof age === 'number' ? age : Number(age);
  if (age === '' || age === null || age === undefined || Number.isNaN(num)) {
    errors.push({
      field: 'age',
      message: 'Age is required',
      severity: 'error',
    });
    return errors;
  }
  if (!Number.isInteger(num) || num !== Math.floor(num)) {
    errors.push({
      field: 'age',
      message: 'Age must be a whole number (no decimals)',
      severity: 'error',
    });
  }
  if (num < 0 || num > 120) {
    errors.push({
      field: 'age',
      message: 'Age must be between 0 and 120 years',
      severity: 'error',
    });
  } else if (num > 100) {
    errors.push({
      field: 'age',
      message: 'Age exceeds 100 years. Please verify this is correct.',
      severity: 'warning',
    });
  }
  return errors;
}

/**
 * Get age-based flags
 */
export function getAgeFlags(age: number): ValidationWarnings {
  const warnings: ValidationWarnings = {};
  
  if (age < 18) {
    warnings.pediatricFlag = true;
  }
  
  if (age > 65) {
    warnings.geriatricFlag = true;
  }
  
  if (age > 100) {
    warnings.ageWarning = 'Age exceeds 100 years. Please verify this is correct.';
  }
  
  return warnings;
}

/**
 * Check for contradictory inputs
 */
export function checkContradictions(
  clinicalHistory: string,
  symptoms: string,
  duration: string,
  redFlags: Array<{ flag: string; present: boolean }>,
  isPregnant: boolean,
  imagingModality: string
): ValidationWarnings {
  const warnings: ValidationWarnings = {};
  const contradictions: string[] = [];
  
  const historyLower = clinicalHistory.toLowerCase();
  const symptomsLower = symptoms.toLowerCase();
  const combinedText = `${historyLower} ${symptomsLower}`;
  
  // Check for cancer mentions but no red flag
  const cancerKeywords = ['cancer', 'malignancy', 'malignant', 'tumor', 'tumour', 'neoplasm', 'carcinoma'];
  const hasCancerMention = cancerKeywords.some(keyword => combinedText.includes(keyword));
  const hasCancerRedFlag = redFlags.some(rf => 
    rf.present && rf.flag.toLowerCase().includes('cancer')
  );
  
  if (hasCancerMention && !hasCancerRedFlag) {
    contradictions.push('Clinical history mentions cancer-related terms but "History of cancer" red flag is not checked.');
  }
  
  // Check for chronic duration but short duration mentioned
  const durationLower = duration.toLowerCase();
  const isChronic = durationLower.includes('chronic') || durationLower.includes('long');
  const isShort = durationLower.includes('day') || durationLower.includes('hour') || 
                  durationLower.includes('acute') || /^\d+\s*(day|hour)/i.test(duration);
  
  if (isChronic && isShort) {
    contradictions.push('Duration mentions both "chronic" and short time periods. Please clarify.');
  }
  
  // Check for pregnancy + radiation
  if (isPregnant) {
    const radiationModalities = ['CT', 'X-ray', 'PET-CT', 'Nuclear Medicine'];
    const hasRadiation = radiationModalities.some(mod => imagingModality.includes(mod));
    
    if (hasRadiation) {
      warnings.pregnancyRadiationWarning = 
        '⚠️ CRITICAL: Patient is pregnant and proposed imaging uses ionizing radiation. ' +
        'Consider non-radiation alternatives (MRI, Ultrasound) unless absolutely necessary. ' +
        'Consult with radiology and obstetrics before proceeding.';
    }
  }
  
  if (contradictions.length > 0) {
    warnings.contradictoryInputs = contradictions;
  }
  
  return warnings;
}

/**
 * Check if patient is pregnant from symptoms/history
 */
export function detectPregnancy(symptoms: string, clinicalHistory: string): boolean {
  const combined = `${symptoms.toLowerCase()} ${clinicalHistory.toLowerCase()}`;
  const pregnancyKeywords = ['pregnant', 'pregnancy', 'gestation', 'gestational', 'expecting'];
  return pregnancyKeywords.some(keyword => combined.includes(keyword));
}

/**
 * Get autocomplete suggestions for chief complaint
 */
export function getChiefComplaintSuggestions(input: string): string[] {
  if (!input || input.length < 2) {
    return CHIEF_COMPLAINT_SUGGESTIONS.slice(0, 5);
  }
  
  const lower = input.toLowerCase();
  return CHIEF_COMPLAINT_SUGGESTIONS
    .filter(suggestion => suggestion.toLowerCase().includes(lower))
    .slice(0, 5);
}

