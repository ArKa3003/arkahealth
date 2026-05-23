/**
 * Browser-safe counter bump (POST to `/api/ins/counters/bump`).
 */

/**
 * Records one observability counter from the client (no PHI in labels).
 *
 * @param counter - Counter name.
 * @param labels - Optional safe labels (`modality`, `rule_id`, …).
 */
export function bumpCounter(
  counter: string,
  labels?: Record<string, string>,
): void {
  void fetch("/api/ins/counters/bump", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ counter, labels }),
    keepalive: true,
  }).catch(() => {
    /* best-effort */
  });
}
