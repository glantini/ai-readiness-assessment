import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Server-side Supabase client for Server Components, Server Actions, and
 * Route Handlers. Uses the anon key with cookie-based session propagation.
 *
 * Usage:
 *   const supabase = await createClient()
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignore: setAll called from a Server Component (read-only context).
            // Middleware handles session refresh instead.
          }
        },
      },
    }
  )
}

/**
 * Service-role client that bypasses Row Level Security.
 * ONLY use in trusted server-side contexts (Server Actions, Route Handlers).
 * Never expose to the client or use in Server Components rendered for public routes.
 */
export function createServiceClient() {
  const { createClient: createSupabaseClient } = require('@supabase/supabase-js')
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}
