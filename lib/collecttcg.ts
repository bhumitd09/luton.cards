// CollectTCG Integration Library
// Syncs products from collecttcg.co.uk into the local Prisma DB

import crypto from 'crypto'
import { db } from '@/lib/db'

export interface CollectTCGProduct {
  id: string           // CollectTCG product ID — stored as externalId/slug
  name: string
  category: string     // e.g. "single", "graded", "sealed", "booster"
  price: number        // in pence (GBP)
  stock: number
  description?: string
  images?: string[]
  grade?: string       // e.g. "PSA 10"
  grader?: string      // e.g. "PSA"
  tags?: string[]
  featured?: boolean
  comparePrice?: number | null
}

export interface SyncResult {
  created: number
  updated: number
  skipped: number
  errors: string[]
  duration: number
}

export async function getCollectTCGSettings(): Promise<{ apiUrl: string; apiKey: string; webhookSecret: string } | null> {
  const settings = await db.content.findMany({
    where: { key: { in: ['collecttcg_api_url', 'collecttcg_api_key', 'collecttcg_webhook_secret'] } },
  })
  const map: Record<string, string> = {}
  settings.forEach(s => { map[s.key] = s.value })

  if (!map.collecttcg_api_key || !map.collecttcg_api_url) return null

  return {
    apiUrl: map.collecttcg_api_url.replace(/\/$/, ''),
    apiKey: map.collecttcg_api_key,
    webhookSecret: map.collecttcg_webhook_secret || '',
  }
}

// Candidate API paths to try — CollectTCG may expose inventory at any of these
const CANDIDATE_PATHS = [
  '/api/inventory',
  '/api/products',
  '/api/v1/products',
  '/api/v1/inventory',
  '/api/shop/products',
  '/wp-json/wc/v3/products',
]

export async function fetchCollectTCGProducts(apiUrl: string, apiKey: string): Promise<CollectTCGProduct[]> {
  const attempts: Array<{ path: string; status: number; contentType: string; snippet: string }> = []

  for (const path of CANDIDATE_PATHS) {
    const fullUrl = `${apiUrl}${path}`
    let res: Response
    try {
      res = await fetch(fullUrl, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        cache: 'no-store',
      })
    } catch (err) {
      throw new Error(`Network error hitting ${fullUrl}: ${err instanceof Error ? err.message : String(err)}`)
    }

    const contentType = res.headers.get('content-type') || ''
    const text = await res.text()

    // Only try to parse JSON if the content-type says JSON (or it clearly looks like JSON)
    const looksJson = contentType.includes('application/json') || text.trim().startsWith('{') || text.trim().startsWith('[')

    if (res.ok && looksJson) {
      try {
        const data = JSON.parse(text)
        const products = Array.isArray(data) ? data : (data.products || data.items || data.inventory || data.data || [])
        if (Array.isArray(products)) {
          return products
        }
      } catch {
        // fall through to next path
      }
    }

    attempts.push({
      path,
      status: res.status,
      contentType,
      snippet: text.slice(0, 120).replace(/\s+/g, ' '),
    })
  }

  // Nothing worked — build a helpful error
  const summary = attempts
    .map(a => `  ${a.path} → ${a.status} (${a.contentType || 'no content-type'}) "${a.snippet}"`)
    .join('\n')
  throw new Error(
    `Could not find a JSON API endpoint under ${apiUrl}. Tried:\n${summary}\n\nCheck that the base URL and API key are correct, and that your CollectTCG account exposes a JSON inventory/products endpoint.`
  )
}

export async function syncProducts(products: CollectTCGProduct[]): Promise<SyncResult> {
  const start = Date.now()
  let created = 0, updated = 0, skipped = 0
  const errors: string[] = []

  for (const p of products) {
    try {
      // Use the external ID as the slug for deduplication
      const slug = `ctcg-${p.id}`

      const existing = await db.product.findFirst({ where: { slug } })

      const data = {
        name: p.name,
        category: (p.category || 'single').toLowerCase(),
        price: typeof p.price === 'number' ? p.price : Math.round(Number(p.price) * 100) / 100,
        stock: typeof p.stock === 'number' ? Math.max(0, p.stock) : 0,
        description: p.description || null,
        images: p.images || [],
        grade: p.grade || null,
        grader: p.grader || null,
        tags: p.tags || [],
        featured: p.featured || false,
        active: true,
        comparePrice: p.comparePrice || null,
      }

      if (existing) {
        await db.product.update({ where: { id: existing.id }, data })
        updated++
      } else {
        await db.product.create({ data: { ...data, slug } })
        created++
      }
    } catch (err) {
      errors.push(`Failed to sync product "${p.name}": ${err instanceof Error ? err.message : String(err)}`)
      skipped++
    }
  }

  const duration = Date.now() - start

  // Log the sync
  await db.syncLog.create({
    data: {
      status: errors.length === 0 ? 'success' : created + updated > 0 ? 'partial' : 'error',
      message: errors.length > 0 ? errors.slice(0, 3).join('; ') : null,
      created,
      updated,
      skipped,
      duration,
    },
  }).catch(() => {})

  return { created, updated, skipped, errors, duration }
}

export function verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
  if (!secret) return true // if no secret configured, allow all
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex')
  return signature === expected || signature === `sha256=${expected}`
}
