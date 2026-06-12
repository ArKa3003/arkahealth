import { NextResponse, type NextRequest } from "next/server";

import { ARKA_SESSION_COOKIE, openDemoSession } from "@/lib/auth/demo-session";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

/**
 * Returns the active demo session user, if any.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const cookieValue = request.cookies.get(ARKA_SESSION_COOKIE)?.value;
  if (!cookieValue) {
    return NextResponse.json({ user: null }, { headers: NO_STORE_HEADERS });
  }

  const opened = await openDemoSession(cookieValue);
  if (opened.error) {
    return NextResponse.json({ user: null }, { headers: NO_STORE_HEADERS });
  }

  return NextResponse.json(
    { user: { email: opened.data.email } },
    { headers: NO_STORE_HEADERS },
  );
}
