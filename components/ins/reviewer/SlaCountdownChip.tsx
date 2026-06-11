"use client";

import { Clock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { CMS0057_EXPEDITED_HOURS, CMS0057_STANDARD_HOURS } from "@/lib/validation/metrics";
import { cn } from "@/lib/utils";

export interface SlaCountdownChipProps {
  deadlineAt: string;
  expedited: boolean;
  className?: string;
}

type SlaTone = "ok" | "amber" | "red" | "overdue";

function slaState(deadlineAt: string): { label: string; tone: SlaTone; hoursLeft: number } {
  const hoursLeft = (new Date(deadlineAt).getTime() - Date.now()) / 3600000;
  if (hoursLeft <= 0) {
    return { label: "SLA overdue", tone: "overdue", hoursLeft };
  }
  const h = Math.ceil(hoursLeft);
  const label = h < 24 ? `${h}h left` : `${Math.ceil(h / 24)}d left`;
  if (hoursLeft < 4) return { label, tone: "red", hoursLeft };
  if (hoursLeft < 12) return { label, tone: "amber", hoursLeft };
  return { label, tone: "ok", hoursLeft };
}

function toneToVariant(tone: SlaTone): "success" | "warning" | "danger" | "neutral" {
  switch (tone) {
    case "ok":
      return "success";
    case "amber":
      return "warning";
    case "red":
    case "overdue":
      return "danger";
    default:
      return "neutral";
  }
}

/**
 * CMS-0057-F SLA countdown — 72h standard / 24h expedited with amber &lt;12h, red &lt;4h.
 */
export function SlaCountdownChip({ deadlineAt, expedited, className }: SlaCountdownChipProps) {
  const { label, tone } = slaState(deadlineAt);
  const windowLabel = expedited ? `${CMS0057_EXPEDITED_HOURS}h exp` : `${CMS0057_STANDARD_HOURS}h std`;

  return (
    <Badge variant={toneToVariant(tone)} dot className={cn("font-normal tabular-nums", className)}>
      <Clock className="h-3 w-3" aria-hidden />
      <span>{label}</span>
      <span className="text-[10px] opacity-80">· {windowLabel}</span>
    </Badge>
  );
}
