/**
 * @file OverrideDialog.tsx
 * @description Slide-up panel (in-sidebar) for override reason selection and documentation. Not a modal.
 */

'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { OverrideOption } from '@/lib/cds-platform/alerting/types';

export interface OverrideDialogProps {
  /** Override reason options (e.g. STANDARD_OVERRIDE_OPTIONS) */
  options: OverrideOption[];
  onSubmit: (payload: { code: string; documentation?: string }) => void;
  onGoBack: () => void;
  /** Alert title for context */
  alertTitle?: string;
  'aria-label'?: string;
}

export function OverrideDialog({
  options,
  onSubmit,
  onGoBack,
  alertTitle,
  'aria-label': ariaLabel,
}: OverrideDialogProps) {
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [documentation, setDocumentation] = useState('');
  const selected = options.find((o) => o.code === selectedCode);
  const needsDoc = selected?.requiresDocumentation ?? false;
  const canSubmit = selectedCode != null && (!needsDoc || documentation.trim().length > 0);

  const handleSubmit = () => {
    if (!selectedCode) return;
    if (needsDoc && !documentation.trim()) return;
    onSubmit({ code: selectedCode, documentation: needsDoc ? documentation.trim() : undefined });
  };

  return (
    <div
      className="flex flex-col gap-4 rounded-t-lg border border-b-0 border-[var(--arka-border,#e5e7eb)] bg-[var(--arka-bg-elevated,#fff)] p-4 shadow-lg dark:border-[var(--arka-border)] dark:bg-[var(--arka-bg-elevated)]"
      role="dialog"
      aria-labelledby="override-dialog-title"
      aria-describedby="override-dialog-desc"
      aria-label={ariaLabel ?? 'Override reason'}
    >
      <h2 id="override-dialog-title" className="text-sm font-semibold text-[var(--arka-fg,#111827)] dark:text-[var(--arka-fg)]">
        Why are you overriding this recommendation?
      </h2>
      <p id="override-dialog-desc" className="text-xs text-[var(--arka-fg-muted,#6b7280)] dark:text-[var(--arka-fg-muted)]">
        {alertTitle ? `Alert: ${alertTitle}` : 'Select a reason for the override. This will be recorded for audit.'}
      </p>
      <fieldset className="flex flex-col gap-2">
        <legend className="sr-only">Override reason</legend>
        {options.map((opt) => (
          <label
            key={opt.code}
            className="flex cursor-pointer items-start gap-2 rounded border border-[var(--arka-border,#e5e7eb)] p-2 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50/50 dark:border-[var(--arka-border)] dark:has-[:checked]:bg-blue-950/20"
          >
            <input
              type="radio"
              name="override-reason"
              value={opt.code}
              checked={selectedCode === opt.code}
              onChange={() => {
                setSelectedCode(opt.code);
                setDocumentation('');
              }}
              className="mt-1 h-4 w-4 border-[var(--arka-border)] text-blue-600 focus:ring-blue-500 dark:border-[var(--arka-border)]"
              aria-describedby={opt.requiresDocumentation ? `doc-prompt-${opt.code}` : undefined}
            />
            <span className="text-sm text-[var(--arka-fg,#111827)] dark:text-[var(--arka-fg)]">
              {opt.display}
            </span>
          </label>
        ))}
      </fieldset>
      {needsDoc && selected && (
        <div id={`doc-prompt-${selected.code}`}>
          <label htmlFor="override-documentation" className="text-xs font-medium text-[var(--arka-fg,#111827)] dark:text-[var(--arka-fg)]">
            {selected.documentationPrompt ?? 'Documentation required'}
          </label>
          <textarea
            id="override-documentation"
            value={documentation}
            onChange={(e) => setDocumentation(e.target.value)}
            placeholder="Enter details..."
            rows={3}
            className="mt-1 w-full rounded border border-[var(--arka-border,#e5e7eb)] bg-[var(--arka-bg,#fff)] px-3 py-2 text-sm text-[var(--arka-fg,#111827)] placeholder:text-[var(--arka-fg-muted,#9ca3af)] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-[var(--arka-border)] dark:bg-[var(--arka-bg)] dark:text-[var(--arka-fg)] dark:placeholder:text-[var(--arka-fg-muted)]"
            aria-required="true"
          />
        </div>
      )}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-arka-cyan focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[var(--arka-bg)]"
          aria-label="Submit override"
        >
          Submit Override
        </button>
        <button
          type="button"
          onClick={onGoBack}
          className="flex items-center justify-center gap-1 rounded text-sm font-medium text-[var(--arka-fg-muted,#6b7280)] hover:text-[var(--arka-fg,#111827)] focus:outline-none focus-visible:ring-2 focus-visible:ring-arka-cyan dark:text-[var(--arka-fg-muted)] dark:hover:text-[var(--arka-fg)]"
          aria-label="Go back"
        >
          <ChevronDown className="h-4 w-4 rotate-90" aria-hidden />
          Go Back
        </button>
      </div>
    </div>
  );
}
