"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/demos/rural/shared/ui/Card";

export function AlternativeStudyJustifier() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Alternative study justifier</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-arka-text-dark-muted">
        <p>
          When MRI is not available within clinically acceptable window, draft justification tying CT + US approach to
          guideline-consistent care (demo text).
        </p>
      </CardContent>
    </Card>
  );
}
