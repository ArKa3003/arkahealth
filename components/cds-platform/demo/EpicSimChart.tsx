'use client';

/**
 * @file EpicSimChart.tsx
 * @description Left-column EpicSim™ patient chart mock for the CDS Hooks live demo.
 */

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { DemoScenario } from './scenarios';

export interface EpicSimChartProps {
  scenario: DemoScenario;
  onSignOrder: () => void;
  signing?: boolean;
  onScenarioSelect: (id: string) => void;
  scenarioIds: { id: string; label: string }[];
}

type ChartTab = 'summary' | 'results' | 'orders';

/** Plausible demo vitals keyed loosely by scenario id prefix. */
function vitalsForScenario(scenario: DemoScenario): { label: string; value: string }[] {
  const base = [
    { label: 'BP', value: '128/82' },
    { label: 'HR', value: '72' },
    { label: 'Temp', value: '98.4 °F' },
    { label: 'RR', value: '16' },
    { label: 'SpO₂', value: '98%' },
  ];
  if (scenario.id === 'ha-1') {
    return [
      { label: 'BP', value: '156/94' },
      { label: 'HR', value: '88' },
      { label: 'Temp', value: '98.8 °F' },
      { label: 'RR', value: '18' },
      { label: 'SpO₂', value: '99%' },
    ];
  }
  if (scenario.id === 'belly') {
    return [
      { label: 'BP', value: '102/64' },
      { label: 'HR', value: '110' },
      { label: 'Temp', value: '101.2 °F' },
      { label: 'RR', value: '22' },
      { label: 'SpO₂', value: '97%' },
    ];
  }
  return base;
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
  const [chartTab, setChartTab] = useState<ChartTab>('summary');
  const vitals = vitalsForScenario(scenario);
  const durationLabel =
    scenario.duration % 7 === 0
      ? `${scenario.duration / 7} weeks`
      : `${scenario.duration} days`;

  return (
    <section
      className="flex min-w-0 flex-col bg-white text-slate-900 md:rounded-l-xl"
      aria-label="EpicSim patient chart"
    >
      <header className="shrink-0 border-b border-arka-primary/15 bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-2.5 text-white">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-300">
          EpicSim™ — Patient Chart
        </p>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <h2 className="text-base font-semibold">
            {scenario.patientName}
          </h2>
          <span className="text-sm text-slate-200">
            {scenario.age}
            {sexLabel} · MRN {scenario.mrn} · PCP: Chen, A.
          </span>
        </div>
        <p className="mt-0.5 text-xs text-slate-300">
          Allergies: {scenario.allergies} · eGFR {scenario.eGFR} · BMI 27.1
        </p>
      </header>

      <Tabs
        value={chartTab}
        onValueChange={(v) => setChartTab(v as ChartTab)}
        className="flex flex-col"
      >
        <TabsList className="h-auto w-full shrink-0 justify-start gap-0 rounded-none border-b border-slate-200 bg-slate-100 px-2 py-0 text-slate-700">
          <TabsTrigger
            value="summary"
            className="rounded-none border-b-2 border-transparent px-3 py-2 text-xs text-slate-600 data-[state=active]:border-teal-600 data-[state=active]:bg-white data-[state=active]:font-semibold data-[state=active]:text-slate-900 dark:data-[state=active]:bg-white dark:data-[state=active]:text-slate-900"
          >
            Chart Review
          </TabsTrigger>
          <TabsTrigger
            value="results"
            className="rounded-none border-b-2 border-transparent px-3 py-2 text-xs text-slate-600 data-[state=active]:border-teal-600 data-[state=active]:bg-white data-[state=active]:font-semibold data-[state=active]:text-slate-900 dark:data-[state=active]:bg-white dark:data-[state=active]:text-slate-900"
          >
            Results
          </TabsTrigger>
          <TabsTrigger
            value="orders"
            className="rounded-none border-b-2 border-transparent px-3 py-2 text-xs text-slate-600 data-[state=active]:border-teal-600 data-[state=active]:bg-white data-[state=active]:font-semibold data-[state=active]:text-slate-900 dark:data-[state=active]:bg-white dark:data-[state=active]:text-slate-900"
          >
            Orders
          </TabsTrigger>
        </TabsList>

        <div>
          <TabsContent
            value="summary"
            className="mt-0 space-y-4 rounded-none border-0 bg-white p-4 text-slate-900 shadow-none dark:bg-white dark:text-slate-900"
          >
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Today&apos;s visit
              </h3>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {scenario.chiefComplaint}
              </p>
              <p className="mt-1 text-sm text-slate-700">
                Symptom duration {durationLabel} · {scenario.urgency} · Outpatient
              </p>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Vitals (today)
              </h3>
              <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
                {vitals.map((v) => (
                  <div
                    key={v.label}
                    className="rounded border border-slate-200 bg-white px-2 py-1.5 text-center"
                  >
                    <p className="text-[10px] font-medium text-slate-600">{v.label}</p>
                    <p className="text-sm font-semibold text-slate-900">{v.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Active problems
              </h3>
              <ul
                className="mt-2 divide-y divide-slate-200 rounded border border-slate-200 text-sm"
                aria-label="Active problems"
              >
                {scenario.problems.map((p) => (
                  <li key={p.icd10} className="px-3 py-2 text-slate-900">
                    {p.display}{' '}
                    <span className="text-slate-600">({p.icd10})</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Red-flag screen
              </h3>
              <table className="mt-2 w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs text-slate-600">
                    <th className="pb-1 font-semibold">Finding</th>
                    <th className="pb-1 font-semibold">Present</th>
                  </tr>
                </thead>
                <tbody>
                  {scenario.redFlags.map((rf) => (
                    <tr key={rf.flag} className="border-b border-slate-100">
                      <td className="py-1.5 text-slate-900">{rf.flag}</td>
                      <td className="py-1.5">
                        <span
                          className={
                            rf.present
                              ? 'font-semibold text-red-700'
                              : 'text-slate-600'
                          }
                        >
                          {rf.present ? 'Yes' : 'No'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Medications
              </h3>
              <ul className="mt-2 list-inside list-disc space-y-0.5 text-sm text-slate-800">
                {scenario.id === 'lbp-1' && (
                  <>
                    <li>Lisinopril 10 mg daily</li>
                    <li>Ibuprofen 400 mg PRN</li>
                  </>
                )}
                {scenario.id === 'ha-1' && (
                  <>
                    <li>Sumatriptan 50 mg PRN</li>
                    <li>Amlodipine 5 mg daily</li>
                  </>
                )}
                {scenario.id === 'belly' && <li>Acetaminophen 15 mg/kg PRN fever</li>}
                {scenario.id === 'knee' && (
                  <>
                    <li>Meloxicam 7.5 mg daily</li>
                    <li>Glucosamine OTC</li>
                  </>
                )}
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Recent imaging
              </h3>
              <p className="mt-1 text-sm text-slate-800">
                {scenario.id === 'knee'
                  ? 'Knee radiographs — 14 months ago (outside facility)'
                  : 'No relevant imaging in the last 90 days'}
              </p>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Assessment &amp; plan (excerpt)
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-800">
                Continue conservative management for {scenario.chiefComplaint.toLowerCase()}.
                Discuss imaging only if symptoms persist or red flags emerge. Draft imaging order
                pending clinician review.
              </p>
            </div>
          </TabsContent>

          <TabsContent
            value="results"
            className="mt-0 space-y-3 rounded-none border-0 bg-white p-4 text-slate-900 shadow-none dark:bg-white dark:text-slate-900"
          >
            <p className="text-sm text-slate-800">
              Recent labs — no critical results. eGFR {scenario.eGFR} (stable). CBC within normal
              limits.
            </p>
            <div className="rounded border border-slate-200 text-sm text-slate-900">
              <div className="grid grid-cols-3 gap-2 border-b border-slate-200 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
                <span>Test</span>
                <span>Value</span>
                <span>Ref</span>
              </div>
              <div className="grid grid-cols-3 gap-2 px-3 py-2">
                <span>Creatinine</span>
                <span>0.9 mg/dL</span>
                <span className="text-slate-600">0.7–1.2</span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-t border-slate-100 px-3 py-2">
                <span>WBC</span>
                <span>7.2 K/µL</span>
                <span className="text-slate-600">4.5–11</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent
            value="orders"
            className="mt-0 rounded-none border-0 bg-white p-4 text-slate-900 shadow-none dark:bg-white dark:text-slate-900"
          >
            <Card className="border-teal-300 bg-teal-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-teal-800">
                  Imaging order (draft)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="font-semibold text-slate-900">{scenario.orderDisplay}</p>
                <p className="text-slate-700">CPT {scenario.cpt}</p>
                <p className="text-slate-700">
                  Indication: {scenario.chiefComplaint} ({scenario.icd10})
                </p>
                <p className="text-slate-700">Duration: {durationLabel}</p>
                <p className="text-slate-700">
                  Modality: {scenario.modality} · {scenario.bodyPart}
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>

      <footer className="shrink-0 border-t border-slate-200 bg-slate-100 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Demo scenarios">
            <span className="text-xs font-semibold text-slate-600">Scenarios:</span>
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
                      ? 'cursor-default border-arka-teal bg-arka-teal/15 text-arka-teal'
                      : 'cursor-pointer hover:border-arka-teal/50'
                  }
                >
                  {s.label}
                </Badge>
              </button>
            ))}
          </div>
          <Button
            type="button"
            variant="primary"
            className="shrink-0 bg-arka-teal px-6 hover:bg-arka-teal-dark focus-visible:ring-2 focus-visible:ring-arka-cyan"
            onClick={onSignOrder}
            disabled={signing}
            aria-label="Sign imaging order"
          >
            {signing ? 'Signing…' : 'Sign Order'}
          </Button>
        </div>
      </footer>
    </section>
  );
}
