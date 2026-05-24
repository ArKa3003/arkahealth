/**
 * @file progressive-disclosure.ts
 * @description Progressive disclosure controller: adapts information depth by clinician behavior and alert severity.
 * Phase 9: Progressive Disclosure System.
 */

// =============================================================================
// Types
// =============================================================================

export type DisclosureLevel = 'MINIMAL' | 'STANDARD' | 'DETAILED' | 'MAXIMUM';

export type HookType = 'order-select' | 'order-sign';

export interface UserPreferences {
  disclosureLevel: DisclosureLevel;
  expandedSections: string[];
  overrideCount: number;
  viewCount: number;
  averageViewTimeMs: number;
  lastUpdated: Date;
  /** Consecutive overrides per alert type (e.g. "duplicate_imaging" -> 2) */
  consecutiveOverrideByType: Record<string, number>;
  /** Total number of times user has seen CDS (for "first 5 uses" rule) */
  totalSessionViews: number;
}

export interface DisclosureContext {
  /** Appropriateness score 1–9 */
  score: number;
  /** Has patient safety / contrast safety alerts */
  hasSafetyFlags: boolean;
  /** Current CDS hook */
  hook: HookType;
  /** Optional clinician identifier from CDS context */
  userId?: string;
}

export type DisclosureInteractionEvent =
  | { type: 'view_start' }
  | { type: 'view_end'; durationMs: number }
  | { type: 'expand_section'; section: string }
  | { type: 'collapse_section'; section: string }
  | { type: 'override'; alertCategory?: string }
  | { type: 'dismiss' }
  | { type: 'show_more' }
  | { type: 'show_less' };

/** Sections in DeepDiveView; first two are 'score', 'alternatives' for DETAILED default open */
export const DEEP_DIVE_SECTIONS = ['score', 'alternatives', 'evidence', 'patient', 'documentation'] as const;
export const DETAILED_DEFAULT_OPEN_SECTIONS = ['score', 'alternatives'];

// =============================================================================
// Default preferences
// =============================================================================

const DEFAULT_PREFERENCES: UserPreferences = {
  disclosureLevel: 'STANDARD',
  expandedSections: [],
  overrideCount: 0,
  viewCount: 0,
  averageViewTimeMs: 0,
  lastUpdated: new Date(),
  consecutiveOverrideByType: {},
  totalSessionViews: 0,
};

// =============================================================================
// ProgressiveDisclosureController
// =============================================================================

export class ProgressiveDisclosureController {
  private prefs: Map<string, UserPreferences> = new Map();
  /** In-memory only; key = userId or 'anonymous' */
  private readonly defaultUserId = 'anonymous';

  private getUserId(userId?: string): string {
    return userId ?? this.defaultUserId;
  }

  getPreferences(userId?: string): UserPreferences {
    const key = this.getUserId(userId);
    const existing = this.prefs.get(key);
    if (existing) return { ...existing };
    return { ...DEFAULT_PREFERENCES };
  }

  private setPreferences(userId: string, update: Partial<UserPreferences>): void {
    const key = this.getUserId(userId);
    const current = this.prefs.get(key) ?? { ...DEFAULT_PREFERENCES };
    const next: UserPreferences = {
      ...current,
      ...update,
      lastUpdated: new Date(),
    };
    this.prefs.set(key, next);
  }

  /**
   * Choose initial disclosure level from score, safety, hook, and stored preferences.
   */
  selectInitialLevel(context: DisclosureContext): DisclosureLevel {
    const { score, hasSafetyFlags, hook, userId } = context;
    const prefs = this.getPreferences(userId);

    // First 5 uses ever → STANDARD minimum (learning phase)
    if (prefs.totalSessionViews < 5) {
      return 'STANDARD';
    }

    // Score 7–9 + no safety flags → MINIMAL
    if (score >= 7 && score <= 9 && !hasSafetyFlags) {
      return 'MINIMAL';
    }

    // Score 7–9 + safety flags → STANDARD
    if (score >= 7 && score <= 9 && hasSafetyFlags) {
      return 'STANDARD';
    }

    // Score 4–6 → STANDARD
    if (score >= 4 && score <= 6) {
      return 'STANDARD';
    }

    // Score 1–3 + order-select → DETAILED
    if (score >= 1 && score <= 3 && hook === 'order-select') {
      return 'DETAILED';
    }

    // Score 1–3 + order-sign → MAXIMUM
    if (score >= 1 && score <= 3 && hook === 'order-sign') {
      return 'MAXIMUM';
    }

    // Apply adaptive overrides from stored preferences
    const overrideLevel = this.adaptLevelFromPreferences(prefs);
    if (overrideLevel) return overrideLevel;

    return prefs.disclosureLevel ?? 'STANDARD';
  }

