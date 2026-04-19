"use client";

import { suggestSubspecialty } from "@/lib/demos/rural/tele/routing-engine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/demos/rural/shared/ui/Card";

const modalities = ["CT abdomen", "MRI shoulder", "US DVT"];

export function MultiProviderRouter() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Multi-provider routing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-arka-text-dark-muted">
        {modalities.map((m) => (
          <p key={m}>
            <span className="font-medium text-arka-text-dark">{m}</span> → {suggestSubspecialty(m)}
          </p>
        ))}
      </CardContent>
    </Card>
  );
}
