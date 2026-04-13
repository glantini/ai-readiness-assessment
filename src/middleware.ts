import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  // Build a Supabase client that can read/write cookies on the response
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh the session — MUST be called before any auth checks so that
  // expired tokens get rotated and the session remains alive.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // ── Public assess routes: always allow (no auth required) ─────────────────
  // /assess/[token]/** is the client-facing assessment flow
  if (pathname.startsWith('/assess')) {
    return supabaseResponse
  }

  // ── Auth routes: redirect authenticated IMG users to dashboard ─────────────
  if (pathname.startsWith('/auth')) {
    if (user && user.email?.endsWith('@growwithimg.com')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return supabaseResponse
  }

  // ── Partner login: always public ──────────────────────────────────────────
  if (pathname === '/partner/login') {
    return supabaseResponse
  }

  // ── Partner routes: require an authenticated user (partner identity is
  //    verified at the page/layout level via referral_partners lookup) ───────
  if (pathname.startsWith('/partner')) {
    if (!user) {
      const loginUrl = new URL('/partner/login', request.url)
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }
    return supabaseResponse
  }

  // ── Admin alias: same gate as /dashboard, redirects through to /dashboard ──
  if (pathname.startsWith('/admin')) {
    if (!user) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }

    if (!user.email?.endsWith('@growwithimg.com')) {
      await supabase.auth.signOut()
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('error', 'access_restricted')
      return NextResponse.redirect(loginUrl)
    }

    return supabaseResponse
  }

  // ── Dashboard routes: require authenticated @growwithimg.com user ──────────
  if (pathname.startsWith('/dashboard')) {
    // Not signed in → redirect to login
    if (!user) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Signed in but wrong domain → sign out and redirect to login with error
    if (!user.email?.endsWith('@growwithimg.com')) {
      await supabase.auth.signOut()
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('error', 'unauthorized_domain')
      return NextResponse.redirect(loginUrl)
    }

    return supabaseResponse
  }

  // ── Root: redirect authenticated IMG users to dashboard ───────────────────
  if (pathname === '/') {
    if (user && user.email?.endsWith('@growwithimg.com')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimisation)
     * - favicon.ico, sitemap.xml, robots.txt
     * - public asset files (images, fonts, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)',
  ],
}
