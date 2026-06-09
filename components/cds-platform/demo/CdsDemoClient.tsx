'use client';

/**
 * @file CdsDemoClient.tsx
 * @description Live CDS Hooks shareholder demo — EpicSim chart + citation-first ARKA sidebar.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import type { CDSHookRequest, CDSHookResponse } from '@/lib/types/cds-hooks';
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

const ORDER_SELECT_PATH = '/api/cds-services/arka-clin-appropriateness';
const ORDER_SIGN_PATH = '/api/cds-services/arka-clin-appropriateness-sign';
const FETCH_TIMEOUT_MS = 9_000;

interface HookExchange {
  hook: 'order-select' | 'order-sign';
  request: CDSHookRequest;
  response: CDSHookResponse | null;
  error?: string;
  offline?: boolean;
}

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
  const [live, setLive] = useState(true);

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
  const emptyCards = exchanges.some((e) => e.hook === 'order-select' && e.response?.cards.length === 0);

  const invokeHook = useCallback(
    async (hook: 'order-select' | 'order-sign', path: string): Promise<HookExchange> => {
      const request = buildCdsRequest(scenario, hook);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      try {
        const res = await fetch(path, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
          signal: controller.signal,
        });
        const text = await res.text();
        if (!res.ok) {
          return {
            hook,
            request,
            response: buildLocalCdsResponse(scenario, hook),
            offline: true,
          };
        }
        const response = parseCdsHookResponse(text);
        if (!response) {
          return {
            hook,
            request,
            response: buildLocalCdsResponse(scenario, hook),
            offline: true,
          };
        }
        return { hook, request, response };
      } catch {
        return {
          hook,
          request,
          response: buildLocalCdsResponse(scenario, hook),
          offline: true,
        };
      } finally {
        clearTimeout(timeoutId);
      }
    },
    [scenario],
  );

  const runOrderSelect = useCallback(async () => {
    setLoading(true);
    setShowReviewPanel(false);
    setSignPending(false);
    const exchange = await invokeHook('order-select', ORDER_SELECT_PATH);
    setExchanges((prev) => {
      const rest = prev.filter((e) => e.hook !== 'order-select');
      return [...rest, exchange];
    });
    const cards = (exchange.response?.cards ?? []) as DemoCdsCard[];
    setPrimaryCard(cards[0]);
    const score = buildPredictionFromCard(cards[0], scenario).score;
    setScoresSeen((s) => [...s, score]);
    setOrdersReviewed((n) => n + 1);
    setLoading(false);
    setLive(!exchange.offline);
  }, [invokeHook, scenario]);

  useEffect(() => {
    void runOrderSelect();
  }, [scenarioId, runOrderSelect]);

  const handleReset = () => {
    setScenarioId('lbp-1');
    setExchanges([]);
    setRoi({ dollarsAvoided: 0, ordersOptimized: 0 });
    setScoresSeen([]);
    setOrdersReviewed(0);
    setOverrideDialogOpen(false);
    setShowReviewPanel(false);
    setSignPending(false);
    setLive(false);
  };

  const handleSignOrder = async () => {
    setSigning(true);
    let exchange = await invokeHook('order-sign', ORDER_SIGN_PATH);
    if (exchange.error || !exchange.response) {
      exchange = await invokeHook('order-sign', ORDER_SELECT_PATH);
    }
    setExchanges((prev) => {
      const rest = prev.filter((e) => e.hook !== 'order-sign');
      return [...rest, exchange];
    });
    const cards = (exchange.response?.cards ?? []) as DemoCdsCard[];
    const signCard = cards[0];
    if (signCard) {
      setPrimaryCard(signCard);
    }
    if (signCard?.indicator === 'critical' || signCard?.indicator === 'warning') {
      setSignPending(true);
    }
    setSigning(false);
  };

  const handleOpenAlternativeInChart = () => {
    setShowReviewPanel(false);
    setRoi((r) => ({
      dollarsAvoided: r.dollarsAvoided + scenario.avoidedCostEstimate,
      ordersOptimized: r.ordersOptimized + 1,
    }));
  };

  const medianScore =
    scoresSeen.length === 0
      ? '—'
      : String(
          [...scoresSeen].sort((a, b) => a - b)[Math.floor(scoresSeen.length / 2)] ?? '—',
        );

  const latestOrderSelect = exchanges.find((e) => e.hook === 'order-select');
  const badgeLabel = !latestOrderSelect
    ? '○ Idle'
    : live
      ? '● Live'
      : '● Cached';
  const badgeAria = !latestOrderSelect
    ? 'Idle'
    : live
      ? 'Live connection'
      : 'Cached scenario response';

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
              !latestOrderSelect
                ? 'border-arka-muted text-arka-muted'
                : live
                  ? 'border-emerald-500/50 text-emerald-600'
                  : 'border-amber-500/50 text-amber-600'
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
          className="focus-visible:ring-2 focus-visible:ring-arka-cyan"
        >
          Reset
        </Button>
      </div>

      <div
        className="grid w-full min-w-0 grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(340px,420px)] md:items-start md:gap-0 md:rounded-xl md:border md:border-arka-light md:bg-slate-100/90 md:shadow-sm"
        aria-label="EHR workspace"
      >
        <div className="flex min-w-0 flex-col md:border-r md:border-arka-primary/10">
          <EpicSimChart
            scenario={scenario}
            onSignOrder={() => void handleSignOrder()}
            signing={signing}
            onScenarioSelect={(id) => setScenarioId(id as DemoScenarioId)}
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
          onReviewAlternative={() => setShowReviewPanel(true)}
          onOverride={() => setOverrideDialogOpen(true)}
          showReviewPanel={showReviewPanel}
          onCloseReviewPanel={() => setShowReviewPanel(false)}
          onOpenAlternativeInChart={handleOpenAlternativeInChart}
          overrideDialogOpen={overrideDialogOpen}
          onOverrideDialogClose={() => setOverrideDialogOpen(false)}
          onOverrideSubmit={() => {
            setOverrideDialogOpen(false);
            setSignPending(false);
          }}
          onAboutRecommendation={() => undefined}
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
            className="text-xs text-arka-cyan hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-cyan"
            onClick={() => setShowRawJson((v) => !v)}
            aria-expanded={showRawJson}
          >
            {showRawJson ? 'Collapse' : 'Expand'}
          </button>
        </div>
        {showRawJson && (
          <div className="mt-4 space-y-4">
            {exchanges.length === 0 && (
              <p className="text-xs text-arka-text-soft">No requests yet. Select a scenario or sign an order.</p>
            )}
            {exchanges.map((ex) => (
              <div key={ex.hook} className="space-y-2">
                <p className="text-xs font-semibold text-arka-teal">
                  {ex.hook === 'order-select' ? 'Request →' : 'Sign →'} POST{' '}
                  {ex.hook === 'order-select' ? ORDER_SELECT_PATH : ORDER_SIGN_PATH}
                </p>
                <JsonSyntaxPre value={ex.request} />
                <p className="text-xs font-semibold text-arka-cyan">Response ←</p>
                {ex.offline && (
                  <p className="font-mono text-xs text-arka-text-soft">
                    // Served from cached scenario response (CDS endpoint unreachable)
                  </p>
                )}
                {ex.response ? (
                  <JsonSyntaxPre value={ex.response} maxHeightClass="max-h-64" />
                ) : (
                  <pre className="max-h-48 overflow-auto rounded bg-slate-900 p-3 font-mono text-xs text-red-300">
                    {(() => {
                      const raw = ex.error ?? 'null';
                      if (raw.includes('did not match the expected pattern')) {
                        return 'CDS service unreachable in offline mode — using cached scenario response.';
                      }
                      return raw;
                    })()}
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
