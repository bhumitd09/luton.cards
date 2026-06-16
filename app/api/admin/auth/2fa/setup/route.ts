import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { db } from '@/lib/db'
import { verifyAdminSession } from '@/lib/admin-auth'
import { generateTotpSecret, encryptSecret, totpKeyUri } from '@/lib/totp'

/**
 * POST /api/admin/auth/2fa/setup — begin TOTP enrolment for the signed-in
 * admin. Generates a fresh secret, stores it ENCRYPTED but leaves
 * totpEnabled=false (pending) until a code is confirmed via /enable.
 *
 * Returns the otpauth URI, a QR data-URL, and the base32 secret (for manual
 * entry). The plaintext secret is returned ONCE here and never again.
 */
export async function POST(req: NextRequest) {
  const admin = await verifyAdminSession(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.adminUser.findUnique({
    where: { id: admin.userId },
    select: { email: true, totpEnabled: true },
  })
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.totpEnabled) {
    return NextResponse.json({ error: '2FA is already enabled. Disable it first to re-enrol.' }, { status: 400 })
  }

  const secret = generateTotpSecret()
  await db.adminUser.update({
    where: { id: admin.userId },
    data: { totpSecret: encryptSecret(secret) },
  })

  const uri = totpKeyUri(user.email, secret)
  const qr = await QRCode.toDataURL(uri, { margin: 1, width: 220 })

  return NextResponse.json({ secret, uri, qr })
}
