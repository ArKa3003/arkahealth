"use client";

import { buildTransferProtocol } from "@/lib/demos/rural/scoring/transfer-logic";
import { useSelectedFacility } from "@/lib/demos/rural/rural-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/demos/rural/shared/ui/Card";

export function TransferProtocolAutomation() {
  const facility = useSelectedFacility();
  const draft = buildTransferProtocol(facility, "MRI");
  return (
    <Card>
      <CardHeader>
        <CardTitle>Transfer protocol automation</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-arka-text-dark-muted">
        <p>Auto-generated checklist ETA ~{draft.etaMinutes} min for {facility.name}.</p>
      </CardContent>
    </Card>
  );
}
