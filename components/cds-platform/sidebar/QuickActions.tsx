/**
 * @file QuickActions.tsx
 * @description Sticky footer with contextual action buttons (Accept, View Alternatives, Override, Cancel).
 */

'use client';

import React from 'react';
import { Check, List, ShieldAlert, X } from 'lucide-react';

export interface QuickActionsProps {
  /** Appropriateness score 1–9 */
  score: number;
  onAcceptOrder?: () => void;
  onViewAlternatives?: () => void;
  onOverrideAndContinue?: () => void;
  onCancelOrder?: () => void;
  'aria-label'?: string;
}

export function QuickActions({
  score,
  onAcceptOrder,
  onViewAlternatives,
  onOverrideAndContinue,
  onCancelOrder,
  'aria-label': ariaLabel,
}: QuickActionsProps) {
  const showAccept = score >= 7 && score <= 9;
  const showOverride = score >= 1 && score <= 6;

  return (
    <footer
      className="grid grid-cols-2 gap-2 border-t border-[var(--arka-border,#e5e7eb)] bg-[var(--arka-bg-footer,#f9fafb)] p-3 dark:border-[var(--arka-border)] dark:bg-[var(--arka-bg-footer)]"
      role="contentinfo"
      aria-label={ariaLabel ?? 'Quick actions'}
    >
      {showAccept && (
        <button
          type="button"
          onClick={onAcceptOrder}
          className="flex items-center justify-center gap-1.5 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-[var(--arka-bg)]"
          aria-label="Accept order"
        >
          <Check className="h-4 w-4" aria-hidden />
          Accept Order
        </button>
      )}
      <button
        type="button"
        onClick={onViewAlternatives}
        className="flex items-center justify-center gap-1.5 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-[var(--arka-bg)]"
        aria-label="View alternative imaging options"
      >
        <List className="h-4 w-4" aria-hidden />
        View Alternatives
      </button>
      {showOverride && (
        <button
          type="button"
          onClick={onOverrideAndContinue}
          className="col-span-2 flex items-center justify-center gap-1.5 rounded-md border border-amber-500 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:bg-amber-950/30 dark:text-amber-200 dark:hover:bg-amber-950/50 dark:focus:ring-offset-[var(--arka-bg)]"
          aria-label="Override recommendation and continue"
        >
          <ShieldAlert className="h-4 w-4" aria-hidden />
          Override & Continue
        </button>
      )}
      <button
        type="button"
        onClick={onCancelOrder}
        className="col-span-2 flex items-center justify-center gap-1.5 rounded-md border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:border-red-800 dark:bg-transparent dark:text-red-300 dark:hover:bg-red-950/30 dark:focus:ring-offset-[var(--arka-bg)]"
        aria-label="Cancel order"
      >
        <X className="h-4 w-4" aria-hidden />
        Cancel Order
      </button>
    </footer>
  );
}
