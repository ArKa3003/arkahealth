"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/demos/rural/shared/ui/Card";
import { Badge } from "@/components/demos/rural/shared/ui/Badge";

export function MobileUnitProtocol() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>Mobile unit protocol</CardTitle>
        <Badge>Field</Badge>
      </CardHeader>
      <CardContent className="text-sm text-arka-text-dark-muted">
        <p>
          Stabilize, capture priors, transmit DICOM + clinical context pack. Defer contrast studies without lab
          clearance on-board.
        </p>
      </CardContent>
    </Card>
  );
}
