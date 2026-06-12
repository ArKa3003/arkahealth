import { NextResponse } from "next/server";

import { ARKA_SESSION_COOKIE } from "@/lib/auth/demo-session";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

/**
 * Clears the demo session cookie.
 */
export async function POST(): Promise<NextResponse> {
  const response = NextResponse.json({ ok: true }, { headers: NO_STORE_HEADERS });
  response.cookies.delete(ARKA_SESSION_COOKIE);
  return response;
}
