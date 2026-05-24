/**
 * @file SidebarHeader.tsx
 * @description Compact header for CDS sidebar: ARKA branding, patient context, order summary, traffic light.
 */

'use client';

import React from 'react';

export type TrafficLightStatus = 'green' | 'yellow' | 'red';

export interface SidebarHeaderProps {
  /** Patient display name */
  patientName: string;
  /** Age in years */
  age?: number;
  /** Sex for display */
  sex?: 'Male' | 'Female' | 'Other';
  /** Current order summary (e.g. "MRI Brain w/ contrast") */
  orderSummary: string;
  /** Traffic light status for appropriateness */
  trafficLight: TrafficLightStatus;
  /** Optional ARIA label override */
  'aria-label'?: string;
}

function ArkaLogoIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        fill="var(--arka-primary, #0ea5e9)"
        fillRule="evenodd"
        d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0Zm0 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2Zm1 3v6H7V5h2Zm-1 7a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function SidebarHeader({
  patientName,
  age,
  sex,
  orderSummary,
  trafficLight,
  'aria-label': ariaLabel,
}: SidebarHeaderProps) {
  const patientLine = [patientName, age != null ? `${age}y` : null, sex ?? null]
    .filter(Boolean)
    .join(' · ');
  const statusColor =
    trafficLight === 'green'
      ? 'bg-emerald-500'
      : trafficLight === 'yellow'
        ? 'bg-amber-500'
        : 'bg-red-500';

  return (
    <header
      className="flex shrink-0 flex-col gap-1 border-b border-[var(--arka-border,#e5e7eb)] bg-[var(--arka-bg-header,#f9fafb)] px-3 py-2 dark:border-[var(--arka-border)] dark:bg-[var(--arka-bg-header)]"
      style={{ maxHeight: 64 }}
      role="banner"
      aria-label={ariaLabel ?? 'Patient and order context'}
    >
      <div className="flex items-center gap-2">
        <ArkaLogoIcon className="shrink-0" />
        <span className="text-xs font-semibold text-[var(--arka-fg-muted,#6b7280)] dark:text-[var(--arka-fg-muted)]">
          ARKA CDS
        </span>
        <span
          className={`ml-auto h-2 w-2 shrink-0 rounded-full ${statusColor}`}
          role="status"
          aria-label={`Appropriateness: ${trafficLight}`}
          title={`Score indicator: ${trafficLight}`}
        />
      </div>
      <p className="truncate text-sm font-medium text-[var(--arka-fg,#111827)] dark:text-[var(--arka-fg)]" title={patientLine}>
        {patientLine || '—'}
      </p>
      <p className="truncate text-xs text-[var(--arka-fg-muted,#6b7280)] dark:text-[var(--arka-fg-muted)]" title={orderSummary}>
        {orderSummary || '—'}
      </p>
    </header>
  );
}
