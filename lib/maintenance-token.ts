/**
 * Maintenance "site lock" bypass token.
 *
 * Shared by the Edge middleware (gate) and the Node unlock route (issuer), so
 * it uses ONLY Web Crypto (available in both runtimes) and never imports
 * Prisma — keeping it safe to bundle into the edge middleware.
 *
 * The bypass cookie holds an HMAC of a fixed string keyed by a server secret.
 * A visitor can only obtain a valid cookie by entering the correct password at
 * the holding page (the unlock route checks the password, then sets this). The
 * secret never leaves the server, so the token can't be forged.
 */
export const MAINT_BYPASS_COOKIE = 'lc_maint_bypass'

function secret(): string {
  return (
    process.env.MAINTENANCE_SECRET ||
    process.env.ADMIN_JWT_SECRET ||
    process.env.CUSTOMER_JWT_SECRET ||
    'luton-maintenance-fallback'
  )
}

export async function maintenanceBypassToken(): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode('maintenance-bypass-v1'))
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
}
