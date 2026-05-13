import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { signCustomerToken, CUSTOMER_TOKEN_COOKIE } from '@/lib/customer-auth'

export async function POST(req: NextRequest) {
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

  const user = await db.user.findUnique({ where: { email } })
  // Always do the bcrypt compare to avoid leaking which emails exist (timing-safe)
  const dummyHash = '$2a$12$abcdefghijklmnopqrstuv0123456789ABCDEFGHIJKLMNOPQRSTUV'
  const valid = await bcrypt.compare(password, user?.passwordHash || dummyHash)

  if (!user || !valid) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
  }

  await db.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  })

  const token = signCustomerToken({ userId: user.id, email: user.email })
  const response = NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } })
  response.cookies.set(CUSTOMER_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
  return response
}

export async function DELETE() {
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
