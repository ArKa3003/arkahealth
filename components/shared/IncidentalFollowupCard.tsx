"use client";

import { CalendarClock, X } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { FDANonDeviceBanner } from "@/components/shared/compliance/FDANonDeviceBanner";
import { FDA_NON_DEVICE_CDS_DISCLOSURE } from "@/lib/compliance/fda-disclosure";
import {
  incidentalCategoryLabel,
  type IncidentalFinding,
} from "@/lib/aiie/incidentals";
import { cn } from "@/lib/utils";

export interface IncidentalFollowupCardProps {
  finding: IncidentalFinding;
  /** Called when the clinician dismisses this finding for the session. */
  onDismiss?: () => void;
  /** Called when the clinician opts to schedule follow-up. */
  onSchedule?: () => void;
  className?: string;
}

/**
 * Surfaces a single untracked incidental finding from prior diagnostic reports.
 */
export function IncidentalFollowupCard({
  finding,
  onDismiss,
  onSchedule,
  className,
}: IncidentalFollowupCardProps) {
  const categoryLabel = incidentalCategoryLabel(finding.category);
  const intervalPhrase = followUpIntervalPhrase(finding.followupRecommended);

  return (
    <div
      className={cn(
        "arka-card rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 sm:p-5 space-y-3",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-semibold text-amber-950">Follow-up recommended</p>
          <p className="text-sm text-amber-900 leading-relaxed">
            Prior report from{" "}
            <time dateTime={finding.date}>{formatDisplayDate(finding.date)}</time> mentioned{" "}
            <strong>{categoryLabel}</strong>; {intervalPhrase} —{" "}
            <strong>{finding.daysOverdue} days overdue</strong>.
          </p>
          <p className="text-xs text-amber-800/90 line-clamp-3" title={finding.text}>
            {finding.text}
          </p>
          <p className="text-xs text-amber-800">
            <span className="font-medium">Evidence:</span> {finding.citation}
          </p>
        </div>
        {onDismiss ?
          <Button
            type="button"
            variant="ghost"
            className="shrink-0 text-amber-900 hover:bg-amber-500/20 min-h-[44px] min-w-[44px] p-2"
            aria-label="Dismiss incidental follow-up reminder"
            onClick={onDismiss}
          >
            <X className="h-4 w-4" aria-hidden />
          </Button>
        : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {onSchedule ?
          <Button
            type="button"
            variant="primary"
            className="min-h-[44px] bg-amber-700 hover:opacity-90"
            onClick={onSchedule}
          >
            <CalendarClock className="h-4 w-4 mr-2" aria-hidden />
            Schedule follow-up
          </Button>
        : null}
        {onDismiss ?
          <Button
            type="button"
            variant="secondary"
            className="min-h-[44px] border-amber-600/30 text-amber-950"
            onClick={onDismiss}
          >
            Dismiss
          </Button>
        : null}
      </div>

      <p className="text-xs text-amber-900/80 border-t border-amber-500/20 pt-3">{FDA_NON_DEVICE_CDS_DISCLOSURE}</p>
      <FDANonDeviceBanner product="CLIN" className="rounded-lg" />
    </div>
  );
}

function followUpIntervalPhrase(followupRecommended: string): string {
  if (/6\s*months?/i.test(followupRecommended)) {
    return "Fleischner-style follow-up recommended at 6 months";
  }
  if (/12\s*months?/i.test(followupRecommended)) {
    return "ACR-style follow-up recommended at 12 months";
  }
  return followupRecommended;
}

function formatDisplayDate(isoDate: string): string {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) {
    return isoDate;
  }
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
