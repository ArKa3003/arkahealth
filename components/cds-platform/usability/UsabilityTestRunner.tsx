/**
 * @file UsabilityTestRunner.tsx
 * @description Page component for running usability tests: scenarios one at a time,
 * records interactions, SUS + custom survey, results summary.
 * Phase 11: Usability Testing Infrastructure.
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  UsabilityTestingFramework,
  type TestSessionConfig,
  type ExpectedAction,
} from '@/lib/cds-platform/usability/testing-framework';
import { USABILITY_TEST_SCENARIOS } from '@/lib/cds-platform/usability/scenarios';
import {
  SUS_QUESTIONS,
  CUSTOM_CDS_QUESTIONS,
  LIKERT_LABELS,
  computeSusScore,
  interpretSusScore,
} from '@/lib/cds-platform/usability/sus-survey';
import type { ClinicalScenario } from '@/lib/cds-platform/types';
import type { MLPrediction } from '@/lib/cds-platform/ml/types';
import type { TieredAlert } from '@/lib/cds-platform/alerting/types';
import type { AlternativeOption } from '@/components/cds-platform/sidebar/AlternativesPanel';
import { SidebarLayout } from '@/components/cds-platform/sidebar/SidebarLayout';
import type { ParticipantRole } from '@/lib/cds-platform/usability/testing-framework';

type Phase = 'config' | 'scenario' | 'survey' | 'results';

const ROLES: { value: ParticipantRole; label: string }[] = [
  { value: 'attending', label: 'Attending' },
  { value: 'resident', label: 'Resident' },
  { value: 'fellow', label: 'Fellow' },
  { value: 'np', label: 'NP' },
  { value: 'pa', label: 'PA' },
];

export default function UsabilityTestRunner() {
  const [framework] = useState(() => new UsabilityTestingFramework());
  const [phase, setPhase] = useState<Phase>('config');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [participantId, setParticipantId] = useState('');
  const [participantRole, setParticipantRole] = useState<ParticipantRole>('attending');
  const [specialty, setSpecialty] = useState('');
  const [experienceYears, setExperienceYears] = useState(5);
  const [selectedScenarioIds, setSelectedScenarioIds] = useState<string[]>(
    USABILITY_TEST_SCENARIOS.map((s) => s.id)
  );
  const [scenarioData, setScenarioData] = useState<{
    prediction: MLPrediction;
    alerts: TieredAlert[];
    alternatives?: AlternativeOption[];
  } | null>(null);
  const [loadingScenario, setLoadingScenario] = useState(false);
  const [susResponses, setSusResponses] = useState<number[]>([]);
  const [customResponses, setCustomResponses] = useState<number[]>([]);

  const scenarios = USABILITY_TEST_SCENARIOS.filter((s) => selectedScenarioIds.includes(s.id));
  const currentScenario = scenarios[currentScenarioIndex];
  const isLastScenario = currentScenarioIndex >= scenarios.length - 1;

  const record = useCallback(
    (type: Parameters<typeof framework.recordEvent>[1]['type'], target?: string, data?: Record<string, unknown>) => {
      if (!sessionId || !currentScenario) return;
      framework.recordEvent(sessionId, {
        timestamp: Date.now(),
        type,
        target,
        data,
        scenarioId: currentScenario.id,
      });
    },
    [sessionId, currentScenario, framework]
  );

  const handleStartSession = useCallback(() => {
    const config: TestSessionConfig = {
      participantId: participantId || `participant-${Date.now()}`,
      participantRole,
      specialty: specialty || 'General',
      experienceYears,
      scenarios,
      testType: 'task_completion',
    };
    const session = framework.createSession(config);
    setSessionId(session.id);
    setPhase('scenario');
    setCurrentScenarioIndex(0);
    setScenarioData(null);
  }, [
    participantId,
    participantRole,
    specialty,
    experienceYears,
    scenarios,
    framework,
  ]);

  useEffect(() => {
    if (phase !== 'scenario' || !currentScenario) return;
    framework.startScenario(sessionId!, currentScenario.id);
    record('page_view', 'scenario');
    setLoadingScenario(true);
    fetch('/api/usability/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario: currentScenario.scenario }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setScenarioData({
          prediction: data.prediction,
          alerts: data.alerts || [],
          alternatives: data.alternatives,
        });
      })
      .catch(() => setScenarioData(null))
      .finally(() => setLoadingScenario(false));
  }, [phase, sessionId, currentScenario?.id]);

  const completeTask = useCallback(
    (action: ExpectedAction | 'modify' | 'abandon') => {
      if (!sessionId || !currentScenario) return;
      if (action === 'proceed') record('accept_suggestion', 'quick_actions');
      if (action === 'override') record('override', 'quick_actions');
      if (action === 'cancel') record('task_abandon', 'quick_actions');
      if (action === 'change_order' || action === 'modify') record('view_alternatives', 'quick_actions');
      framework.completeTask(sessionId, currentScenario.id, action);
      record('task_complete', undefined, { action });
      if (isLastScenario) {
        setPhase('survey');
        setSusResponses(Array(10).fill(0));
        setCustomResponses(Array(5).fill(0));
      } else {
        setCurrentScenarioIndex((i) => i + 1);
        setScenarioData(null);
      }
    },
    [sessionId, currentScenario, isLastScenario, framework, record]
  );

  const handleAcceptOrder = useCallback(() => completeTask('proceed'), [completeTask]);
  const handleCancelOrder = useCallback(() => completeTask('cancel'), [completeTask]);
  const handleOverrideAndContinue = useCallback(() => record('override', 'quick_actions'), [record]);
  const handleViewAlternatives = useCallback(() => record('view_alternatives', 'quick_actions'), [record]);
  const handleOrderInstead = useCallback(() => completeTask('change_order'), [completeTask]);
  const handleOverrideSubmit = useCallback(
    (payload: { code: string; documentation?: string }) => {
      record('override', 'override_dialog', payload);
      completeTask('proceed');
    },
    [record, completeTask]
  );

  const handleLayerInteraction = useCallback(
    (event: { layer: 'glance' | 'scan' | 'deep_dive'; section?: string; action: 'view' | 'expand' | 'collapse' }) => {
      if (event.action === 'expand') record('expand_section', event.section);
      if (event.action === 'collapse') record('collapse_section', event.section);
      if (event.action === 'view') record('read_detail', event.section);
    },
    [record]
  );

  const handleSurveySubmit = useCallback(() => {
    if (!sessionId) return;
    framework.setSurveyResponses(sessionId, susResponses, customResponses);
    setPhase('results');
  }, [sessionId, susResponses, customResponses, framework]);

  if (phase === 'config') {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="mb-2 text-2xl font-semibold text-slate-900">Usability Test — Session setup</h1>
          <p className="mb-6 text-slate-600">
            Configure the test session. All data is anonymous and stored only in this browser.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Participant ID (anonymous)</label>
              <input
                type="text"
                value={participantId}
                onChange={(e) => setParticipantId(e.target.value)}
                placeholder="e.g. P001"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Role</label>
              <select
                value={participantRole}
                onChange={(e) => setParticipantRole(e.target.value as ParticipantRole)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Specialty</label>
              <input
                type="text"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="e.g. Emergency Medicine"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Years of experience</label>
              <input
                type="number"
                min={0}
                max={50}
                value={experienceYears}
                onChange={(e) => setExperienceYears(parseInt(e.target.value, 10) || 0)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Scenarios to run</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {USABILITY_TEST_SCENARIOS.map((s) => (
                  <label key={s.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedScenarioIds.includes(s.id)}
                      onChange={(e) =>
                        setSelectedScenarioIds((ids) =>
                          e.target.checked ? [...ids, s.id] : ids.filter((id) => id !== s.id)
                        )
                      }
                      className="rounded border-slate-300"
                    />
                    <span className="text-sm text-slate-700">{s.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={handleStartSession}
              disabled={scenarios.length === 0}
              className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              Start test session
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'scenario' && currentScenario) {
    return (
      <div className="flex min-h-screen bg-slate-100">
        <div className="flex flex-1 flex-col overflow-auto p-6">
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-900">
              Scenario {currentScenarioIndex + 1} of {scenarios.length}: {currentScenario.name}
            </p>
            <p className="mt-2 text-sm text-amber-800">{currentScenario.taskDescription}</p>
            <p className="mt-1 text-xs text-amber-700">
              Time limit: {currentScenario.maxTimeSeconds}s — Expected: {currentScenario.expectedAction}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-medium text-slate-500">Patient context</h2>
            <p className="mt-1 text-slate-900">
              {currentScenario.scenario.chiefComplaint}; {currentScenario.scenario.clinicalHistory}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Order: {currentScenario.scenario.proposedImaging?.modality} {currentScenario.scenario.proposedImaging?.bodyPart}
            </p>
          </div>
        </div>
        <div className="shrink-0 border-l border-slate-200 bg-slate-50">
          {loadingScenario || !scenarioData ? (
            <div className="flex w-[380px] flex-col items-center justify-center gap-3 p-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
              <p className="text-sm text-slate-600">Loading CDS…</p>
            </div>
          ) : (
            <SidebarLayout
              scenario={currentScenario.scenario}
              prediction={scenarioData.prediction}
              alerts={scenarioData.alerts}
              alternatives={scenarioData.alternatives}
              onAcceptOrder={handleAcceptOrder}
              onViewAlternatives={handleViewAlternatives}
              onOverrideAndContinue={handleOverrideAndContinue}
              onCancelOrder={handleCancelOrder}
              onOrderInstead={handleOrderInstead}
              onOverrideSubmit={handleOverrideSubmit}
              onLayerInteraction={handleLayerInteraction}
            />
          )}
        </div>
      </div>
    );
  }

  if (phase === 'survey') {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="mb-2 text-2xl font-semibold text-slate-900">Post-test survey</h1>
          <p className="mb-6 text-slate-600">System Usability Scale (SUS) and CDS-specific questions.</p>

          <section className="mb-8">
            <h2 className="mb-4 text-lg font-medium text-slate-800">System Usability Scale</h2>
            <p className="mb-4 text-sm text-slate-600">1 = Strongly disagree, 5 = Strongly agree</p>
            <div className="space-y-4">
              {SUS_QUESTIONS.map((q, i) => (
                <div key={q.id}>
                  <label className="block text-sm font-medium text-slate-700">{q.text}</label>
                  <div className="mt-1 flex gap-4">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <label key={v} className="flex items-center gap-1">
                        <input
                          type="radio"
                          name={q.id}
                          checked={(susResponses[i] ?? 0) === v}
                          onChange={() =>
                            setSusResponses((prev) => {
                              const next = [...prev];
                              next[i] = v;
                              return next;
                            })
                          }
                          className="border-slate-300"
                        />
                        <span className="text-sm text-slate-600">{v}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-lg font-medium text-slate-800">CDS-specific questions</h2>
            <div className="space-y-4">
              {CUSTOM_CDS_QUESTIONS.map((q, i) => (
                <div key={q.id}>
                  <label className="block text-sm font-medium text-slate-700">{q.text}</label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {LIKERT_LABELS.map((label, v) => (
                      <label key={v} className="flex items-center gap-1">
                        <input
                          type="radio"
                          name={q.id}
                          checked={(customResponses[i] ?? 0) === v + 1}
                          onChange={() =>
                            setCustomResponses((prev) => {
                              const next = [...prev];
                              next[i] = v + 1;
                              return next;
                            })
                          }
                          className="border-slate-300"
                        />
                        <span className="text-xs text-slate-600">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSurveySubmit}
              className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
            >
              Submit and view results
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'results' && sessionId) {
    const metrics = framework.computeSessionMetrics(sessionId);
    const aggregate = framework.computeAggregateMetrics();
    const susScore = metrics.satisfactionScore ?? 0;
    const interpretation = interpretSusScore(susScore);

    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="mb-2 text-2xl font-semibold text-slate-900">Usability test results</h1>
          <p className="mb-6 text-slate-600">Session summary and metrics.</p>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 p-4">
              <h3 className="text-sm font-medium text-slate-500">Task completion</h3>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {(metrics.taskCompletionRate * 100).toFixed(0)}%
              </p>
              <p className="text-xs text-slate-600">Target: &gt; 90%</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <h3 className="text-sm font-medium text-slate-500">Mean task time</h3>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {metrics.meanTaskTime.toFixed(1)}s
              </p>
              <p className="text-xs text-slate-600">Target: &lt; 30s</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <h3 className="text-sm font-medium text-slate-500">Error rate</h3>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {(metrics.errorRate * 100).toFixed(0)}%
              </p>
              <p className="text-xs text-slate-600">Target: &lt; 10%</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <h3 className="text-sm font-medium text-slate-500">SUS score</h3>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{susScore.toFixed(0)}</p>
              <p className="text-xs text-slate-600">
                {interpretation.grade} — {interpretation.adjective} (target: &gt; 68)
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-slate-200 p-4">
            <h3 className="text-sm font-medium text-slate-700">Information access pattern</h3>
            <p className="mt-2 text-sm text-slate-600">
              Glance only: {(metrics.informationAccessPattern.glanceOnlyRate * 100).toFixed(0)}% · Scan:{' '}
              {(metrics.informationAccessPattern.scanRate * 100).toFixed(0)}% · Deep dive:{' '}
              {(metrics.informationAccessPattern.deepDiveRate * 100).toFixed(0)}%
            </p>
          </div>

          <div className="mt-6 rounded-lg border border-slate-200 p-4">
            <h3 className="text-sm font-medium text-slate-700">Alert response pattern</h3>
            <p className="mt-2 text-sm text-slate-600">
              Accept: {(metrics.alertResponsePattern.acceptRate * 100).toFixed(0)}% · Override:{' '}
              {(metrics.alertResponsePattern.overrideRate * 100).toFixed(0)}% · Modify:{' '}
              {(metrics.alertResponsePattern.modifyRate * 100).toFixed(0)}% · Cancel:{' '}
              {(metrics.alertResponsePattern.cancelRate * 100).toFixed(0)}%
            </p>
          </div>

          <div className="mt-6 flex gap-4">
            <button
              type="button"
              onClick={() => {
                setPhase('config');
                setSessionId(null);
                setCurrentScenarioIndex(0);
              }}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              New session
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
