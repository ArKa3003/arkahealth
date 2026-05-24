/**
 * @file NudgeDisplay.tsx
 * @description Renders behavioral nudges within the CDS sidebar.
 */

'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Users, Sparkles, CheckCircle2, Circle, ShieldAlert } from 'lucide-react';

export type NudgeType = 'default' | 'social_norm' | 'active_choice' | 'framing';
export type NudgePlacement = 'inline' | 'card_header' | 'card_footer' | 'suggestion_label';

export interface Nudge {
  id: string;
  type: NudgeType;
  priority: number;
  content: string;
  htmlContent: string;
  markdownContent: string;
  placement: NudgePlacement;
  dismissible: boolean;
  trackingId: string;
}

export type NudgeTrackEvent =
  | { type: 'viewed'; trackingId: string; nudgeType: NudgeType; nudgeId: string }
  | { type: 'dismissed'; trackingId: string; nudgeType: NudgeType; nudgeId: string }
  | { type: 'action'; trackingId: string; nudgeType: NudgeType; nudgeId: string; action: string; selection?: string };

export interface NudgeDisplayProps {
  nudges: Nudge[];
  /** Called when a nudge is viewed, dismissed, or influences an action. */
  onTrack?: (event: NudgeTrackEvent) => void;
  /**
   * Optional: apply a recommended default (e.g., switch order to alternative).
   * If provided, an "Apply recommendation" CTA will be shown on default nudges.
   */
  onApplyDefault?: (payload: { nudgeId: string; trackingId: string; recommended: string; ordered: string }) => void;
  /**
   * Optional: proceed after active choice selection. If omitted, we still track selection locally.
   */
  onActiveChoiceSubmit?: (payload: { nudgeId: string; trackingId: string; selection: 'proceed' | 'switch' | 'defer' }) => void;
  theme?: 'light' | 'dark';
  'aria-label'?: string;
}

type DefaultParsed = {
  recommended: string;
  recommendedScore?: number;
  ordered: string;
  orderedScore?: number;
} | null;

function parseDefaultNudge(content: string): DefaultParsed {
  // Expected: "Recommended: X (score: Y/9) instead of Z (score: W/9)."
  const re = /^Recommended:\s*(.+?)\s*\(score:\s*(\d+)\/9\)\s*instead of\s*(.+?)\s*\(score:\s*(\d+)\/9\)\.\s*$/i;
  const m = content.trim().match(re);
  if (!m) return null;
  return {
    recommended: m[1].trim(),
    recommendedScore: Number(m[2]),
    ordered: m[3].trim(),
    orderedScore: Number(m[4]),
  };
}

type ActiveChoiceOption = { id: 'proceed' | 'switch' | 'defer'; label: string };

function parseActiveChoice(content: string): ActiveChoiceOption[] {
  const lines = content.split('\n').map((l) => l.trim());
  const bulletLines = lines.filter((l) => l.startsWith('- ')).map((l) => l.slice(2).trim());
  if (bulletLines.length >= 2) {
    const opts: ActiveChoiceOption[] = [];
    for (const bl of bulletLines) {
      const lower = bl.toLowerCase();
      if (lower.startsWith('proceed with')) opts.push({ id: 'proceed', label: bl });
      else if (lower.startsWith('switch to') || lower.includes('alternative')) opts.push({ id: 'switch', label: bl });
      else if (lower.startsWith('defer imaging')) opts.push({ id: 'defer', label: bl });
    }
    // Ensure all options exist in a stable order.
    const byId = new Map(opts.map((o) => [o.id, o] as const));
    return (['proceed', 'switch', 'defer'] as const)
      .map((id) => byId.get(id))
      .filter(Boolean) as ActiveChoiceOption[];
  }
  return [
    { id: 'proceed', label: 'Proceed with ordered study' },
    { id: 'switch', label: 'Switch to alternative' },
    { id: 'defer', label: 'Defer imaging and try conservative management' },
  ];
}

function framingIcon(content: string) {
  const c = content.toLowerCase();
  if (c.includes('radiation')) return { glyph: '☢️', title: 'Radiation' };
  if (c.includes('cost')) return { glyph: '💲', title: 'Cost' };
  if (c.includes('time framing') || c.includes('days ago') || c.includes('repeating')) return { glyph: '⏱', title: 'Timing' };
  if (c.includes('patient safety') || c.includes('egfr') || c.includes('kidney')) return { glyph: '🛡', title: 'Patient safety' };
  return { glyph: 'ℹ️', title: 'Info' };
}

