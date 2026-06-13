import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { enforceRateLimit } from '@/lib/rate-limit'
import { generateResetToken, RESET_TOKEN_TTL_MS } from '@/lib/password-reset'
import { sendPasswordResetEmail } from '@/lib/email'

/**
 * POST /api/admin/auth/forgot — admin/vendor "forgot password".
 * Generic 200 always (no enumeration). Only active accounts get a link.
 */
export async function POST(req: NextRequest) {
  const block = enforceRateLimit(req, { bucket: 'admin-pw-forgot', max: 5, windowMs: 15 * 60_000 })
  if (block) return block

  const body = await req.json().catch(() => ({}))
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''

  if (email) {
    try {
      const adminUser = await db.adminUser.findUnique({ where: { email } })
      if (adminUser && adminUser.active) {
        const { token, hash, expiry } = generateResetToken()
        await db.adminUser.update({
          where: { id: adminUser.id },
          data: { resetTokenHash: hash, resetTokenExpiry: expiry },
        })
        const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://lutoncards.com').replace(/\/+$/, '')
        const resetUrl = `${appUrl}/admin/reset-password?token=${encodeURIComponent(token)}`
        await sendPasswordResetEmail({
          to: adminUser.email,
          name: adminUser.name,
          resetUrl,
          expiresInMinutes: Math.round(RESET_TOKEN_TTL_MS / 60_000),
        }).catch((e) => console.error('Admin reset email failed:', e))
      }
    } catch (err) {
      console.error('Admin forgot-password error:', err)
    }
  }

  return NextResponse.json({ ok: true })
}
