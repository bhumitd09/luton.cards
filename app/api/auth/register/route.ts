import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { signCustomerToken, CUSTOMER_TOKEN_COOKIE } from '@/lib/customer-auth'

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export async function POST(req: NextRequest) {
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
    return NextResponse.json({ error: 'An account with that email already exists.' }, { status: 409 })
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

  const token = signCustomerToken({ userId: user.id, email: user.email })
  const response = NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } }, { status: 201 })
  response.cookies.set(CUSTOMER_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })
  return response
}
