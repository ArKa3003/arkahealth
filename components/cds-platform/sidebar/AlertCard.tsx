/**
 * @file AlertCard.tsx
 * @description Renders a single TieredAlert as a compact card with tier-based styling and actions.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Info, AlertTriangle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import type { TieredAlert } from '@/lib/cds-platform/alerting/types';

export interface AlertCardProps {
  alert: TieredAlert;
  onDismiss?: (id: string) => void;
  onOverride?: (id: string) => void;
  onAction?: (alertId: string, actionType: TieredAlert['actions'][0]['type']) => void;
  /** Order-sign context: show override button for WARNING/CRITICAL */
  showOverrideButton?: boolean;
  'aria-label'?: string;
}

const MAX_MESSAGE_LINES = 3;
const PASSIVE_AUTO_DISMISS_MS = 10_000;

function getTierStyles(tier: TieredAlert['tier']) {
  switch (tier) {
    case 'passive':
      return {
        bg: 'bg-[var(--arka-bg-muted,#f3f4f6)] dark:bg-[var(--arka-bg-muted)]',
        border: 'border-l-[var(--arka-border,#e5e7eb)] dark:border-[var(--arka-border)]',
        icon: Info,
        iconClass: 'text-[var(--arka-fg-muted,#6b7280)] dark:text-[var(--arka-fg-muted)]',
      };
    case 'active_info':
      return {
        bg: 'bg-[var(--arka-bg-elevated,#fff)] dark:bg-[var(--arka-bg-elevated)]',
        border: 'border-l-4 border-l-blue-500',
        icon: Info,
        iconClass: 'text-blue-500',
      };
    case 'warning':
      return {
        bg: 'bg-[var(--arka-bg-elevated,#fff)] dark:bg-[var(--arka-bg-elevated)]',
        border: 'border-l-4 border-l-amber-500',
        icon: AlertTriangle,
        iconClass: 'text-amber-500',
      };
    case 'critical':
      return {
        bg: 'bg-red-50 dark:bg-red-950/30',
        border: 'border-l-4 border-l-red-500',
        icon: AlertCircle,
        iconClass: 'text-red-500',
      };
    default:
      return {
        bg: 'bg-[var(--arka-bg-elevated,#fff)] dark:bg-[var(--arka-bg-elevated)]',
        border: 'border-l-4 border-l-[var(--arka-border)] dark:border-[var(--arka-border)]',
        icon: Info,
        iconClass: 'text-[var(--arka-fg-muted)] dark:text-[var(--arka-fg-muted)]',
      };
  }
}

export function AlertCard({
  alert,
  onDismiss,
  onOverride,
  onAction,
  showOverrideButton = false,
  'aria-label': ariaLabel,
}: AlertCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const styles = getTierStyles(alert.tier);
  const Icon = styles.icon;
  const isPassive = alert.tier === 'passive';
  const showOverride = showOverrideButton && (alert.tier === 'warning' || alert.tier === 'critical') && (alert.overrideOptions?.length ?? 0) > 0;

  useEffect(() => {
    if (!isPassive || !onDismiss) return;
    const t = setTimeout(() => {
      setDismissed(true);
      onDismiss(alert.id);
    }, alert.displayDuration ?? PASSIVE_AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [isPassive, alert.id, alert.displayDuration, onDismiss]);

  if (dismissed) return null;

  const messageLines = (alert.message ?? '').split('\n');
  const truncated = !expanded && messageLines.length > MAX_MESSAGE_LINES;
  const displayMessage = truncated ? messageLines.slice(0, MAX_MESSAGE_LINES).join('\n') : alert.message ?? '';

  return (
    <article
      className={`rounded-r border border-[var(--arka-border,#e5e7eb)] border-l-4 ${styles.bg} ${styles.border} p-2 transition-opacity duration-200 dark:border-[var(--arka-border)] ${
        alert.tier === 'critical' ? 'animate-pulse' : ''
      }`}
      aria-label={ariaLabel ?? alert.title}
      role="article"
    >
      <div className="flex gap-2">
        <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${styles.iconClass}`} aria-hidden />
        <div className="min-w-0 flex-1">
          <h3 className={`text-sm ${alert.tier === 'warning' || alert.tier === 'critical' ? 'font-bold' : 'font-medium'} text-[var(--arka-fg,#111827)] dark:text-[var(--arka-fg)]`}>
            {alert.title}
          </h3>
          <p className="mt-0.5 whitespace-pre-wrap text-xs text-[var(--arka-fg-muted,#6b7280)] dark:text-[var(--arka-fg-muted)] line-clamp-3">
            {displayMessage}
            {truncated && '…'}
          </p>
          {truncated && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="mt-1 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
              aria-expanded={expanded}
            >
              Show more
              <ChevronDown className="inline h-3 w-3" aria-hidden />
            </button>
          )}
          {expanded && messageLines.length > MAX_MESSAGE_LINES && (
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="mt-1 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
              aria-expanded={expanded}
            >
              Show less
              <ChevronUp className="inline h-3 w-3" aria-hidden />
            </button>
          )}
          <div className="mt-2 flex flex-wrap gap-1">
            {alert.actions?.map((action, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onAction?.(alert.id, action.type)}
                className={`rounded px-2 py-1 text-xs font-medium ${
                  action.primary
                    ? 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
                    : 'bg-[var(--arka-bg-muted,#f3f4f6)] text-[var(--arka-fg,#111827)] hover:bg-[var(--arka-border,#e5e7eb)] dark:bg-[var(--arka-bg-muted)] dark:text-[var(--arka-fg)] dark:hover:bg-[var(--arka-border)]'
                }`}
              >
                {action.label}
              </button>
            ))}
            {showOverride && (
              <button
                type="button"
                onClick={() => onOverride?.(alert.id)}
                className="rounded border border-amber-500 px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/30"
              >
                Override
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
