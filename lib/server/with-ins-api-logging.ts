import { after } from "next/server";

import { clientIpFromRequest, insertInsRequestLog } from "@/lib/server/ins-request-log";

/**
 * Wraps an App Router handler to record duration and status into `ins_request_logs`
 * after the response is produced. Uses `x-request-id` and `x-request-start` from middleware.
 *
 * @param handler - Route handler (supports optional second `context` arg for dynamic segments).
 */
export function withInsApiLogging<A extends unknown[]>(
  handler: (request: Request, ...args: A) => Promise<Response>,
): (request: Request, ...args: A) => Promise<Response> {
  return (async (request: Request, ...args: A) => {
    const start = Number(request.headers.get("x-request-start") ?? Date.now());
    const requestId = request.headers.get("x-request-id") ?? "";
    const path = new URL(request.url).pathname;
    const method = request.method;
    const ip = clientIpFromRequest(request);

    try {
      const response = await handler(request, ...args);
      const end = Date.now();
      after(() =>
        void insertInsRequestLog({
          requestId,
          path,
          method,
          durationMs: Math.max(0, end - start),
          statusCode: response.status,
          clientIp: ip,
        }),
      );
      return response;
    } catch (err) {
      const end = Date.now();
      after(() =>
        void insertInsRequestLog({
          requestId,
          path,
          method,
          durationMs: Math.max(0, end - start),
          statusCode: 500,
          clientIp: ip,
        }),
      );
      throw err;
    }
  }) as (request: Request, ...args: A) => Promise<Response>;
}
