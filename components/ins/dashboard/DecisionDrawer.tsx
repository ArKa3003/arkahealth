"use client";

import Link from "next/link";

import { ScoreRing } from "@/components/ui/score-ring";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { FDA_NON_DEVICE_CDS_DISCLOSURE } from "@/lib/compliance/fda-disclosure";
import { cn } from "@/lib/utils";

import type { RecentDecisionRow } from "./recent-decisions";

export interface DecisionDrawerProps {
  decision: RecentDecisionRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function statusVariant(status: RecentDecisionRow["status"]) {
  switch (status) {
    case "approved":
    case "auto_approved":
      return "success" as const;
    case "denied":
      return "danger" as const;
    case "pended":
      return "warning" as const;
    default:
      return "neutral" as const;
  }
}

function statusLabel(status: RecentDecisionRow["status"]): string {
  return status.replace("_", " ");
}

/**
 * Right-side decision detail sheet — factor breakdown, evidence links, FDA disclaimer.
 */
export function DecisionDrawer({ decision, open, onOpenChange }: DecisionDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" aria-describedby={decision ? "decision-drawer-desc" : undefined}>
        {decision ? (
          <>
            <SheetHeader>
              <div className="flex items-start gap-4">
                <ScoreRing score={decision.aiieScore} size={72} label="" animate={false} />
                <div className="min-w-0 flex-1 pt-1">
                  <SheetTitle>
                    CPT {decision.cptCode} · {decision.payerLabel}
                  </SheetTitle>
                  <SheetDescription id="decision-drawer-desc">
                    Decided {new Date(decision.decisionAt).toLocaleString()}
                  </SheetDescription>
                  <Badge variant={statusVariant(decision.status)} className="mt-2 capitalize">
                    {statusLabel(decision.status)}
                  </Badge>
                </div>
              </div>
            </SheetHeader>

            <SheetBody className="space-y-6">
              {decision.denialReason ? (
                <section>
                  <h3 className="text-sm font-semibold text-arka-slate-900">Denial reason</h3>
                  <p className="mt-2 text-sm leading-relaxed text-arka-slate-600">{decision.denialReason}</p>
                </section>
              ) : null}

              <section>
                <h3 className="text-sm font-semibold text-arka-slate-900">AIIE factor breakdown</h3>
                <ul className="mt-3 space-y-3">
                  {decision.factors.map((f) => {
                    const max = Math.max(...decision.factors.map((x) => Math.abs(x.contribution)), 0.001);
                    const width = (Math.abs(f.contribution) / max) * 100;
                    const positive = f.contribution > 0;
                    return (
                      <li key={f.id}>
                        <div className="mb-1 flex justify-between gap-2 text-xs text-arka-slate-600">
                          <span>{f.label}</span>
                          <span className="shrink-0 font-mono tabular-nums text-arka-slate-800">
                            {f.contribution > 0 ? "+" : ""}
                            {f.contribution.toFixed(1)}
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-arka-slate-100">
                          <div
                            className={cn(
                              "h-2 rounded-full",
                              positive ? "bg-arka-teal-500" : "bg-warning",
                            )}
                            style={{ width: `${width}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-arka-slate-900">Evidence</h3>
                <ul className="mt-2 space-y-2">
                  {decision.evidenceLinks.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm font-medium text-arka-teal-700 underline decoration-arka-teal-700/30 underline-offset-2 hover:decoration-arka-teal-700"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>

              <div
                role="note"
                className="rounded-radius-md border border-border-subtle bg-surface-sunken px-3 py-3 text-caption leading-relaxed text-arka-slate-600"
              >
                {FDA_NON_DEVICE_CDS_DISCLOSURE}
              </div>
            </SheetBody>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
