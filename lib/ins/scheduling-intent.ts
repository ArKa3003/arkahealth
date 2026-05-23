import { FHIRClient } from "@/lib/fhir/client";
import { hashAuditIdentifier } from "@/lib/server/aiie-audit-logger";
import type { AiieAuditEvent } from "@/lib/server/aiie-audit-logger";
import { bump } from "@/lib/server/metrics-counters";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Appointment, Bundle } from "@/lib/types/fhir";

/** Row status values for `ins_scheduling_intent`. */
export type SchedulingStatus =
  | "pending"
  | "in_progress"
  | "scheduled"
  | "cancelled"
  | "sla_breached";

/** Summary returned by {@link reconcileIntents}. */
export interface ReconcileIntentsResult {
  scheduled: number;
  breached: number;
  stillPending: number;
}

const SLA_HOURS = 72;
const SHA256_HEX = /^[a-f0-9]{64}$/i;

const FHIR_SCHEDULED_STATUSES = new Set([
  "booked",
  "arrived",
  "fulfilled",
  "checked-in",
  "waitlist",
]);

const FHIR_CANCELLED_STATUSES = new Set(["cancelled", "noshow"]);

/**
 * SLA deadline for a newly captured intent (72h per CMS PA standard alignment).
 */
export function schedulingSlaExpiresAt(from: Date = new Date()): string {
  return new Date(from.getTime() + SLA_HOURS * 60 * 60 * 1000).toISOString();
}

function patientHashFromAppointment(appointment: Appointment): string | undefined {
  for (const p of appointment.participant ?? []) {
    const ref = p.actor?.reference?.trim();
    if (!ref) {
      continue;
    }
    if (ref.startsWith("Patient/")) {
      return hashAuditIdentifier(ref);
    }
    if (!ref.includes("/")) {
      return hashAuditIdentifier(`Patient/${ref}`);
    }
  }
  return undefined;
}

function cptFromAppointment(appointment: Appointment): string | undefined {
  for (const st of appointment.serviceType ?? []) {
    for (const c of st.coding ?? []) {
      if (c.code && /^\d{5}$/.test(c.code)) {
        return c.code;
      }
    }
  }
  return undefined;
}

/**
 * Order hashes derivable from an `Appointment` (ServiceRequest reason + logical id).
 */
export function orderHashesFromAppointment(appointment: Appointment): string[] {
  const out = new Set<string>();
  if (appointment.id) {
    out.add(hashAuditIdentifier(appointment.id));
    out.add(hashAuditIdentifier(`Appointment/${appointment.id}`));
  }
  for (const ref of appointment.reasonReference ?? []) {
    const r = ref.reference?.trim();
    if (!r) {
      continue;
    }
    if (r.startsWith("ServiceRequest/")) {
      const tail = r.slice("ServiceRequest/".length);
      if (tail) {
        out.add(hashAuditIdentifier(tail));
        out.add(hashAuditIdentifier(r));
      }
    }
  }
  return [...out];
}

/**
 * Whether a FHIR appointment matches a scheduling intent (patient + order or CPT).
 */
export function appointmentMatchesIntent(
  appointment: Appointment,
  intent: {
    order_hash: string;
    patient_hash: string;
    cpt: string | null;
  },
): boolean {
  const patientHash = patientHashFromAppointment(appointment);
  if (!patientHash || patientHash !== intent.patient_hash) {
    return false;
  }
  const orderHashes = orderHashesFromAppointment(appointment);
  if (orderHashes.includes(intent.order_hash)) {
    return true;
  }
  const apptCpt = cptFromAppointment(appointment);
  return Boolean(intent.cpt && apptCpt && intent.cpt === apptCpt);
}

function fhirStatusBucket(status: string | undefined): "scheduled" | "cancelled" | "open" {
  const s = (status ?? "").toLowerCase();
  if (FHIR_CANCELLED_STATUSES.has(s)) {
    return "cancelled";
  }
  if (FHIR_SCHEDULED_STATUSES.has(s)) {
    return "scheduled";
  }
  return "open";
}

