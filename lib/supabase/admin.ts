import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { AIIELibError } from "@/lib/types/aiie";

/**
 * Creates a Supabase client using the service role key for server-side jobs that
 * bypass RLS (ARKA-INS aggregates and caches). Never expose this client to the browser.
 *
 * @returns A connected admin client or a structured error when configuration is missing.
 */
export function createAdminClient(): {
  data: SupabaseClient | null;
  error: AIIELibError | null;
} {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return {
      data: null,
      error: {
        code: "MISSING_SUPABASE_ADMIN_CONFIG",
        message:
          "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for admin database access.",
      },
    };
  }
  return {
    data: createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    }),
    error: null,
  };
}
