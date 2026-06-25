/**
 * PSA (Professional Sports Authenticator) public-API client.
 *
 * Looks up a graded card by its cert number and returns normalised card
 * details + the front/back slab images, so the admin can list a graded slab
 * for sale with one cert number instead of typing everything by hand.
 *
 * Auth: a PSA public-API token in the PSA_API_TOKEN env var (sent as
 * `Authorization: bearer <token>`). Base URL defaults to the public API and
 * is overridable via PSA_API_BASE_URL.
 *
 * Docs: https://www.psacard.com/publicapi  (cert/GetByCertNumber,
 * cert/GetImagesByCertNumber).
 */

const DEFAULT_BASE = 'https://api.psacard.com/publicapi'

export function psaConfigured(): boolean {
  return Boolean(process.env.PSA_API_TOKEN && process.env.PSA_API_TOKEN.length > 0)
}

function psaBase(): string {
  return (process.env.PSA_API_BASE_URL || DEFAULT_BASE).replace(/\/+$/, '')
}

/** Thrown for any PSA lookup failure; carries an HTTP status for the route. */
export class PsaError extends Error {
  status: number
  constructor(message: string, status = 502) {
    super(message)
    this.name = 'PsaError'
    this.status = status
  }
}

export interface PsaCert {
  certNumber: string
  grade: string            // e.g. "10"
  gradeDescription: string // e.g. "GEM MT 10"
  grader: 'PSA'
  subject: string          // e.g. "Charizard"
  year: string
  brand: string            // e.g. "Pokemon Game"
  category: string         // e.g. "TCG Cards"
  cardNumber: string
  variety: string
  population: number | null
}

export interface PsaImage {
  url: string
  isFront: boolean
}

// ─── Lookup cache ──────────────────────────────────────────────────────────
// PSA's public tier is brutally rate-limited (as low as 1 call/day). The admin
// looks a cert up, reviews it, then imports — so import must NOT call PSA again.
// We cache the lookup (our own fetch, still authoritative) and import reuses it.
interface PsaLookup { cert: PsaCert; images: PsaImage[]; at: number }
const lookupCache = new Map<string, PsaLookup>()
const LOOKUP_TTL_MS = 24 * 60 * 60_000

export function cachePsaLookup(cert: PsaCert, images: PsaImage[]): void {
  lookupCache.set(cert.certNumber, { cert, images, at: Date.now() })
  if (lookupCache.size > 500) {
    const oldest = lookupCache.keys().next().value
    if (oldest !== undefined) lookupCache.delete(oldest)
  }
}

export function getCachedPsaLookup(certNumber: string): { cert: PsaCert; images: PsaImage[] } | null {
  const key = certNumber.replace(/[^0-9]/g, '')
  const hit = lookupCache.get(key)
  if (!hit) return null
  if (Date.now() - hit.at > LOOKUP_TTL_MS) { lookupCache.delete(key); return null }
  return { cert: hit.cert, images: hit.images }
}

function authHeaders(): Record<string, string> {
  const token = process.env.PSA_API_TOKEN
  if (!token) throw new PsaError('PSA is not configured. Set PSA_API_TOKEN.', 503)
  return { Authorization: `bearer ${token}`, Accept: 'application/json' }
}

function str(v: unknown): string {
  return v === null || v === undefined ? '' : String(v).trim()
}

/** Only PSA/Collectors-owned hosts may have their images fetched server-side
 *  (SSRF guard). PSA slab photos are served from collectors.com, not
 *  psacard.com — both are allowed. Override with PSA_IMAGE_HOSTS (comma list)
 *  if PSA serves images from another CDN host. */
