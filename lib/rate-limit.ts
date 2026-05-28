/**
 * In-memory fixed-window rate limiter.
 *
 * Suitable for single-instance Railway deploys (which is what we're on).
 * If we ever scale horizontally, swap the backing store for Upstash Redis
 * (`@upstash/ratelimit`) — the API surface (`limit({ key, max, windowMs })`)
 * is intentionally compatible.
 *
 * Why not just slap @upstash/ratelimit in? Adds a Redis dependency, an
 * external service to provision, monthly cost, and a network hop on every
 * sensitive request. For a single Railway node we get 95% of the benefit
 * with zero infra. Re-evaluate when we hit ~2 instances.
 *
 * The store is a Map keyed by `${bucket}:${key}` (e.g. `admin-login:1.2.3.4`).
 * Old entries are lazy-evicted on access; we don't need a sweeper because
 * each entry only consumes ~60 bytes and the cap below keeps it bounded.
 */
import { NextRequest, NextResponse } from 'next/server'

interface Bucket {
  count: number
  windowStart: number // ms epoch
}

const STORE_CAP = 5000 // hard ceiling on tracked keys to avoid runaway memory
const store = new Map<string, Bucket>()

/**
 * Best-effort client IP. Trusts proxy headers because we run behind Railway's
 * proxy; if you ever expose the Node port directly, prefer req.ip.
 */
export function clientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) {
    // x-forwarded-for is a comma-separated list; first entry is the original client
    return xff.split(',')[0].trim()
  }
  const real = req.headers.get('x-real-ip')
  if (real) return real.trim()
  // NextRequest doesn't expose req.ip on every runtime; fall back to a stable
  // bucket so unknown-source traffic still gets rate-limited (worst case all
  // shares one bucket — that's still a defence).
  return 'unknown'
}

export interface RateLimitOptions {
  /** Logical name of the limiter, e.g. 'admin-login'. */
  bucket: string
  /** Identifier within the bucket (usually IP, optionally combined with email). */
  key: string
  /** Maximum requests allowed within the window. */
  max: number
  /** Window length in milliseconds. */
  windowMs: number
}

export interface RateLimitResult {
  ok: boolean
  remaining: number
  /** Seconds until the window resets — set in the Retry-After header. */
  retryAfter: number
}

export function rateLimit(opts: RateLimitOptions): RateLimitResult {
  const now = Date.now()
  const mapKey = `${opts.bucket}:${opts.key}`
  const entry = store.get(mapKey)

  // Window expired (or first hit) — start fresh
  if (!entry || now - entry.windowStart >= opts.windowMs) {
    // Evict if we're at capacity. Naive: drop the first key we encounter
    // (effectively pseudo-LRU because Map iteration order is insertion).
    if (store.size >= STORE_CAP) {
      const firstKey = store.keys().next().value
      if (firstKey !== undefined) store.delete(firstKey)
    }
    store.set(mapKey, { count: 1, windowStart: now })
    return { ok: true, remaining: opts.max - 1, retryAfter: 0 }
  }

  entry.count += 1
  if (entry.count > opts.max) {
    const retryAfter = Math.ceil((opts.windowMs - (now - entry.windowStart)) / 1000)
    return { ok: false, remaining: 0, retryAfter: Math.max(1, retryAfter) }
  }

  return { ok: true, remaining: opts.max - entry.count, retryAfter: 0 }
}

/**
 * Convenience: returns a 429 NextResponse if the limit is hit, or null when
 * the caller should continue. Sets `Retry-After` + `X-RateLimit-*` headers.
 */
export function enforceRateLimit(
  req: NextRequest,
  opts: Omit<RateLimitOptions, 'key'> & { keyParts?: string[] },
): NextResponse | null {
  const keyParts = opts.keyParts && opts.keyParts.length > 0 ? opts.keyParts : [clientIp(req)]
  const key = keyParts.join('|').toLowerCase()
  const result = rateLimit({ bucket: opts.bucket, key, max: opts.max, windowMs: opts.windowMs })

  if (!result.ok) {
    const res = NextResponse.json(
      { error: 'Too many requests. Slow down and try again shortly.' },
      { status: 429 },
    )
    res.headers.set('Retry-After', String(result.retryAfter))
    res.headers.set('X-RateLimit-Limit', String(opts.max))
    res.headers.set('X-RateLimit-Remaining', '0')
    return res
  }
  return null
}
