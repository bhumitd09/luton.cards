import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAdminSession } from '@/lib/admin-auth'
import { enforceRateLimit } from '@/lib/rate-limit'
import { storage } from '@/lib/storage'
import { slugify } from '@/lib/slug'
import { normalizeGame } from '@/lib/games'
import { isValidCondition } from '@/lib/conditions'
import { getCard, ctcgGame, isAllowedCtcgImage, CtcgError } from '@/lib/ctcg'

/**
 * POST /api/admin/ctcg/import — list a card from the card database.
 * The card facts (name, images, rarity) come from the platform API
 * (re-fetched here, never trusted from the client); the admin supplies the
 * price + category and may tweak name/description/game/stock.
 *
 * Body: { tcg, cardId, price, comparePrice?, category?, game?, name?,
 *         description?, stock?, featured?, active? }
 *
 * Images are downloaded onto our own storage (SSRF-guarded to the CTCG CDN).
 */
const MAX_IMG_BYTES = 10 * 1024 * 1024
const MAX_IMAGES = 3

async function storeImage(url: string | null): Promise<string | null> {
  if (!url || !isAllowedCtcgImage(url)) return null
  try {
    const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(10_000) })
    if (!res.ok) return null
    if (res.url && !isAllowedCtcgImage(res.url)) return null // re-validate after redirect
    const type = (res.headers.get('content-type') || '').split(';')[0].trim()
    if (!type.startsWith('image/') || type === 'image/svg+xml') return null
    const len = Number(res.headers.get('content-length'))
    if (Number.isFinite(len) && len > MAX_IMG_BYTES) return null
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length === 0 || buf.length > MAX_IMG_BYTES) return null
    const ext = type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg'
    const saved = await storage().put({ data: buf, filename: `card.${ext}`, mimeType: type, prefix: 'products' })
    return saved.url
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const admin = await verifyAdminSession(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const block = enforceRateLimit(req, { bucket: 'ctcg-import', keyParts: [admin.userId], max: 60, windowMs: 60_000 })
  if (block) return block

  const body = await req.json().catch(() => ({}))
  const tcg = typeof body.tcg === 'string' ? body.tcg.trim() : ''
  const cardId = typeof body.cardId === 'string' ? body.cardId.trim() : ''
  if (!tcg || !cardId) return NextResponse.json({ error: 'tcg and cardId are required' }, { status: 400 })

  const price = Number(body.price)
  if (!Number.isFinite(price) || price <= 0) {
    return NextResponse.json({ error: 'Enter a valid price' }, { status: 400 })
  }

  try {
    // Authoritative card facts from the platform.
    const { card } = await getCard(tcg, cardId)

    // Download images (front/base first), capped, skipping any that fail the guard.
    const urls = (card.images || []).map(i => i.url).filter((u): u is string => !!u).slice(0, MAX_IMAGES)
    const stored: string[] = []
    for (const u of urls) {
      const s = await storeImage(u)
      if (s) stored.push(s)
    }

    const cardName = card.name || cardId
    const setBit = card.set_name || card.set_code || ''
    const defaultName = [cardName, setBit ? `(${setBit})` : '', card.number ? `#${card.number}` : '']
      .filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
    const name = (typeof body.name === 'string' && body.name.trim()) || defaultName
    const defaultDesc = [
      card.rarity ? `Rarity: ${card.rarity}` : '',
      setBit ? `Set: ${setBit}` : '',
      card.category ? `Type: ${card.category}` : '',
      card.effect || '',
    ].filter(Boolean).join('\n')
    const description = (typeof body.description === 'string' && body.description.trim()) || defaultDesc

    const game = body.game ? normalizeGame(body.game) : ctcgGame(tcg)
    const category = (typeof body.category === 'string' && body.category.trim()) || 'single'
    const stock = Number.isInteger(body.stock) && body.stock >= 0 ? body.stock : 1
    const comparePrice = body.comparePrice !== undefined && body.comparePrice !== null && body.comparePrice !== ''
      ? Number(body.comparePrice) : null

    const slug = `${slugify(name)}-${slugify(tcg)}-${slugify(cardId)}`.slice(0, 120)

    // Tags: the set name (e.g. "Roaring Skies") + the game (e.g. "pokemon").
    // De-duped, blanks dropped. No internal "ctcg" tag.
    const tags = Array.from(new Set(
      [card.set_name?.trim(), game].filter((t): t is string => !!t),
    ))

    const product = await db.product.create({
      data: {
        name,
        slug,
        description,
        price,
        comparePrice: comparePrice && Number.isFinite(comparePrice) ? comparePrice : null,
        stock,
        category,
        game,
        // Raw singles from the catalogue: default to Near Mint, admin can change.
        condition: isValidCondition(body.condition) ? body.condition : 'near-mint',
        images: stored,
        featured: Boolean(body.featured),
        active: body.active !== undefined ? Boolean(body.active) : true,
        tags,
        vendorId: admin.userId,
      },
    })

    return NextResponse.json({ product, imagesStored: stored.length }, { status: 201 })
  } catch (err) {
    if (err instanceof CtcgError) return NextResponse.json({ error: err.message }, { status: err.status })
    const e = err as { code?: string }
    if (e?.code === 'P2002') return NextResponse.json({ error: 'This card has already been listed.' }, { status: 409 })
    console.error('CTCG import error:', err)
    return NextResponse.json({ error: 'Could not create the listing' }, { status: 500 })
  }
}