  /**
   * Adapt level from behavior: detail expansion rate, view time, override rate.
   */
  private adaptLevelFromPreferences(prefs: UserPreferences): DisclosureLevel | null {
    if (prefs.viewCount < 3) return null;

    const avgViewMs = prefs.averageViewTimeMs;

    // If detail expansion rate > 50% (we track expanded sections; if user often has many open) → default DETAILED
    if (prefs.expandedSections.length >= 2 && prefs.viewCount >= 5) {
      return 'DETAILED';
    }

    // If average view time < 3 seconds → show only most critical (MINIMAL)
    if (avgViewMs > 0 && avgViewMs < 3000 && prefs.viewCount >= 5) {
      return 'MINIMAL';
    }

    // If clinician always dismisses quickly (low view time repeatedly) → decrease
    if (avgViewMs > 0 && avgViewMs < 2000 && prefs.viewCount >= 10) {
      return 'MINIMAL';
    }

    return null;
  }

  /**
   * Get default expanded sections for a level.
   * DETAILED: first 2 sections open; MAXIMUM: all open.
   */
  getDefaultExpandedSections(level: DisclosureLevel): string[] {
    switch (level) {
      case 'MINIMAL':
      case 'STANDARD':
        return [];
      case 'DETAILED':
        return [...DETAILED_DEFAULT_OPEN_SECTIONS];
      case 'MAXIMUM':
        return [...DEEP_DIVE_SECTIONS];
      default:
        return [];
    }
  }

  /**
   * Whether to show social norm nudges more prominently (override rate > 80%).
   */
  shouldEmphasizeSocialNudges(userId?: string): boolean {
    const prefs = this.getPreferences(userId);
    if (prefs.viewCount < 5) return false;
    const rate = prefs.overrideCount / prefs.viewCount;
    return rate > 0.8;
  }

  /**
   * Reduce tier for alert type if same type overridden 3+ times consecutively.
   */
  shouldReduceTierForAlertType(userId: string | undefined, alertCategory: string): boolean {
    const prefs = this.getPreferences(userId);
    const count = prefs.consecutiveOverrideByType[alertCategory] ?? 0;
    return count >= 3;
  }

  /**
   * Process an interaction and update stored preferences; may return suggested level change.
   */
  recordInteraction(userId: string | undefined, event: DisclosureInteractionEvent): void {
    const key = this.getUserId(userId);
    const prefs = this.getPreferences(userId);

    switch (event.type) {
      case 'view_start':
        this.setPreferences(key, { viewCount: prefs.viewCount + 1, totalSessionViews: prefs.totalSessionViews + 1 });
        break;
      case 'view_end': {
        const n = prefs.viewCount;
        const prevAvg = prefs.averageViewTimeMs;
        const newAvg = n <= 1 ? event.durationMs : (prevAvg * (n - 1) + event.durationMs) / n;
        this.setPreferences(key, { averageViewTimeMs: Math.round(newAvg) });
        break;
      }
      case 'expand_section': {
        const expanded = prefs.expandedSections.includes(event.section)
          ? prefs.expandedSections
          : [...prefs.expandedSections, event.section];
        this.setPreferences(key, { expandedSections: expanded });
        break;
      }
      case 'collapse_section': {
        const expanded = prefs.expandedSections.filter((s) => s !== event.section);
        this.setPreferences(key, { expandedSections: expanded });
        break;
      }
      case 'override': {
        const overrideCount = prefs.overrideCount + 1;
        const cat = event.alertCategory ?? 'unknown';
        const consec = { ...prefs.consecutiveOverrideByType };
        consec[cat] = (consec[cat] ?? 0) + 1;
        this.setPreferences(key, { overrideCount, consecutiveOverrideByType: consec });
        break;
      }
      case 'dismiss':
        // Optional: clear consecutive override for that type if we had category
        break;
      case 'show_more':
      case 'show_less':
        // Manual level change is handled by setLevel in the hook; no auto-update here
        break;
      default:
        break;
    }
  }

  /**
   * Set user's preferred disclosure level (e.g. after "Show More" / "Show Less").
   */
  setUserLevel(userId: string | undefined, level: DisclosureLevel): void {
    const key = this.getUserId(userId);
    this.setPreferences(key, { disclosureLevel: level });
  }

  /** Reset consecutive overrides when user accepts (so we don't reduce tier forever). */
  clearConsecutiveOverrides(userId: string | undefined, alertCategory?: string): void {
    const key = this.getUserId(userId);
    const prefs = this.getPreferences(userId);
    const consec = { ...prefs.consecutiveOverrideByType };
    if (alertCategory) delete consec[alertCategory];
    else Object.keys(consec).forEach((k) => delete consec[k]);
    this.setPreferences(key, { consecutiveOverrideByType: consec });
  }
}

// Singleton for app-wide use
let controllerInstance: ProgressiveDisclosureController | null = null;

export function getProgressiveDisclosureController(): ProgressiveDisclosureController {
  if (!controllerInstance) {
    controllerInstance = new ProgressiveDisclosureController();
  }
  return controllerInstance;
}

export function setProgressiveDisclosureController(instance: ProgressiveDisclosureController | null): void {
  controllerInstance = instance;
}
