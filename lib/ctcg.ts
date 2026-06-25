/**
 * Client for the CTCG card-database platform (the FastAPI service that holds
 * the scraped TCG catalogue + S3/CDN images). We call its public `/v1` API
 * server-side with an API key so the key never reaches the browser.
 *
 * Config (env):
 *   CTCG_API_BASE     e.g. https://ctcg-xxx.up.railway.app   (no trailing slash needed)
 *   CTCG_API_KEY      a key minted in the platform's back office (/api/keys)
 *   CTCG_IMAGE_HOSTS  optional comma-separated allowlist of CDN hostnames the
 *                     importer may download images from. If unset we trust the
 *                     host returned by the (authenticated) API but still block
 *                     private/loopback addresses.
 */

export function ctcgConfigured(): boolean {
  return Boolean(process.env.CTCG_API_BASE && process.env.CTCG_API_KEY)
}

function base(): string {
  return (process.env.CTCG_API_BASE || '').replace(/\/+$/, '')
}

export class CtcgError extends Error {
  status: number
  constructor(message: string, status = 502) {
    super(message)
    this.name = 'CtcgError'
    this.status = status
  }
}

async function call<T>(path: string, timeoutMs = 15_000): Promise<T> {
  if (!ctcgConfigured()) {
    throw new CtcgError('Card database is not connected. Set CTCG_API_BASE + CTCG_API_KEY.', 503)
  }
  let res: Response
  try {
    res = await fetch(`${base()}${path}`, {
      headers: { 'X-API-Key': process.env.CTCG_API_KEY as string, Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch (err) {
    throw new CtcgError(`Could not reach the card database: ${err instanceof Error ? err.message : String(err)}`)
  }
  if (res.status === 401) throw new CtcgError('Card database rejected the API key.', 502)
  if (res.status === 404) throw new CtcgError('Not found in the card database.', 404)
  if (res.status === 429) throw new CtcgError('Card database is rate-limiting; try again shortly.', 429)
  const text = await res.text()
  if (!res.ok) throw new CtcgError(`Card database returned ${res.status}: ${text.slice(0, 200)}`)
  try {
    return JSON.parse(text) as T
  } catch {
    throw new CtcgError('Card database returned an unexpected response.')
  }
}

// ─── Types (mirror the platform's /v1 responses) ───────────────────────────
export interface CtcgTcg { tcg: string; set_count: number | null }
export interface CtcgSet { code: string; name: string | null; release_date: string | null; logo: string | null }
export interface CtcgCompactCard {
  tcg?: string
  card_id: string
  name: string | null
  number?: string | null
  set_code?: string | null
  rarity: string | null
  image: string | null
}
export interface CtcgPrice { market: string; currency: string; amount: number | null; raw: string | null; url: string | null }
export interface CtcgFullCard {
  tcg: string
  card_id: string
  set_code: string | null
  set_name: string | null
  name: string | null
  category: string | null
  rarity: string | null
  effect: string | null
  number?: string | null
  images: { url: string | null; language: string | null; variant: string | null }[]
  printings?: { label: string; variant: string | null; prices: CtcgPrice[] }[]
}

export const listTcgs = () => call<{ tcgs: CtcgTcg[] }>('/v1/tcgs')
export const listSets = (tcg: string) => call<{ tcg: string; sets: CtcgSet[] }>(`/v1/sets/${encodeURIComponent(tcg)}`)

export const browseSet = (tcg: string, code: string, page = 1, q = '') =>
  call<{ total: number; page: number; page_size: number; cards: CtcgCompactCard[] }>(
    `/v1/sets/${encodeURIComponent(tcg)}/${encodeURIComponent(code)}?page=${page}&page_size=50&q=${encodeURIComponent(q)}`,
  )

export const searchByName = (q: string, tcg = '', page = 1) =>
  // Longer timeout: the first search for a game may build the name index
  // server-side (self-heal); subsequent searches are instant.
  call<{ total: number; page: number; page_size: number; cards: CtcgCompactCard[] }>(
    `/v1/search?q=${encodeURIComponent(q)}${tcg ? `&tcg=${encodeURIComponent(tcg)}` : ''}&page=${page}&page_size=50`,
    120_000,
  )

export const getCard = (tcg: string, cardId: string) =>
  call<{ card: CtcgFullCard }>(`/v1/cards/${encodeURIComponent(tcg)}/${encodeURIComponent(cardId)}`)

/** Map a CTCG tcg id to the store's game field. */
export function ctcgGame(tcg: string): 'pokemon' | 'one-piece' | 'lorcana' | 'riftbound' {
  if (tcg.startsWith('pokemon')) return 'pokemon'
  if (tcg === 'one-piece') return 'one-piece'
  if (tcg === 'lorcana') return 'lorcana'
  if (tcg === 'riftbound') return 'riftbound'
  return 'pokemon'
}

/** SSRF guard for importing a CTCG image. https only, no userinfo, no
 *  private/loopback hosts; honour CTCG_IMAGE_HOSTS allowlist when set. */
export function isAllowedCtcgImage(url: string): boolean {
  let u: URL
  try { u = new URL(url) } catch { return false }
  if (u.protocol !== 'https:' || u.username || u.password) return false
  const host = u.hostname.toLowerCase()
  if (host === 'localhost' || host.endsWith('.local')) return false
  // Block obvious private / link-local / loopback IP literals.
  if (/^(127\.|10\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.|::1$|\[)/.test(host)) return false
  const allow = (process.env.CTCG_IMAGE_HOSTS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
  if (allow.length > 0) return allow.some(a => host === a || host.endsWith(`.${a}`))
  return true // no allowlist configured → trust the API-sourced host (still https + non-private)
}
