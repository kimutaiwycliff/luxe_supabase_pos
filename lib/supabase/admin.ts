import { createClient } from "@supabase/supabase-js"

/**
 * Admin Supabase client using the service role key.
 * Bypasses Row Level Security — only use in trusted server-side contexts
 * like cron jobs or background tasks. Never expose to the client.
 */
export function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )
}
