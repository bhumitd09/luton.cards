import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { enforceRateLimit } from '@/lib/rate-limit'
import { hashResetToken } from '@/lib/password-reset'

/**
 * POST /api/admin/auth/reset — admin/vendor completes a password reset.
 * Body: { token, password }. Admin password policy: min 12 chars.
 */
export async function POST(req: NextRequest) {
  const block = enforceRateLimit(req, { bucket: 'admin-pw-reset', max: 10, windowMs: 15 * 60_000 })
  if (block) return block

  const body = await req.json().catch(() => ({}))
  const token = typeof body.token === 'string' ? body.token : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!token || !password) {
    return NextResponse.json({ error: 'Token and new password are required' }, { status: 400 })
  }
  if (password.length < 12) {
    return NextResponse.json({ error: 'Password must be at least 12 characters' }, { status: 400 })
  }

  const adminUser = await db.adminUser.findFirst({
    where: { resetTokenHash: hashResetToken(token), resetTokenExpiry: { gt: new Date() } },
  })
  if (!adminUser) {
    return NextResponse.json({ error: 'This reset link is invalid or has expired.' }, { status: 400 })
  }

  await db.adminUser.update({
    where: { id: adminUser.id },
    data: {
      passwordHash: await bcrypt.hash(password, 12),
      resetTokenHash: null,
      resetTokenExpiry: null,
      tokenVersion: { increment: 1 },
    },
  })

  return NextResponse.json({ ok: true })
}
