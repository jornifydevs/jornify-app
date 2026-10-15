import { createClient } from "@supabase/supabase-js";

/**
 * Returns a Supabase client authenticated with the service role key.
 * Use ONLY on the server side (API routes, server components).
 * Never expose this client to the browser.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
