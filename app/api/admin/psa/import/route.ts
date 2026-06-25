import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAdminSession } from '@/lib/admin-auth'
import { enforceRateLimit } from '@/lib/rate-limit'
import { storage } from '@/lib/storage'
import { slugify } from '@/lib/slug'
import { fetchPsaCert, fetchPsaImages, buildListingFromCert, guessGame, isPsaImageUrl, PsaError } from '@/lib/psa'

/**
 * POST /api/admin/psa/import — create a for-sale graded listing from a PSA
 * cert number. The card facts (grade, grader, images) come straight from PSA
 * (re-fetched here, never trusted from the client); the admin supplies the
 * price + category, and may tweak the name/description.
 *
 * Body: { certNumber, price, comparePrice?, category?, game?, name?,
 *         description?, featured?, active? }
 *
 * PSA images are downloaded onto our own storage so listings don't depend on
 * PSA's hotlink. Graded slabs are unique, so stock is fixed at 1.
 */
const MAX_IMG_BYTES = 10 * 1024 * 1024

async function storePsaImage(url: string): Promise<string | null> {
  if (!isPsaImageUrl(url)) return null // SSRF guard: PSA hosts only
  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return null
    const type = (res.headers.get('content-type') || '').split(';')[0].trim()
    if (!type.startsWith('image/') || type === 'image/svg+xml') return null
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length === 0 || buf.length > MAX_IMG_BYTES) return null
    const ext = type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg'
    const saved = await storage().put({
      data: buf,
      filename: `psa.${ext}`,
      mimeType: type,
      prefix: 'products',
    })
    return saved.url
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const admin = await verifyAdminSession(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const block = enforceRateLimit(req, { bucket: 'psa-import', keyParts: [admin.userId], max: 40, windowMs: 60_000 })
  if (block) return block

  const body = await req.json().catch(() => ({}))
  const certNumber = typeof body.certNumber === 'string' ? body.certNumber.trim() : ''
  if (!certNumber) return NextResponse.json({ error: 'Cert number is required' }, { status: 400 })

  const price = Number(body.price)
  if (!Number.isFinite(price) || price <= 0) {
    return NextResponse.json({ error: 'Enter a valid price' }, { status: 400 })
  }

  try {
    // Card facts come from PSA, authoritative.
    const cert = await fetchPsaCert(certNumber)
    const psaImages = await fetchPsaImages(certNumber)
    const listing = buildListingFromCert(cert)

    // Download PSA images onto our storage (front first), skipping any that fail.
    const stored: string[] = []
    for (const img of psaImages) {
      const url = await storePsaImage(img.url)
      if (url) stored.push(url)
    }

    const name = (typeof body.name === 'string' && body.name.trim()) || listing.name
    const description = (typeof body.description === 'string' && body.description.trim()) || listing.description
    const category = (typeof body.category === 'string' && body.category.trim()) || 'graded'
    const game = body.game === 'one-piece' || body.game === 'pokemon' ? body.game : guessGame(cert)
    const comparePrice = body.comparePrice !== undefined && body.comparePrice !== null && body.comparePrice !== ''
      ? Number(body.comparePrice)
      : null

    // Unique slug: listing name + cert number guarantees no collision per slab.
    const slug = `${slugify(name)}-psa-${cert.certNumber}`.slice(0, 120)

    const product = await db.product.create({
      data: {
        name,
        slug,
        description,
        price,
        comparePrice: comparePrice && Number.isFinite(comparePrice) ? comparePrice : null,
        stock: 1, // a graded slab is a unique single item
        category,
        game,
        images: stored,
        grade: cert.grade || null,
        grader: 'PSA',
        featured: Boolean(body.featured),
        active: body.active !== undefined ? Boolean(body.active) : true,
        tags: ['graded', 'psa'],
        vendorId: admin.userId,
      },
    })

    return NextResponse.json({ product, imagesStored: stored.length }, { status: 201 })
  } catch (err) {
    if (err instanceof PsaError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    const e = err as { code?: string }
    if (e?.code === 'P2002') {
      return NextResponse.json({ error: 'This PSA cert has already been listed.' }, { status: 409 })
    }
    console.error('PSA import error:', err)
    return NextResponse.json({ error: 'Could not create the listing' }, { status: 500 })
  }
}
