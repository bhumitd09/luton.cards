import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { MAINT_BYPASS_COOKIE, maintenanceBypassToken } from '@/lib/maintenance-token'

/**
 * Two jobs:
 *
 *  1. CSRF defense-in-depth for the JSON API (same-origin check on
 *     state-changing /api requests).
 *  2. Maintenance "site lock": when enabled in the back office, public pages
 *     are replaced by a holding page unless the visitor is a logged-in admin
 *     or has unlocked with the password.
 */

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

// Server-to-server endpoints with their own signature auth — never subject to
// the browser-origin check.
const EXEMPT_PREFIXES = ['/api/stripe/webhook', '/api/square/webhook', '/api/webhooks/']

const ADMIN_COOKIE = 'luton_admin_token'

// ── Maintenance flag cache ────────────────────────────────────────────────
// The flag lives in the DB (toggled from the back office). Middleware runs on
// the edge and can't touch Prisma, so it reads the flag from a tiny internal
// endpoint and caches it per-instance for 30s — roughly one lookup per
// instance per 30s, not one per request. Fails OPEN (site stays live) so a
// lookup blip can never accidentally brick the storefront.
let flagCache: { enabled: boolean; exp: number } | null = null

async function maintenanceEnabled(req: NextRequest): Promise<boolean> {
  const now = Date.now()
  if (flagCache && flagCache.exp > now) return flagCache.enabled
  try {
    const res = await fetch(new URL('/api/maintenance/status', req.url), { cache: 'no-store' })
    const data = res.ok ? await res.json() : { enabled: false }
    flagCache = { enabled: Boolean(data.enabled), exp: now + 30_000 }
    return flagCache.enabled
  } catch {
    flagCache = { enabled: false, exp: now + 30_000 }
    return false
  }
}

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

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // ── /api → CSRF only (never gated by maintenance) ──────────────────────
  if (pathname.startsWith('/api')) {
    return csrf(req) ?? NextResponse.next()
  }

  // ── Page routes → maintenance gate ─────────────────────────────────────
  // Always-allowed paths: the back office (so the owner can unlock), the
  // holding page itself, and Next internals. Only gate real navigations.
  const exempt =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/maintenance') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/logo')
  if (exempt) return NextResponse.next()

  if (!(await maintenanceEnabled(req))) return NextResponse.next()

  // Logged-in admin? Let them browse the live site while it's locked.
  if (req.cookies.get(ADMIN_COOKIE)?.value) return NextResponse.next()

  // Unlocked with the password?
  const bypass = req.cookies.get(MAINT_BYPASS_COOKIE)?.value
  if (bypass && bypass === (await maintenanceBypassToken())) return NextResponse.next()

  // Otherwise show the holding page (URL preserved via rewrite).
  return NextResponse.rewrite(new URL('/maintenance', req.url))
}

export const config = {
  // Run on the API (CSRF) and on page navigations (maintenance gate), but skip
  // static assets so we don't add overhead to every image/script.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|txt|xml)$).*)'],
}
