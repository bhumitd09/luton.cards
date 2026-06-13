import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * CSRF defense-in-depth for the JSON API.
 *
 * All auth uses SameSite=Lax cookies, which already blocks the classic
 * cross-site form POST. This adds an explicit same-origin check for every
 * state-changing API request as a second layer: if a browser sends an
 * `Origin` header that isn't ours, we reject it.
 *
 * - Safe methods (GET/HEAD/OPTIONS) are never blocked.
 * - Requests with no `Origin` header (server-to-server, curl, same-origin
 *   navigations on some browsers) pass — there's no cross-site cookie risk
 *   without a browser origin, and cookie auth requires a browser anyway.
 * - Webhooks are server-to-server and legitimately cross-origin, so they're
 *   exempt (they have their own HMAC signature verification).
 */

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

// Server-to-server endpoints with their own signature auth — never subject to
// the browser-origin check.
const EXEMPT_PREFIXES = [
  '/api/stripe/webhook',
  '/api/square/webhook',
  '/api/webhooks/',
]

export function middleware(req: NextRequest) {
  if (SAFE_METHODS.has(req.method)) return NextResponse.next()

  const { pathname } = req.nextUrl
  if (EXEMPT_PREFIXES.some((p) => pathname.startsWith(p))) return NextResponse.next()

  const origin = req.headers.get('origin')
  if (!origin) return NextResponse.next()

  let originHost: string
  try {
    originHost = new URL(origin).host
  } catch {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
  }

  const allowed = new Set<string>([req.nextUrl.host])
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (appUrl) {
    try { allowed.add(new URL(appUrl).host) } catch { /* ignore malformed env */ }
  }

  if (!allowed.has(originHost)) {
    return NextResponse.json({ error: 'Cross-origin request blocked' }, { status: 403 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}
