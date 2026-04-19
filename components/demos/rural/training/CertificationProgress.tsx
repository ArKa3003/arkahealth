"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/demos/rural/shared/ui/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/demos/rural/shared/ui/Tabs";

export function CertificationProgress() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Certification progress</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="core">
          <TabsList>
            <TabsTrigger value="core">Core</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>
          <TabsContent value="core" className="text-sm text-arka-text-dark-muted">
            Core imaging safety modules complete (demo).
          </TabsContent>
          <TabsContent value="advanced" className="text-sm text-arka-text-dark-muted">
            Advanced subspecialty modules queued (demo).
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
