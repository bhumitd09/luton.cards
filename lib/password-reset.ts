import crypto from 'crypto'

/**
 * Password-reset token helpers.
 *
 * The raw token is high-entropy (32 random bytes, base64url) and is only ever
 * sent in the emailed link — we store just its SHA-256 hash, so a database
 * leak can't be used to reset accounts. Tokens are single-use and short-lived.
 */

export const RESET_TOKEN_TTL_MS = 30 * 60_000 // 30 minutes

export function generateResetToken(): { token: string; hash: string; expiry: Date } {
  const token = crypto.randomBytes(32).toString('base64url')
  return {
    token,
    hash: hashResetToken(token),
    expiry: new Date(Date.now() + RESET_TOKEN_TTL_MS),
  }
}

export function hashResetToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

/**
 * Email-verification token helpers. Same hashed, single-use design as reset
 * tokens but a longer TTL (24h) since the user may not check email right away.
 * Hashing is identical (SHA-256), so `hashResetToken` is reused for matching.
 */
export const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60_000 // 24 hours

export function generateVerifyToken(): { token: string; hash: string; expiry: Date } {
  const token = crypto.randomBytes(32).toString('base64url')
  return {
    token,
    hash: hashResetToken(token),
    expiry: new Date(Date.now() + VERIFY_TOKEN_TTL_MS),
  }
}
