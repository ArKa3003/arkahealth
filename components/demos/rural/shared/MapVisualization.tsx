"use client";

import { useState } from "react";

import { ImagingAccessMap } from "@/components/demos/rural/intelligence/ImagingAccessMap";
import { imagingDesertPoints } from "@/lib/demos/rural/intelligence/imaging-desert-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/demos/rural/shared/ui/Card";
import { cn } from "@/lib/utils";

export function MapVisualization() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pinnedId, setPinnedId] = useState<string | null>(null);

  const handleRegionSelect = (id: string) => {
    setPinnedId((current) => (current === id ? null : id));
    setActiveId(id);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Imaging access snapshot (demo)</CardTitle>
      </CardHeader>
      <CardContent>
        <ImagingAccessMap
          activeId={activeId}
          pinnedId={pinnedId}
          onRegionHover={setActiveId}
          onRegionSelect={handleRegionSelect}
        />
        <ul className="mt-3 space-y-1 text-sm text-arka-text-dark-muted" aria-label="Imaging access regions">
          {imagingDesertPoints.map((p) => {
            const highlighted = activeId === p.id || pinnedId === p.id;
            return (
              <li
                key={p.id}
                className={cn(
                  "rounded-radius-sm px-2 py-1 transition-colors",
                  highlighted && "bg-arka-teal-50 text-arka-text-dark",
                )}
                aria-current={highlighted ? "true" : undefined}
              >
                <span className="font-medium text-arka-text-dark">{p.label}</span> — access score{" "}
                {p.accessScore}/100
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
