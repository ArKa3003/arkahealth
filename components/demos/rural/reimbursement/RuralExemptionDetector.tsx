"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

import { detectApplicableExemptions } from "@/lib/demos/rural/reimbursement/exemption-db";
import { fetchRuralExemptions } from "@/lib/demos/rural/rural-api";
import { useSelectedFacility } from "@/lib/demos/rural/rural-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/demos/rural/shared/ui/Card";
import { Badge } from "@/components/demos/rural/shared/ui/Badge";

export function RuralExemptionDetector() {
  const facility = useSelectedFacility();
  const [applicable, setApplicable] = useState(() =>
    detectApplicableExemptions(facility.designation),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setUsedFallback(false);

      const result = await fetchRuralExemptions(facility.designation);

      if (cancelled) return;

      if (result.data) {
        setApplicable(result.data);
      } else {
        setApplicable(detectApplicableExemptions(facility.designation));
        setUsedFallback(true);
        setError(result.error);
      }

      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [facility.designation, facility.id]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rural exemption detector</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-arka-text-dark-muted" role="status">
            <Loader2 className="h-4 w-4 animate-spin text-arka-teal" aria-hidden />
            Checking payer exemptions…
          </div>
        ) : null}

        {error ? (
          <div
            className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning-bg px-3 py-2 text-xs text-warning"
            role="alert"
          >
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            <p>
              {usedFallback
                ? `API unavailable — showing local rules. ${error}`
                : error}
            </p>
          </div>
        ) : null}

        {!loading && applicable.length === 0 ? (
          <p className="text-sm text-arka-text-dark-muted">
            No matching payer exemptions for this facility&apos;s designations.
          </p>
        ) : null}

        {!loading
          ? applicable.map((r) => (
              <div key={r.id} className="rounded-lg border border-arka-primary/10 px-3 py-2 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-arka-text-dark">{r.payerName}</p>
                  <Badge variant={r.autoDetectable ? "success" : "muted"}>
                    {r.autoDetectable ? "Auto-detectable" : "Review"}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-arka-text-dark-muted">
                  {r.exemptionType.replace(/-/g, " ")}
                </p>
                <p className="mt-1 text-arka-text-dark-muted">{r.description}</p>
              </div>
            ))
          : null}
      </CardContent>
    </Card>
  );
}
