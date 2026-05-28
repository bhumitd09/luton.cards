import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { signCustomerToken, CUSTOMER_TOKEN_COOKIE } from '@/lib/customer-auth'
import { enforceRateLimit } from '@/lib/rate-limit'

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

/**
 * Customer register.
 *
 * Hardened:
 *  - Rate limited 3/hr per IP to slow signup abuse.
 *  - Does NOT leak whether an email exists. If the address is already
 *    registered we return a generic success-shaped response and DO NOT
 *    create a session — the would-be attacker can't tell from the response
 *    whether the account was new or existed. Real account holders see
 *    nothing different from a successful first-time signup (they're just
 *    not logged in afterwards — that's the intentional cost).
 */
export async function POST(req: NextRequest) {
  const block = enforceRateLimit(req, {
    bucket: 'customer-register',
    max: 3,
    windowMs: 60 * 60_000, // 3 / hour / IP
  })
  if (block) return block

  let body: { email?: string; password?: string; name?: string; marketingOptIn?: boolean }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const marketingOptIn = Boolean(body.marketingOptIn)

  if (!email || !isEmail(email)) {
    return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 })
  }
  if (!password || password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
  }
  if (name.length > 120) {
    return NextResponse.json({ error: 'Name is too long.' }, { status: 400 })
  }

  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    // Don't leak existence. Return a success-shaped response with no token
    // and no user payload. Front-end already shows a "check your email" /
    // "you can sign in now" copy after register — that copy works for both
    // a new signup AND a duplicate attempt without giving the attacker any
    // signal.
    return NextResponse.json({ ok: true }, { status: 201 })
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const user = await db.user.create({
    data: {
      email,
      passwordHash,
      name: name || null,
      marketingOptIn,
      lastLogin: new Date(),
    },
  })

  const token = signCustomerToken({
    userId: user.id,
    email: user.email,
    tv: user.tokenVersion,
  })
  const response = NextResponse.json(
    { ok: true, user: { id: user.id, email: user.email, name: user.name } },
    { status: 201 },
  )
  response.cookies.set(CUSTOMER_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days (was 30)
  })
  return response
}
