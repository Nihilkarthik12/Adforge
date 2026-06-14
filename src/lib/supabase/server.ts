// Server-side Supabase client for Server Components and Route Handlers.
// Uses the request cookies so RLS sees the logged-in user.

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { isSupabaseConfigured, SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

export async function createServerSupabase(): Promise<SupabaseClient | null> {
  if (!isSupabaseConfigured) return null;
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component — safe to ignore; the proxy
          // refreshes sessions.
        }
      },
    },
  });
}

/** Current user, or null when logged out / Supabase not configured. */
export async function getServerUser(): Promise<{
  supabase: SupabaseClient | null;
  user: User | null;
}> {
  const supabase = await createServerSupabase();
  if (!supabase) return { supabase: null, user: null };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}