/**
 * Enqueues one scheduling intent per hashed order (idempotent on `order_hash`).
 *
 * @param event - De-identified AIIE audit event from order-sign final check.
 */
export async function captureIntent(event: AiieAuditEvent): Promise<void> {
  try {
    if (!SHA256_HEX.test(event.orderHash) || !SHA256_HEX.test(event.patientHash)) {
      console.warn("[ins_scheduling_intent] skipped: invalid hash format");
      return;
    }

    const { data: supabase, error } = createAdminClient();
    if (error || !supabase) {
      console.warn("[ins_scheduling_intent] skipped:", error?.message ?? "no supabase");
      return;
    }

    const { error: upsertErr } = await supabase.from("ins_scheduling_intent").upsert(
      {
        order_hash: event.orderHash,
        patient_hash: event.patientHash,
        sla_expires_at: schedulingSlaExpiresAt(),
        status: "pending" as SchedulingStatus,
        cpt: event.cpt ?? null,
        modality: null,
        body_part: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "order_hash", ignoreDuplicates: true },
    );

    if (upsertErr) {
      console.warn("[ins_scheduling_intent] upsert failed:", upsertErr.message);
    } else {
      void bump("scheduling_intent_created");
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    console.warn("[ins_scheduling_intent] unexpected:", msg);
  }
}

/**
 * Marks one intent as SLA-breached and logs a validation event (no PHI).
 *
 * @param intentId - Primary key of `ins_scheduling_intent`.
 */
export async function markBreached(intentId: string): Promise<void> {
  const { data: supabase, error } = createAdminClient();
  if (error || !supabase) {
    return;
  }

  const { data: row, error: fetchErr } = await supabase
    .from("ins_scheduling_intent")
    .select("id, order_hash, cpt, status")
    .eq("id", intentId)
    .maybeSingle();

  if (fetchErr || !row) {
    return;
  }

  const current = row as {
    id: string;
    order_hash: string;
    cpt: string | null;
    status: SchedulingStatus;
  };

  if (current.status === "sla_breached" || current.status === "scheduled") {
    return;
  }

  const now = new Date().toISOString();
  await supabase
    .from("ins_scheduling_intent")
    .update({ status: "sla_breached", updated_at: now })
    .eq("id", intentId);

  void bump("scheduling_intent_breached");

  await supabase.from("ins_validation_events").insert({
    event_type: "scheduling_intent_breach",
    provider_id: null,
    payer_id: null,
    amount_usd: null,
    minutes_saved: null,
    metadata: {
      order_hash: current.order_hash,
      cpt: current.cpt,
      intent_id: intentId,
    },
  });
}

type IntentRow = {
  id: string;
  order_hash: string;
  patient_hash: string;
  sla_expires_at: string;
  status: SchedulingStatus;
  cpt: string | null;
};

async function fetchOpenIntents(): Promise<IntentRow[]> {
  const { data: supabase, error } = createAdminClient();
  if (error || !supabase) {
    return [];
  }

  const { data, error: qErr } = await supabase
    .from("ins_scheduling_intent")
    .select("id, order_hash, patient_hash, sla_expires_at, status, cpt")
    .in("status", ["pending", "in_progress"]);

  if (qErr || !data) {
    return [];
  }
  return data as IntentRow[];
}

async function pollRecentAppointments(): Promise<Appointment[]> {
  const base = process.env.ARKA_FHIR_BASE_URL?.trim();
  const token =
    process.env.ARKA_FHIR_RECONCILE_BEARER_TOKEN?.trim() ??
    process.env.ARKA_FHIR_BEARER_TOKEN?.trim();

  if (!base || !token) {
    return [];
  }

  const since = new Date(Date.now() - SLA_HOURS * 60 * 60 * 1000).toISOString();
  const client = new FHIRClient(base, token);
  const { data: bundle, error } = await client.searchAppointments({
    date: `ge${since.slice(0, 10)}`,
    _count: 200,
  });

  if (error || !bundle?.entry?.length) {
    return [];
  }

  const out: Appointment[] = [];
  for (const e of bundle.entry) {
    const r = e.resource;
    if (r?.resourceType === "Appointment") {
      out.push(r);
    }
  }
  return out;
}

/**
 * Reconciles open intents against FHIR appointments and SLA deadlines (idempotent updates).
 */
export async function reconcileIntents(): Promise<ReconcileIntentsResult> {
  const nowMs = Date.now();
  let scheduled = 0;
  let breached = 0;

  const intents = await fetchOpenIntents();
  const appointments = await pollRecentAppointments();

  const matchedIntentIds = new Set<string>();

  for (const appt of appointments) {
    const bucket = fhirStatusBucket(appt.status);
    if (bucket === "open") {
      continue;
    }

    for (const intent of intents) {
      if (matchedIntentIds.has(intent.id)) {
        continue;
      }
      if (!appointmentMatchesIntent(appt, intent)) {
        continue;
      }

      const { data: supabase, error } = createAdminClient();
      if (error || !supabase) {
        continue;
      }

      const apptHash = appt.id
        ? hashAuditIdentifier(`Appointment/${appt.id}`)
        : null;
      const nextStatus: SchedulingStatus =
        bucket === "cancelled" ? "cancelled" : "scheduled";

      const { error: updErr } = await supabase
        .from("ins_scheduling_intent")
        .update({
          status: nextStatus,
          scheduled_appointment_hash: apptHash,
          updated_at: new Date().toISOString(),
        })
        .eq("id", intent.id)
        .in("status", ["pending", "in_progress"]);

      if (!updErr) {
        matchedIntentIds.add(intent.id);
        if (nextStatus === "scheduled") {
          scheduled += 1;
        }
      }
    }
  }

  for (const intent of intents) {
    if (matchedIntentIds.has(intent.id)) {
      continue;
    }
    const slaMs = new Date(intent.sla_expires_at).getTime();
    if (intent.status === "pending" && !Number.isNaN(slaMs) && slaMs <= nowMs) {
      await markBreached(intent.id);
      breached += 1;
      matchedIntentIds.add(intent.id);
    }
  }

  const stillPending = intents.filter((i) => !matchedIntentIds.has(i.id)).length;

  return { scheduled, breached, stillPending };
}

/**
 * Dashboard aggregates for scheduling-intent queue (no PHI).
 */
export async function getSchedulingIntentDashboard(): Promise<{
  pendingCount: number;
  slaOnTrackPercent: number;
  breaches: Array<{ orderHash: string; cpt: string | null; slaExpiredAt: string }>;
}> {
  const { data: supabase, error } = createAdminClient();
  if (error || !supabase) {
    return { pendingCount: 0, slaOnTrackPercent: 100, breaches: [] };
  }

  const nowIso = new Date().toISOString();

  const { data: pendingRows } = await supabase
    .from("ins_scheduling_intent")
    .select("sla_expires_at")
    .in("status", ["pending", "in_progress"]);

  const pending = (pendingRows ?? []) as Array<{ sla_expires_at: string }>;
  const onTrack = pending.filter((r) => r.sla_expires_at > nowIso).length;
  const slaOnTrackPercent =
    pending.length === 0 ? 100 : Math.round((onTrack / pending.length) * 100);

  const { data: breachRows } = await supabase
    .from("ins_scheduling_intent")
    .select("order_hash, cpt, sla_expires_at")
    .eq("status", "sla_breached")
    .order("sla_expires_at", { ascending: false })
    .limit(50);

  const breaches = ((breachRows ?? []) as Array<{
    order_hash: string;
    cpt: string | null;
    sla_expires_at: string;
  }>).map((r) => ({
    orderHash: r.order_hash,
    cpt: r.cpt,
    slaExpiredAt: r.sla_expires_at,
  }));

  return {
    pendingCount: pending.length,
    slaOnTrackPercent,
    breaches,
  };
}
