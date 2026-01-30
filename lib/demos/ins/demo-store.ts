"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Patient,
  ImagingOrder,
  PreSubmissionAnalysis,
  DenialPrediction,
  RBMCriteriaMatch,
  GeneratedJustification,
  GeneratedAppeal,
  RiskLevel,
} from "@/lib/demos/ins/types";
import {
  patients,
  imagingOrders,
  preSubmissionAnalyses,
  denialPredictions,
  rbmCriteriaMatches,
  generatedJustifications,
  generatedAppeals,
} from "@/lib/demos/ins/mock-data";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const getPatientById = (id: string): Patient | null => patients.find((p) => p.id === id) || null;
const getOrderById = (id: string): ImagingOrder | null => imagingOrders.find((o) => o.id === id) || null;
const getAnalysisForOrder = (orderId: string): PreSubmissionAnalysis | null => preSubmissionAnalyses.find((a) => a.orderId === orderId) || null;
const getPredictionForOrder = (orderId: string): DenialPrediction | null => denialPredictions.find((p) => p.orderId === orderId) || null;
const getCriteriaMatchForOrder = (orderId: string): RBMCriteriaMatch | null => rbmCriteriaMatches.find((c) => c.orderId === orderId) || null;
const getJustificationForOrder = (orderId: string): GeneratedJustification | null => generatedJustifications.find((j) => j.orderId === orderId) || null;
const getAppealForOrder = (orderId: string): GeneratedAppeal | null => generatedAppeals.find((a) => a.orderId === orderId) || null;

interface ProcessingState {
  isAnalyzing: boolean;
  isGenerating: boolean;
  processingMessage: string | null;
  processingProgress: number;
}

const initialProcessing: ProcessingState = { isAnalyzing: false, isGenerating: false, processingMessage: null, processingProgress: 0 };

interface DemoStoreState {
  selectedPatientId: string | null;
  selectedPatient: Patient | null;
  currentOrderId: string | null;
  currentOrder: Partial<ImagingOrder> | null;
  preSubmissionAnalysis: PreSubmissionAnalysis | null;
  denialPrediction: DenialPrediction | null;
  rbmCriteriaMatch: RBMCriteriaMatch | null;
  generatedJustification: GeneratedJustification | null;
  generatedAppeal: GeneratedAppeal | null;
  currentStep: number;
  completedSteps: number[];
  processing: ProcessingState;
  error: string | null;
  demoStartedAt: string | null;
  lastUpdatedAt: string | null;
}

const initialState: DemoStoreState = {
  selectedPatientId: null,
  selectedPatient: null,
  currentOrderId: null,
  currentOrder: null,
  preSubmissionAnalysis: null,
  denialPrediction: null,
  rbmCriteriaMatch: null,
  generatedJustification: null,
  generatedAppeal: null,
  currentStep: 1,
  completedSteps: [],
  processing: initialProcessing,
  error: null,
  demoStartedAt: null,
  lastUpdatedAt: null,
};

interface DemoStoreActions {
  setSelectedPatient: (id: string | null) => void;
  clearPatient: () => void;
  setCurrentOrder: (orderId: string | null) => void;
  updateOrder: (fields: Partial<ImagingOrder>) => void;
  clearOrder: () => void;
  setPreSubmissionAnalysis: (a: PreSubmissionAnalysis | null) => void;
  setDenialPrediction: (p: DenialPrediction | null) => void;
  setRBMCriteriaMatch: (m: RBMCriteriaMatch | null) => void;
  setGeneratedJustification: (j: GeneratedJustification | null) => void;
  setGeneratedAppeal: (a: GeneratedAppeal | null) => void;
  goToStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  completeStep: (step: number) => void;
  resetDemo: () => void;
  setProcessing: (s: Partial<ProcessingState>) => void;
  clearProcessing: () => void;
  setError: (e: string | null) => void;
  simulatePreSubmissionAnalysis: () => Promise<void>;
  simulateDenialPrediction: () => Promise<void>;
  simulateCriteriaMatching: () => Promise<void>;
  simulateJustificationGeneration: () => Promise<void>;
  simulateAppealGeneration: () => Promise<void>;
  initializeScenario: (scenarioIndex: number) => void;
  rehydrateDerived: () => void;
}

type DemoStore = DemoStoreState & DemoStoreActions & {
  isReadyForSubmission: () => boolean;
  overallRiskLevel: () => RiskLevel | null;
  canProceedToNextStep: () => boolean;
  documentationScore: () => number | null;
  completionPercentage: () => number;
  currentPatient: () => Patient | null;
  currentImagingOrder: () => ImagingOrder | null;
};

