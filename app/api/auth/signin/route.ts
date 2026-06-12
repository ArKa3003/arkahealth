import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import {
  ARKA_SESSION_COOKIE,
  ARKA_SESSION_MAX_AGE_SECONDS,
  sealDemoSession,
  validateDemoCredentials,
} from "@/lib/auth/demo-session";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

const signInBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

/**
 * Authenticates against demo credentials and sets the httpOnly session cookie.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const parsed = signInBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid email or password format" },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const { email, password } = parsed.data;

  if (!validateDemoCredentials(email, password)) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401, headers: NO_STORE_HEADERS });
  }

  const sealed = await sealDemoSession({ email: email.trim().toLowerCase(), sub: "demo-user" });
  if (sealed.error) {
    return NextResponse.json(
      { error: "Authentication service unavailable" },
      { status: 503, headers: NO_STORE_HEADERS },
    );
  }

  const secure = request.nextUrl.protocol === "https:";
  const response = NextResponse.json({ ok: true }, { headers: NO_STORE_HEADERS });
  response.cookies.set(ARKA_SESSION_COOKIE, sealed.data, {
    httpOnly: true,
    secure,
    sameSite: secure ? "none" : "lax",
    path: "/",
    maxAge: ARKA_SESSION_MAX_AGE_SECONDS,
  });
  return response;
}
