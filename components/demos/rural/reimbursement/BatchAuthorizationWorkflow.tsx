"use client";

import { prepareBatchAuthorization } from "@/lib/demos/rural/reimbursement/batch-auth";
import type { BatchOrderEntry } from "@/lib/demos/rural/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/demos/rural/shared/ui/Card";
import { Badge } from "@/components/demos/rural/shared/ui/Badge";
import { Button } from "@/components/demos/rural/shared/ui/Button";
import { useSelectedFacility } from "@/lib/demos/rural/rural-store";
import { useMemo, useState } from "react";

const draftOrders: Omit<BatchOrderEntry, "status" | "exemptionApplied" | "estimatedReimbursement">[] = [
  {
    orderId: "b1",
    patientId: "DEMO-1",
    patientName: "Demo Patient",
    modality: "CT",
    cptCode: "74176",
    indication: "CT CAP w/ contrast",
  },
  {
    orderId: "b2",
    patientId: "DEMO-2",
    patientName: "Demo Patient",
    modality: "MRI",
    cptCode: "72148",
    indication: "MRI lumbar spine without contrast",
  },
];

export function BatchAuthorizationWorkflow() {
  const facility = useSelectedFacility();
  const visitDate = useMemo(
    () => facility.mobileUnits[0]?.nextVisitDate ?? new Date().toISOString().slice(0, 10),
    [facility.mobileUnits]
  );

  const [items, setItems] = useState<BatchOrderEntry[]>(() =>
    draftOrders.map((o) => ({
      ...o,
      status: "pending",
      estimatedReimbursement: 0,
    }))
  );
  const [lastRun, setLastRun] = useState<{ approved: number; totalRevenue: number } | null>(null);

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle>Batch authorization</CardTitle>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            const batch = prepareBatchAuthorization(facility, draftOrders, visitDate);
            setItems(batch.orders);
            setLastRun({ approved: batch.approvedCount, totalRevenue: batch.totalEstimatedRevenue });
          }}
        >
          Run batch pre-auth
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {lastRun ? (
          <p className="text-xs text-arka-text-dark-muted">
            Visit {visitDate}: {lastRun.approved} approved · est. revenue ${lastRun.totalRevenue.toLocaleString()}
          </p>
        ) : null}
        {items.map((i) => (
          <div key={i.orderId} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-arka-bg-medium/30 px-3 py-2 text-sm">
            <div>
              <p className="font-medium text-arka-text-dark">{i.indication}</p>
              <p className="text-xs text-arka-text-dark-muted">
                {i.patientId} · {i.patientName} · CPT {i.cptCode}
                {i.exemptionApplied ? ` · ${i.exemptionApplied.replace(/-/g, " ")}` : ""}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge variant={i.status === "approved" ? "success" : "warning"}>{i.status}</Badge>
              {i.estimatedReimbursement > 0 ? (
                <span className="text-xs text-arka-text-dark-muted">Est. ${i.estimatedReimbursement}</span>
              ) : null}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