export const useInsDemoStore = create<DemoStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setSelectedPatient: (id) => {
        const patient = id ? getPatientById(id) : null;
        set({ selectedPatientId: id, selectedPatient: patient, lastUpdatedAt: new Date().toISOString() });
      },
      clearPatient: () => set({ selectedPatientId: null, selectedPatient: null, lastUpdatedAt: new Date().toISOString() }),

      setCurrentOrder: (orderId) => {
        const order = orderId ? getOrderById(orderId) : null;
        set({ currentOrderId: orderId, currentOrder: order, lastUpdatedAt: new Date().toISOString() });
      },
      updateOrder: (fields) =>
        set((s) => ({ currentOrder: s.currentOrder ? { ...s.currentOrder, ...fields } : fields, lastUpdatedAt: new Date().toISOString() })),
      clearOrder: () => set({ currentOrderId: null, currentOrder: null, lastUpdatedAt: new Date().toISOString() }),

      setPreSubmissionAnalysis: (analysis) => set({ preSubmissionAnalysis: analysis, lastUpdatedAt: new Date().toISOString() }),
      setDenialPrediction: (prediction) => set({ denialPrediction: prediction, lastUpdatedAt: new Date().toISOString() }),
      setRBMCriteriaMatch: (match) => set({ rbmCriteriaMatch: match, lastUpdatedAt: new Date().toISOString() }),
      setGeneratedJustification: (justification) => set({ generatedJustification: justification, lastUpdatedAt: new Date().toISOString() }),
      setGeneratedAppeal: (appeal) => set({ generatedAppeal: appeal, lastUpdatedAt: new Date().toISOString() }),

      goToStep: (step) => {
        if (step >= 1 && step <= 10) set({ currentStep: step, lastUpdatedAt: new Date().toISOString() });
      },
      nextStep: () => set((s) => ({ currentStep: Math.min(s.currentStep + 1, 10), lastUpdatedAt: new Date().toISOString() })),
      previousStep: () => set((s) => ({ currentStep: Math.max(s.currentStep - 1, 1), lastUpdatedAt: new Date().toISOString() })),
      completeStep: (step) =>
        set((s) => ({
          completedSteps: s.completedSteps.includes(step) ? s.completedSteps : [...s.completedSteps, step].sort((a, b) => a - b),
          lastUpdatedAt: new Date().toISOString(),
        })),
      resetDemo: () => set({ ...initialState, demoStartedAt: null, lastUpdatedAt: new Date().toISOString() }),

      setProcessing: (state) => set((s) => ({ processing: { ...s.processing, ...state }, lastUpdatedAt: new Date().toISOString() })),
      clearProcessing: () => set({ processing: initialProcessing, lastUpdatedAt: new Date().toISOString() }),
      setError: (error) => set({ error, lastUpdatedAt: new Date().toISOString() }),

      simulatePreSubmissionAnalysis: async () => {
        const { currentOrderId } = get();
        if (!currentOrderId) return;
        set({ processing: { isAnalyzing: true, isGenerating: false, processingMessage: "Analyzing documentation...", processingProgress: 0 } });
        await delay(500);
        set((s) => ({ processing: { ...s.processing, processingProgress: 25, processingMessage: "Checking clinical indication..." } }));
        await delay(500);
        set((s) => ({ processing: { ...s.processing, processingProgress: 50, processingMessage: "Evaluating treatment history..." } }));
        await delay(500);
        set((s) => ({ processing: { ...s.processing, processingProgress: 75, processingMessage: "Identifying gaps..." } }));
        await delay(500);
        const analysis = getAnalysisForOrder(currentOrderId);
        set({ preSubmissionAnalysis: analysis, processing: initialProcessing, lastUpdatedAt: new Date().toISOString() });
      },

      simulateDenialPrediction: async () => {
        const { currentOrderId } = get();
        if (!currentOrderId) return;
        set({ processing: { isAnalyzing: true, isGenerating: false, processingMessage: "Running denial risk prediction...", processingProgress: 0 } });
        await delay(600);
        set((s) => ({ processing: { ...s.processing, processingProgress: 33 } }));
        await delay(600);
        set((s) => ({ processing: { ...s.processing, processingProgress: 66 } }));
        await delay(600);
        set((s) => ({ processing: { ...s.processing, processingProgress: 90 } }));
        await delay(400);
        const prediction = getPredictionForOrder(currentOrderId);
        set({ denialPrediction: prediction, processing: initialProcessing, lastUpdatedAt: new Date().toISOString() });
      },

      simulateCriteriaMatching: async () => {
        const { currentOrderId } = get();
        if (!currentOrderId) return;
        set({ processing: { isAnalyzing: true, isGenerating: false, processingMessage: "Loading RBM criteria...", processingProgress: 0 } });
        await delay(500);
        set((s) => ({ processing: { ...s.processing, processingProgress: 50 } }));
        await delay(500);
        const criteriaMatch = getCriteriaMatchForOrder(currentOrderId);
        set({ rbmCriteriaMatch: criteriaMatch, processing: initialProcessing, lastUpdatedAt: new Date().toISOString() });
      },

      simulateJustificationGeneration: async () => {
        const { currentOrderId } = get();
        if (!currentOrderId) return;
        set({ processing: { isAnalyzing: false, isGenerating: true, processingMessage: "Generating justification...", processingProgress: 0 } });
        await delay(400);
        set((s) => ({ processing: { ...s.processing, processingProgress: 50 } }));
        await delay(400);
        const justification = getJustificationForOrder(currentOrderId);
        set({ generatedJustification: justification, processing: initialProcessing, lastUpdatedAt: new Date().toISOString() });
      },

      simulateAppealGeneration: async () => {
        const { currentOrderId } = get();
        if (!currentOrderId) return;
        set({ processing: { isAnalyzing: false, isGenerating: true, processingMessage: "Generating appeal...", processingProgress: 0 } });
        await delay(400);
        set((s) => ({ processing: { ...s.processing, processingProgress: 50 } }));
        await delay(400);
        const appeal = getAppealForOrder(currentOrderId);
        set({ generatedAppeal: appeal, processing: initialProcessing, lastUpdatedAt: new Date().toISOString() });
      },

      initializeScenario: (scenarioIndex) => {
        const patient = patients[scenarioIndex];
        const order = imagingOrders[scenarioIndex];
        if (!patient || !order) return;
        set({
          ...initialState,
          selectedPatientId: patient.id,
          selectedPatient: patient,
          currentOrderId: order.id,
          currentOrder: order,
          demoStartedAt: new Date().toISOString(),
          lastUpdatedAt: new Date().toISOString(),
        });
      },

      rehydrateDerived: () => {
        const { selectedPatientId, currentOrderId } = get();
        const updates: Partial<DemoStoreState> = {};
        if (selectedPatientId) updates.selectedPatient = getPatientById(selectedPatientId);
        if (currentOrderId) updates.currentOrder = getOrderById(currentOrderId);
        if (Object.keys(updates).length > 0) set(updates);
      },

      isReadyForSubmission: () => {
        const { preSubmissionAnalysis } = get();
        return !!(preSubmissionAnalysis?.readyForSubmission && preSubmissionAnalysis.documentationScore >= 70);
      },
      overallRiskLevel: () => get().denialPrediction?.riskLevel ?? null,
      canProceedToNextStep: () => {
        const { currentStep, selectedPatientId, currentOrderId, preSubmissionAnalysis } = get();
        if (currentStep === 1) return !!selectedPatientId;
        if (currentStep === 2) return !!currentOrderId;
        if (currentStep === 3) return !!preSubmissionAnalysis;
        return true;
      },
      documentationScore: () => get().preSubmissionAnalysis?.documentationScore ?? null,
      completionPercentage: () => Math.round((get().completedSteps.length / 10) * 100),
      currentPatient: () => (get().selectedPatientId ? getPatientById(get().selectedPatientId!) : null),
      currentImagingOrder: () => (get().currentOrderId ? getOrderById(get().currentOrderId!) : null),
    }),
    {
      name: "arka-ins-demo-store",
      storage: createJSONStorage(() => (typeof window !== "undefined" ? sessionStorage : { getItem: () => null, setItem: () => {}, removeItem: () => {} })),
      partialize: (s) => ({ selectedPatientId: s.selectedPatientId, currentOrderId: s.currentOrderId, currentStep: s.currentStep, completedSteps: s.completedSteps, demoStartedAt: s.demoStartedAt }),
      onRehydrateStorage: () => (_, err) => {
        if (!err) useInsDemoStore.getState().rehydrateDerived?.();
      },
    }
  )
);
