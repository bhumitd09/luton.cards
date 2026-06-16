import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { verifyAdminSession } from '@/lib/admin-auth'
import { enforceRateLimit } from '@/lib/rate-limit'

/**
 * POST /api/admin/auth/2fa/disable — turn off TOTP. Requires the account
 * password as re-authentication so a hijacked session can't silently strip
 * the second factor. Clears the secret + recovery codes.
 * Body: { password }
 */
export async function POST(req: NextRequest) {
  const admin = await verifyAdminSession(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const block = enforceRateLimit(req, {
    bucket: 'admin-2fa-disable',
    keyParts: [admin.userId],
    max: 5,
    windowMs: 15 * 60_000,
  })
  if (block) return block

  const body = await req.json().catch(() => ({}))
  const password = typeof body.password === 'string' ? body.password : ''
  if (!password) {
    return NextResponse.json({ error: 'Password is required to disable 2FA' }, { status: 400 })
  }

  const user = await db.adminUser.findUnique({
    where: { id: admin.userId },
    select: { passwordHash: true },
  })
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) {
    return NextResponse.json({ error: 'Password is incorrect' }, { status: 400 })
  }

  await db.adminUser.update({
    where: { id: admin.userId },
    data: { totpEnabled: false, totpSecret: null, totpRecoveryCodes: [] },
  })

  return NextResponse.json({ disabled: true })
}
