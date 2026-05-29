import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAdminSession } from '@/lib/admin-auth'

type ImportRow = {
  name: string
  game?: string
  category?: string
  price: number | string
  stock?: number | string
  description?: string
  grade?: string
  grader?: string
  featured?: boolean | string
  active?: boolean | string
  image?: string
  images?: string[] | string
  tags?: string[] | string
  comparePrice?: number | string
  slug?: string
}

type ImportResult = {
  ok: boolean
  created: number
  updated: number
  skipped: number
  errors: { row: number; name?: string; message: string }[]
}

const VALID_GAMES = new Set(['pokemon', 'one-piece'])
const VALID_CATEGORIES = new Set(['single', 'graded', 'booster', 'sealed'])

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function asBool(v: unknown): boolean {
  if (typeof v === 'boolean') return v
  if (typeof v === 'string') return ['true', '1', 'yes', 'y', 'TRUE'].includes(v.trim())
  return false
}

function asNumber(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  if (typeof v === 'string') {
    const cleaned = v.replace(/[£$,\s]/g, '')
    const n = Number(cleaned)
    return Number.isFinite(n) ? n : null
  }
  return null
}

function asArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(x => String(x).trim()).filter(Boolean)
  if (typeof v === 'string') {
    if (!v.trim()) return []
    // Accept comma- or pipe-separated values
    return v.split(/[,|]/).map(s => s.trim()).filter(Boolean)
  }
  return []
}

/**
 * Parse a CSV string into an array of objects keyed by the header row.
 * Handles quoted values with commas inside.
 */
function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0)
  if (lines.length === 0) return []
  const headers = splitCsvLine(lines[0]).map(h => h.trim())
  return lines.slice(1).map(line => {
    const values = splitCsvLine(line)
    const row: Record<string, string> = {}
    headers.forEach((h, i) => {
      row[h] = (values[i] ?? '').trim()
    })
    return row
  })
}

function splitCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      out.push(cur)
      cur = ''
    } else {
      cur += ch
    }
  }
  out.push(cur)
  return out
}

export async function POST(req: NextRequest) {
  const admin = await verifyAdminSession(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { format?: 'json' | 'csv'; data?: string | ImportRow[]; mode?: 'create' | 'upsert' }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 })
  }

  const mode = body.mode === 'upsert' ? 'upsert' : 'create'
  let rows: ImportRow[] = []

  if (body.format === 'csv') {
    if (typeof body.data !== 'string') {
      return NextResponse.json({ error: 'CSV format requires data to be a string.' }, { status: 400 })
    }
    rows = parseCSV(body.data) as unknown as ImportRow[]
  } else {
    // Default to JSON
    if (Array.isArray(body.data)) {
      rows = body.data
    } else if (typeof body.data === 'string') {
      try {
        const parsed = JSON.parse(body.data)
        if (!Array.isArray(parsed)) {
          return NextResponse.json({ error: 'JSON must be an array of product objects.' }, { status: 400 })
        }
        rows = parsed
      } catch (err) {
        return NextResponse.json({ error: `Invalid JSON: ${err instanceof Error ? err.message : 'parse error'}` }, { status: 400 })
      }
    } else {
      return NextResponse.json({ error: 'data must be an array or a JSON string.' }, { status: 400 })
    }
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: 'No rows to import.' }, { status: 400 })
  }
  if (rows.length > 500) {
    return NextResponse.json({ error: 'Too many rows. Max 500 per import — split into batches.' }, { status: 400 })
  }

  const result: ImportResult = { ok: true, created: 0, updated: 0, skipped: 0, errors: [] }

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    const rowNum = i + 2 // accounting for header row in CSV

    const name = (r.name ?? '').toString().trim()
    if (!name) {
      result.errors.push({ row: rowNum, message: 'Missing "name"' })
      result.skipped++
      continue
    }

    const price = asNumber(r.price)
    if (price === null || price < 0) {
      result.errors.push({ row: rowNum, name, message: `Invalid price: "${r.price}"` })
      result.skipped++
      continue
    }

    const game = String(r.game ?? 'pokemon').trim().toLowerCase()
    if (!VALID_GAMES.has(game)) {
      result.errors.push({ row: rowNum, name, message: `Invalid game: "${r.game}" (must be pokemon or one-piece)` })
      result.skipped++
      continue
    }

    const category = String(r.category ?? 'single').trim().toLowerCase()
    if (!VALID_CATEGORIES.has(category)) {
      result.errors.push({ row: rowNum, name, message: `Invalid category: "${r.category}" (must be single, graded, booster, or sealed)` })
      result.skipped++
      continue
    }

    const stockN = asNumber(r.stock ?? 0)
    const stock = stockN !== null && stockN >= 0 ? Math.floor(stockN) : 0
    const comparePrice = r.comparePrice !== undefined && r.comparePrice !== '' ? asNumber(r.comparePrice) : null
    const slug = (r.slug ? String(r.slug) : slugify(name)).trim()
    const images = r.image ? [String(r.image)] : asArray(r.images)
    const tags = asArray(r.tags)

    const data = {
      name,
      slug,
      description: r.description ? String(r.description).trim() : null,
      price,
      comparePrice,
      stock,
      category,
      game,
      grade: r.grade ? String(r.grade).trim() : null,
      grader: r.grader ? String(r.grader).trim() : null,
      featured: asBool(r.featured),
      active: r.active === undefined ? true : asBool(r.active),
      images,
      tags,
      // Bulk-imported products are owned by whoever ran the import. Lets
      // each vendor build their catalogue via CSV without superadmin help.
      vendorId: admin.userId,
    }

    try {
      if (mode === 'upsert') {
        const existing = await db.product.findUnique({ where: { slug } })
        if (existing) {
          // Only overwrite if the importer owns the existing row. Otherwise
          // skip with a clear error so vendors can't accidentally hijack each
          // other's stock via CSV slug collisions.
          if (existing.vendorId && existing.vendorId !== admin.userId) {
            result.errors.push({
              row: rowNum, name,
              message: `Slug "${slug}" is owned by another vendor — skipped.`,
            })
            result.skipped++
            continue
          }
          await db.product.update({ where: { slug }, data })
          result.updated++
        } else {
          await db.product.create({ data })
          result.created++
        }
      } else {
        await db.product.create({ data })
        result.created++
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown DB error'
      result.errors.push({ row: rowNum, name, message: msg.replace(/\n/g, ' ').slice(0, 200) })
      result.skipped++
    }
  }

  return NextResponse.json(result, { status: 200 })
}
