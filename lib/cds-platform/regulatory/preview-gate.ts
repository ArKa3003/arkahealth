import type { NextRequest } from 'next/server';

/**
 * Whether regulatory preview endpoints (decision log) may be accessed.
 * Allowed in non-production, or when `X-ARKA-REGULATORY-PREVIEW` matches the env token.
 *
 * @param request - Incoming request.
 */
export function isRegulatoryPreviewAllowed(request: NextRequest): boolean {
  if (process.env.NODE_ENV !== 'production') {
    return true;
  }
  const token = process.env.ARKA_REGULATORY_PREVIEW_TOKEN;
  if (!token) {
    return false;
  }
  return request.headers.get('x-arka-regulatory-preview') === token;
}
