"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";

import { GoldCardDashboardClient } from "@/components/ins/provider/GoldCardDashboardClient";
import { OrderLifecycleTable } from "@/components/ins/provider/OrderLifecycleTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ProviderTab = "gold-card" | "lifecycle";

/**
 * Tabbed provider / scheduler hub: gold card portfolio and order lifecycle.
 */
export function ProviderDashboardClient() {
  const searchParams = useSearchParams();
  const initialTab: ProviderTab =
    searchParams.get("tab") === "lifecycle" ? "lifecycle" : "gold-card";
  const [tab, setTab] = React.useState<ProviderTab>(initialTab);

  return (
    <Tabs
      value={tab}
      onValueChange={(v) => setTab(v as ProviderTab)}
      className="min-h-[50vh] bg-slate-50"
    >
      <div className="border-b border-slate-200 bg-white px-4 pt-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="gold-card">Gold Card</TabsTrigger>
          <TabsTrigger value="lifecycle">Order Lifecycle</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="gold-card" className="mt-0 focus-visible:outline-none">
        <GoldCardDashboardClient embedded />
      </TabsContent>
      <TabsContent value="lifecycle" className="mt-0 focus-visible:outline-none">
        <OrderLifecycleTable />
      </TabsContent>
    </Tabs>
  );
}
