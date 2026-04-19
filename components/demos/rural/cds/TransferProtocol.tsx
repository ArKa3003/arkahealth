"use client";

import { buildTransferProtocol } from "@/lib/demos/rural/scoring/transfer-logic";
import type { FacilityProfile } from "@/lib/demos/rural/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/demos/rural/shared/ui/Card";

export function TransferProtocol({ facility, studyType }: { facility: FacilityProfile; studyType: string }) {
  const draft = buildTransferProtocol(facility, studyType);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Transfer protocol (draft)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-arka-text-dark-muted">
        <p>
          <span className="font-medium text-arka-text-dark">Reason:</span> {draft.reason}
        </p>
        <p>
          <span className="font-medium text-arka-text-dark">ETA to hub handoff:</span> ~{draft.etaMinutes} min
        </p>
        <ul className="list-inside list-disc space-y-1">
          {draft.checklist.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
