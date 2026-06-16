import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAdminSession } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/auth/2fa — current 2FA status for the signed-in admin.
 *  { enabled }  — TOTP is active and required at login.
 *  { pending }  — a secret has been generated but not yet confirmed.
 */
export async function GET(req: NextRequest) {
  const admin = await verifyAdminSession(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.adminUser.findUnique({
    where: { id: admin.userId },
    select: { totpEnabled: true, totpSecret: true, totpRecoveryCodes: true },
  })
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  return NextResponse.json({
    enabled: user.totpEnabled,
    pending: Boolean(user.totpSecret) && !user.totpEnabled,
    recoveryCodesRemaining: user.totpEnabled ? user.totpRecoveryCodes.length : 0,
  })
}
