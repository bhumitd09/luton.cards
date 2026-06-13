import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { enforceRateLimit } from '@/lib/rate-limit'
import { generateResetToken, RESET_TOKEN_TTL_MS } from '@/lib/password-reset'
import { sendPasswordResetEmail } from '@/lib/email'

/**
 * POST /api/auth/forgot — customer "forgot password".
 *
 * Always returns a generic 200 so it can't be used to enumerate which emails
 * have accounts. If the email matches a user we store a hashed, expiring
 * single-use token and email the reset link.
 */
export async function POST(req: NextRequest) {
  const block = enforceRateLimit(req, { bucket: 'customer-pw-forgot', max: 5, windowMs: 15 * 60_000 })
  if (block) return block

  const body = await req.json().catch(() => ({}))
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''

  if (email) {
    try {
      const user = await db.user.findUnique({ where: { email } })
      if (user) {
        const { token, hash, expiry } = generateResetToken()
        await db.user.update({
          where: { id: user.id },
          data: { resetTokenHash: hash, resetTokenExpiry: expiry },
        })
        const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://lutoncards.com').replace(/\/+$/, '')
        const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(token)}`
        await sendPasswordResetEmail({
          to: user.email,
          name: user.name,
          resetUrl,
          expiresInMinutes: Math.round(RESET_TOKEN_TTL_MS / 60_000),
        }).catch((e) => console.error('Customer reset email failed:', e))
      }
    } catch (err) {
      // Never leak failure to the caller — log and still return generic ok.
      console.error('Customer forgot-password error:', err)
    }
  }

  return NextResponse.json({ ok: true })
}
