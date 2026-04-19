"use client";

import { packageClinicalContext } from "@/lib/demos/rural/tele/context-packager";
import type { FacilityProfile } from "@/lib/demos/rural/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/demos/rural/shared/ui/Card";

export function ClinicalContextPackager({ facility }: { facility: FacilityProfile }) {
  const accession = "ACC-2026-04-001";
  const pack = packageClinicalContext({
    orderIndication: "Demo order — packaged for teleradiology",
    patientHistory: ["Prior CT chest 2023-08 (external)", "US abdomen 2024-01"],
    labs: [
      {
        name: "Troponin",
        value: "<0.01",
        unit: "ng/mL",
        normalRange: "<0.04",
        isAbnormal: false,
        date: new Date().toISOString().slice(0, 10),
      },
      {
        name: "Creatinine",
        value: "1.1",
        unit: "mg/dL",
        normalRange: "0.7–1.3",
        isAbnormal: false,
        date: new Date().toISOString().slice(0, 10),
      },
    ],
    priorFindings: ["Prior chest: no acute process", "Abdomen US: normal"],
    arkaScore: 6,
    arkaCategory: "may-be-appropriate",
    redFlags: [],
    medications: ["metformin"],
    allergies: ["iodinated contrast — prior urticaria"],
    clinicalQuestion: `Accession ${accession} — ${facility.name} (${facility.type})`,
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle>Clinical context package</CardTitle>
        <p className="text-xs text-arka-text-dark-muted">{pack.clinicalQuestion}</p>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-arka-text-dark-muted">
        <p>
          <span className="font-medium text-arka-text-dark">Indication:</span> {pack.orderingIndication}
        </p>
        <div>
          <p className="font-medium text-arka-text-dark">Priors</p>
          <ul className="list-inside list-disc">
            {pack.priorImagingFindings.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-medium text-arka-text-dark">Labs</p>
          <ul className="mt-1 space-y-0.5">
            {pack.labValues.map((lv) => (
              <li key={lv.name}>
                {lv.name}: {lv.value} {lv.unit}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
