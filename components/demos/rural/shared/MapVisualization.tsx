"use client";

import { imagingDesertPoints } from "@/lib/demos/rural/intelligence/imaging-desert-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/demos/rural/shared/ui/Card";

export function MapVisualization() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Imaging access snapshot (demo)</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className="relative aspect-[16/9] w-full overflow-hidden rounded-lg border border-dashed border-arka-primary/25 bg-arka-bg-medium/40"
          role="img"
          aria-label="Abstract map of imaging access scores"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-arka-teal/10 via-transparent to-transparent" />
          {imagingDesertPoints.map((p, i) => (
            <span
              key={p.id}
              className="absolute flex h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-arka-teal shadow-md"
              style={{
                left: `${30 + i * 18}%`,
                top: `${35 + (i % 2) * 22}%`,
              }}
              title={`${p.label}: access ${p.accessScore}`}
            />
          ))}
        </div>
        <ul className="mt-3 space-y-1 text-sm text-arka-text-dark-muted">
          {imagingDesertPoints.map((p) => (
            <li key={p.id}>
              <span className="font-medium text-arka-text-dark">{p.label}</span> — access score {p.accessScore}/100
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
