/**
 * @file ehr-rail-store.ts
 * @description Zustand state for the EHR-embedded icon/rail. Encodes the icon-mode
 * UX contract: ARKA never interrupts, it signals. The rail expands only when the
 * clinician clicks the badge, or when a draft order scores ≤3 / carries an
 * EXPEDITE signal — in which case the container pulses exactly once and shows a
 * count badge. No sound, no modal, focus is never stolen.
 */

import { create } from 'zustand';

/** State + actions for the embedded icon/rail. */
export interface EhrRailState {
  /** Whether the full rail (vs. the 48px icon) is visible. */
  expanded: boolean;
  /** True when the last expansion was clinician-initiated (drives focus handoff). */
  userInitiated: boolean;
  /** Count of alert-worthy orders (score ≤3 or EXPEDITE). */
  alertCount: number;
  /** True while the one-time pulse ring animation is playing. */
  pulsing: boolean;
  /** Latched after the pulse has played once for this session. */
  pulsePlayed: boolean;
  /** Expand the rail from a clinician click/keypress. */
  expand: () => void;
  /** Collapse back to icon mode. */
  collapse: () => void;
  /** Toggle from a clinician click/keypress. */
  toggle: () => void;
  /**
   * Report the number of alert-worthy orders after scoring. A non-zero count
   * auto-expands the rail and plays the one-time pulse (signal, never interrupt).
   */
  signalAlerts: (count: number) => void;
  /** Marks the one-time pulse animation as finished. */
  endPulse: () => void;
}

/** Shared store for the embedded EHR rail. */
export const useEhrRailStore = create<EhrRailState>((set, get) => ({
  expanded: false,
  userInitiated: false,
  alertCount: 0,
  pulsing: false,
  pulsePlayed: false,
  expand: () => set({ expanded: true, userInitiated: true }),
  collapse: () => set({ expanded: false, userInitiated: false }),
  toggle: () => {
    const { expanded } = get();
    set({ expanded: !expanded, userInitiated: true });
  },
  signalAlerts: (count: number) => {
    const { pulsePlayed } = get();
    if (count > 0 && !pulsePlayed) {
      set({ alertCount: count, expanded: true, userInitiated: false, pulsing: true, pulsePlayed: true });
    } else {
      set({ alertCount: count });
    }
  },
  endPulse: () => set({ pulsing: false }),
}));
