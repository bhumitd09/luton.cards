import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAdminSession } from '@/lib/admin-auth'
import { enforceRateLimit } from '@/lib/rate-limit'
import { verifyTotp, decryptSecret, generateRecoveryCodes } from '@/lib/totp'

/**
 * POST /api/admin/auth/2fa/enable — confirm enrolment with a first valid code.
 * Body: { code }. On success, flips totpEnabled=true and returns 10 single-use
 * recovery codes (plaintext, shown ONCE).
 */
export async function POST(req: NextRequest) {
  const admin = await verifyAdminSession(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const block = enforceRateLimit(req, {
    bucket: 'admin-2fa-enable',
    keyParts: [admin.userId],
    max: 10,
    windowMs: 5 * 60_000,
  })
  if (block) return block

  const body = await req.json().catch(() => ({}))
  const code = typeof body.code === 'string' ? body.code.trim() : ''

  const user = await db.adminUser.findUnique({
    where: { id: admin.userId },
    select: { totpSecret: true, totpEnabled: true },
  })
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.totpEnabled) {
    return NextResponse.json({ error: '2FA is already enabled.' }, { status: 400 })
  }
  if (!user.totpSecret) {
    return NextResponse.json({ error: 'Start setup first.' }, { status: 400 })
  }

  let valid = false
  try {
    valid = verifyTotp(code, decryptSecret(user.totpSecret))
  } catch {
    valid = false
  }
  if (!valid) {
    return NextResponse.json({ error: 'That code is not valid. Check your authenticator and try again.' }, { status: 400 })
  }

  const { plain, hashed } = generateRecoveryCodes(10)
  await db.adminUser.update({
    where: { id: admin.userId },
    data: { totpEnabled: true, totpRecoveryCodes: hashed },
  })

  return NextResponse.json({ enabled: true, recoveryCodes: plain })
}
