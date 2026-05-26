'use client';

/**
 * @file EpicSimChart.tsx
 * @description Left-column EpicSim™ patient chart mock for the CDS Hooks live demo.
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DemoScenario } from './scenarios';
export interface EpicSimChartProps {
  scenario: DemoScenario;
  onSignOrder: () => void;
  signing?: boolean;
  onScenarioSelect: (id: string) => void;
  scenarioIds: { id: string; label: string }[];
}

/**
 * Renders the mock EHR chart panel (patient header, problems, draft order, scenario picker).
 */
export function EpicSimChart({
  scenario,
  onSignOrder,
  signing = false,
  onScenarioSelect,
  scenarioIds,
}: EpicSimChartProps) {
  const sexLabel = scenario.sex === 'Male' ? 'M' : 'F';

  return (
    <section
      className="flex flex-col gap-4 rounded-xl border border-arka-light bg-white p-4 shadow-sm"
      aria-label="EpicSim patient chart"
    >
      <header className="border-b border-arka-primary/10 pb-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-arka-muted">EpicSim™ — Patient Chart</p>
        <h2 className="mt-2 text-lg font-semibold text-arka-text-dark">
          {scenario.patientName} · {scenario.age}
          {sexLabel} · MRN {scenario.mrn}
        </h2>
        <p className="mt-1 text-sm text-arka-text-dark-muted">
          Allergies: {scenario.allergies} · eGFR: {scenario.eGFR}
        </p>
      </header>

      <div>
        <h3 className="text-sm font-medium text-arka-text-dark">Active problems</h3>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-arka-text-dark-muted" aria-label="Active problems">
          {scenario.problems.map((p) => (
            <li key={p.icd10}>
              {p.display} ({p.icd10})
            </li>
          ))}
        </ul>
      </div>

      <Card className="border-arka-teal/30 bg-arka-pale/20 dark:bg-arka-teal/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-arka-teal">Imaging order (draft)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="font-medium text-arka-text-dark">{scenario.orderDisplay}</p>
          <p className="text-arka-text-dark-muted">CPT {scenario.cpt}</p>
          <p className="text-arka-text-dark-muted">
            Indication: {scenario.chiefComplaint} ({scenario.icd10})
          </p>
          <p className="text-arka-text-dark-muted">
            Duration:{' '}
            {scenario.duration % 7 === 0
              ? `${scenario.duration / 7} weeks`
              : `${scenario.duration} days`}
          </p>
          <Button
            type="button"
            variant="primary"
            className="mt-2 w-full bg-arka-teal hover:bg-arka-teal-dark focus-visible:ring-2 focus-visible:ring-arka-cyan"
            onClick={onSignOrder}
            disabled={signing}
            aria-label="Sign imaging order"
          >
            {signing ? 'Signing…' : 'Sign Order'}
          </Button>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Demo scenarios">
        <span className="w-full text-xs font-medium text-arka-muted">Scenarios:</span>
        {scenarioIds.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onScenarioSelect(s.id)}
            className="focus:outline-none focus-visible:ring-2 focus-visible:ring-arka-cyan"
            aria-pressed={scenario.id === s.id}
            aria-label={`Load scenario ${s.label}`}
          >
            <Badge
              variant={scenario.id === s.id ? 'default' : 'outline'}
              className={
                scenario.id === s.id
                  ? 'border-arka-teal bg-arka-teal/15 text-arka-teal cursor-default'
                  : 'cursor-pointer hover:border-arka-teal/50'
              }
            >
              {s.label}
            </Badge>
          </button>
        ))}
      </div>
    </section>
  );
}
