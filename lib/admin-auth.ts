import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { db } from '@/lib/db'

/**
 * Admin authentication helpers.
 *
 * Two layers of session validity:
 *
 *  1. Synchronous: the JWT signature is valid and not expired.
 *     `getAdminFromRequest(req)` — cheap, reads the cookie + verifies.
 *  2. Asynchronous: the AdminUser still exists, is `active`, and the JWT's
 *     `tv` (tokenVersion) claim matches the DB. `verifyAdminSession(req)`
 *     does both layers and is what every admin API route should call.
 *
 * Why two layers? Most authorization checks need both — but inside hot
 * paths (rate limiter key derivation, low-cost reads) the sync layer is
 * enough. The DB check is cached for 30 seconds per JWT so a logged-in
 * admin browsing a page that makes 20 admin API calls only triggers one
 * lookup.
 *
 * tokenVersion lets us revoke sessions without a server-side session store:
 * password change → `tokenVersion++` → every existing JWT is invalidated.
 */

const ADMIN_TOKEN_COOKIE = 'luton_admin_token'

// In production the JWT secret MUST be set to a long random string in
// Railway env vars. We refuse to sign/verify if it's missing or weak —
// previously this fell back to a hardcoded string baked into the source,
// which let anyone reading the repo mint a superadmin JWT.
//
// The secret is resolved LAZILY on first sign/verify, not at module-load.
// Next's build pipeline imports route modules just to collect page data;
// throwing at module load would crash the build on machines that don't
// have the prod env vars set.
let _cachedSecret: string | null = null
let _warnedDev = false
function jwtSecret(): string {
  if (_cachedSecret) return _cachedSecret
  const env = process.env.ADMIN_JWT_SECRET
  if (env && env.length >= 32) {
    _cachedSecret = env
    return _cachedSecret
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'ADMIN_JWT_SECRET env var is missing or shorter than 32 chars. ' +
      'Set it to a long random string in Railway and redeploy.',
    )
  }
  if (!_warnedDev) {
    _warnedDev = true
    // eslint-disable-next-line no-console
    console.warn(
      '[admin-auth] ADMIN_JWT_SECRET not set or too short. Using dev fallback. ' +
      'NEVER deploy with this — set ADMIN_JWT_SECRET to a 32+ char random string.',
    )
  }
  _cachedSecret = 'dev-only-admin-secret-do-not-use-in-prod-' + (process.env.npm_package_name || 'app')
  return _cachedSecret
}

export interface AdminJwtPayload {
  userId: string
  email: string
  role: string
  /** tokenVersion — must match AdminUser.tokenVersion at verify time. */
  tv: number
}

export function signAdminToken(payload: AdminJwtPayload): string {
  // 24h expiry. Sliding refresh happens on every login — we don't auto-renew
  // on every request because that needs a cookie write and we want session
  // length to be predictable.
  return jwt.sign(payload, jwtSecret(), { expiresIn: '24h' })
}

export function verifyAdminToken(token: string): AdminJwtPayload | null {
  try {
    const decoded = jwt.verify(token, jwtSecret()) as Partial<AdminJwtPayload>
    if (
      !decoded ||
      typeof decoded.userId !== 'string' ||
      typeof decoded.email !== 'string' ||
      typeof decoded.role !== 'string' ||
      typeof decoded.tv !== 'number'
    ) {
      return null
    }
    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      tv: decoded.tv,
    }
  } catch {
    return null
  }
}

/** Sync layer: signature + expiry only. No DB call. */
export function getAdminFromRequest(req: NextRequest): AdminJwtPayload | null {
  const token = req.cookies.get(ADMIN_TOKEN_COOKIE)?.value
  if (!token) return null
  return verifyAdminToken(token)
}

export function requireAdmin(req: NextRequest): AdminJwtPayload {
  const admin = getAdminFromRequest(req)
  if (!admin) throw new Error('Unauthorized')
  return admin
}

// ─── Async session check with 30s memoization ─────────────────────────────
// Cache map: cookie token string → { ok, validatedAt }. Avoids hitting the DB
// on every single admin API call when the same browser is making many.
const sessionCache = new Map<string, { ok: boolean; validatedAt: number }>()
const SESSION_CACHE_TTL_MS = 30_000

/**
 * Full-fidelity session check: JWT valid + admin exists + active + token
 * version matches. Returns the JWT payload on success or null on failure.
 *
 * Call this from any admin API handler that mutates data or returns
 * sensitive info. Compared to the sync `getAdminFromRequest`, this closes:
 *   - soft-deleted admins (active=false) still able to act for up to 24h
 *   - stolen tokens still usable after the owner's password change
 *   - sessions for AdminUser rows that were hard-deleted
 */
export async function verifyAdminSession(req: NextRequest): Promise<AdminJwtPayload | null> {
  const token = req.cookies.get(ADMIN_TOKEN_COOKIE)?.value
  if (!token) return null

  const payload = verifyAdminToken(token)
  if (!payload) return null

  // Fast path: cached recent validation
  const cached = sessionCache.get(token)
  if (cached && Date.now() - cached.validatedAt < SESSION_CACHE_TTL_MS) {
    return cached.ok ? payload : null
  }

  // Slow path: DB lookup
  try {
    const user = await db.adminUser.findUnique({
      where: { id: payload.userId },
      select: { active: true, role: true, tokenVersion: true },
    })
    const ok = !!user && user.active && user.tokenVersion === payload.tv
    sessionCache.set(token, { ok, validatedAt: Date.now() })
    // Bound the cache to avoid runaway memory
    if (sessionCache.size > 2000) {
      const firstKey = sessionCache.keys().next().value
      if (firstKey !== undefined) sessionCache.delete(firstKey)
    }
    if (!ok) return null
    // Reflect the latest role from DB (in case it was changed since sign)
    return { ...payload, role: user.role }
  } catch {
    // On DB failure, fail closed — better a 401 than letting a possibly
    // revoked session through.
    return null
  }
}

/** Manually invalidate the cached session check for a token (e.g. after logout). */
export function invalidateAdminSession(token: string | undefined) {
  if (token) sessionCache.delete(token)
}

export const ADMIN_TOKEN_COOKIE_NAME = ADMIN_TOKEN_COOKIE
