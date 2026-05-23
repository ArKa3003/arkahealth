import { create } from "zustand";

import type { Checklist } from "@/lib/viewer/checklist-types";

interface ReferenceViewerState {
  checked: Record<string, boolean>;
  toggleItem: (id: string) => void;
  setChecked: (id: string, value: boolean) => void;
  resetForChecklist: (checklist: Checklist) => void;
}

/**
 * Checklist completion state for {@link ReferenceViewer} (session-local).
 */
export const useReferenceViewerStore = create<ReferenceViewerState>((set) => ({
  checked: {},
  toggleItem: (id) => {
    set((s) => ({
      checked: { ...s.checked, [id]: !s.checked[id] },
    }));
  },
  setChecked: (id, value) => {
    set((s) => ({
      checked: { ...s.checked, [id]: value },
    }));
  },
  resetForChecklist: (checklist) => {
    const next: Record<string, boolean> = {};
    for (const item of checklist.items) {
      next[item.id] = false;
    }
    set({ checked: next });
  },
}));
