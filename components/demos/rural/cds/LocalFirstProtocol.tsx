"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/demos/rural/shared/ui/Card";

export function LocalFirstProtocol() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Local-first protocol</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="list-inside list-decimal space-y-2 text-sm text-arka-text-dark-muted">
          <li>Ultrasound-first when modality-appropriate.</li>
          <li>CT limited protocol; escalate slices only if clinically indicated.</li>
          <li>Sync CDS rationale to EHR for peer review.</li>
        </ol>
      </CardContent>
    </Card>
  );
}
