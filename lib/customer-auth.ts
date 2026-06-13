import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { db } from '@/lib/db'

/**
 * Customer (storefront account) authentication helpers.
 *
 * Mirror of admin-auth: strict secret (no hardcoded fallback in prod),
 * tokenVersion-based revocation, async session validator that confirms the
 * user still exists and the token version still matches.
 */

export const CUSTOMER_TOKEN_COOKIE = 'luton_customer_token'

// Lazy secret read — see lib/admin-auth.ts for rationale (don't crash the
// build's page-data collection step on machines without the prod env set).
let _cachedSecret: string | null = null
let _warnedDev = false
function jwtSecret(): string {
  if (_cachedSecret) return _cachedSecret
  const env = process.env.CUSTOMER_JWT_SECRET
  if (env && env.length >= 32) {
    _cachedSecret = env
    return _cachedSecret
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'CUSTOMER_JWT_SECRET env var is missing or shorter than 32 chars. ' +
      'Set it to a long random string in Railway and redeploy.',
    )
  }
  if (!_warnedDev) {
    _warnedDev = true
    // eslint-disable-next-line no-console
    console.warn(
      '[customer-auth] CUSTOMER_JWT_SECRET not set or too short. Using dev fallback. ' +
      'NEVER deploy with this — set CUSTOMER_JWT_SECRET to a 32+ char random string.',
    )
  }
  _cachedSecret = 'dev-only-customer-secret-do-not-use-in-prod-' + (process.env.npm_package_name || 'app')
  return _cachedSecret
}

export interface CustomerJwtPayload {
  userId: string
  email: string
  /** tokenVersion — must match User.tokenVersion at verify time. */
  tv: number
}

export function signCustomerToken(payload: CustomerJwtPayload): string {
  // 7-day expiry (was 30d). Sliding renewal happens on next login.
  return jwt.sign(payload, jwtSecret(), { expiresIn: '7d', algorithm: 'HS256' })
}

export function verifyCustomerToken(token: string): CustomerJwtPayload | null {
  try {
    const decoded = jwt.verify(token, jwtSecret(), { algorithms: ['HS256'] }) as Partial<CustomerJwtPayload>
    if (
      !decoded ||
      typeof decoded.userId !== 'string' ||
      typeof decoded.email !== 'string' ||
      typeof decoded.tv !== 'number'
    ) {
      return null
    }
    return { userId: decoded.userId, email: decoded.email, tv: decoded.tv }
  } catch {
    return null
  }
}

/** Sync layer: signature + expiry only. */
export function getCustomerFromRequest(req: NextRequest): CustomerJwtPayload | null {
  const token = req.cookies.get(CUSTOMER_TOKEN_COOKIE)?.value
  if (!token) return null
  return verifyCustomerToken(token)
}

// ─── Async session check with 30s memoization (see admin-auth for rationale) ─
const sessionCache = new Map<string, { ok: boolean; validatedAt: number }>()
const SESSION_CACHE_TTL_MS = 30_000

export async function verifyCustomerSession(req: NextRequest): Promise<CustomerJwtPayload | null> {
  const token = req.cookies.get(CUSTOMER_TOKEN_COOKIE)?.value
  if (!token) return null

  const payload = verifyCustomerToken(token)
  if (!payload) return null

  const cached = sessionCache.get(token)
  if (cached && Date.now() - cached.validatedAt < SESSION_CACHE_TTL_MS) {
    return cached.ok ? payload : null
  }

  try {
    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: { tokenVersion: true },
    })
    const ok = !!user && user.tokenVersion === payload.tv
    sessionCache.set(token, { ok, validatedAt: Date.now() })
    if (sessionCache.size > 2000) {
      const firstKey = sessionCache.keys().next().value
      if (firstKey !== undefined) sessionCache.delete(firstKey)
    }
    return ok ? payload : null
  } catch {
    return null
  }
}

export function invalidateCustomerSession(token: string | undefined) {
  if (token) sessionCache.delete(token)
}
