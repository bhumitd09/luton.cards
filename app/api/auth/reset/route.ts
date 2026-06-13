import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { enforceRateLimit } from '@/lib/rate-limit'
import { hashResetToken } from '@/lib/password-reset'

/**
 * POST /api/auth/reset — customer completes a password reset.
 * Body: { token, password }
 *
 * Token is matched by its SHA-256 hash and must be unexpired. On success the
 * password is replaced, the token is cleared (single-use), and tokenVersion is
 * bumped to kill any existing sessions.
 */
export async function POST(req: NextRequest) {
  const block = enforceRateLimit(req, { bucket: 'customer-pw-reset', max: 10, windowMs: 15 * 60_000 })
  if (block) return block

  const body = await req.json().catch(() => ({}))
  const token = typeof body.token === 'string' ? body.token : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!token || !password) {
    return NextResponse.json({ error: 'Token and new password are required' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  const user = await db.user.findFirst({
    where: { resetTokenHash: hashResetToken(token), resetTokenExpiry: { gt: new Date() } },
  })
  if (!user) {
    return NextResponse.json({ error: 'This reset link is invalid or has expired.' }, { status: 400 })
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await bcrypt.hash(password, 12),
      resetTokenHash: null,
      resetTokenExpiry: null,
      tokenVersion: { increment: 1 },
    },
  })

  return NextResponse.json({ ok: true })
}
