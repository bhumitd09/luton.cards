import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { signCustomerToken, CUSTOMER_TOKEN_COOKIE, invalidateCustomerSession } from '@/lib/customer-auth'
import { enforceRateLimit, clientIp } from '@/lib/rate-limit'

// A REAL bcrypt hash (cost 12) so the compare on a missing account takes the
// same ~400ms as a real hit — the old hardcoded string wasn't a valid bcrypt
// hash and returned in ~0.2ms, leaking which emails exist via timing.
const DUMMY_HASH = bcrypt.hashSync('luton-cards-not-a-real-password-placeholder', 12)

/**
 * Customer login. Rate-limited 5/min/IP + 10/hr/(IP+email). 7-day cookie
 * (was 30d). Constant-time bcrypt to avoid email enumeration via timing.
 * Includes tokenVersion in JWT for revocation on password change.
 */
export async function POST(req: NextRequest) {
  const ipBlock = enforceRateLimit(req, {
    bucket: 'customer-login-ip',
    max: 5,
    windowMs: 60_000,
  })
  if (ipBlock) return ipBlock

  let body: { email?: string; password?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
  }

  const ipEmailBlock = enforceRateLimit(req, {
    bucket: 'customer-login-ip-email',
    keyParts: [clientIp(req), email],
    max: 10,
    windowMs: 60 * 60_000,
  })
  if (ipEmailBlock) return ipEmailBlock

  const user = await db.user.findUnique({ where: { email } })
  const valid = await bcrypt.compare(password, user?.passwordHash || DUMMY_HASH)

  if (!user || !valid) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
  }

  await db.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  })

  const token = signCustomerToken({
    userId: user.id,
    email: user.email,
    tv: user.tokenVersion,
  })
  const response = NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } })
  response.cookies.set(CUSTOMER_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days (was 30)
  })
  return response
}

export async function DELETE(req: NextRequest) {
  const token = req.cookies.get(CUSTOMER_TOKEN_COOKIE)?.value
  invalidateCustomerSession(token)
  const response = NextResponse.json({ ok: true })
  response.cookies.set(CUSTOMER_TOKEN_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  return response
}