export function NudgeDisplay({ nudges, onTrack, onApplyDefault, onActiveChoiceSubmit, theme, 'aria-label': ariaLabel }: NudgeDisplayProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const viewedRef = useRef<Set<string>>(new Set());
  const [activeChoiceSelections, setActiveChoiceSelections] = useState<Record<string, 'proceed' | 'switch' | 'defer' | undefined>>({});

  const display = useMemo(
    () => [...nudges].filter((n) => !dismissed.has(n.id)).sort((a, b) => b.priority - a.priority),
    [nudges, dismissed]
  );

  useEffect(() => {
    for (const n of display) {
      const key = n.trackingId || n.id;
      if (viewedRef.current.has(key)) continue;
      viewedRef.current.add(key);
      onTrack?.({ type: 'viewed', trackingId: n.trackingId, nudgeType: n.type, nudgeId: n.id });
    }
  }, [display, onTrack]);

  if (display.length === 0) return null;

  return (
    <section
      className={`flex flex-col gap-2 ${theme === 'dark' ? 'dark' : ''}`}
      aria-label={ariaLabel ?? 'Behavioral nudges'}
    >
      {display.map((n) => {
        if (n.type === 'social_norm') {
          return (
            <div
              key={n.id}
              className="rounded-lg border border-[var(--arka-border,#e5e7eb)] bg-blue-50 px-3 py-2 text-[var(--arka-fg,#111827)] dark:border-[var(--arka-border)] dark:bg-blue-950/25 dark:text-[var(--arka-fg)]"
              role="note"
              aria-label="Social norm nudge"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-start gap-2">
                  <Users className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-blue-700 dark:text-blue-300">Peer pattern</p>
                    <p className="mt-0.5 text-xs text-[var(--arka-fg-muted,#6b7280)] dark:text-[var(--arka-fg-muted)]">
                      {n.content}
                    </p>
                  </div>
                </div>
                {n.dismissible && (
                  <button
                    type="button"
                    onClick={() => {
                      setDismissed((s) => new Set(s).add(n.id));
                      onTrack?.({ type: 'dismissed', trackingId: n.trackingId, nudgeType: n.type, nudgeId: n.id });
                    }}
                    className="shrink-0 text-xs font-medium text-blue-700 hover:underline dark:text-blue-300"
                    aria-label="Dismiss peer pattern nudge"
                  >
                    Dismiss
                  </button>
                )}
              </div>
            </div>
          );
        }

        if (n.type === 'default') {
          const parsed = parseDefaultNudge(n.content);
          const recommended = parsed?.recommended ?? 'Recommended option';
          const ordered = parsed?.ordered ?? 'Ordered option';

          return (
            <div
              key={n.id}
              className="rounded-lg border border-[var(--arka-border,#e5e7eb)] bg-[var(--arka-bg-elevated,#fff)] px-3 py-2 dark:border-[var(--arka-border)] dark:bg-[var(--arka-bg-elevated)]"
              role="group"
              aria-label="Default nudge"
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden />
                  <p className="text-xs font-medium text-[var(--arka-fg,#111827)] dark:text-[var(--arka-fg)]">Recommended default</p>
                </div>
                {n.dismissible && (
                  <button
                    type="button"
                    onClick={() => {
                      setDismissed((s) => new Set(s).add(n.id));
                      onTrack?.({ type: 'dismissed', trackingId: n.trackingId, nudgeType: n.type, nudgeId: n.id });
                    }}
                    className="text-xs font-medium text-[var(--arka-fg-muted,#6b7280)] hover:underline dark:text-[var(--arka-fg-muted)]"
                    aria-label="Dismiss recommended default nudge"
                  >
                    Dismiss
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="flex cursor-pointer items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1.5 dark:border-emerald-900/40 dark:bg-emerald-950/25">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-emerald-900 dark:text-emerald-200">
                      {recommended}
                      {typeof parsed?.recommendedScore === 'number' ? (
                        <span className="ml-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                          (score {parsed.recommendedScore}/9)
                        </span>
                      ) : null}
                    </div>
                    <div className="text-[11px] text-emerald-800/80 dark:text-emerald-200/80">Pre-selected as the recommended option.</div>
                  </div>
                </label>

                <label className="flex items-start gap-2 rounded-md border border-[var(--arka-border,#e5e7eb)] bg-[var(--arka-bg,#fff)] px-2 py-1.5 dark:border-[var(--arka-border)] dark:bg-[var(--arka-bg)]">
                  <Circle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--arka-fg-muted,#6b7280)] dark:text-[var(--arka-fg-muted)]" aria-hidden />
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-[var(--arka-fg,#111827)] dark:text-[var(--arka-fg)]">
                      {ordered}
                      {typeof parsed?.orderedScore === 'number' ? (
                        <span className="ml-1 text-[11px] font-medium text-[var(--arka-fg-muted,#6b7280)] dark:text-[var(--arka-fg-muted)]">
                          (score {parsed.orderedScore}/9)
                        </span>
                      ) : null}
                    </div>
                  </div>
                </label>

                {onApplyDefault && parsed && (
                  <button
                    type="button"
                    onClick={() => {
                      onTrack?.({ type: 'action', trackingId: n.trackingId, nudgeType: n.type, nudgeId: n.id, action: 'apply_default', selection: 'switch' });
                      onApplyDefault({ nudgeId: n.id, trackingId: n.trackingId, recommended: parsed.recommended, ordered: parsed.ordered });
                    }}
                    className="w-full rounded-md bg-emerald-600 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-[var(--arka-bg)]"
                    aria-label="Apply recommended default"
                  >
                    Apply recommendation
                  </button>
                )}
              </div>
            </div>
          );
        }

        if (n.type === 'active_choice') {
          const options = parseActiveChoice(n.content);
          const selection = activeChoiceSelections[n.id];
          const disabled = !selection;

          return (
            <div
              key={n.id}
              className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-900/40 dark:bg-amber-950/20"
              role="group"
              aria-label="Active choice nudge"
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-amber-700 dark:text-amber-300" aria-hidden />
                  <p className="text-xs font-medium text-amber-900 dark:text-amber-100">Active choice</p>
                </div>
              </div>

              <p className="text-xs text-amber-900/80 dark:text-amber-100/80">Select one option to continue:</p>

              <div className="mt-2 flex flex-col gap-1.5">
                {options.map((o) => {
                  const checked = selection === o.id;
                  return (
                    <label
                      key={o.id}
                      className={`flex cursor-pointer items-start gap-2 rounded-md border px-2 py-1.5 text-xs ${
                        checked
                          ? 'border-amber-400 bg-white dark:bg-[var(--arka-bg)]'
                          : 'border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`active-choice-${n.id}`}
                        className="mt-0.5"
                        checked={checked}
                        onChange={() => {
                          setActiveChoiceSelections((s) => ({ ...s, [n.id]: o.id }));
                          onTrack?.({ type: 'action', trackingId: n.trackingId, nudgeType: n.type, nudgeId: n.id, action: 'select_active_choice', selection: o.id });
                        }}
                        aria-label={o.label}
                      />
                      <span className="min-w-0 text-amber-950 dark:text-amber-50">{o.label}</span>
                    </label>
                  );
                })}
              </div>

              <button
                type="button"
                disabled={disabled}
                onClick={() => {
                  if (!selection) return;
                  onTrack?.({ type: 'action', trackingId: n.trackingId, nudgeType: n.type, nudgeId: n.id, action: 'submit_active_choice', selection });
                  onActiveChoiceSubmit?.({ nudgeId: n.id, trackingId: n.trackingId, selection });
                }}
                className={`mt-2 w-full rounded-md py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-[var(--arka-bg)] ${
                  disabled
                    ? 'cursor-not-allowed bg-amber-200 text-amber-900/60 dark:bg-amber-900/30 dark:text-amber-100/50'
                    : 'bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600'
                }`}
                aria-label="Continue with selected option"
              >
                Continue
              </button>
            </div>
          );
        }

        // framing
        const icon = framingIcon(n.content);
        return (
          <div
            key={n.id}
            className="rounded-lg border border-[var(--arka-border,#e5e7eb)] bg-[var(--arka-bg,#fff)] px-3 py-2 text-[var(--arka-fg,#111827)] dark:border-[var(--arka-border)] dark:bg-[var(--arka-bg)] dark:text-[var(--arka-fg)]"
            role="note"
            aria-label="Framing nudge"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-start gap-2">
                <span className="mt-0.5 text-sm" aria-hidden title={icon.title}>
                  {icon.glyph}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[var(--arka-fg,#111827)] dark:text-[var(--arka-fg)]">{icon.title}</p>
                  <p className="mt-0.5 text-xs text-[var(--arka-fg-muted,#6b7280)] dark:text-[var(--arka-fg-muted)]">
                    {n.content.replace(/^(Radiation framing:|Cost framing:|Time framing:|Patient safety framing:)\s*/i, '')}
                  </p>
                </div>
              </div>
              {n.dismissible && (
                <button
                  type="button"
                  onClick={() => {
                    setDismissed((s) => new Set(s).add(n.id));
                    onTrack?.({ type: 'dismissed', trackingId: n.trackingId, nudgeType: n.type, nudgeId: n.id });
                  }}
                  className="shrink-0 text-xs font-medium text-[var(--arka-fg-muted,#6b7280)] hover:underline dark:text-[var(--arka-fg-muted)]"
                  aria-label="Dismiss framing nudge"
                >
                  Dismiss
                </button>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}

