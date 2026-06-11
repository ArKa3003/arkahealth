"use client";

import {
  ArrowRight,
  Building2,
  FileText,
  Monitor,
  Radio,
  Stethoscope,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const FLOW_STEPS = [
  { label: "Acquire study", icon: Monitor },
  { label: "Package context", icon: FileText },
  { label: "AI triage", icon: Zap },
  { label: "Route read", icon: Radio },
  { label: "Return report", icon: Stethoscope },
] as const;

/**
 * Side-by-side originating site / distant site visual for ARKA-TELE.
 */
export function TeleSiteFlow() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-h3">Originating site → distant site flow</CardTitle>
        <p className="text-caption text-arka-slate-500">
          How a rural facility study moves through ARKA-TELE to a teleradiology partner (demo).
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
          <SitePanel
            variant="originating"
            title="Originating site"
            subtitle="Critical Access Hospital · Kansas"
            items={[
              "Study acquired on-site (X-ray, CT, US)",
              "ARKA-RURAL CDS context attached",
              "DICOM + clinical package transmitted",
            ]}
          />

          <div className="flex flex-col items-center justify-center gap-2 px-2 py-4 lg:py-0">
            <div className="hidden h-full w-px bg-border-subtle lg:block" aria-hidden />
            <div className="flex flex-col items-center gap-3 rounded-radius-lg border border-arka-teal-200 bg-arka-teal-50 px-4 py-5 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-radius-md bg-arka-teal-600 text-white">
                <Radio className="h-5 w-5" aria-hidden />
              </div>
              <p className="text-sm font-semibold text-arka-slate-900">ARKA-TELE</p>
              <p className="max-w-[9rem] text-xs text-arka-slate-600">
                Orchestration, triage, and provider routing
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-arka-teal-600 lg:rotate-0 rotate-90" aria-hidden />
          </div>

          <SitePanel
            variant="distant"
            title="Distant site"
            subtitle="Teleradiology partner · 24/7 coverage"
            items={[
              "AI-prioritized worklist intake",
              "Subspecialty match when needed",
              "Preliminary or final report returned",
            ]}
          />
        </div>

        <ol className="grid gap-2 sm:grid-cols-5">
          {FLOW_STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <li
                key={step.label}
                className="flex items-center gap-2 rounded-radius-md border border-border-subtle bg-surface-raised px-3 py-2.5"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-arka-teal-100 text-xs font-semibold text-arka-teal-700">
                  {index + 1}
                </span>
                <Icon className="h-4 w-4 shrink-0 text-arka-teal-600" aria-hidden />
                <span className="text-xs font-medium text-arka-slate-700">{step.label}</span>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}

function SitePanel({
  variant,
  title,
  subtitle,
  items,
}: {
  variant: "originating" | "distant";
  title: string;
  subtitle: string;
  items: string[];
}) {
  const isOriginating = variant === "originating";

  return (
    <div
      className={cn(
        "flex flex-col rounded-radius-lg border p-4 sm:p-5",
        isOriginating
          ? "border-info/30 bg-info-bg/40"
          : "border-success/30 bg-success-bg/40",
      )}
    >
      <div className="mb-4 flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-radius-md",
            isOriginating ? "bg-info text-white" : "bg-success text-white",
          )}
        >
          <Building2 className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-arka-slate-900">{title}</h3>
            <Badge variant={isOriginating ? "info" : "success"} dot>
              {isOriginating ? "Rural facility" : "Read partner"}
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-arka-slate-600">{subtitle}</p>
        </div>
      </div>
      <ul className="space-y-2 text-sm text-arka-slate-700">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <span
              className={cn(
                "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                isOriginating ? "bg-info" : "bg-success",
              )}
              aria-hidden
            />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
