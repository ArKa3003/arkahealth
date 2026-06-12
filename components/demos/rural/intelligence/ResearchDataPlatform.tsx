"use client";

import { useState } from "react";
import { Download } from "lucide-react";

import { imagingDesertPoints } from "@/lib/demos/rural/intelligence/imaging-desert-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/demos/rural/shared/ui/Card";
import { Badge } from "@/components/demos/rural/shared/ui/Badge";
import { Button } from "@/components/demos/rural/shared/ui/Button";

const COHORT_FIELDS = [
  { id: "access", label: "Imaging access score" },
  { id: "transfer", label: "Transfer delay" },
  { id: "screening", label: "Screening adherence" },
] as const;

export function ResearchDataPlatform() {
  const [selected, setSelected] = useState<string[]>(["access", "transfer"]);
  const [exported, setExported] = useState(false);

  const toggleField = (id: string) => {
    setSelected((current) =>
      current.includes(id) ? current.filter((f) => f !== id) : [...current, id],
    );
    setExported(false);
  };

  const handleExport = () => {
    setExported(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>Research data platform</CardTitle>
        <Badge variant="demo">Synthetic</Badge>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-arka-text-dark-muted">
        <p>Federated cohort builder for rural imaging outcomes with IRB-ready export stubs (demo).</p>

        <fieldset className="space-y-2">
          <legend className="text-xs font-medium uppercase tracking-wide text-arka-slate-600">
            Cohort fields
          </legend>
          {COHORT_FIELDS.map((field) => (
            <label key={field.id} className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={selected.includes(field.id)}
                onChange={() => toggleField(field.id)}
                className="accent-arka-teal-600"
              />
              <span className="text-arka-text-dark">{field.label}</span>
            </label>
          ))}
        </fieldset>

        <div className="rounded-lg border border-arka-light bg-arka-bg-alt px-3 py-2 text-xs">
          <p className="font-medium text-arka-text-dark">
            Preview · {imagingDesertPoints.length} regions · {selected.length} fields
          </p>
          <p className="mt-1 text-arka-text-dark-muted">
            {imagingDesertPoints.map((p) => `${p.label} (${p.accessScore}/100)`).join(" · ")}
          </p>
        </div>

        <Button
          type="button"
          variant="secondary"
          className="min-h-[44px]"
          onClick={handleExport}
          disabled={selected.length === 0}
        >
          <Download className="h-4 w-4" aria-hidden />
          Export cohort stub
        </Button>

        {exported ? (
          <p className="text-xs text-success" role="status">
            IRB-ready CSV stub generated (demo — no PHI).
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
