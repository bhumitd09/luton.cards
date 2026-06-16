import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { authenticator } from 'otplib'

/**
 * Admin TOTP (two-factor) helpers.
 *
 * The TOTP secret is sensitive — anyone with it can mint valid codes — so it
 * is stored AES-256-GCM encrypted, with the key derived from ADMIN_JWT_SECRET
 * (already a required, high-entropy prod secret). The plaintext secret only
 * exists transiently during enrolment and verification.
 *
 * Recovery codes are bcrypt-hashed (like passwords); the plaintext set is
 * shown to the admin exactly once at enable time.
 */

const ISSUER = 'Luton Cards'

function encryptionKey(): Buffer {
  const secret = process.env.ADMIN_JWT_SECRET
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ADMIN_JWT_SECRET is required to encrypt 2FA secrets.')
    }
    // Dev fallback — namespaced so it can't collide with a real secret.
    return crypto.createHash('sha256').update('dev-totp-key').digest()
  }
  // Derive a stable 32-byte key from the secret (independent of its length).
  return crypto.createHash('sha256').update(`totp:${secret}`).digest()
}

export function encryptSecret(plaintext: string): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv)
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  // Store as iv.tag.ciphertext, base64url each part.
  return [iv.toString('base64url'), tag.toString('base64url'), enc.toString('base64url')].join('.')
}

export function decryptSecret(stored: string): string {
  const [ivB64, tagB64, dataB64] = stored.split('.')
  if (!ivB64 || !tagB64 || !dataB64) throw new Error('Malformed encrypted secret')
  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(ivB64, 'base64url'))
  decipher.setAuthTag(Buffer.from(tagB64, 'base64url'))
  return Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64url')), decipher.final()]).toString('utf8')
}

export function generateTotpSecret(): string {
  return authenticator.generateSecret()
}

/** otpauth:// URI for QR-code enrolment in an authenticator app. */
export function totpKeyUri(email: string, secret: string): string {
  return authenticator.keyuri(email, ISSUER, secret)
}

/** Verify a 6-digit code against the (plaintext) secret, with a ±1 step window. */
export function verifyTotp(token: string, secret: string): boolean {
  const clean = token.replace(/\s+/g, '')
  if (!/^\d{6}$/.test(clean)) return false
  try {
    return authenticator.verify({ token: clean, secret })
  } catch {
    return false
  }
}

/** Generate N human-friendly single-use recovery codes (plaintext) + their
 *  bcrypt hashes for storage. */
export function generateRecoveryCodes(count = 10): { plain: string[]; hashed: string[] } {
  const plain: string[] = []
  for (let i = 0; i < count; i++) {
    // 10 hex chars, grouped as xxxxx-xxxxx for readability.
    const raw = crypto.randomBytes(5).toString('hex')
    plain.push(`${raw.slice(0, 5)}-${raw.slice(5)}`)
  }
  const hashed = plain.map((c) => bcrypt.hashSync(c.replace(/-/g, '').toLowerCase(), 10))
  return { plain, hashed }
}

/** Check a submitted recovery code against the stored hashes. Returns the
 *  index of the matching (unused) hash, or -1. Caller removes that hash to
 *  enforce single use. */
export function matchRecoveryCode(submitted: string, hashes: string[]): number {
  const norm = submitted.replace(/[\s-]/g, '').toLowerCase()
  if (!norm) return -1
  for (let i = 0; i < hashes.length; i++) {
    if (bcrypt.compareSync(norm, hashes[i])) return i
  }
  return -1
}
