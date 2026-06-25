import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyCustomerSession } from '@/lib/customer-auth'
import { enforceRateLimit } from '@/lib/rate-limit'
import { generateVerifyToken, VERIFY_TOKEN_TTL_MS } from '@/lib/password-reset'
import { sendEmailVerification } from '@/lib/email'

/**
 * POST /api/auth/verify-email/resend — re-send the verification email to the
 * currently logged-in customer. Authenticated (so it can't be used to spam
 * arbitrary addresses) and rate limited. No-ops cleanly if already verified.
 */
export async function POST(req: NextRequest) {
  const auth = await verifyCustomerSession(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const block = enforceRateLimit(req, { bucket: 'verify-resend', keyParts: [auth.userId], max: 3, windowMs: 15 * 60_000 })
  if (block) return block

  const user = await db.user.findUnique({ where: { id: auth.userId }, select: { id: true, email: true, name: true, emailVerified: true } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  if (user.emailVerified) return NextResponse.json({ ok: true, alreadyVerified: true })

  const verify = generateVerifyToken()
  await db.user.update({
    where: { id: user.id },
    data: { verifyTokenHash: verify.hash, verifyTokenExpiry: verify.expiry },
  })

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://lutoncards.com').replace(/\/+$/, '')
  await sendEmailVerification({
    to: user.email,
    name: user.name,
    verifyUrl: `${appUrl}/verify-email?token=${encodeURIComponent(verify.token)}`,
    expiresInHours: Math.round(VERIFY_TOKEN_TTL_MS / 3_600_000),
  }).catch((e) => console.error('Resend verification email failed:', e))

  return NextResponse.json({ ok: true })
}
