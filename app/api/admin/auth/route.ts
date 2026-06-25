import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { signAdminToken, verifyAdminSession, ADMIN_TOKEN_COOKIE_NAME, invalidateAdminSession } from '@/lib/admin-auth'
import { enforceRateLimit, clientIp } from '@/lib/rate-limit'
import { verifyTotp, decryptSecret, matchRecoveryCode } from '@/lib/totp'

/**
 * Admin sign-in / session check / sign-out.
 *
 * Hardened:
 *  - Always runs bcrypt (with a dummy hash on miss) so timing doesn't leak
 *    which emails exist. The "this account is disabled" message has been
 *    folded into the generic "Invalid credentials" for the same reason.
 *  - Rate-limited 5/min per IP and 10/hour per (IP + email) tuple to slow
 *    brute force.
 *  - Includes tokenVersion in the JWT so a password change immediately
 *    invalidates every existing session.
 */

// A REAL bcrypt hash (cost 12) computed once at module load, so the compare
// on a missing/disabled account takes the same ~400ms as a real hit. The old
// hardcoded string was NOT a parseable bcrypt hash, so compare returned in
// ~0.2ms and leaked account existence via a timing oracle.
const DUMMY_HASH = bcrypt.hashSync('luton-cards-not-a-real-password-placeholder', 12)

export async function POST(req: NextRequest) {
  // Per-IP cap first (quick).
  const ipBlock = enforceRateLimit(req, {
    bucket: 'admin-login-ip',
    max: 5,
    windowMs: 60_000, // 5 / minute
  })
  if (ipBlock) return ipBlock

  try {
    const body = await req.json()
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // Per-(IP, email) cap to catch credential stuffing of a single account.
    const ipEmailBlock = enforceRateLimit(req, {
      bucket: 'admin-login-ip-email',
      keyParts: [clientIp(req), email],
      max: 10,
      windowMs: 60 * 60_000, // 10 / hour
    })
    if (ipEmailBlock) return ipEmailBlock

    const adminUser = await db.adminUser.findUnique({ where: { email } })

    // Always run bcrypt to keep timing constant.
    const passwordValid = await bcrypt.compare(password, adminUser?.passwordHash || DUMMY_HASH)

    if (!adminUser || !passwordValid || !adminUser.active) {
      // Same response for missing user, wrong password, disabled account.
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // ─── Second factor ───────────────────────────────────────────────────
    // Password is correct. If this account has 2FA enabled, do NOT issue a
    // session yet — require a valid TOTP (or recovery) code in this same
    // request. The client resubmits email+password+code on the 2FA prompt.
    if (adminUser.totpEnabled) {
      const code = typeof body.code === 'string' ? body.code.trim() : ''
      const recoveryCode = typeof body.recoveryCode === 'string' ? body.recoveryCode.trim() : ''

      if (!code && !recoveryCode) {
        return NextResponse.json({ twoFactorRequired: true }, { status: 200 })
      }

      // Hard rate-limit the code-check step per account to stop brute force of
      // the 6-digit space once a password is known.
      const codeBlock = enforceRateLimit(req, {
        bucket: 'admin-login-2fa',
        keyParts: [adminUser.id],
        max: 10,
        windowMs: 5 * 60_000,
      })
      if (codeBlock) return codeBlock

      let ok = false
      if (code && adminUser.totpSecret) {
        try {
          ok = verifyTotp(code, decryptSecret(adminUser.totpSecret))
        } catch {
          ok = false
        }
      }
      if (!ok && recoveryCode) {
        const idx = matchRecoveryCode(recoveryCode, adminUser.totpRecoveryCodes)
        if (idx >= 0) {
          // Consume the matched code ATOMICALLY: the updateMany only succeeds
          // while that exact hash is still present, so two concurrent logins
          // can't both spend the same single-use code.
          const matchedHash = adminUser.totpRecoveryCodes[idx]
          const remaining = adminUser.totpRecoveryCodes.filter((_, i) => i !== idx)
          const consumed = await db.adminUser.updateMany({
            where: { id: adminUser.id, totpRecoveryCodes: { has: matchedHash } },
            data: { totpRecoveryCodes: remaining },
          })
          ok = consumed.count > 0
        }
      }

      if (!ok) {
        return NextResponse.json({ error: 'Invalid authentication code', twoFactorRequired: true }, { status: 401 })
      }
    }

    await db.adminUser.update({
      where: { id: adminUser.id },
      data: { lastLogin: new Date() },
    })

    const token = signAdminToken({
      userId: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
      tv: adminUser.tokenVersion,
    })

    const response = NextResponse.json({
      success: true,
      user: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
      },
    })

    response.cookies.set(ADMIN_TOKEN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24h — was 7d
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Auth POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdminSession(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminUser = await db.adminUser.findUnique({
      where: { id: admin.userId },
      select: { id: true, email: true, name: true, role: true },
    })

    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ user: adminUser })
  } catch (error) {
    console.error('Auth GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const token = req.cookies.get(ADMIN_TOKEN_COOKIE_NAME)?.value
  invalidateAdminSession(token)
  const response = NextResponse.json({ success: true })
  response.cookies.set(ADMIN_TOKEN_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
  return response
}
