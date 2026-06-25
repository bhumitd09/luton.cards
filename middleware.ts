import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Two jobs:
 *  1. CSRF defense-in-depth for the JSON API (same-origin check on
 *     state-changing /api requests).
 *  2. Expose the request path as `x-pathname` so the root layout can apply the
 *     maintenance "site lock" (the layout reads the flag straight from the DB —
 *     middleware runs on the edge and can't, and a self-fetch proved
 *     unreliable behind the proxy).
 */

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

const EXEMPT_PREFIXES = ['/api/stripe/webhook', '/api/square/webhook', '/api/webhooks/']

function csrf(req: NextRequest): NextResponse | null {
  if (SAFE_METHODS.has(req.method)) return null
  const { pathname } = req.nextUrl
  if (EXEMPT_PREFIXES.some(p => pathname.startsWith(p))) return null

  const origin = req.headers.get('origin')
  if (!origin) return null

  let originHost: string
  try {
    originHost = new URL(origin).host
  } catch {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
  }

  const allowed = new Set<string>([req.nextUrl.host])
  const fwdHost = req.headers.get('x-forwarded-host')
  const host = req.headers.get('host')
  if (fwdHost) fwdHost.split(',').forEach(h => allowed.add(h.trim()))
  if (host) allowed.add(host.trim())
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (appUrl) {
    try { allowed.add(new URL(appUrl).host) } catch { /* ignore malformed env */ }
  }

  if (!allowed.has(originHost)) {
    return NextResponse.json({ error: 'Cross-origin request blocked' }, { status: 403 })
  }
  return null
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/api')) {
    return csrf(req) ?? NextResponse.next()
  }

  // Pass the path to the root layout (maintenance gate) via a request header.
  const headers = new Headers(req.headers)
  headers.set('x-pathname', pathname)
  const res = NextResponse.next({ request: { headers } })
  // Stop the CDN (Cloudflare) caching page HTML. Pages are dynamic (they
  // reflect live stock + the maintenance lock), so a cached copy goes stale
  // and the site lock can't engage. Static assets are excluded by the matcher.
  res.headers.set('Cache-Control', 'no-store, must-revalidate')
  res.headers.set('CDN-Cache-Control', 'no-store')
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|txt|xml)$).*)'],
}
