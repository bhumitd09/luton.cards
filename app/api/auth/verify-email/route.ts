import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { enforceRateLimit } from '@/lib/rate-limit'
import { hashResetToken } from '@/lib/password-reset'

/**
 * POST /api/auth/verify-email — confirm a customer's email address.
 * Body: { token }
 *
 * The token is matched by its SHA-256 hash and must be unexpired. On success
 * we mark the account verified, clear the token (single-use), and CLAIM any
 * past guest orders placed with the same email by setting their userId. This
 * is the only place email-matched orders get attached — closing the IDOR where
 * an unverified signup could otherwise read another person's order history.
 */
export async function POST(req: NextRequest) {
  const block = enforceRateLimit(req, { bucket: 'customer-verify-email', max: 10, windowMs: 15 * 60_000 })
  if (block) return block

  const body = await req.json().catch(() => ({}))
  const token = typeof body.token === 'string' ? body.token : ''
  if (!token) {
    return NextResponse.json({ error: 'Verification token is required.' }, { status: 400 })
  }

  const user = await db.user.findFirst({
    where: { verifyTokenHash: hashResetToken(token), verifyTokenExpiry: { gt: new Date() } },
  })
  if (!user) {
    return NextResponse.json({ error: 'This verification link is invalid or has expired.' }, { status: 400 })
  }

  await db.user.update({
    where: { id: user.id },
    data: { emailVerified: true, verifyTokenHash: null, verifyTokenExpiry: null },
  })

  // Attach past guest orders with this email that aren't already linked.
  const claimed = await db.order.updateMany({
    where: { email: user.email, userId: null },
    data: { userId: user.id },
  })

  return NextResponse.json({ ok: true, claimed: claimed.count })
}
