'use client';

/**
 * @file CdsDemoClient.tsx
 * @description Live CDS Hooks shareholder demo — EpicSim chart + citation-first ARKA sidebar.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import type { CDSHookRequest, CDSHookResponse } from '@/lib/types/cds-hooks';
import { STANDARD_OVERRIDE_REASONS } from '@/lib/cds-platform/alerting/override-reasons';
import { routes } from '@/lib/constants';
import { buildCdsRequest } from './build-cds-request';
import {
  DEMO_SCENARIO_LIST,
  getDemoScenario,
  type DemoScenarioId,
} from './scenarios';
import { EpicSimChart } from './EpicSimChart';
import { CdsDemoSidebar } from './CdsDemoSidebar';
import { RoiCounter } from './RoiCounter';
import { JsonSyntaxPre } from './JsonSyntaxPre';
import {
  buildLocalCdsResponse,
  buildPredictionFromCard,
  resolveMedicalBasis,
  resolveShapRows,
  type DemoCdsCard,
} from './demo-response';

const FETCH_TIMEOUT_MS = 9_000;

interface HookExchange {
  hook: 'order-select' | 'order-sign';
  request: CDSHookRequest;
  response: CDSHookResponse | null;
  error?: string;
  offline?: boolean;
}

type ConnectionState = 'idle' | 'live' | 'fallback';

/**
 * Parses a CDS Hooks response body; returns null when JSON is invalid or lacks a cards array.
 */
function parseCdsHookResponse(text: string): CDSHookResponse | null {
  try {
    const parsed = JSON.parse(text) as unknown;
    if (
      parsed !== null &&
      typeof parsed === 'object' &&
      Array.isArray((parsed as CDSHookResponse).cards)
    ) {
      return parsed as CDSHookResponse;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Records CDS Hooks feedback (accept / override) for the active card.
 */
function postCdsFeedback(
  cardUuid: string,
  outcome: 'accepted' | 'overridden',
  hookInstance: string | undefined,
  overrideReason?: { code: string; display: string },
): void {
  void fetch(routes.cdsFeedbackApi, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      feedback: [
        {
          card: cardUuid,
          outcome,
          outcomeTimestamp: new Date().toISOString(),
          ...(overrideReason
            ? {
                overrideReason: {
                  reason: {
                    code: overrideReason.code,
                    display: overrideReason.display,
                  },
                },
              }
            : {}),
        },
      ],
      serviceId: 'arka-clin-appropriateness',
      hookInstance,
    }),
    keepalive: true,
  }).catch(() => {
    // Feedback is best-effort; demo flow never blocks on it.
  });
}

/**
 * Interactive CDS Hooks live demo client (EHR mock + ARKA sidebar + raw JSON).
 */
