/**
 * Structured comparison checklist for non-diagnostic reference viewing.
 */

export interface ChecklistItem {
  id: string;
  label: string;
  /** Anatomic or workflow anchor for systematic review. */
  anchor: string;
  rationale: string;
}

export interface Checklist {
  region: string;
  items: ChecklistItem[];
}
