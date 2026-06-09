export type SafeFetchJsonResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status?: number };

/**
 * Fetches a URL and parses the response body as JSON without throwing.
 *
 * Applies an {@link AbortController} timeout (default 9000ms via `init.timeoutMs`),
 * checks `res.ok`, reads the body as text, then parses with `JSON.parse` inside
 * try/catch. An optional `init.signal` is merged so caller aborts cancel the request.
 *
 * @returns A discriminated union — never rejects.
 */
export async function safeFetchJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit & { timeoutMs?: number },
): Promise<SafeFetchJsonResult<T>> {
  const timeoutMs = init?.timeoutMs ?? 9000;
  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const externalSignal = init?.signal;

  const abortFromExternal = () => {
    controller.abort();
  };

  try {
    timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    if (externalSignal) {
      if (externalSignal.aborted) {
        return { ok: false, error: 'Request aborted' };
      }
      externalSignal.addEventListener('abort', abortFromExternal, { once: true });
    }

    const { timeoutMs: _timeoutMs, signal: _signal, ...fetchInit } = init ?? {};

    const res = await fetch(input, {
      ...fetchInit,
      signal: controller.signal,
    });

    const text = await res.text();

    if (!res.ok) {
      let errorMessage = `HTTP ${res.status}`;
      if (text.trim()) {
        try {
          const parsed = JSON.parse(text) as { error?: string; message?: string };
          errorMessage = parsed.error ?? parsed.message ?? errorMessage;
        } catch {
          errorMessage = text.length > 200 ? `${text.slice(0, 200)}…` : text;
        }
      }
      return { ok: false, error: errorMessage, status: res.status };
    }

    if (!text.trim()) {
      return { ok: false, error: 'Empty response body', status: res.status };
    }

    try {
      const data = JSON.parse(text) as T;
      return { ok: true, data };
    } catch {
      return { ok: false, error: 'Invalid JSON response', status: res.status };
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      if (externalSignal?.aborted) {
        return { ok: false, error: 'Request aborted' };
      }
      return { ok: false, error: 'Request timed out' };
    }
    const message = err instanceof Error ? err.message : 'Network request failed';
    return { ok: false, error: message };
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
    externalSignal?.removeEventListener('abort', abortFromExternal);
  }
}
