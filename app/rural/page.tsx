import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, AlertTriangle, Building2, ChevronRight, MapPin, Users } from "lucide-react";
import {
  RURAL_CRISIS_STATS,
  RURAL_HUB_AREAS,
  RURAL_PHASE_STATUS_META,
} from "@/lib/demos/rural/constants";
import { RuralHubMapLazy } from "@/components/demos/rural/shared/RuralHubMapLazy";
import { MetricCard } from "@/components/ins/MetricCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { routes } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Rural Imaging Solutions | ARKA Health",
  description:
    "ARKA for rural sites: right-order imaging guidance, remote reads, clinician training, and tools to keep local imaging programs viable.",
};

export default function RuralHubPage() {
  return (
    <div className="space-y-10 sm:space-y-14">
      <nav aria-label="Breadcrumb" className="text-sm font-medium text-arka-text-dark-muted">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link
              href={routes.home}
              className="transition-colors hover:text-arka-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500"
            >
              Home
            </Link>
          </li>
          <li className="flex items-center gap-1.5">
            <ChevronRight className="h-4 w-4 shrink-0 text-arka-text-dark-soft" aria-hidden />
            <span className="font-medium text-arka-teal">ARKA-RURAL</span>
          </li>
        </ol>
      </nav>

      {/* Hero */}
      <section className="grid gap-8 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="mb-3 font-mono text-xs font-medium uppercase tracking-[0.14em] text-arka-teal-600">
            Access &amp; equity phase
          </p>
          <h1 className="font-heading text-3xl font-semibold text-arka-text-dark sm:text-4xl lg:text-display">
            Rural Imaging Crisis Platform
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-arka-text-dark-muted sm:text-lg">
            Extends ARKA to rural hospitals and clinics — right-order imaging guidance, remote reads,
            clinician training, and tools to keep local imaging programs viable where access is scarce.
          </p>
        </div>
        <RuralHubMapLazy />
      </section>

      {/* Crisis stats */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          label="Rural hospitals at risk"
          value={RURAL_CRISIS_STATS.hospitalsAtRisk.toLocaleString()}
          delta={{ value: "Closure risk", direction: "up", positiveIsGood: false }}
        />
        <MetricCard
          label="Rural emergency hospitals"
          value={String(RURAL_CRISIS_STATS.currentREHs)}
          delta={{ value: "REH model", direction: "neutral" }}
        />
        <MetricCard
          label="Rural Americans underserved"
          value={`${RURAL_CRISIS_STATS.ruralAmericansUnderserved / 1_000_000}M+`}
          delta={{ value: "Access gap", direction: "neutral" }}
        />
        <MetricCard
          label="Teleradiology market by 2030"
          value={`$${RURAL_CRISIS_STATS.teleradiologyMarket2030 / 1e9}B`}
          delta={{
            value: `${RURAL_CRISIS_STATS.teleradiologyCAGR}% CAGR`,
            direction: "up",
            positiveIsGood: true,
          }}
        />
      </section>

      {/* Seven pillars */}
      <section>
        <div className="mb-6 text-center sm:mb-8">
          <p className="mb-2 font-mono text-xs font-medium uppercase tracking-[0.14em] text-arka-teal-600">
            Seven strategic pillars
          </p>
          <h2 className="font-heading text-2xl font-semibold text-arka-text-dark sm:text-3xl">
            Unified rural imaging hub
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-arka-text-dark-muted sm:text-base">
            Each pillar addresses a distinct barrier to rural imaging access — from CDS at order entry
            through reimbursement and population intelligence.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {RURAL_HUB_AREAS.map((area) => {
            const Icon = area.icon;
            const status = RURAL_PHASE_STATUS_META[area.phaseStatus];
            return (
              <Link key={area.id} href={area.href} className="group block h-full">
                <Card variant="interactive" className="h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-radius-md bg-arka-teal-50">
                        <Icon className="h-5 w-5 text-arka-teal-600" aria-hidden />
                      </div>
                      <Badge variant={status.badgeVariant} dot>
                        {status.label}
                      </Badge>
                    </div>
                    <CardTitle className="mt-3 text-lg">{area.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{area.valueStatement}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-arka-teal-600 transition-all group-hover:gap-2">
                      Explore
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Context strip */}
      <section className="rounded-radius-lg border border-border-subtle bg-surface-sunken p-4 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: AlertTriangle, label: "Hospitals in imminent danger", value: RURAL_CRISIS_STATS.hospitalsInImminentDanger },
            { icon: Building2, label: "Critical access hospitals", value: RURAL_CRISIS_STATS.criticalAccessHospitals },
            { icon: Users, label: "Radiologist shortage (est.)", value: RURAL_CRISIS_STATS.radiologistShortage },
            { icon: MapPin, label: "FDA-approved AI devices (radiology)", value: RURAL_CRISIS_STATS.fdaApprovedAIDevicesRadiology },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-arka-teal-600" aria-hidden />
              <div>
                <p className="text-2xl font-semibold tabular-nums text-arka-slate-900">
                  {value.toLocaleString()}
                </p>
                <p className="text-xs text-arka-slate-600">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