export function isPsaImageUrl(url: string): boolean {
  try {
    const u = new URL(url)
    if (u.protocol !== 'https:') return false // no http:// / file:// / etc.
    if (u.username || u.password) return false // no userinfo tricks
    const host = u.hostname.toLowerCase()
    const env = (process.env.PSA_IMAGE_HOSTS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
    const allow = env.length > 0 ? env : ['psacard.com', 'collectors.com']
    return allow.some(a => host === a || host.endsWith(`.${a}`))
  } catch {
    return false
  }
}

export async function fetchPsaCert(certNumber: string): Promise<PsaCert> {
  const cert = certNumber.replace(/[^0-9]/g, '')
  if (!cert) throw new PsaError('Enter a numeric PSA cert number.', 400)

  let res: Response
  try {
    res = await fetch(`${psaBase()}/cert/GetByCertNumber/${cert}`, {
      headers: authHeaders(),
      cache: 'no-store',
    })
  } catch (err) {
    throw new PsaError(`Could not reach PSA: ${err instanceof Error ? err.message : String(err)}`)
  }

  if (res.status === 401 || res.status === 403) {
    throw new PsaError('PSA rejected the API token. Check PSA_API_TOKEN.', 502)
  }
  if (res.status === 404) {
    throw new PsaError(`No PSA record found for cert #${cert}.`, 404)
  }
  const text = await res.text()
  if (!res.ok) {
    throw new PsaError(`PSA returned ${res.status}: ${text.slice(0, 200)}`)
  }

  let data: Record<string, unknown>
  try {
    data = JSON.parse(text)
  } catch {
    throw new PsaError('PSA returned an unexpected (non-JSON) response.')
  }

  // The public API wraps the record as { PSACert: {...} }; tolerate a flat shape too.
  const c = (data.PSACert ?? data.psaCert ?? data) as Record<string, unknown>
  if (!c || typeof c !== 'object' || (!c.CertNumber && !c.certNumber)) {
    throw new PsaError(`No PSA record found for cert #${cert}.`, 404)
  }

  const popRaw = c.TotalPopulation ?? c.totalPopulation
  return {
    certNumber: str(c.CertNumber ?? c.certNumber) || cert,
    grade: str(c.CardGrade ?? c.cardGrade ?? c.Grade),
    gradeDescription: str(c.GradeDescription ?? c.gradeDescription),
    grader: 'PSA',
    subject: str(c.Subject ?? c.subject),
    year: str(c.Year ?? c.year),
    brand: str(c.Brand ?? c.brand),
    category: str(c.Category ?? c.category),
    cardNumber: str(c.CardNumber ?? c.cardNumber),
    variety: str(c.Variety ?? c.variety),
    population: typeof popRaw === 'number' ? popRaw : popRaw ? Number(popRaw) || null : null,
  }
}

export async function fetchPsaImages(certNumber: string): Promise<PsaImage[]> {
  const cert = certNumber.replace(/[^0-9]/g, '')
  if (!cert) return []
  let res: Response
  try {
    res = await fetch(`${psaBase()}/cert/GetImagesByCertNumber/${cert}`, {
      headers: authHeaders(),
      cache: 'no-store',
    })
  } catch {
    return []
  }
  if (!res.ok) return []
  let data: unknown
  try {
    data = JSON.parse(await res.text())
  } catch {
    return []
  }
  const arr = Array.isArray(data) ? data : []
  const images: PsaImage[] = []
  for (const item of arr) {
    if (!item || typeof item !== 'object') continue
    const rec = item as Record<string, unknown>
    const url = str(rec.ImageURL ?? rec.imageURL ?? rec.imageUrl ?? rec.url)
    if (url && isPsaImageUrl(url)) {
      images.push({ url, isFront: Boolean(rec.IsFrontImage ?? rec.isFrontImage) })
    }
  }
  // Front first.
  return images.sort((a, b) => Number(b.isFront) - Number(a.isFront))
}

/** Build a human listing title + description from a cert record. */
export function buildListingFromCert(cert: PsaCert): { name: string; description: string } {
  const namePieces = [cert.year, cert.brand, cert.subject].map((s) => s.trim()).filter(Boolean)
  if (cert.cardNumber) namePieces.push(`#${cert.cardNumber}`)
  if (cert.variety) namePieces.push(cert.variety)
  const gradeBit = cert.gradeDescription || (cert.grade ? `PSA ${cert.grade}` : 'PSA')
  const name = `${namePieces.join(' ')} — PSA ${cert.grade || ''}`.replace(/\s+/g, ' ').trim()

  const lines = [
    `Graded ${gradeBit} by PSA.`,
    cert.subject ? `Subject: ${cert.subject}` : '',
    cert.year || cert.brand ? `Set: ${[cert.year, cert.brand].filter(Boolean).join(' ')}` : '',
    cert.cardNumber ? `Card number: ${cert.cardNumber}` : '',
    cert.variety ? `Variety: ${cert.variety}` : '',
    cert.population != null ? `PSA population at grading: ${cert.population}` : '',
    `PSA certification #${cert.certNumber} — verify at psacard.com/cert/${cert.certNumber}.`,
  ].filter(Boolean)

  return { name, description: lines.join('\n') }
}

/** Best-effort map of a PSA category/brand to the store's game field. */
export function guessGame(cert: PsaCert): 'pokemon' | 'one-piece' {
  const hay = `${cert.brand} ${cert.category} ${cert.subject}`.toLowerCase()
  if (hay.includes('one piece')) return 'one-piece'
  return 'pokemon'
}
