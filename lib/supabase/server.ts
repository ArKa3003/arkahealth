import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase server client for Server Components, Route Handlers, and Server Actions.
 * Session is read/written via Next.js cookies (`@supabase/ssr`).
 *
 * @returns Configured Supabase client, or throws if public env vars are unset.
 */
export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          /* Called from a Server Component where cookies are read-only */
        }
      },
    },
  });
}
