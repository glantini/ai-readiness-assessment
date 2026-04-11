import { createBrowserClient } from '@supabase/ssr'

/**
 * Browser-side Supabase client for Client Components.
 * Creates a singleton per module to avoid multiple GoTrue instances.
 *
 * Usage (inside a Client Component):
 *   const supabase = createClient()
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
