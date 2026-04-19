import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { RuralDemoState, FacilityProfile, RAASResult } from "./types";
import { DEMO_FACILITIES } from "./facility-profiles";

interface RuralStore extends RuralDemoState {
  // Actions
  setSelectedFacility: (facility: FacilityProfile) => void;
  setRAASResult: (result: RAASResult | null) => void;
  resetState: () => void;
}

const initialState: RuralDemoState = {
  selectedFacility: DEMO_FACILITIES[0] ?? null,
  raasResult: null,
  activeTriageTier: null,
  teleStudies: [],
  qualityMetrics: null,
  currentCase: null,
  cmeProgress: null,
  activeExemptions: [],
  batchAuth: null,
  revenueCycle: null,
  grants: [],
  networkConfig: null,
  selectedAlgorithms: [],
  preliminaryAssessment: null,
  activePOCUSProtocol: null,
  imagingDeserts: [],
  outcomes: [],
  facilityRisks: [],
};

export const useRuralStore = create<RuralStore>()(
  persist(
    (set) => ({
      ...initialState,
      setSelectedFacility: (facility) => set({ selectedFacility: facility }),
      setRAASResult: (result) =>
        set({
          raasResult: result,
          activeTriageTier: result?.triageRecommendation.tier ?? null,
        }),
      resetState: () => set(initialState),
    }),
    {
      name: "arka-rural-demo",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        selectedFacility: state.selectedFacility,
      }),
    }
  )
);

/** Resolved facility for UI; falls back when state allows null. */
export function useSelectedFacility(): FacilityProfile {
  return useRuralStore((s) => s.selectedFacility ?? DEMO_FACILITIES[0]!);
}
