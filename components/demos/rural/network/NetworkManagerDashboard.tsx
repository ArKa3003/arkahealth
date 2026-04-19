"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Building2, Cpu, Phone, Truck, Users } from "lucide-react";
import { HubSpokeNetworkDiagram, type NetworkLayoutNode } from "@/components/demos/rural/network/HubSpokeNetworkDiagram";
import { SharedQualityDashboard } from "@/components/demos/rural/network/SharedQualityDashboard";
import { RuralStatBanner } from "@/components/demos/rural/shared/RuralStatBanner";
import { Badge } from "@/components/demos/rural/shared/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/demos/rural/shared/ui/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/demos/rural/shared/ui/Tabs";
import { DEMO_FACILITIES, getDemoFacilitiesByRole } from "@/lib/demos/rural/facility-profiles";
import type { FacilityProfile } from "@/lib/demos/rural/types";

function buildLayout(hub: FacilityProfile): NetworkLayoutNode[] {
  const cx = 210;
  const cy = 118;
  const rSpoke = 128;
  const rInd = 124;

  const spokes = getDemoFacilitiesByRole("spoke").filter((s) => s.hubFacilityId === hub.id);
  const independents = getDemoFacilitiesByRole("independent");

  const nodes: NetworkLayoutNode[] = [
    { facility: hub, x: cx, y: cy, linkToHub: "none" },
  ];

  spokes.forEach((f, i) => {
    const spread = Math.min(spokes.length, 4);
    const start = Math.PI / 2 - (Math.PI * 0.42 * (spread - 1)) / 2;
    const angle = spokes.length === 1 ? Math.PI / 2 : start + ((Math.PI * 0.42 * i) / Math.max(1, spokes.length - 1));
    nodes.push({
      facility: f,
      x: cx + rSpoke * Math.cos(angle),
      y: cy + rSpoke * Math.sin(angle),
      linkToHub: "solid",
    });
  });

  independents.forEach((f, i) => {
    const angle = Math.PI * 0.35 + (i * Math.PI) / Math.max(2, independents.length + 1);
    nodes.push({
      facility: f,
      x: cx + rInd * Math.cos(angle),
      y: cy + rInd * Math.sin(angle),
      linkToHub: "dashed",
    });
  });

  return nodes;
}

function facilityById(id: string | null): FacilityProfile | undefined {
  if (!id) return undefined;
  return DEMO_FACILITIES.find((f) => f.id === id);
}