export function CdsDemoClient() {
  const [scenarioId, setScenarioId] = useState<DemoScenarioId>('lbp-1');
  const [loading, setLoading] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signPending, setSignPending] = useState(false);
  const [showRawJson, setShowRawJson] = useState(true);
  const [exchanges, setExchanges] = useState<HookExchange[]>([]);
  const [primaryCard, setPrimaryCard] = useState<DemoCdsCard | undefined>();
  const [showReviewPanel, setShowReviewPanel] = useState(false);
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);
  const [roi, setRoi] = useState({ dollarsAvoided: 0, ordersOptimized: 0 });
  const [scoresSeen, setScoresSeen] = useState<number[]>([]);
  const [ordersReviewed, setOrdersReviewed] = useState(0);
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeHook, setActiveHook] = useState<'order-select' | 'order-sign'>('order-select');
  const [hookInstance, setHookInstance] = useState<string | undefined>();
  const [feedbackStatus, setFeedbackStatus] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const requestGenRef = useRef(0);

  const scenario = useMemo(() => getDemoScenario(scenarioId), [scenarioId]);
  const prediction = useMemo(
    () => buildPredictionFromCard(primaryCard, scenario),
    [primaryCard, scenario],
  );
  const medicalBasis = useMemo(
    () => resolveMedicalBasis(primaryCard, scenario),
    [primaryCard, scenario],
  );
  const shapRows = useMemo(
    () => resolveShapRows(primaryCard, scenario),
    [primaryCard, scenario],
  );
  const emptyCards = exchanges.some(
    (e) => e.hook === 'order-select' && !e.offline && e.response?.cards.length === 0,
  );

  const invokeHook = useCallback(
    async (
      hook: 'order-select' | 'order-sign',
      path: string,
      signal: AbortSignal,
      forScenarioId: DemoScenarioId,
    ): Promise<HookExchange> => {
      const activeScenario = getDemoScenario(forScenarioId);
      const request = buildCdsRequest(activeScenario, hook);

      try {
        const res = await fetch(path, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
          signal,
        });
        const text = await res.text();
        if (!res.ok) {
          return {
            hook,
            request,
            response: buildLocalCdsResponse(activeScenario, hook),
            error: `CDS service returned ${res.status}`,
            offline: true,
          };
        }
        const response = parseCdsHookResponse(text);
        if (!response) {
          return {
            hook,
            request,
            response: buildLocalCdsResponse(activeScenario, hook),
            error: 'Invalid JSON response from CDS service',
            offline: true,
          };
        }
        return { hook, request, response };
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          throw err;
        }
        return {
          hook,
          request,
          response: buildLocalCdsResponse(activeScenario, hook),
          error: 'CDS service unreachable — using demo fallback response',
          offline: true,
        };
      }
    },
    [],
  );

  const runOrderSelect = useCallback(async (forScenarioId: DemoScenarioId, requestGen: number) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    setLoading(true);
    setShowReviewPanel(false);
    setSignPending(false);
    setActiveHook('order-select');
    setFetchError(null);
    setFeedbackStatus(null);

    try {
      const exchange = await invokeHook(
        'order-select',
        routes.cdsClinAppropriateness,
        controller.signal,
        forScenarioId,
      );

      if (requestGenRef.current !== requestGen) return;

      setExchanges((prev) => {
        const rest = prev.filter((e) => e.hook !== 'order-select' && e.hook !== 'order-sign');
        return [...rest, exchange];
      });

      const cards = (exchange.response?.cards ?? []) as DemoCdsCard[];
      setPrimaryCard(cards[0]);
      setHookInstance(exchange.request.hookInstance);

      if (!exchange.offline) {
        const score = buildPredictionFromCard(cards[0], getDemoScenario(forScenarioId)).score;
        setScoresSeen((s) => [...s, score]);
        setOrdersReviewed((n) => n + 1);
        setConnectionState('live');
      } else {
        setConnectionState('fallback');
        setFetchError(exchange.error ?? 'CDS service unreachable — showing demo fallback response.');
      }
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        setConnectionState('fallback');
        setFetchError('Request timed out — showing demo fallback response.');
      }
    } finally {
      clearTimeout(timeoutId);
      if (requestGenRef.current === requestGen) {
        setLoading(false);
      }
    }
  }, [invokeHook]);

  const handleScenarioSelect = useCallback(
    (id: DemoScenarioId) => {
      const requestGen = requestGenRef.current + 1;
      requestGenRef.current = requestGen;
      setScenarioId(id);
      setOverrideDialogOpen(false);
      setShowReviewPanel(false);
      setSignPending(false);
      setExchanges((prev) => prev.filter((e) => e.hook !== 'order-sign'));
      void runOrderSelect(id, requestGen);
    },
    [runOrderSelect],
  );

  useEffect(() => {
    const requestGen = requestGenRef.current + 1;
    requestGenRef.current = requestGen;
    const timer = window.setTimeout(() => {
      void runOrderSelect('lbp-1', requestGen);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [runOrderSelect]);

  const handleReset = () => {
    abortRef.current?.abort();
    setExchanges([]);
    setRoi({ dollarsAvoided: 0, ordersOptimized: 0 });
    setScoresSeen([]);
    setOrdersReviewed(0);
    setConnectionState('idle');
    setFetchError(null);
    setFeedbackStatus(null);
    setPrimaryCard(undefined);
    setHookInstance(undefined);
    handleScenarioSelect('lbp-1');
  };

  const handleSignOrder = async () => {
    const runForId = scenarioId;
    setSigning(true);
    setActiveHook('order-sign');
    setFetchError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const exchange = await invokeHook(
        'order-sign',
        routes.cdsClinAppropriatenessSign,
        controller.signal,
        runForId,
      );

      if (exchange.offline) {
        setConnectionState('fallback');
        setFetchError(
          exchange.error ?? 'Order-sign hook failed — demo fallback response shown below.',
        );
      } else {
        setConnectionState('live');
      }

      setExchanges((prev) => {
        const rest = prev.filter((e) => e.hook !== 'order-sign');
        return [...rest, exchange];
      });

      const cards = (exchange.response?.cards ?? []) as DemoCdsCard[];
      const signCard = cards[0];
      if (signCard) {
        setPrimaryCard(signCard);
        setHookInstance(exchange.request.hookInstance);
      }
      if (signCard?.indicator === 'critical' || signCard?.indicator === 'warning') {
        setSignPending(true);
      }
    } catch {
      setFetchError('Order-sign request timed out.');
      setConnectionState('fallback');
    } finally {
      clearTimeout(timeoutId);
      setSigning(false);
    }
  };

  const recordFeedback = useCallback(
    (outcome: 'accepted' | 'overridden', overrideReason?: { code: string; display: string }) => {
      const cardUuid = primaryCard?.uuid;
      if (!cardUuid) return;
      postCdsFeedback(cardUuid, outcome, hookInstance, overrideReason);
      setFeedbackStatus(
        outcome === 'accepted' ? 'Alternative recorded in feedback log.' : 'Override recorded in feedback log.',
      );
    },
    [primaryCard?.uuid, hookInstance],
  );

  const handleOpenAlternativeInChart = () => {
    setShowReviewPanel(false);
    recordFeedback('accepted');
    setRoi((r) => ({
      dollarsAvoided: r.dollarsAvoided + scenario.avoidedCostEstimate,
      ordersOptimized: r.ordersOptimized + 1,
    }));
  };

  const handleOverrideSubmit = (payload: { code: string; documentation?: string }) => {
    const reasonLabel =
      STANDARD_OVERRIDE_REASONS.find((r) => r.id === payload.code)?.label ?? payload.code;
    const display = payload.documentation?.trim() || reasonLabel;
    recordFeedback('overridden', { code: payload.code, display });
    setOverrideDialogOpen(false);
    setSignPending(false);
  };

  const medianScore =
    scoresSeen.length === 0
      ? '—'
      : String(
          [...scoresSeen].sort((a, b) => a - b)[Math.floor(scoresSeen.length / 2)] ?? '—',
        );

  const badgeLabel =
    connectionState === 'idle'
      ? '○ Idle'
      : connectionState === 'live'
        ? '● Live'
        : '● Demo fallback';
  const badgeAria =
    connectionState === 'idle'
      ? 'Idle — no requests yet'
      : connectionState === 'live'
        ? 'Live connection to CDS service'
        : 'Demo fallback — CDS endpoint unreachable';

  const jsonPanelId = 'live-cds-json-panel';

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-arka-primary/15 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-arka-text-dark">
            ARKA · CDS Hooks Live Demo
          </span>
          <Badge
            variant="outline"
            className={
              connectionState === 'idle'
                ? 'border-arka-slate-300 text-arka-slate-600'
                : connectionState === 'live'
                  ? 'border-emerald-600/50 text-emerald-800'
                  : 'border-amber-600/50 text-amber-800'
            }
            aria-label={badgeAria}
          >
            {badgeLabel}
          </Badge>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={handleReset}
          aria-label="Reset demo"
          className="min-h-[44px] touch-manipulation focus-visible:ring-2 focus-visible:ring-arka-teal-500"
        >
          Reset
        </Button>
      </div>

      {fetchError ? (
        <div
          className="flex items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-50 px-4 py-3 text-sm text-arka-slate-800"
          role="alert"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden />
          <p>{fetchError}</p>
        </div>
      ) : null}

      {feedbackStatus ? (
        <p className="sr-only" role="status" aria-live="polite">
          {feedbackStatus}
        </p>
      ) : null}

      <div
        className="grid w-full min-w-0 grid-cols-1 gap-4 bg-white md:grid-cols-[minmax(0,1fr)_minmax(340px,420px)] md:items-start md:gap-0 md:rounded-xl md:border md:border-arka-light md:bg-slate-100/90 md:shadow-sm"
        aria-label="EHR workspace"
      >
        <div className="flex min-w-0 flex-col md:border-r md:border-arka-primary/10">
          <EpicSimChart
            scenario={scenario}
            onSignOrder={() => void handleSignOrder()}
            signing={signing}
            onScenarioSelect={(id) => handleScenarioSelect(id as DemoScenarioId)}
            scenarioIds={DEMO_SCENARIO_LIST.map((s) => ({ id: s.id, label: s.label }))}
          />
        </div>
        <CdsDemoSidebar
          scenario={scenario}
          medicalBasis={medicalBasis}
          prediction={prediction}
          shapRows={shapRows}
          loading={loading}
          emptyCards={emptyCards}
          activeHook={activeHook}
          onReviewAlternative={() => setShowReviewPanel(true)}
          onOverride={() => setOverrideDialogOpen(true)}
          showReviewPanel={showReviewPanel}
          onCloseReviewPanel={() => setShowReviewPanel(false)}
          onOpenAlternativeInChart={handleOpenAlternativeInChart}
          overrideDialogOpen={overrideDialogOpen}
          onOverrideDialogClose={() => setOverrideDialogOpen(false)}
          onOverrideSubmit={handleOverrideSubmit}
          signPending={signPending}
          onSignAnywayWithReason={() => setOverrideDialogOpen(true)}
        />
      </div>

      <section
        className="min-w-0 rounded-lg border border-arka-primary/15 bg-arka-deep p-4"
        aria-labelledby="live-cds-json-heading"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="live-cds-json-heading" className="text-sm font-medium text-white">
            Live CDS Hooks JSON
          </h2>
          <button
            type="button"
            className="min-h-[44px] touch-manipulation px-2 text-xs text-arka-teal-300 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500"
            onClick={() => setShowRawJson((v) => !v)}
            aria-expanded={showRawJson}
            aria-controls={jsonPanelId}
          >
            {showRawJson ? 'Collapse' : 'Expand'}
          </button>
        </div>
        {showRawJson && (
          <div id={jsonPanelId} className="mt-4 space-y-4">
            {exchanges.length === 0 && (
              <p className="text-xs text-arka-text-soft">No requests yet. Select a scenario or sign an order.</p>
            )}
            {exchanges.map((ex) => (
              <div key={ex.hook} className="space-y-2">
                <p className="text-xs font-semibold text-arka-teal-300">
                  {ex.hook === 'order-select' ? 'Request →' : 'Sign →'} POST{' '}
                  {ex.hook === 'order-select'
                    ? routes.cdsClinAppropriateness
                    : routes.cdsClinAppropriatenessSign}
                </p>
                <JsonSyntaxPre value={ex.request} />
                <p className="text-xs font-semibold text-arka-cyan">Response ←</p>
                {ex.offline ? (
                  <p className="font-mono text-xs text-amber-200">
                    {'// Demo fallback — live CDS endpoint unreachable'}
                  </p>
                ) : null}
                {ex.response ? (
                  <JsonSyntaxPre value={ex.response} maxHeightClass="max-h-64 sm:max-h-[70vh]" />
                ) : (
                  <pre className="max-h-48 overflow-auto rounded bg-slate-900 p-3 font-mono text-xs text-red-300">
                    {ex.error ?? 'null'}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <footer className="grid gap-4 sm:grid-cols-3" aria-label="Demo session statistics">
        <div className="rounded-lg border border-arka-primary/15 bg-white p-4 text-center">
          <p className="text-xs uppercase text-arka-text-dark-muted">Median score</p>
          <p className="mt-1 text-2xl font-semibold text-arka-text-dark">{medianScore}</p>
        </div>
        <div className="rounded-lg border border-arka-primary/15 bg-white p-4 text-center">
          <p className="text-xs uppercase text-arka-text-dark-muted">Orders reviewed</p>
          <p className="mt-1 text-2xl font-semibold text-arka-text-dark">{ordersReviewed}</p>
        </div>
        <RoiCounter dollarsAvoided={roi.dollarsAvoided} ordersOptimized={roi.ordersOptimized} />
      </footer>
    </div>
  );
}
