import { createHash } from "node:crypto";

import { createAdminClient } from "@/lib/supabase/admin";

export type InsRequestLogInput = {
  requestId: string;
  path: string;
  method: string;
  durationMs: number;
  statusCode: number;
  clientIp: string;
};

/**
 * SHA-256 of the client IP for storage (no raw IP in logs).
 *
 * @param ip - Raw IP or "unknown".
 */
export function hashClientIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex");
}

/**
 * Inserts one timing row into `ins_request_logs` (no PHI). Fails silently if Supabase is unset.
 *
 * @param input - Request identifiers and measured duration.
 */
export async function insertInsRequestLog(input: InsRequestLogInput): Promise<void> {
  const { data: supabase, error } = createAdminClient();
  if (error || !supabase) {
    return;
  }
  const ipHash = hashClientIp(input.clientIp);
  const { error: insertErr } = await supabase.from("ins_request_logs").insert({
    request_id: input.requestId,
    path: input.path,
    method: input.method,
    duration_ms: input.durationMs,
    status_code: input.statusCode,
    ip_hash: ipHash,
  });
  if (insertErr) {
    console.error("[ins_request_logs]", insertErr.message);
  }
}

/**
 * Best-effort client IP from request headers (Vercel / proxies).
 *
 * @param request - Incoming request.
 */
export function clientIpFromRequest(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    return xff.split(",")[0]?.trim() || "unknown";
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "unknown";
}
