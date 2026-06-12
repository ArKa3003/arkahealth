import { getImagingRatingsForCase, imagingOptions } from "@/lib/demos/ed";
import type { Case, CaseCategory, CaseImagingRating, ImagingOption } from "@/lib/demos/ed/types";

/** Maps ED case category to first-party evidence registry slug. */
export const CATEGORY_EVIDENCE_SLUG: Record<CaseCategory, string> = {
  "chest-pain": "chest",
  headache: "head-brain",
  "abdominal-pain": "abdomen",
  "low-back-pain": "spine",
  "extremity-trauma": "msk",
};

/** Estimated minutes to complete a scenario by difficulty tier. */
export const DIFFICULTY_EST_MINUTES: Record<
  Case["difficulty"],
  number
> = {
  beginner: 4,
  intermediate: 6,
  advanced: 8,
};

export type PracticeCaseResult = {
  caseId: string;
  selectedImagingId: string;
  isCorrect: boolean;
  acrRating: number;
  answeredAt: number;
};

export type PracticeSessionProgress = {
  answeredCaseIds: string[];
  results: PracticeCaseResult[];
  streak: number;
  bestStreak: number;
};

const SESSION_KEY = "arka-ed-practice-progress";
const PAGE_MODE_KEY = "arka-ed-page-mode";

export type EdPageMode = "practice" | "queue";

/**
 * Resolves imaging options rated for a case (4–6 choices including no-imaging).
 */
export function getImagingOptionsForCase(caseId: string): ImagingOption[] {
  const ratings = getImagingRatingsForCase(caseId);
  const ratedIds = new Set(ratings.map((r) => r.imaging_option_id));
  return imagingOptions.filter((option) => ratedIds.has(option.id));
}

/**
 * Returns ACR ratings for options shown in practice mode.
 */
export function getPracticeRatingsForCase(caseId: string): CaseImagingRating[] {
  const optionIds = new Set(
    getImagingOptionsForCase(caseId).map((option) => option.id),
  );
  optionIds.add("no-imaging");
  return getImagingRatingsForCase(caseId).filter((rating) =>
    optionIds.has(rating.imaging_option_id),
  );
}

/**
 * Determines whether the learner's selection matches optimal imaging.
 */
export function isPracticeAnswerCorrect(
  caseData: Case,
  selectedImagingIds: string[],
): boolean {
  if (selectedImagingIds.length !== 1) return false;

  const selected = selectedImagingIds[0];
  if (selected === "no-imaging") {
    return (
      caseData.optimal_imaging.length === 0 ||
      caseData.optimal_imaging.includes("no-imaging")
    );
  }

  return caseData.optimal_imaging.includes(selected);
}

/**
 * Resolves the ACR rating for a single selected option id.
 */
export function acrRatingForSelection(
  ratings: CaseImagingRating[],
  selectedImagingIds: string[],
  caseData: Case,
): number {
  if (selectedImagingIds.includes("no-imaging")) {
    const noImagingRating = ratings.find(
      (rating) => rating.imaging_option_id === "no-imaging",
    );
    if (noImagingRating) return noImagingRating.acr_rating;
    return caseData.optimal_imaging.length === 0 ? 9 : 1;
  }

  const selectedRatings = ratings.filter((rating) =>
    selectedImagingIds.includes(rating.imaging_option_id),
  );
  if (selectedRatings.length === 0) return 1;
  return Math.max(...selectedRatings.map((rating) => rating.acr_rating));
}

/**
 * Reads persisted practice progress from sessionStorage.
 */
export function loadPracticeProgress(): PracticeSessionProgress {
  if (typeof window === "undefined") {
    return { answeredCaseIds: [], results: [], streak: 0, bestStreak: 0 };
  }

  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) {
      return { answeredCaseIds: [], results: [], streak: 0, bestStreak: 0 };
    }
    const parsed = JSON.parse(raw) as PracticeSessionProgress;
    return {
      answeredCaseIds: parsed.answeredCaseIds ?? [],
      results: parsed.results ?? [],
      streak: parsed.streak ?? 0,
      bestStreak: parsed.bestStreak ?? 0,
    };
  } catch {
    return { answeredCaseIds: [], results: [], streak: 0, bestStreak: 0 };
  }
}

/**
 * Persists practice progress to sessionStorage.
 */
export function savePracticeProgress(progress: PracticeSessionProgress): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(progress));
}

/**
 * Reads the last selected page mode from sessionStorage.
 */
export function loadEdPageMode(): EdPageMode {
  if (typeof window === "undefined") return "practice";
  const saved = sessionStorage.getItem(PAGE_MODE_KEY);
  return saved === "queue" ? "queue" : "practice";
}

/**
 * Persists page mode to sessionStorage.
 */
export function saveEdPageMode(mode: EdPageMode): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PAGE_MODE_KEY, mode);
}

/**
 * Appends a case result and updates streak counters.
 */
export function appendPracticeResult(
  progress: PracticeSessionProgress,
  result: PracticeCaseResult,
): PracticeSessionProgress {
  const withoutDuplicate = progress.results.filter(
    (entry) => entry.caseId !== result.caseId,
  );
  const answeredCaseIds = Array.from(
    new Set([...progress.answeredCaseIds, result.caseId]),
  );
  const streak = result.isCorrect ? progress.streak + 1 : 0;
  const bestStreak = Math.max(progress.bestStreak, streak);

  return {
    answeredCaseIds,
    results: [...withoutDuplicate, result],
    streak,
    bestStreak,
  };
}
