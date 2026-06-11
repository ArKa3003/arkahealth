"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TableScrollWrapper } from "@/components/ui/TableScrollWrapper";
import { RURAL_IMAGING_RATES } from "@/lib/demos/rural/reimbursement/rate-schedule";

/**
 * Rural imaging rate schedule with sticky header for horizontal scroll on mobile.
 */
export function RuralRateTable() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-h3">Rural imaging rate schedule</CardTitle>
        <p className="text-caption text-arka-slate-500">
          Illustrative professional-component rates ($) with rural adjustment factors — demo data only.
        </p>
      </CardHeader>
      <CardContent>
        <TableScrollWrapper aria-label="Rural imaging reimbursement rates">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-surface shadow-[0_1px_0_var(--border-subtle)]">
              <tr className="text-left text-xs font-medium uppercase tracking-wide text-arka-slate-500">
                <th className="px-4 py-3 font-medium">CPT</th>
                <th className="px-4 py-3 font-medium">Study</th>
                <th className="px-4 py-3 font-medium">Modality</th>
                <th className="px-4 py-3 text-right font-medium">Medicare</th>
                <th className="px-4 py-3 text-right font-medium">Medicaid</th>
                <th className="px-4 py-3 text-right font-medium">Commercial</th>
                <th className="px-4 py-3 text-right font-medium">Rural adj.</th>
              </tr>
            </thead>
            <tbody>
              {RURAL_IMAGING_RATES.map((row) => (
                <tr
                  key={row.cpt}
                  className="border-t border-border-subtle transition-colors hover:bg-surface-sunken"
                >
                  <td className="px-4 py-3 font-mono text-xs text-arka-slate-700">{row.cpt}</td>
                  <td className="px-4 py-3 text-arka-slate-900">{row.description}</td>
                  <td className="px-4 py-3 text-arka-slate-600">{row.modality}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-arka-slate-900">
                    ${row.medicare}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-arka-slate-900">
                    ${row.medicaid}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-arka-slate-900">
                    ${row.commercial}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium text-arka-teal-700">
                    ×{row.ruralAdj.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScrollWrapper>
      </CardContent>
    </Card>
  );
}
