"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Scan, Magnet, CircleDot, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/demos/ins/ui/Card";
import { Badge } from "@/components/demos/ins/ui/Badge";
import { Button } from "@/components/demos/ins/ui/Button";
import { useInsDemoStore } from "@/lib/demos/ins/demo-store";
import { imagingOrders } from "@/lib/demos/ins/mock-data";
import type { ImagingOrder } from "@/lib/demos/ins/types";

const iconByType: Record<string, React.ReactNode> = {
  MRI: <Magnet className="h-6 w-6" />,
  CT: <Scan className="h-6 w-6" />,
  "PET-CT": <CircleDot className="h-6 w-6" />,
  PET: <CircleDot className="h-6 w-6" />,
};

function OrderCard({
  order,
  isSelected,
  onSelect,
}: {
  order: ImagingOrder;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const icon = iconByType[order.imagingType] ?? <Scan className="h-6 w-6" />;
  return (
    <Card
      variant="interactive"
      className={cn(
        "cursor-pointer transition-all duration-300",
        isSelected && "border-2 border-arka-deep ring-2 ring-arka-deep/20"
      )}
      onClick={onSelect}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-arka-deep/20 flex items-center justify-center text-arka-deep flex-shrink-0">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-heading font-semibold text-arka-text">
              {order.imagingType} — {order.bodyPart}
            </h3>
            <p className="text-sm text-arka-text-soft font-mono">{order.cptCode} {order.cptDescription}</p>
            <p className="text-sm text-arka-text-muted mt-1 line-clamp-2">{order.clinicalIndication}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge status="neutral" variant="subtle" size="sm">{order.urgency}</Badge>
              <Badge status="info" variant="subtle" size="sm">{order.orderingProvider.specialty}</Badge>
            </div>
          </div>
          <ChevronRight className={cn("h-5 w-5 text-arka-text-soft flex-shrink-0", isSelected && "text-arka-deep")} />
        </div>
      </CardContent>
    </Card>
  );
}

export function OrderEntry() {
  const { selectedPatientId, currentOrderId, setCurrentOrder, completeStep, nextStep } = useInsDemoStore();
  const ordersForPatient = imagingOrders.filter((o) => o.patientId === selectedPatientId);

  const handleContinue = () => {
    if (currentOrderId) {
      completeStep(2);
      nextStep();
    }
  };

  if (!selectedPatientId) {
    return (
      <p className="text-arka-text-soft">Select a patient in Step 1 first.</p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold text-arka-text mb-1">Order Entry</h2>
        <p className="text-arka-text-soft text-sm">Select the imaging order to submit for prior authorization.</p>
      </div>
      <div className="space-y-3">
        {ordersForPatient.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            isSelected={currentOrderId === order.id}
            onSelect={() => setCurrentOrder(order.id)}
          />
        ))}
      </div>
      <div className="flex justify-end">
        <Button variant="primary" size="md" onClick={handleContinue} disabled={!currentOrderId}>
          Continue to Pre-Submission Analysis
        </Button>
      </div>
    </div>
  );
}