export function NetworkManagerDashboard() {
  const hub = getDemoFacilitiesByRole("hub")[0]!;
  const spokes = useMemo(
    () => getDemoFacilitiesByRole("spoke").filter((s) => s.hubFacilityId === hub.id),
    [hub.id]
  );
  const layoutNodes = useMemo(() => buildLayout(hub), [hub]);

  const [selectedId, setSelectedId] = useState<string | null>(hub.id);
  const selected = facilityById(selectedId) ?? hub;

  const mobileDays = useMemo(() => {
    const set = new Set<string>();
    DEMO_FACILITIES.forEach((f) => {
      f.mobileUnits.forEach((m) => m.visitDays.forEach((d) => set.add(d)));
    });
    return set.size;
  }, []);

  return (
    <div className="space-y-6">
      <RuralStatBanner
        stats={[
          { label: "Network sites", value: String(layoutNodes.length), hint: "Hub + connected" },
          { label: "Spokes (contracted)", value: String(spokes.length), hint: "To this hub" },
          { label: "Mobile visit days", value: String(mobileDays), hint: "Across demo cohort" },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-arka-teal" aria-hidden />
              Network topology
            </CardTitle>
            <p className="mt-1 text-sm text-arka-text-dark-muted">
              Solid lines: contracted spokes. Dashed lines: independent sites under shared protocols (demo).
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            <HubSpokeNetworkDiagram
              nodes={layoutNodes}
              hubId={hub.id}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Facility details</CardTitle>
            <p className="mt-1 text-sm text-arka-text-dark-muted">{selected.name}</p>
          </CardHeader>
          <CardContent className="pt-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <FacilityDetailTabs facility={selected} spokes={spokes} />
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>

      <SharedQualityDashboard hub={hub} spoke={spokes[0]} />
    </div>
  );
}

function FacilityDetailTabs({ facility, spokes }: { facility: FacilityProfile; spokes: FacilityProfile[] }) {
  return (
    <Tabs defaultValue="equipment">
      <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
        <TabsTrigger value="equipment" className="gap-1">
          <Cpu className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Equipment
        </TabsTrigger>
        <TabsTrigger value="staffing" className="gap-1">
          <Users className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Staffing
        </TabsTrigger>
        <TabsTrigger value="mobile" className="gap-1">
          <Truck className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Mobile
        </TabsTrigger>
        <TabsTrigger value="transfer" className="gap-1">
          <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Transfer
        </TabsTrigger>
      </TabsList>

      <TabsContent value="equipment" className="mt-3 space-y-2 text-sm">
        {facility.equipment.length === 0 ? (
          <p className="text-arka-text-dark-muted">No registered equipment for this site (demo).</p>
        ) : (
          facility.equipment.map((eq) => (
            <div
              key={eq.id}
              className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-arka-primary/10 bg-arka-bg-medium/20 px-3 py-2"
            >
              <div>
                <p className="font-medium text-arka-text-dark">
                  {eq.modality}{" "}
                  <span className="font-normal text-arka-text-dark-muted">
                    · {eq.manufacturer} {eq.model}
                  </span>
                </p>
                <p className="text-xs text-arka-text-dark-muted">
                  Utilization {eq.utilizationRate}% · ~{eq.averageStudiesPerDay} studies/day · {eq.maintenanceStatus}
                </p>
              </div>
              <Badge variant={eq.aiCompatible ? "success" : "muted"}>{eq.aiCompatible ? "AI-ready" : "Standard"}</Badge>
            </div>
          ))
        )}
      </TabsContent>

      <TabsContent value="staffing" className="mt-3 space-y-3 text-sm">
        <div className="rounded-lg border border-arka-primary/10 bg-arka-bg-medium/20 px-3 py-2">
          <p className="text-xs font-medium uppercase tracking-wide text-arka-text-dark-muted">Radiologists</p>
          {facility.staffing.radiologists.length === 0 ? (
            <p className="mt-1 text-arka-text-dark-muted">None on-site (teleradiology may apply).</p>
          ) : (
            <ul className="mt-1 space-y-1">
              {facility.staffing.radiologists.map((r) => (
                <li key={r.id} className="text-arka-text-dark">
                  {r.name}{" "}
                  <span className="text-arka-text-dark-muted">
                    ({r.fullTime ? "FTE" : `${r.scheduledHours}h/wk`})
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-lg border border-arka-primary/10 bg-arka-bg-medium/20 px-3 py-2">
          <p className="text-xs font-medium uppercase tracking-wide text-arka-text-dark-muted">Technologists</p>
          {facility.staffing.technologists.length === 0 ? (
            <p className="mt-1 text-arka-text-dark-muted">None listed.</p>
          ) : (
            <ul className="mt-1 space-y-1">
              {facility.staffing.technologists.map((t) => (
                <li key={t.id} className="text-arka-text-dark">
                  {t.name}{" "}
                  <span className="text-arka-text-dark-muted">
                    · {t.modalityCompetencies.slice(0, 4).join(", ")}
                    {t.modalityCompetencies.length > 4 ? "…" : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <p className="text-xs text-arka-text-dark-muted">
          Coverage weekdays {facility.staffing.coverageSchedule.weekday.start}–{facility.staffing.coverageSchedule.weekday.end}
          {facility.staffing.coverageSchedule.weekend
            ? ` · weekends ${facility.staffing.coverageSchedule.weekend.start}–${facility.staffing.coverageSchedule.weekend.end}`
            : ""}{" "}
          · After-hours: {facility.staffing.hasAfterHoursCoverage ? "Yes" : "Limited"}
          {facility.staffing.teleradiologyForAfterHours ? " (tele)" : ""}
        </p>
      </TabsContent>

      <TabsContent value="mobile" className="mt-3 space-y-2 text-sm">
        {facility.mobileUnits.length === 0 ? (
          <p className="text-arka-text-dark-muted">No mobile imaging visits scheduled for this site (demo).</p>
        ) : (
          facility.mobileUnits.map((m) => (
            <div key={m.id} className="rounded-lg border border-arka-primary/10 px-3 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-arka-text-dark">
                  {m.modality} · {m.provider}
                </span>
                <Badge variant="muted">{m.visitFrequency}</Badge>
              </div>
              <p className="mt-1 text-xs text-arka-text-dark-muted">
                {m.visitDays.join(", ")} · Next {m.nextVisitDate} · {m.slotsPerVisit} slots · {m.averageUtilization}% filled
              </p>
            </div>
          ))
        )}
      </TabsContent>

      <TabsContent value="transfer" className="mt-3 space-y-2 text-sm">
        {facility.networkRole === "hub" ? (
          <div className="rounded-lg border border-arka-primary/10 bg-arka-bg-medium/20 px-3 py-2 text-arka-text-dark">
            <p className="font-medium">Receiving hub</p>
            <p className="mt-1 text-arka-text-dark-muted">
              Contracted spokes ({spokes.length}): {spokes.map((s) => s.name).join(", ") || "—"}
            </p>
            <p className="mt-2 text-xs text-arka-text-dark-muted">
              Configure shared protocols, peer review, and escalation paths with each spoke in production.
            </p>
          </div>
        ) : facility.transferAgreements.length === 0 ? (
          <p className="text-arka-text-dark-muted">No transfer agreements on file (demo).</p>
        ) : (
          facility.transferAgreements.map((t) => (
            <div key={t.id} className="rounded-lg border border-arka-primary/10 px-3 py-2">
              <p className="font-medium text-arka-text-dark">{t.partnerFacilityName}</p>
              <p className="mt-1 text-xs text-arka-text-dark-muted">
                ~{t.estimatedTransferMinutes} min · {t.distanceMiles} mi · {t.transferProtocol}
                {t.preNotificationRequired ? " · pre-notification" : ""}
              </p>
              <p className="mt-1 text-xs text-arka-text-dark-muted">{t.contactPhone}</p>
              <p className="mt-1 text-[11px] text-arka-text-dark-muted">
                Modalities: {t.availableModalities.slice(0, 6).join(", ")}
                {t.availableModalities.length > 6 ? "…" : ""}
              </p>
            </div>
          ))
        )}
      </TabsContent>
    </Tabs>
  );
}
