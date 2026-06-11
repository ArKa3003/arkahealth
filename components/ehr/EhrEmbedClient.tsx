"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

import { ArkaAnimatedLogo } from "@/components/ArkaAnimatedLogo";
import { MATRIX_VERSION } from "@/lib/aiie/knowledge-matrix";
import { FDA_NON_DEVICE_CDS_DISCLOSURE } from "@/lib/compliance/fda-disclosure";
import { scoreOrder } from "@/lib/aiie/scoring-engine";
import { postRailEvent, sha256Hex } from "@/lib/ehr/rail-telemetry";
import type { WritebackSession } from "@/lib/ehr/writeback";
import { useEhrRailStore } from "@/lib/stores/ehr-rail-store";
import {
  mapServiceRequestBundle,
  patientBannerFromFhir,
  type EhrImagingOrder,
  type EhrPatientBanner,
} from "@/lib/ehr/order-mapper";
import type {
  FHIRBundle,
  FHIRPatient,
  FHIRServiceRequest,
} from "@/lib/cds-platform/fhir/resources";
import { EhrOrderCard, type ScoredEhrOrder } from "./EhrOrderCard";

import patientFixture from "@/sandbox-fixtures/ehr/patient.json";
import serviceRequestsFixture from "@/sandbox-fixtures/ehr/service-requests.json";

const RAIL_ID = "arka-ehr-rail";

interface ReadyData {
  banner: EhrPatientBanner;
  orders: ScoredEhrOrder[];
  /** SHA-256 hex of the patient id — the only patient identifier used in audit events. */
  patientHash: string | null;
  /** SMART session for explicit-accept write-back; null in demo mode. */
  session: WritebackSession | null;
}

type LoadState =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | ({ phase: "ready" } & ReadyData);

async function scoreOrders(orders: EhrImagingOrder[]): Promise<ScoredEhrOrder[]> {
  return Promise.all(
    orders.map(async (order) => ({ ...order, score: await scoreOrder(order.aiieInput) })),
  );
}

async function hashPatientId(patientId: string | null): Promise<string | null> {
  if (!patientId) return null;
  try {
    return await sha256Hex(patientId);
  } catch {
    return null;
  }
}

async function loadDemoData(): Promise<ReadyData> {
  const patient = patientFixture as unknown as FHIRPatient;
  const bundle = serviceRequestsFixture as unknown as FHIRBundle<FHIRServiceRequest>;
  const orders = await scoreOrders(mapServiceRequestBundle(bundle, patient));
  return {
    banner: patientBannerFromFhir(patient),
    orders,
    patientHash: await hashPatientId(patient.id ?? null),
    session: null,
  };
}

async function loadLiveData(): Promise<ReadyData> {
  const sessionRes = await fetch("/api/ehr/session", { cache: "no-store" });
  const sessionJson = (await sessionRes.json()) as {
    data: { fhirBaseUrl: string; accessToken: string; patientId: string | null } | null;
    error: { code: string; message: string } | null;
  };
  if (!sessionRes.ok || sessionJson.error || !sessionJson.data) {
    throw new Error(sessionJson.error?.message ?? "No EHR session.");
  }
  const { fhirBaseUrl, accessToken, patientId } = sessionJson.data;
  if (!patientId) {
    throw new Error("Launch context did not include a patient.");
  }

  const base = fhirBaseUrl.replace(/\/+$/, "");
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/fhir+json",
  } as const;

  const [patientRes, ordersRes] = await Promise.all([
    fetch(`${base}/Patient/${encodeURIComponent(patientId)}`, { headers, cache: "no-store" }),
    fetch(
      `${base}/ServiceRequest?patient=${encodeURIComponent(patientId)}&status=draft,active&_count=20`,
      { headers, cache: "no-store" },
    ),
  ]);
  if (!patientRes.ok || !ordersRes.ok) {
    throw new Error("FHIR query failed — check granted scopes.");
  }

  const patient = (await patientRes.json()) as FHIRPatient;
  const bundle = (await ordersRes.json()) as FHIRBundle<FHIRServiceRequest>;
  const orders = await scoreOrders(mapServiceRequestBundle(bundle, patient));
  return {
    banner: patientBannerFromFhir(patient),
    orders,
    patientHash: await hashPatientId(patientId),
    session: { fhirBaseUrl, accessToken },
  };
}

/** Props for the embedded icon/rail. */
export interface EhrEmbedClientProps {
  /** When true, renders from sandbox fixtures instead of a live EHR session. */
  demoMode: boolean;
  /** Launch error code forwarded from the OAuth redirect, if any. */
  launchError?: string;
}

/**
 * The EHR-embedded ARKA surface: a 48px floating icon (the unmodified animated
 * logo) that expands into a compact intelligence rail. Expansion happens only on
 * clinician click or when a draft order scores ≤3 / carries an EXPEDITE signal —
 * in which case the container pulses once and shows a count badge. No sound, no
 * modal; focus is only moved on clinician-initiated expansion.
 */
export function EhrEmbedClient({ demoMode, launchError }: EhrEmbedClientProps) {
  const [state, setState] = useState<LoadState>({ phase: "loading" });
  const expanded = useEhrRailStore((s) => s.expanded);
  const userInitiated = useEhrRailStore((s) => s.userInitiated);
  const alertCount = useEhrRailStore((s) => s.alertCount);
  const pulsing = useEhrRailStore((s) => s.pulsing);
  const expand = useEhrRailStore((s) => s.expand);
  const collapse = useEhrRailStore((s) => s.collapse);
  const signalAlerts = useEhrRailStore((s) => s.signalAlerts);
  const endPulse = useEhrRailStore((s) => s.endPulse);

  const iconRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const focusIconOnCollapse = useRef(false);
  const signaled = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        if (!demoMode && launchError) {
          throw new Error(`EHR launch failed (${launchError}). Relaunch from your EHR.`);
        }
        const data = demoMode ? await loadDemoData() : await loadLiveData();
        if (!cancelled) setState({ phase: "ready", ...data });
      } catch (err) {
        if (!cancelled) {
          setState({
            phase: "error",
            message: err instanceof Error ? err.message : "Unable to load EHR context.",
          });
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [demoMode, launchError]);

  // Signal (never interrupt): alert-worthy orders auto-expand + pulse exactly once.
  // The render is also audited once per session (hashed patient id, no PHI).
  useEffect(() => {
    if (state.phase !== "ready" || signaled.current) return;
    signaled.current = true;
    const count = state.orders.filter(
      (order) => order.score.clinicalScore <= 3 || order.expedite,
    ).length;
    signalAlerts(count);
    if (state.patientHash) {
      postRailEvent(state.patientHash, {
        eventType: "rail_render",
        matrixVersion: MATRIX_VERSION,
        demoMode,
      });
    }
  }, [state, signalAlerts, demoMode]);

  // Escape collapses the rail from anywhere inside it.
  useEffect(() => {
    if (!expanded) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        focusIconOnCollapse.current = true;
        collapse();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [expanded, collapse]);

  // Focus handoff: only for clinician-initiated transitions.
  useEffect(() => {
    if (expanded && userInitiated) {
      const id = window.setTimeout(() => closeRef.current?.focus(), 220);
      return () => window.clearTimeout(id);
    }
    if (!expanded && focusIconOnCollapse.current) {
      focusIconOnCollapse.current = false;
      const id = window.setTimeout(() => iconRef.current?.focus(), 220);
      return () => window.clearTimeout(id);
    }
    return undefined;
  }, [expanded, userInitiated]);

  const handleCollapse = useCallback(() => {
    focusIconOnCollapse.current = true;
    collapse();
  }, [collapse]);

  const pulseRing = pulsing ? (
    <motion.span
      aria-hidden
      className="pointer-events-none absolute -inset-1 rounded-[inherit] ring-2 ring-arka-teal-400"
      initial={{ opacity: 0.9, scale: 1 }}
      animate={{ opacity: 0, scale: 1.08 }}
      transition={{ duration: 1.1, ease: "easeOut" }}
      onAnimationComplete={endPulse}
    />
  ) : null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      <AnimatePresence mode="wait" initial={false}>
        {expanded ? (
          <motion.section
            key="rail"
            id={RAIL_ID}
            aria-label="ARKA imaging intelligence"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 0.61, 0.36, 1] }}
            className="relative flex max-h-[calc(100dvh-2rem)] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-arka-slate-200 bg-white shadow-elevation-4"
          >
            {pulseRing}

            {/* Patient banner */}
            <header className="flex items-start gap-2 border-b border-arka-slate-100 px-3.5 py-3">
              <div className="min-w-0 flex-1">
                {state.phase === "ready" ? (
                  <>
                    <p className="truncate text-[13px] font-semibold text-arka-slate-900">
                      {state.banner.name}
                    </p>
                    <p className="text-[11px] text-arka-slate-500">
                      {state.banner.age !== null ? `${state.banner.age} yrs · ` : ""}
                      {state.banner.sex} · MRN {state.banner.mrnMasked}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-[13px] font-semibold text-arka-slate-900">ARKA</p>
                    <p className="text-[11px] text-arka-slate-500">Imaging intelligence</p>
                  </>
                )}
              </div>
              {alertCount > 0 ? (
                <span className="mt-0.5 inline-flex shrink-0 items-center rounded-full bg-red-100 px-1.5 py-px text-[10px] font-semibold text-red-700">
                  {alertCount} {alertCount === 1 ? "alert" : "alerts"}
                </span>
              ) : null}
              <button
                ref={closeRef}
                type="button"
                onClick={handleCollapse}
                aria-label="Collapse ARKA to icon"
                className="-mr-1 -mt-0.5 rounded-md p-1 text-arka-slate-400 transition-colors hover:bg-arka-slate-100 hover:text-arka-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </header>

            {/* Active imaging orders */}
            <div className="min-h-0 flex-1 overflow-y-auto px-3.5 py-3">
              <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-arka-slate-500">
                Active imaging orders
              </h2>
              {state.phase === "loading" ? (
                <ul className="space-y-2" aria-label="Loading orders">
                  {[0, 1, 2].map((i) => (
                    <li
                      key={i}
                      className="h-14 animate-pulse rounded-lg border border-arka-slate-100 bg-arka-slate-50"
                    />
                  ))}
                </ul>
              ) : null}
              {state.phase === "error" ? (
                <p className="rounded-lg border border-arka-slate-200 bg-arka-slate-50 px-3 py-2.5 text-[12px] leading-snug text-arka-slate-600">
                  {state.message}
                </p>
              ) : null}
              {state.phase === "ready" ? (
                state.orders.length > 0 ? (
                  <ul className="space-y-2">
                    {state.orders.map((order) => (
                      <EhrOrderCard
                        key={order.id}
                        order={order}
                        demoMode={demoMode}
                        patientHash={state.patientHash}
                        session={state.session}
                      />
                    ))}
                  </ul>
                ) : (
                  <p className="text-[12px] text-arka-slate-500">
                    No active imaging orders for this patient.
                  </p>
                )
              ) : null}
            </div>

            {/* Quiet status row + FDA disclaimer */}
            <footer className="border-t border-arka-slate-100 px-3.5 py-2.5">
              <p className="flex items-center gap-1.5 text-[11px] text-arka-slate-500">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                AIIE active · monitoring orders · v{MATRIX_VERSION}
              </p>
              <p className="mt-1.5 text-[11px] leading-snug text-arka-slate-400">
                {FDA_NON_DEVICE_CDS_DISCLOSURE}
              </p>
            </footer>
          </motion.section>
        ) : (
          <motion.button
            key="icon"
            ref={iconRef}
            type="button"
            onClick={expand}
            aria-expanded={false}
            aria-controls={RAIL_ID}
            aria-label={
              alertCount > 0
                ? `Open ARKA imaging intelligence — ${alertCount} ${alertCount === 1 ? "alert" : "alerts"}`
                : "Open ARKA imaging intelligence"
            }
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.2, ease: [0.22, 0.61, 0.36, 1] }}
            className="relative flex h-12 w-12 items-center justify-center rounded-full border border-arka-slate-200 bg-white shadow-elevation-3 transition-shadow hover:shadow-elevation-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500 focus-visible:ring-offset-2"
          >
            {pulseRing}
            <span className="block h-9 w-9 [&_svg]:h-full [&_svg]:w-full" aria-hidden>
              <ArkaAnimatedLogo
                width={120}
                height={135}
                animate
                idleAnimations
                className="h-full w-full"
              />
            </span>
            {alertCount > 0 ? (
              <span
                aria-hidden
                className="absolute -right-0.5 -top-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white shadow-elevation-1"
              >
                {alertCount}
              </span>
            ) : null}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
